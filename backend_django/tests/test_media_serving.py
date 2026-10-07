import importlib

import pytest
from django.urls import clear_url_caches

import config.urls

JPEG_CONTENT = b"\xff\xd8\xff\xe0" + b"\x00" * 64
OUTSIDE_FILE_CONTENT = "content-that-must-never-be-served"


# Les routes de /media sont décidées à l'import de config.urls, selon DEBUG :
# je recharge donc ce module avec le réglage voulu, puis je le remets en état.
@pytest.fixture(name="reload_urls_with_debug")
def reload_urls_with_debug_fixture(settings):
    def reload_urls_with_debug(is_debug: bool) -> None:
        settings.DEBUG = is_debug
        importlib.reload(config.urls)
        clear_url_caches()

    yield reload_urls_with_debug
    settings.DEBUG = False
    importlib.reload(config.urls)
    clear_url_caches()


@pytest.fixture(name="stored_photo")
def stored_photo_fixture(isolated_media_root) -> str:
    isolated_media_root.mkdir()
    (isolated_media_root / "facade.jpg").write_bytes(JPEG_CONTENT)
    return "/media/facade.jpg"


def test_media_files_are_served_in_debug_mode(
    client, reload_urls_with_debug, stored_photo
):
    reload_urls_with_debug(True)

    response = client.get(stored_photo)

    assert response.status_code == 200
    assert b"".join(response.streaming_content) == JPEG_CONTENT
    assert response["Content-Type"] == "image/jpeg"
    # Le navigateur ne doit jamais réinterpréter un fichier téléversé sous un
    # autre type que celui annoncé.
    assert response["X-Content-Type-Options"] == "nosniff"


def test_media_serving_cannot_escape_the_media_folder(
    client, reload_urls_with_debug, stored_photo, isolated_media_root
):
    (isolated_media_root.parent / "outside.txt").write_text(OUTSIDE_FILE_CONTENT)
    reload_urls_with_debug(True)

    response = client.get("/media/../outside.txt")

    # Django refuse la requête (chemin hors du dossier) sans rien lire.
    assert response.status_code == 400
    assert OUTSIDE_FILE_CONTENT.encode() not in response.content


def test_media_files_are_not_served_by_django_outside_debug_mode(
    client, reload_urls_with_debug, stored_photo
):
    reload_urls_with_debug(False)

    response = client.get(stored_photo)

    assert response.status_code == 404
