from django.db import models
from django.utils import timezone

from edufinder.models.enums import ContentLanguage, EstablishmentStatus, MediaType
from edufinder.models.identifiers import PUBLIC_UUID_LENGTH, generate_public_uuid
from edufinder.models.reference import (
    City,
    EstablishmentType,
    Exam,
    LinguisticSection,
    PaymentMethod,
    Program,
    Sector,
    StudyLevel,
)
from edufinder.models.user import User

STATUS_MAX_LENGTH = 20
MEDIA_TYPE_MAX_LENGTH = 20
CONTENT_LANGUAGE_MAX_LENGTH = 2
COORDINATE_MAX_DIGITS = 9
COORDINATE_DECIMAL_PLACES = 6
MINIMUM_PASS_RATE = 0
MAXIMUM_PASS_RATE = 100


class EstablishmentQuerySet(models.QuerySet):
    # Règle d'or de l'API publique : seul le statut publié est visible. Je la
    # centralise ici pour qu'aucune requête publique ne la réécrive (et ne
    # l'oublie).
    def published(self) -> "EstablishmentQuerySet":
        return self.filter(status=EstablishmentStatus.PUBLISHED)


class Establishment(models.Model):
    id_establishment = models.AutoField(primary_key=True)
    # Identifiant public non devinable, exposé dans les URLs et l'API ;
    # l'entier auto-incrémenté reste un détail interne.
    uuid = models.CharField(max_length=PUBLIC_UUID_LENGTH, default=generate_public_uuid)
    city = models.ForeignKey(
        City,
        on_delete=models.PROTECT,
        db_column="id_city",
        related_name="establishments",
    )
    type = models.ForeignKey(
        EstablishmentType,
        on_delete=models.PROTECT,
        db_column="id_type",
        related_name="establishments",
    )
    sector = models.ForeignKey(
        Sector,
        on_delete=models.PROTECT,
        db_column="id_sector",
        related_name="establishments",
    )
    linguistic_section = models.ForeignKey(
        LinguisticSection,
        on_delete=models.PROTECT,
        db_column="id_linguistic_section",
        related_name="establishments",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    # Responsable de l'établissement (directeur / proviseur) : distinct du
    # compte du gestionnaire. Mis en avant dans la présentation documentaire.
    director_name = models.CharField(max_length=120, null=True, blank=True)
    director_title = models.CharField(max_length=80, null=True, blank=True)
    director_bio = models.TextField(null=True, blank=True)
    # Textes libres dans les deux langues du site. Les colonnes d'origine
    # (description, director_title, director_bio) gardent le texte tel que
    # l'établissement l'a écrit, dans la langue content_language ; les colonnes
    # « _translation » portent sa version dans l'autre langue, facultative.
    # content_language reste à NULL pour une fiche saisie avant ce choix : sa
    # langue est alors inconnue et le texte est affiché tel quel.
    content_language = models.CharField(
        max_length=CONTENT_LANGUAGE_MAX_LENGTH,
        choices=ContentLanguage.choices,
        null=True,
        blank=True,
    )
    description_translation = models.TextField(null=True, blank=True)
    director_title_translation = models.CharField(max_length=80, null=True, blank=True)
    director_bio_translation = models.TextField(null=True, blank=True)
    # Photo du responsable : distincte de la galerie de l'établissement,
    # illustration de la fiche Leadership.
    director_photo_url = models.CharField(max_length=500, null=True, blank=True)
    address = models.CharField(max_length=255, null=True, blank=True)
    # Coordonnées GPS optionnelles (géocodage de l'adresse + ville) ; une
    # école sans point précis est située via sa ville côté rendu.
    latitude = models.DecimalField(
        max_digits=COORDINATE_MAX_DIGITS,
        decimal_places=COORDINATE_DECIMAL_PLACES,
        null=True,
        blank=True,
    )
    longitude = models.DecimalField(
        max_digits=COORDINATE_MAX_DIGITS,
        decimal_places=COORDINATE_DECIMAL_PLACES,
        null=True,
        blank=True,
    )
    status = models.CharField(
        max_length=STATUS_MAX_LENGTH, choices=EstablishmentStatus.choices
    )
    phone = models.CharField(max_length=20, null=True, blank=True)
    contact_email = models.CharField(max_length=255, null=True, blank=True)
    website = models.CharField(max_length=255, null=True, blank=True)
    # Établissement mis en avant par l'équipe éditoriale : il remonte en tête
    # de la recherche publique et reçoit un badge « Recommended » côté UI.
    # db_default reprend le défaut posé en base : les inserts SQL bruts des
    # scripts de données comptent dessus.
    recommended = models.BooleanField(default=False, db_default=False)
    # Indicateurs de performance vus par le responsable (incrémentés côté
    # public, jamais exposés publiquement) : vues de la fiche et demandes
    # d'admission (clic sur l'e-mail du secrétariat).
    views_count = models.IntegerField(default=0, db_default=0)
    inquiries_count = models.IntegerField(default=0, db_default=0)
    created_at = models.DateTimeField(default=timezone.now)
    # Reste à NULL tant que l'établissement n'a jamais été modifié.
    updated_at = models.DateTimeField(null=True, blank=True)

    objects = EstablishmentQuerySet.as_manager()

    class Meta:
        db_table = "establishment"
        constraints = [
            models.UniqueConstraint(fields=["uuid"], name="uq_establishment_uuid"),
        ]


# Les trois tables d'association ci-dessous ont une clé primaire sur deux
# colonnes et aucune colonne id : CompositePrimaryKey décrit ce schéma tel
# quel, là où un ManyToManyField exigerait une colonne id supplémentaire.
class ProgramOffer(models.Model):
    pk = models.CompositePrimaryKey("establishment_id", "program_id")
    establishment = models.ForeignKey(
        Establishment,
        on_delete=models.PROTECT,
        db_column="id_establishment",
        related_name="program_offers",
    )
    program = models.ForeignKey(
        Program,
        on_delete=models.PROTECT,
        db_column="id_program",
        related_name="establishment_offers",
    )

    class Meta:
        db_table = "program_offer"


# Cette table porte la règle d'autorisation du cahier des besoins : un
# responsable n'accède qu'aux établissements qui lui sont associés ici.
class UserEstablishment(models.Model):
    pk = models.CompositePrimaryKey("user_id", "establishment_id")
    user = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        db_column="id_user",
        related_name="user_establishments",
    )
    establishment = models.ForeignKey(
        Establishment,
        on_delete=models.PROTECT,
        db_column="id_establishment",
        related_name="user_establishments",
    )

    class Meta:
        db_table = "user_establishment"


class SchoolFee(models.Model):
    id_fee = models.AutoField(primary_key=True)
    establishment = models.ForeignKey(
        Establishment,
        on_delete=models.PROTECT,
        db_column="id_establishment",
        related_name="fees",
    )
    level = models.ForeignKey(
        StudyLevel,
        on_delete=models.PROTECT,
        db_column="id_level",
        related_name="fees",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    school_year = models.CharField(max_length=9)

    class Meta:
        db_table = "school_fee"
        constraints = [
            models.UniqueConstraint(
                fields=["establishment", "level", "school_year"],
                name="uq_fee_establishment_level_school_year",
            ),
            models.CheckConstraint(
                condition=models.Q(amount__gte=0),
                name="ck_school_fee_amount_positive",
            ),
        ]


class SchoolFeePaymentMethod(models.Model):
    pk = models.CompositePrimaryKey("fee_id", "payment_method_id")
    fee = models.ForeignKey(
        SchoolFee,
        on_delete=models.PROTECT,
        db_column="id_fee",
        related_name="payment_methods",
    )
    payment_method = models.ForeignKey(
        PaymentMethod,
        on_delete=models.PROTECT,
        db_column="id_payment_method",
        related_name="fees",
    )

    class Meta:
        db_table = "school_fee_payment_method"


class Service(models.Model):
    id_service = models.AutoField(primary_key=True)
    establishment = models.ForeignKey(
        Establishment,
        on_delete=models.PROTECT,
        db_column="id_establishment",
        related_name="services",
    )
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "service"
        # Un même service ne peut pas apparaître deux fois chez un
        # établissement ; la collation MySQL rend l'unicité insensible à la casse.
        constraints = [
            models.UniqueConstraint(
                fields=["establishment", "name"],
                name="uq_service_establishment_name",
            ),
        ]


class ExamResult(models.Model):
    id_result = models.AutoField(primary_key=True)
    establishment = models.ForeignKey(
        Establishment,
        on_delete=models.PROTECT,
        db_column="id_establishment",
        related_name="exam_results",
    )
    exam = models.ForeignKey(
        Exam,
        on_delete=models.PROTECT,
        db_column="id_exam",
        related_name="exam_results",
    )
    session = models.CharField(max_length=20)
    pass_rate = models.DecimalField(max_digits=5, decimal_places=2)

    class Meta:
        db_table = "exam_result"
        constraints = [
            models.UniqueConstraint(
                fields=["establishment", "exam", "session"],
                name="uq_exam_result_establishment_exam_session",
            ),
            # La validation des entrées de l'API ne protège pas les inserts SQL
            # bruts : la plage est aussi garantie en base.
            models.CheckConstraint(
                condition=models.Q(
                    pass_rate__gte=MINIMUM_PASS_RATE, pass_rate__lte=MAXIMUM_PASS_RATE
                ),
                name="ck_exam_result_pass_rate_range",
            ),
        ]


class Media(models.Model):
    id_media = models.AutoField(primary_key=True)
    establishment = models.ForeignKey(
        Establishment,
        on_delete=models.PROTECT,
        db_column="id_establishment",
        related_name="media",
    )
    type = models.CharField(max_length=MEDIA_TYPE_MAX_LENGTH, choices=MediaType.choices)
    url = models.CharField(max_length=500)
    caption = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = "media"


# Vues et demandes de contact d'un établissement pour une journée. Les totaux
# portés par establishment ne disent rien de l'évolution : cette table garde
# une ligne par jour où il s'est passé quelque chose.
class EstablishmentDailyActivity(models.Model):
    id_daily_activity = models.AutoField(primary_key=True)
    establishment = models.ForeignKey(
        Establishment,
        on_delete=models.CASCADE,
        db_column="id_establishment",
        related_name="daily_activities",
    )
    day = models.DateField()
    views_count = models.IntegerField(default=0)
    inquiries_count = models.IntegerField(default=0)

    class Meta:
        db_table = "establishment_daily_activity"
        constraints = [
            models.UniqueConstraint(
                fields=["establishment", "day"], name="uq_daily_activity_establishment_day"
            ),
        ]
