"""Tables de référence : découpage administratif et nomenclatures.

Les noms de tables et de colonnes sont ceux du schéma MySQL existant (créé
par Alembic) : je les fixe avec db_table / db_column pour que Django lise la
base de démo telle quelle, sans rien renommer.
"""
from django.db import models

LABEL_MAX_LENGTH = 100


# Libellés d'affichage dans les deux langues du site. La colonne d'origine
# (name ou label) reste la clé métier : les règles de cohérence et les
# propositions la comparent telle quelle, je ne la traduis donc jamais sur
# place. Un libellé vide signifie « pas encore traduit ».
class BilingualLabels(models.Model):
    label_fr = models.CharField(max_length=LABEL_MAX_LENGTH, blank=True, default="")
    label_en = models.CharField(max_length=LABEL_MAX_LENGTH, blank=True, default="")

    class Meta:
        abstract = True


# Découpage administratif : une région regroupe plusieurs villes.
class Region(BilingualLabels):
    id_region = models.AutoField(primary_key=True)
    name = models.CharField(max_length=LABEL_MAX_LENGTH)

    class Meta:
        db_table = "region"
        constraints = [
            models.UniqueConstraint(fields=["name"], name="uq_region_name"),
        ]


# Type d'établissement : maternelle, primaire, secondaire, université…
class EstablishmentType(BilingualLabels):
    id_type = models.AutoField(primary_key=True)
    label = models.CharField(max_length=LABEL_MAX_LENGTH)

    class Meta:
        db_table = "establishment_type"


# Ville rattachée à une région ; les établissements y sont localisés.
class City(models.Model):
    id_city = models.AutoField(primary_key=True)
    # PROTECT sur toutes les clés étrangères : la base refuse déjà de supprimer
    # une ligne référencée (aucune cascade dans le schéma), Django doit dire
    # la même chose.
    region = models.ForeignKey(
        Region,
        on_delete=models.PROTECT,
        db_column="id_region",
        related_name="cities",
    )
    name = models.CharField(max_length=LABEL_MAX_LENGTH)

    class Meta:
        db_table = "city"
        constraints = [
            models.UniqueConstraint(
                fields=["name", "region"], name="uq_city_name_region"
            ),
        ]


# Étape de scolarité (maternelle, primaire, secondaire, supérieur) qui
# regroupe les niveaux d'étude.
class Stage(BilingualLabels):
    id_stage = models.AutoField(primary_key=True)
    label = models.CharField(max_length=LABEL_MAX_LENGTH)

    class Meta:
        db_table = "stage"
        constraints = [
            models.UniqueConstraint(fields=["label"], name="uq_stage_label"),
        ]


# Niveau d'étude (Petite Section, CP, 6e, Licence 1…) rattaché à une étape ;
# les frais de scolarité se définissent par niveau.
class StudyLevel(models.Model):
    id_level = models.AutoField(primary_key=True)
    stage = models.ForeignKey(
        Stage,
        on_delete=models.PROTECT,
        db_column="id_stage",
        related_name="study_levels",
    )
    label = models.CharField(max_length=LABEL_MAX_LENGTH)

    class Meta:
        db_table = "study_level"
        constraints = [
            models.UniqueConstraint(
                fields=["stage", "label"], name="uq_study_level_stage_label"
            ),
        ]


# Filière ou programme offert par un établissement (Informatique, Santé…).
class Program(BilingualLabels):
    id_program = models.AutoField(primary_key=True)
    name = models.CharField(max_length=LABEL_MAX_LENGTH)

    class Meta:
        db_table = "program"
        # Sans unicité, deux lignes du même nom fragmenteraient le filtre par
        # programme.
        constraints = [
            models.UniqueConstraint(fields=["name"], name="uq_program_name"),
        ]


# Examen officiel (CEP, BEPC, Probatoire, Bac…).
class Exam(BilingualLabels):
    id_exam = models.AutoField(primary_key=True)
    label = models.CharField(max_length=LABEL_MAX_LENGTH)

    class Meta:
        db_table = "exam"


# Modalité de paiement des frais (1 tranche, 2 tranches, trimestriel…).
class PaymentMethod(BilingualLabels):
    id_payment_method = models.AutoField(primary_key=True)
    label = models.CharField(max_length=LABEL_MAX_LENGTH)

    class Meta:
        db_table = "payment_method"


# Secteur de l'établissement : public ou privé. Le regroupement public/privé
# repose sur cette colonne dédiée et jamais sur le texte du libellé : les
# libellés réels sont hétérogènes (« private », « privé »…).
class Sector(BilingualLabels):
    id_sector = models.AutoField(primary_key=True)
    label = models.CharField(max_length=LABEL_MAX_LENGTH)
    is_public = models.BooleanField(default=False)

    class Meta:
        db_table = "sector"


# Section linguistique de l'établissement : francophone, anglophone, bilingue.
class LinguisticSection(BilingualLabels):
    id_linguistic_section = models.AutoField(primary_key=True)
    label = models.CharField(max_length=LABEL_MAX_LENGTH)

    class Meta:
        db_table = "linguistic_section"
