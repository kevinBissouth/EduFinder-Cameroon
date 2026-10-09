"""Pages du site servies par Django : le frontend compilé, complété par ce
qu'un robot lit sans exécuter de JavaScript (titre, description, image)."""
import re
import unicodedata
from dataclasses import dataclass

from django.conf import settings
from django.utils.html import escape

from edufinder.models import Establishment, MediaType

SITE_NAME = "EduFinder Cameroon"
SITE_SHELL_FILE_NAME = "index.html"
SCHOOL_PAGE_PATH = "/school/"
# Longueur au-delà de laquelle les moteurs de recherche et les messageries
# coupent eux-mêmes la description d'une page.
DESCRIPTION_MAX_LENGTH = 160
ELLIPSIS = "…"

TITLE_PATTERN = re.compile(r"<title>.*?</title>", re.DOTALL)
DESCRIPTION_PATTERN = re.compile(r'<meta\s+name="description"\s+content="[^"]*"\s*/?>', re.DOTALL)
HEAD_END = "</head>"
NON_ALPHANUMERIC_RUNS = re.compile(r"[^a-z0-9]+")


@dataclass(frozen=True)
class PageMetadata:
    title: str
    description: str
    address: str
    image_address: str | None


# Même règle que toSlug côté frontend : l'adresse annoncée aux robots doit
# être celle que le site affiche dans la barre du navigateur.
def to_slug(text: str) -> str:
    without_accents = (
        unicodedata.normalize("NFD", text).encode("ascii", "ignore").decode("ascii")
    )
    return NON_ALPHANUMERIC_RUNS.sub("-", without_accents.lower()).strip("-")


def build_school_path(establishment: Establishment) -> str:
    slug = to_slug(establishment.name)
    base_path = f"{SCHOOL_PAGE_PATH}{establishment.uuid}"
    return f"{base_path}/{slug}" if slug else base_path


# Le fichier n'existe qu'après « npm run build » : en développement, c'est
# Vite qui sert l'interface et cette fonction renvoie None.
def read_site_shell() -> str | None:
    shell_file = settings.FRONTEND_BUILD_DIR / SITE_SHELL_FILE_NAME
    if not shell_file.is_file():
        return None
    return shell_file.read_text(encoding="utf-8")


def describe_school_page(establishment: Establishment, site_address: str) -> PageMetadata:
    cover = establishment.media.filter(type=MediaType.IMAGE).order_by("id_media").first()
    return PageMetadata(
        title=f"{establishment.name} | {SITE_NAME}",
        description=_summarize(establishment),
        address=f"{site_address}{build_school_path(establishment)}",
        image_address=f"{site_address}{cover.url}" if cover else None,
    )


def _summarize(establishment: Establishment) -> str:
    description = " ".join((establishment.description or "").split())
    if not description:
        return (
            f"Fees, exam results, services and contact details of "
            f"{establishment.name}, {establishment.city.name}."
        )
    if len(description) <= DESCRIPTION_MAX_LENGTH:
        return description
    return description[: DESCRIPTION_MAX_LENGTH - len(ELLIPSIS)].rstrip() + ELLIPSIS


# Tout ce qui vient d'un établissement est échappé avant d'entrer dans la
# page : un nom contenant des guillemets ou une balise ne doit jamais pouvoir
# fermer l'attribut et injecter du code.
def render_site_page(site_shell: str, metadata: PageMetadata) -> str:
    title = escape(metadata.title)
    description = escape(metadata.description)
    address = escape(metadata.address)
    tags = [
        f'<link rel="canonical" href="{address}" />',
        '<meta property="og:type" content="website" />',
        f'<meta property="og:site_name" content="{SITE_NAME}" />',
        f'<meta property="og:title" content="{title}" />',
        f'<meta property="og:description" content="{description}" />',
        f'<meta property="og:url" content="{address}" />',
    ]
    if metadata.image_address:
        tags.append(f'<meta property="og:image" content="{escape(metadata.image_address)}" />')
    page = TITLE_PATTERN.sub(lambda _match: f"<title>{title}</title>", site_shell, count=1)
    page = _replace_description(page, description)
    return page.replace(HEAD_END, "\n    ".join(tags) + f"\n  {HEAD_END}", 1)


def _replace_description(page: str, description: str) -> str:
    description_tag = f'<meta name="description" content="{description}" />'
    return DESCRIPTION_PATTERN.sub(lambda _match: description_tag, page, count=1)


def list_published_school_paths() -> list[str]:
    return [
        build_school_path(establishment)
        for establishment in Establishment.objects.published().order_by("name")
    ]
