import pytest

from edufinder.models import EstablishmentStatus, Media, MediaType
from edufinder.services.site_pages import to_slug

SITE_SHELL = """<!doctype html>
<html lang="en">
  <head>
    <meta
      name="description"
      content="Compare schools and universities in Cameroon."
    />
    <title>EduFinder Cameroon: compare schools before you enrol</title>
  </head>
  <body><div id="root"></div></body>
</html>
"""
DEFAULT_TITLE = "<title>EduFinder Cameroon: compare schools before you enrol</title>"
UNKNOWN_UUID = "00000000-0000-0000-0000-000000000000"


@pytest.fixture(name="built_site")
def built_site_fixture(settings, tmp_path):
    settings.FRONTEND_BUILD_DIR = tmp_path
    (tmp_path / "index.html").write_text(SITE_SHELL, encoding="utf-8")


@pytest.mark.django_db
def test_school_page_carries_the_school_in_its_head(client, built_site, create_establishment):
    school = create_establishment(
        name="Collège de la Paix", description="Un collège bilingue au cœur de Douala."
    )
    Media.objects.create(establishment=school, type=MediaType.IMAGE, url="/media/facade.jpg")

    response = client.get(f"/school/{school.uuid}")
    page = response.content.decode()

    assert response.status_code == 200
    assert "<title>Collège de la Paix | EduFinder Cameroon</title>" in page
    assert '<meta name="description" content="Un collège bilingue au cœur de Douala." />' in page
    assert '<meta property="og:image" content="http://testserver/media/facade.jpg" />' in page
    canonical_address = f"http://testserver/school/{school.uuid}/college-de-la-paix"
    assert f'<link rel="canonical" href="{canonical_address}" />' in page
    assert DEFAULT_TITLE not in page


@pytest.mark.django_db
def test_school_page_ignores_the_readable_name_in_the_address(client, built_site, establishment):
    response = client.get(f"/school/{establishment.uuid}/any-name-at-all")

    assert response.status_code == 200
    assert "Collège de la Paix | EduFinder Cameroon" in response.content.decode()


@pytest.mark.django_db
def test_school_page_escapes_what_the_school_wrote(client, built_site, create_establishment):
    school = create_establishment(name='"><script>alert(1)</script>')

    page = client.get(f"/school/{school.uuid}").content.decode()

    assert "<script>alert(1)</script>" not in page
    assert "&lt;script&gt;" in page


@pytest.mark.django_db
def test_school_page_without_description_or_photo_falls_back(client, built_site, establishment):
    page = client.get(f"/school/{establishment.uuid}").content.decode()

    assert "Fees, exam results, services and contact details of Collège de la Paix, Douala." in page
    assert "og:image" not in page


@pytest.mark.django_db
def test_long_description_is_cut_for_the_head(client, built_site, create_establishment):
    school = create_establishment(description="mot " * 100)

    page = client.get(f"/school/{school.uuid}").content.decode()

    assert "mot mot…" in page
    assert "mot " * 60 not in page


@pytest.mark.django_db
@pytest.mark.parametrize(
    "hidden_status",
    [EstablishmentStatus.PENDING, EstablishmentStatus.REJECTED, EstablishmentStatus.SUSPENDED],
)
def test_unpublished_school_page_reveals_nothing(
    client, built_site, create_establishment, hidden_status
):
    school = create_establishment(name="École Cachée", status=hidden_status)

    response = client.get(f"/school/{school.uuid}")

    assert response.status_code == 404
    assert "École Cachée" not in response.content.decode()
    assert DEFAULT_TITLE in response.content.decode()


@pytest.mark.django_db
@pytest.mark.parametrize("school_id", [UNKNOWN_UUID, "not-an-identifier"])
def test_unknown_school_page_is_not_found_but_still_shows_the_site(client, built_site, school_id):
    response = client.get(f"/school/{school_id}")

    assert response.status_code == 404
    assert '<div id="root">' in response.content.decode()


@pytest.mark.django_db
@pytest.mark.parametrize(
    "page_path",
    ["/login", "/saved", "/legal", "/privacy", "/manager", "/school-admin", "/compare/", "/compare/a,b"],
)
def test_other_site_pages_serve_the_site_unchanged(client, built_site, page_path):
    response = client.get(page_path)

    assert response.status_code == 200
    assert response.content.decode() == SITE_SHELL


@pytest.mark.django_db
def test_site_pages_are_not_found_before_the_site_is_built(client, settings, tmp_path, establishment):
    settings.FRONTEND_BUILD_DIR = tmp_path / "missing"

    assert client.get("/login").status_code == 404
    assert client.get(f"/school/{establishment.uuid}").status_code == 404


@pytest.mark.django_db
def test_site_pages_refuse_writes(client, built_site):
    assert client.post("/login").status_code == 405


@pytest.mark.django_db
def test_sitemap_lists_the_home_page_and_published_schools_only(client, create_establishment):
    published = create_establishment(name="École Visible")
    hidden = create_establishment(name="École Cachée", status=EstablishmentStatus.SUSPENDED)

    response = client.get("/sitemap.xml")
    sitemap = response.content.decode()

    assert response["Content-Type"] == "application/xml"
    assert "<loc>http://testserver/</loc>" in sitemap
    assert f"<loc>http://testserver/school/{published.uuid}/ecole-visible</loc>" in sitemap
    assert hidden.uuid not in sitemap


@pytest.mark.django_db
def test_robots_file_points_to_the_sitemap_and_closes_private_spaces(client):
    robots = client.get("/robots.txt").content.decode()

    assert "Sitemap: http://testserver/sitemap.xml" in robots
    assert "Disallow: /manager" in robots
    assert "Disallow: /school-admin" in robots


def test_slug_matches_the_frontend_rule():
    assert to_slug("Collège Moderne Bilingue de Yaoundé") == "college-moderne-bilingue-de-yaounde"
    assert to_slug("  Institut d'Ingénierie (ISIT) ") == "institut-d-ingenierie-isit"
    assert to_slug("!!!") == ""


@pytest.mark.django_db
def test_addresses_follow_the_scheme_announced_by_the_hosting_proxy(client, settings):
    settings.SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

    # Un vrai navigateur envoie toujours l'en-tête Host ; sans lui, le client
    # de test ferait ajouter le port 80 à l'adresse.
    response = client.get("/robots.txt", HTTP_X_FORWARDED_PROTO="https", HTTP_HOST="testserver")
    robots = response.content.decode()

    assert "Sitemap: https://testserver/sitemap.xml" in robots
