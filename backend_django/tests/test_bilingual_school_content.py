import pytest

from edufinder.models import (
    ContentLanguage,
    Submission,
    SubmissionStatus,
    SubmissionType,
    UserEstablishment,
)

TRANSLATED_CONTENT = {
    "content_language": "fr",
    "description": "Un collège bilingue.",
    "description_translation": "A bilingual college.",
    "director_title": "Proviseur",
    "director_title_translation": "Principal",
    "director_bio": "Elle dirige le collège depuis dix ans.",
    "director_bio_translation": "She has led the college for ten years.",
}


def modification_url(establishment) -> str:
    return f"/my/establishments/{establishment.uuid}/modification-proposals"


@pytest.fixture(name="managed_establishment")
def managed_establishment_fixture(establishment, manager):
    UserEstablishment.objects.create(user=manager, establishment=establishment)
    return establishment


@pytest.mark.django_db
def test_manager_proposes_texts_in_both_languages(client, log_in_as, manager, managed_establishment):
    log_in_as(manager)

    response = client.post(modification_url(managed_establishment), TRANSLATED_CONTENT, format="json")

    assert response.status_code == 201
    stored_content = Submission.objects.get().content
    assert stored_content["content_language"] == "fr"
    assert stored_content["director_bio_translation"] == "She has led the college for ten years."
    # Tant que le super admin n'a pas validé, la fiche ne change pas.
    managed_establishment.refresh_from_db()
    assert managed_establishment.description_translation is None


@pytest.mark.django_db
def test_unknown_content_language_is_refused(client, log_in_as, manager, managed_establishment):
    log_in_as(manager)

    response = client.post(
        modification_url(managed_establishment), {"content_language": "de"}, format="json"
    )

    assert response.status_code == 422
    assert Submission.objects.count() == 0


@pytest.mark.django_db
def test_approval_writes_both_languages_and_the_public_profile_shows_them(
    client, log_in_as, manager, super_admin, establishment
):
    submission = Submission.objects.create(
        user=manager,
        establishment=establishment,
        type=SubmissionType.MODIFICATION,
        status=SubmissionStatus.PENDING,
        content=TRANSLATED_CONTENT,
    )
    log_in_as(super_admin)

    approval = client.post(f"/admin/submissions/{submission.uuid}/approve")
    profile = client.get(f"/institutions/{establishment.uuid}").json()

    assert approval.status_code == 200
    establishment.refresh_from_db()
    assert establishment.content_language == ContentLanguage.FRENCH
    assert profile["content_language"] == "fr"
    assert profile["description"] == "Un collège bilingue."
    assert profile["description_translation"] == "A bilingual college."
    assert profile["director_title_translation"] == "Principal"
    assert profile["director_bio_translation"] == "She has led the college for ten years."


@pytest.mark.django_db
def test_profile_written_before_the_language_choice_has_no_language(client, establishment):
    profile = client.get(f"/institutions/{establishment.uuid}").json()

    assert profile["content_language"] is None
    assert profile["description_translation"] is None
