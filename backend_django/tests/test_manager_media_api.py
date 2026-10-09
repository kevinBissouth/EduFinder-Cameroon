import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from edufinder.models import (
    Establishment,
    Media,
    MediaType,
    Submission,
    SubmissionStatus,
    SubmissionType,
    User,
    UserEstablishment,
    UserRole,
)
from edufinder.services import media_files

PADDING = b"\x00" * 64
PNG_CONTENT = b"\x89PNG\r\n\x1a\n" + PADDING
JPEG_CONTENT = b"\xff\xd8\xff\xe0" + PADDING
WEBP_CONTENT = b"RIFF\x24\x00\x00\x00WEBP" + PADDING
PDF_CONTENT = b"%PDF-1.7\n" + PADDING
# Deux tailles de premier bloc différentes : les deux sont des MP4 valides.
MP4_CONTENT = b"\x00\x00\x00\x18ftypmp42" + PADDING
MP4_WITH_LARGER_HEADER_CONTENT = b"\x00\x00\x00\x20ftypisom" + PADDING
WEBM_CONTENT = b"\x1a\x45\xdf\xa3" + PADDING
HTML_CONTENT = b"<html><script>alert(1)</script></html>"
# Conteneur RIFF qui n'est pas une image WebP.
WAV_CONTENT = b"RIFF\x24\x00\x00\x00WAVE" + PADDING
DETACHED_UPLOAD_URL = "/my/uploads/media"


@pytest.fixture(name="managed_establishment")
def managed_establishment_fixture(establishment, manager) -> Establishment:
    UserEstablishment.objects.create(user=manager, establishment=establishment)
    return establishment


@pytest.fixture(name="other_manager")
def other_manager_fixture() -> User:
    return User.objects.create(
        name="Other", email="other@example.com", password_hash="x", role=UserRole.MANAGER
    )


def media_url(establishment: Establishment) -> str:
    return f"/my/establishments/{establishment.uuid}/media"


def director_photo_url(establishment: Establishment) -> str:
    return f"/my/establishments/{establishment.uuid}/director-photo"


def send_file(client, method: str, url: str, content: bytes, name: str = "upload.bin"):
    uploaded_file = SimpleUploadedFile(name, content)
    return getattr(client, method)(url, {"file": uploaded_file}, format="multipart")


def stored_file_names(media_root) -> list[str]:
    if not media_root.exists():
        return []
    return sorted(path.name for path in media_root.iterdir())


# --- Accès --------------------------------------------------------------------


@pytest.mark.django_db
def test_anonymous_cannot_touch_media(client, managed_establishment, isolated_media_root):
    responses = [
        send_file(client, "post", media_url(managed_establishment), PNG_CONTENT),
        send_file(client, "post", DETACHED_UPLOAD_URL, PNG_CONTENT),
        send_file(client, "put", director_photo_url(managed_establishment), PNG_CONTENT),
        client.delete(f"{media_url(managed_establishment)}/1"),
    ]

    assert [response.status_code for response in responses] == [401] * 4
    assert stored_file_names(isolated_media_root) == []


@pytest.mark.django_db
def test_manager_cannot_touch_media_of_another_manager(
    client, log_in_as, managed_establishment, other_manager, isolated_media_root
):
    media = Media.objects.create(
        establishment=managed_establishment, type=MediaType.IMAGE, url="/media/a.jpg"
    )
    log_in_as(other_manager)

    responses = [
        send_file(client, "post", media_url(managed_establishment), PNG_CONTENT),
        send_file(client, "put", director_photo_url(managed_establishment), PNG_CONTENT),
        client.delete(f"{media_url(managed_establishment)}/{media.pk}"),
    ]

    assert [response.status_code for response in responses] == [403] * 3
    assert Media.objects.filter(pk=media.pk).exists()
    assert stored_file_names(isolated_media_root) == []


@pytest.mark.django_db
def test_upload_from_untrusted_origin_is_rejected(
    client, log_in_as, manager, isolated_media_root
):
    log_in_as(manager)

    response = client.post(
        DETACHED_UPLOAD_URL,
        {"file": SimpleUploadedFile("photo.png", PNG_CONTENT)},
        format="multipart",
        HTTP_ORIGIN="https://evil.example",
    )

    assert response.status_code == 403
    assert stored_file_names(isolated_media_root) == []


# --- POST /my/establishments/{uuid}/media -------------------------------------


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("content", "expected_extension", "expected_type"),
    [
        (PNG_CONTENT, ".png", "image"),
        (JPEG_CONTENT, ".jpg", "image"),
        (WEBP_CONTENT, ".webp", "image"),
        (PDF_CONTENT, ".pdf", "pdf"),
        (MP4_CONTENT, ".mp4", "video"),
        (MP4_WITH_LARGER_HEADER_CONTENT, ".mp4", "video"),
        (WEBM_CONTENT, ".webm", "video"),
    ],
)
def test_gallery_upload_detects_the_type_from_the_content(
    client,
    log_in_as,
    manager,
    managed_establishment,
    isolated_media_root,
    content,
    expected_extension,
    expected_type,
):
    log_in_as(manager)

    # Le nom et l'extension annoncés par le client sont volontairement faux.
    response = send_file(
        client, "post", media_url(managed_establishment), content, name="evil.exe"
    )

    assert response.status_code == 201
    media_addition = Submission.objects.get().content["media_additions"][0]
    assert media_addition["type"] == expected_type
    assert media_addition["caption"] == "evil.exe"
    stored_name = media_addition["url"].removeprefix("/media/")
    assert stored_name.endswith(expected_extension)
    assert "evil" not in stored_name
    assert stored_file_names(isolated_media_root) == [stored_name]
    assert (isolated_media_root / stored_name).read_bytes() == content


@pytest.mark.django_db
def test_gallery_upload_waits_for_the_super_admin_before_reaching_the_profile(
    client, log_in_as, manager, managed_establishment
):
    log_in_as(manager)

    response = send_file(client, "post", media_url(managed_establishment), PNG_CONTENT)

    submission = Submission.objects.get(uuid=response.json()["submission_uuid"])
    assert response.json()["submission_status"] == "pending"
    assert submission.type == SubmissionType.MODIFICATION
    assert submission.status == SubmissionStatus.PENDING
    assert submission.user == manager
    assert submission.establishment == managed_establishment
    # Rien n'est publié : ni média en base, ni média sur la fiche publique.
    assert Media.objects.count() == 0
    public_profile = client.get(f"/institutions/{managed_establishment.uuid}").json()
    assert public_profile["media"] == []
    manager_profile = client.get(f"/my/establishments/{managed_establishment.uuid}").json()
    assert manager_profile["media"] == []
    assert manager_profile["has_pending_submission"] is True


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("content", "file_name"),
    [
        (HTML_CONTENT, "page.html"),
        (HTML_CONTENT, "photo.png"),
        (WAV_CONTENT, "sound.webp"),
        (b"MZ\x90\x00" + PADDING, "program.jpg"),
    ],
)
def test_gallery_upload_rejects_unsupported_content(
    client, log_in_as, manager, managed_establishment, isolated_media_root, content, file_name
):
    log_in_as(manager)

    response = send_file(
        client, "post", media_url(managed_establishment), content, name=file_name
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Unsupported file type (allowed: png, jpg, webp, pdf, mp4, webm)"
    }
    assert Submission.objects.count() == 0
    assert stored_file_names(isolated_media_root) == []


@pytest.mark.django_db
def test_gallery_upload_rejects_an_empty_file(
    client, log_in_as, manager, managed_establishment
):
    log_in_as(manager)

    response = send_file(client, "post", media_url(managed_establishment), b"")

    assert response.status_code == 400
    assert response.json() == {"detail": "Empty file"}
    assert Submission.objects.count() == 0


@pytest.mark.django_db
def test_gallery_upload_without_a_file_is_rejected_with_422(
    client, log_in_as, manager, managed_establishment
):
    log_in_as(manager)

    response = client.post(media_url(managed_establishment), {}, format="multipart")

    assert response.status_code == 422
    assert "file" in response.json()


@pytest.mark.django_db
def test_upload_size_limit_depends_on_the_type(
    client, log_in_as, manager, managed_establishment, isolated_media_root, monkeypatch
):
    monkeypatch.setattr(media_files, "MAX_IMAGE_OR_PDF_BYTES", 100)
    monkeypatch.setattr(media_files, "MAX_VIDEO_BYTES", 1000)
    log_in_as(manager)
    url = media_url(managed_establishment)
    extra_bytes = b"\x00" * 500

    oversized_image_response = send_file(client, "post", url, PNG_CONTENT + extra_bytes)
    video_response = send_file(client, "post", url, MP4_CONTENT + extra_bytes)
    oversized_video_response = send_file(client, "post", url, MP4_CONTENT + extra_bytes * 3)

    assert oversized_image_response.status_code == 400
    assert oversized_image_response.json() == {
        "detail": "File too large (20 MB max for videos, 5 MB otherwise)"
    }
    assert video_response.status_code == 201
    assert oversized_video_response.status_code == 400
    assert len(stored_file_names(isolated_media_root)) == 1
    assert Submission.objects.count() == 1


@pytest.mark.django_db
def test_gallery_upload_truncates_a_very_long_caption(
    client, log_in_as, manager, managed_establishment
):
    log_in_as(manager)

    response = send_file(
        client,
        "post",
        media_url(managed_establishment),
        PNG_CONTENT,
        name="a" * 300 + ".png",
    )

    assert response.status_code == 201
    caption = Submission.objects.get().content["media_additions"][0]["caption"]
    assert len(caption) <= 255


# --- DELETE /my/establishments/{uuid}/media/{id} ------------------------------


@pytest.mark.django_db
def test_media_removal_waits_for_the_super_admin(
    client, log_in_as, manager, managed_establishment, isolated_media_root
):
    isolated_media_root.mkdir()
    (isolated_media_root / "facade.jpg").write_bytes(JPEG_CONTENT)
    media = Media.objects.create(
        establishment=managed_establishment, type=MediaType.IMAGE, url="/media/facade.jpg"
    )
    log_in_as(manager)

    response = client.delete(f"{media_url(managed_establishment)}/{media.pk}")

    assert response.status_code == 201
    submission = Submission.objects.get(uuid=response.json()["submission_uuid"])
    assert submission.status == SubmissionStatus.PENDING
    assert submission.content == {"media_removals": [media.pk]}
    # Le média et son fichier restent en place tant que rien n'est approuvé.
    assert Media.objects.filter(pk=media.pk).exists()
    assert stored_file_names(isolated_media_root) == ["facade.jpg"]
    public_profile = client.get(f"/institutions/{managed_establishment.uuid}").json()
    assert [item["id_media"] for item in public_profile["media"]] == [media.pk]


@pytest.mark.django_db
def test_removal_cannot_target_a_media_of_another_establishment(
    client, log_in_as, manager, managed_establishment, create_establishment
):
    foreign_media = Media.objects.create(
        establishment=create_establishment(name="Foreign school"),
        type=MediaType.IMAGE,
        url="/media/foreign.jpg",
    )
    log_in_as(manager)

    response = client.delete(f"{media_url(managed_establishment)}/{foreign_media.pk}")

    assert response.status_code == 404
    assert response.json() == {"detail": "Media not found"}
    assert Submission.objects.count() == 0


# --- POST /my/uploads/media ---------------------------------------------------


@pytest.mark.django_db
def test_detached_upload_stores_the_file_without_proposing_anything(
    client, log_in_as, manager, isolated_media_root
):
    log_in_as(manager)

    response = send_file(client, "post", DETACHED_UPLOAD_URL, JPEG_CONTENT)

    assert response.status_code == 200
    stored_name = response.json()["url"].removeprefix("/media/")
    assert stored_file_names(isolated_media_root) == [stored_name]
    assert Media.objects.count() == 0
    assert Submission.objects.count() == 0


@pytest.mark.django_db
def test_detached_upload_url_is_accepted_by_a_creation_proposal(
    client, log_in_as, manager, establishment
):
    log_in_as(manager)
    cover_url = send_file(client, "post", DETACHED_UPLOAD_URL, JPEG_CONTENT).json()["url"]
    video_url = send_file(client, "post", DETACHED_UPLOAD_URL, WEBM_CONTENT).json()["url"]

    response = client.post(
        "/establishments/proposals",
        {
            "name": "New Hope Academy",
            "id_city": establishment.city.pk,
            "id_type": establishment.type.pk,
            "id_sector": establishment.sector.pk,
            "id_linguistic_section": establishment.linguistic_section.pk,
            "cover_photo": cover_url,
            "videos": [video_url],
        },
        format="json",
    )

    assert response.status_code == 201, response.content


# --- PUT /my/establishments/{uuid}/director-photo -----------------------------


@pytest.mark.django_db
def test_director_photo_change_waits_for_the_super_admin(
    client, log_in_as, manager, managed_establishment, isolated_media_root
):
    log_in_as(manager)

    response = send_file(
        client, "put", director_photo_url(managed_establishment), WEBP_CONTENT
    )

    assert response.status_code == 201
    submission = Submission.objects.get(uuid=response.json()["submission_uuid"])
    proposed_photo_url = submission.content["director_photo"]
    assert submission.content == {"director_photo": proposed_photo_url}
    assert proposed_photo_url.endswith(".webp")
    assert stored_file_names(isolated_media_root) == [
        proposed_photo_url.removeprefix("/media/")
    ]
    # La fiche garde son ancienne photo (ici : aucune) jusqu'à l'approbation.
    managed_establishment.refresh_from_db()
    assert managed_establishment.director_photo_url is None


@pytest.mark.django_db
@pytest.mark.parametrize("content", [PDF_CONTENT, MP4_CONTENT, HTML_CONTENT])
def test_director_photo_only_accepts_images(
    client, log_in_as, manager, managed_establishment, isolated_media_root, content
):
    log_in_as(manager)

    response = send_file(client, "put", director_photo_url(managed_establishment), content)

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Unsupported file type (allowed: png, jpg, webp)"
    }
    assert Submission.objects.count() == 0
    assert stored_file_names(isolated_media_root) == []


# --- Suppression d'un fichier stocké (utilisée à l'approbation d'un retrait) ---


@pytest.mark.django_db
def test_stored_file_is_deleted_once_nothing_references_it(isolated_media_root):
    isolated_media_root.mkdir()
    (isolated_media_root / "facade.jpg").write_bytes(JPEG_CONTENT)

    media_files.delete_stored_file_if_unused("/media/facade.jpg")

    assert stored_file_names(isolated_media_root) == []


@pytest.mark.django_db
def test_stored_file_is_kept_while_still_referenced(
    establishment, isolated_media_root
):
    isolated_media_root.mkdir()
    (isolated_media_root / "facade.jpg").write_bytes(JPEG_CONTENT)
    establishment.director_photo_url = "/media/facade.jpg"
    establishment.save()

    media_files.delete_stored_file_if_unused("/media/facade.jpg")

    assert stored_file_names(isolated_media_root) == ["facade.jpg"]


@pytest.mark.django_db
@pytest.mark.parametrize(
    "foreign_url", ["https://evil.example/a.jpg", "/media/../outside.txt", "/etc/passwd"]
)
def test_file_outside_the_media_folder_is_never_deleted(isolated_media_root, foreign_url):
    isolated_media_root.mkdir()
    outside_file = isolated_media_root.parent / "outside.txt"
    outside_file.write_text("must survive")

    media_files.delete_stored_file_if_unused(foreign_url)

    assert outside_file.read_text() == "must survive"
