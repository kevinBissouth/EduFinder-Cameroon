from rest_framework import serializers

from edufinder.models import Establishment, SchoolFee, StudyLevel


# Les tables de référence nomment leur libellé « name » ou « label » selon la
# table, mais le frontend attend toujours {id, name} : deux serializers
# couvrent les deux cas sans toucher aux colonnes.
class NamedReferenceSerializer(serializers.Serializer):
    id = serializers.IntegerField(source="pk")
    name = serializers.CharField()


class LabelledReferenceSerializer(serializers.Serializer):
    id = serializers.IntegerField(source="pk")
    name = serializers.CharField(source="label")


class StudyLevelReferenceSerializer(serializers.Serializer):
    id = serializers.IntegerField(source="pk")
    name = serializers.SerializerMethodField()
    # Cycle et libellé séparés : le frontend traduit le cycle et garde le nom
    # officiel de la classe.
    stage = serializers.CharField(source="stage.label")
    label = serializers.CharField()

    # Un même libellé de niveau peut exister dans deux étapes : je préfixe par
    # l'étape pour que le choix reste sans ambiguïté dans les listes.
    def get_name(self, study_level: StudyLevel) -> str:
        return f"{study_level.stage.label} — {study_level.label}"


class FiltersMetaSerializer(serializers.Serializer):
    regions = NamedReferenceSerializer(many=True)
    sectors = LabelledReferenceSerializer(many=True)
    exams = LabelledReferenceSerializer(many=True)
    services = serializers.ListField(child=serializers.CharField())
    cities = NamedReferenceSerializer(many=True)
    types = LabelledReferenceSerializer(many=True)
    languages = LabelledReferenceSerializer(many=True)
    levels = StudyLevelReferenceSerializer(many=True)
    programs = NamedReferenceSerializer(many=True)
    # Modalités de paiement référencées (libellés) : liste fermée servant à
    # choisir, côté gestionnaire, les plans rattachés au frais d'une classe.
    payment_methods = serializers.ListField(child=serializers.CharField())
    featured_type_ids = serializers.ListField(child=serializers.IntegerField())


class TranslatedLabelSerializer(serializers.Serializer):
    fr = serializers.CharField()
    en = serializers.CharField()


# Table de correspondance clé -> libellés, une entrée par liste de référence.
# Les clés sont les valeurs que les autres réponses de l'API renvoient déjà.
class ReferenceLabelsSerializer(serializers.Serializer):
    regions = serializers.DictField(child=TranslatedLabelSerializer())
    types = serializers.DictField(child=TranslatedLabelSerializer())
    sections = serializers.DictField(child=TranslatedLabelSerializer())
    sectors = serializers.DictField(child=TranslatedLabelSerializer())
    exams = serializers.DictField(child=TranslatedLabelSerializer())
    stages = serializers.DictField(child=TranslatedLabelSerializer())
    programs = serializers.DictField(child=TranslatedLabelSerializer())
    payment_methods = serializers.DictField(child=TranslatedLabelSerializer())


class PlatformStatsSerializer(serializers.Serializer):
    institutions = serializers.IntegerField()
    cities = serializers.IntegerField()
    fee_plans = serializers.IntegerField()
    exam_results = serializers.IntegerField()


class FeeSerializer(serializers.Serializer):
    # Identifiant du niveau : rendu ici pour permettre au responsable de
    # modifier les frais de l'année en cours via une proposition (il doit le
    # renvoyer dans sa saisie).
    id_level = serializers.IntegerField(source="level_id")
    stage = serializers.CharField(source="level.stage.label")
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    school_year = serializers.CharField()
    payment_methods = serializers.SerializerMethodField()

    # Le frontend lit la clé « class », mot réservé en Python : je ne peux pas
    # la déclarer comme attribut, je l'ajoute donc à la construction des champs.
    def get_fields(self) -> dict:
        fields = super().get_fields()
        fields["class"] = serializers.CharField(source="level.label")
        return fields

    def get_payment_methods(self, school_fee: SchoolFee) -> list[str]:
        return [
            fee_payment_method.payment_method.label
            for fee_payment_method in school_fee.payment_methods.all()
        ]


class ServiceSerializer(serializers.Serializer):
    name = serializers.CharField()
    description = serializers.CharField()


class ExamResultSerializer(serializers.Serializer):
    id_exam = serializers.IntegerField(source="exam_id")
    exam = serializers.CharField(source="exam.label")
    session = serializers.CharField()
    pass_rate = serializers.DecimalField(max_digits=5, decimal_places=2)


class MediaSerializer(serializers.Serializer):
    id_media = serializers.IntegerField()
    type = serializers.CharField()
    url = serializers.CharField()
    caption = serializers.CharField()


# Carte de résultat de recherche. min_tuition, best_pass_rate et cover_url sont
# des annotations calculées par la requête de recherche.
class InstitutionSummarySerializer(serializers.Serializer):
    uuid = serializers.CharField()
    name = serializers.CharField()
    city = serializers.CharField(source="city.name")
    type = serializers.CharField(source="type.label")
    sector = serializers.CharField(source="sector.label")
    linguistic_section = serializers.CharField(source="linguistic_section.label")
    phone = serializers.CharField()
    website = serializers.CharField()
    recommended = serializers.BooleanField()
    min_tuition = serializers.DecimalField(max_digits=12, decimal_places=2)
    best_pass_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    cover_url = serializers.CharField()


# Fiche publique complète. Les champs sont énumérés un par un : rien de ce qui
# n'est pas listé ici ne sort (statut, compteurs de vues, clé interne,
# comptes rattachés).
class InstitutionDetailSerializer(serializers.Serializer):
    uuid = serializers.CharField()
    name = serializers.CharField()
    description = serializers.CharField()
    director_name = serializers.CharField()
    director_title = serializers.CharField()
    director_bio = serializers.CharField()
    director_photo_url = serializers.CharField()
    address = serializers.CharField()
    phone = serializers.CharField()
    contact_email = serializers.CharField()
    website = serializers.CharField()
    city = serializers.CharField(source="city.name")
    region = serializers.CharField(source="city.region.name")
    type = serializers.CharField(source="type.label")
    sector = serializers.CharField(source="sector.label")
    linguistic_section = serializers.CharField(source="linguistic_section.label")
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    fees = FeeSerializer(many=True)
    services = ServiceSerializer(many=True)
    exam_results = ExamResultSerializer(many=True)
    programs = serializers.SerializerMethodField()
    media = MediaSerializer(many=True)

    def get_programs(self, establishment: Establishment) -> list[str]:
        return [
            program_offer.program.name
            for program_offer in establishment.program_offers.all()
        ]
