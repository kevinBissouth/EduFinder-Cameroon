"""Pages du site : Django sert le frontend compilé aux adresses que le
navigateur peut ouvrir directement (« /school/… », « /login »…), avec les
informations d'une fiche dans l'en-tête pour les robots et les messageries."""
from django.http import HttpRequest, HttpResponse, HttpResponseNotFound
from django.views.decorators.http import require_GET

from edufinder.services.public_institutions import find_published_establishment
from edufinder.services.site_pages import (
    describe_school_page,
    list_published_school_paths,
    read_site_shell,
    render_site_page,
)

SITE_NOT_BUILT_MESSAGE = "The site has not been built."
# Les espaces privés et la connexion n'ont rien à offrir à un moteur de recherche.
PRIVATE_PATHS = ["/login", "/manager", "/school-admin"]
SITEMAP_NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9"


def _read_site_address(request: HttpRequest) -> str:
    return request.build_absolute_uri("/").rstrip("/")


@require_GET
def site_page(request: HttpRequest, **_route_parameters) -> HttpResponse:
    site_shell = read_site_shell()
    if site_shell is None:
        return HttpResponseNotFound(SITE_NOT_BUILT_MESSAGE)
    return HttpResponse(site_shell)


@require_GET
def school_page(request: HttpRequest, institution_uuid: str, **_route_parameters) -> HttpResponse:
    site_shell = read_site_shell()
    if site_shell is None:
        return HttpResponseNotFound(SITE_NOT_BUILT_MESSAGE)
    establishment = find_published_establishment(institution_uuid)
    # Inconnu, mal formé ou non publié : même réponse, sans rien de
    # l'établissement dans la page. L'interface affiche « introuvable ».
    if establishment is None:
        return HttpResponseNotFound(site_shell)
    metadata = describe_school_page(establishment, _read_site_address(request))
    return HttpResponse(render_site_page(site_shell, metadata))


@require_GET
def sitemap(request: HttpRequest) -> HttpResponse:
    site_address = _read_site_address(request)
    page_paths = ["/", *list_published_school_paths()]
    entries = "".join(f"<url><loc>{site_address}{path}</loc></url>" for path in page_paths)
    document = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f'<urlset xmlns="{SITEMAP_NAMESPACE}">{entries}</urlset>'
    )
    return HttpResponse(document, content_type="application/xml")


@require_GET
def robots(request: HttpRequest) -> HttpResponse:
    lines = [
        "User-agent: *",
        *(f"Disallow: {private_path}" for private_path in PRIVATE_PATHS),
        f"Sitemap: {_read_site_address(request)}/sitemap.xml",
    ]
    return HttpResponse("\n".join(lines) + "\n", content_type="text/plain")
