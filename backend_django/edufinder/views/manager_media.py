"""Espace responsable : fichiers de la galerie et photo du directeur.

Aucune de ces routes ne modifie la fiche : chacune ouvre une soumission en
attente, et c'est l'approbation du super administrateur qui publie le fichier
ou le retire.
"""
from django.core.files.uploadedfile import UploadedFile
from rest_framework import serializers, status
from rest_framework.decorators import parser_classes
from rest_framework.exceptions import NotFound
from rest_framework.parsers import MultiPartParser
from rest_framework.request import Request
from rest_framework.response import Response

from edufinder.models import Establishment, Media, Submission
from edufinder.serializers.proposal import ProposalCreatedSerializer
from edufinder.services.media_files import (
    GALLERY_MEDIA_TYPES,
    PHOTO_MEDIA_TYPES,
    store_uploaded_file,
)
from edufinder.services.proposals import (
    propose_director_photo,
    propose_media_addition,
    propose_media_removal,
)
from edufinder.views.access import get_managed_establishment, manager_api_view

CAPTION_MAX_LENGTH = 255


class UploadSerializer(serializers.Serializer):
    # Un fichier vide passe ici pour recevoir le même refus explicite que les
    # autres fichiers rejetés (service de fichiers).
    file = serializers.FileField(allow_empty_file=True)


def _get_uploaded_file(request: Request) -> UploadedFile:
    upload_serializer = UploadSerializer(data=request.data)
    upload_serializer.is_valid(raise_exception=True)
    return upload_serializer.validated_data["file"]


def _build_submission_response(submission: Submission) -> Response:
    return Response(
        ProposalCreatedSerializer(submission).data, status=status.HTTP_201_CREATED
    )


@manager_api_view(["POST"])
@parser_classes([MultiPartParser])
def propose_establishment_media(request, establishment_uuid: str):
    establishment = get_managed_establishment(
        request, establishment_uuid, Establishment.objects.all()
    )
    uploaded_file = _get_uploaded_file(request)
    stored_file = store_uploaded_file(uploaded_file, GALLERY_MEDIA_TYPES)
    # La légende reprend le nom du fichier, borné à la taille de la colonne.
    caption = uploaded_file.name[:CAPTION_MAX_LENGTH]
    return _build_submission_response(
        propose_media_addition(request.user, establishment, stored_file, caption)
    )


@manager_api_view(["DELETE"])
def propose_establishment_media_removal(
    request, establishment_uuid: str, media_id: int
):
    establishment = get_managed_establishment(
        request, establishment_uuid, Establishment.objects.all()
    )
    # Le média est cherché DANS l'établissement vérifié : connaître l'id d'un
    # média d'un autre établissement ne permet pas d'en demander le retrait.
    media = Media.objects.filter(pk=media_id, establishment=establishment).first()
    if media is None:
        raise NotFound("Media not found")
    return _build_submission_response(propose_media_removal(request.user, media))


# Téléversement détaché (écran de création) : stocke le fichier et renvoie son
# adresse, sans rien proposer. C'est la proposition de création qui portera
# cette adresse, et son approbation qui la rattachera à l'établissement.
@manager_api_view(["POST"])
@parser_classes([MultiPartParser])
def upload_detached_media(request):
    stored_file = store_uploaded_file(_get_uploaded_file(request), GALLERY_MEDIA_TYPES)
    return Response({"url": stored_file.url})


@manager_api_view(["PUT"])
@parser_classes([MultiPartParser])
def propose_director_photo_change(request, establishment_uuid: str):
    establishment = get_managed_establishment(
        request, establishment_uuid, Establishment.objects.all()
    )
    stored_file = store_uploaded_file(_get_uploaded_file(request), PHOTO_MEDIA_TYPES)
    return _build_submission_response(
        propose_director_photo(request.user, establishment, stored_file)
    )
