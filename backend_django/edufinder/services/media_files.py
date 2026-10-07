"""Fichiers téléversés par les responsables.

Règles de sécurité : le type est déduit du contenu réel du fichier (ses
premiers octets), jamais de l'extension ou du type annoncés par le client, qui
sont triviaux à contrefaire ; le nom de stockage est généré ici ; la taille
est bornée.
"""
import uuid
from collections.abc import Collection
from dataclasses import dataclass

from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import UploadedFile

from edufinder.models import Establishment, Media, MediaType

BYTES_PER_MEGABYTE = 1024 * 1024
MAX_IMAGE_OR_PDF_BYTES = 5 * BYTES_PER_MEGABYTE
# Les vidéos sont plus lourdes : plafond distinct, toujours borné côté serveur.
MAX_VIDEO_BYTES = 100 * BYTES_PER_MEGABYTE
# Assez d'octets pour reconnaître toutes les signatures ci-dessous.
SIGNATURE_BYTES = 12

GALLERY_MEDIA_TYPES = frozenset({MediaType.IMAGE, MediaType.PDF, MediaType.VIDEO})
PHOTO_MEDIA_TYPES = frozenset({MediaType.IMAGE})


class UploadRejectedError(Exception):
    """Fichier refusé, avec un message à présenter tel quel au client."""


@dataclass(frozen=True)
class FileSignature:
    extension: str
    media_type: MediaType
    # Marqueurs attendus : (position, octets). Tous doivent être présents.
    markers: tuple[tuple[int, bytes], ...]

    def matches(self, file_header: bytes) -> bool:
        return all(
            file_header[position : position + len(expected_bytes)] == expected_bytes
            for position, expected_bytes in self.markers
        )


_FILE_SIGNATURES = (
    FileSignature(".png", MediaType.IMAGE, ((0, b"\x89PNG\r\n\x1a\n"),)),
    FileSignature(".jpg", MediaType.IMAGE, ((0, b"\xff\xd8\xff"),)),
    # RIFF est un conteneur partagé (AVI, WAV...) : seul le second marqueur
    # garantit qu'il s'agit d'une image WebP.
    FileSignature(".webp", MediaType.IMAGE, ((0, b"RIFF"), (8, b"WEBP"))),
    FileSignature(".pdf", MediaType.PDF, ((0, b"%PDF"),)),
    # Un MP4 commence par la taille de son premier bloc, variable d'un fichier
    # à l'autre : le marqueur fiable est « ftyp », juste après.
    FileSignature(".mp4", MediaType.VIDEO, ((4, b"ftyp"),)),
    FileSignature(".webm", MediaType.VIDEO, ((0, b"\x1a\x45\xdf\xa3"),)),
)


@dataclass(frozen=True)
class StoredFile:
    url: str
    media_type: MediaType


def store_uploaded_file(
    uploaded_file: UploadedFile, allowed_media_types: Collection[MediaType]
) -> StoredFile:
    if not uploaded_file.size:
        raise UploadRejectedError("Empty file")
    file_signature = _detect_signature(uploaded_file)
    if file_signature is None or file_signature.media_type not in allowed_media_types:
        raise UploadRejectedError(
            "Unsupported file type (allowed: "
            f"{_describe_allowed_extensions(allowed_media_types)})"
        )
    if uploaded_file.size > _get_size_limit(file_signature.media_type):
        raise UploadRejectedError(
            "File too large (100 MB max for videos, 5 MB otherwise)"
        )
    # Le nom est généré ici : rien de ce que le client a fourni n'entre dans
    # le chemin du fichier.
    stored_name = default_storage.save(
        f"{uuid.uuid4().hex}{file_signature.extension}", uploaded_file
    )
    return StoredFile(
        url=default_storage.url(stored_name), media_type=file_signature.media_type
    )


def _detect_signature(uploaded_file: UploadedFile) -> FileSignature | None:
    # Je ne lis que l'en-tête : le fichier entier n'est jamais chargé en mémoire.
    uploaded_file.seek(0)
    file_header = uploaded_file.read(SIGNATURE_BYTES)
    uploaded_file.seek(0)
    return next(
        (signature for signature in _FILE_SIGNATURES if signature.matches(file_header)),
        None,
    )


def _describe_allowed_extensions(allowed_media_types: Collection[MediaType]) -> str:
    return ", ".join(
        signature.extension.removeprefix(".")
        for signature in _FILE_SIGNATURES
        if signature.media_type in allowed_media_types
    )


def _get_size_limit(media_type: MediaType) -> int:
    if media_type == MediaType.VIDEO:
        return MAX_VIDEO_BYTES
    return MAX_IMAGE_OR_PDF_BYTES


def delete_stored_file_if_unused(file_url: str) -> None:
    stored_name = file_url.removeprefix(settings.MEDIA_URL)
    # Je ne supprime qu'un fichier directement dans notre dossier média : une
    # adresse externe ou un chemin contenant un sous-dossier n'est pas à nous.
    is_own_file = file_url.startswith(settings.MEDIA_URL) and "/" not in stored_name
    if not is_own_file or _is_file_still_referenced(file_url):
        return
    default_storage.delete(stored_name)


def _is_file_still_referenced(file_url: str) -> bool:
    return (
        Media.objects.filter(url=file_url).exists()
        or Establishment.objects.filter(director_photo_url=file_url).exists()
    )
