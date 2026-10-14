"""Complète la nomenclature des classes et des examens.

Le secondaire technique partageait les classes du général (« 6e »…), alors
qu'il compte en années (« 1ère année » à « 4e année ») avant la seconde. Il
manquait aussi la SIL, la Class 6 et le FSLC, et la maternelle anglophone
commence par une Pre-Nursery, pas par une troisième année.

Je complète une nomenclature déjà en place, jamais une base vide : chaque
ajout se fait seulement si la ligne à laquelle il se rattache existe (comme la
migration 0007, une base sans les lignes attendues n'est pas touchée). Les
lignes sont désignées par leur libellé : les identifiants diffèrent d'une base
à l'autre.

Cette migration ne se défait pas : une fois les frais du technique déplacés,
rien ne dit plus lesquels venaient des classes du général.
"""
from django.db import migrations

TECHNICAL_TYPE_LABEL = "Secondary technical"

# Clé du cycle -> libellés d'affichage et classes, dans l'ordre de la scolarité.
TECHNICAL_STAGES = {
    "Technical lower secondary": {
        "label_fr": "Premier cycle technique",
        "label_en": "Technical lower secondary",
        "level_labels": ("1ère année", "2e année", "3e année", "4e année"),
    },
    "Technical upper secondary": {
        "label_fr": "Second cycle technique",
        "label_en": "Technical upper secondary",
        "level_labels": ("2nde", "1ère", "Terminale"),
    },
}

# Cycle existant -> classe qui lui manquait.
MISSING_LEVEL_LABELS = {"Primaire": "SIL", "Primary": "Class 6"}

NURSERY_STAGE_LABEL = "Nursery"
MISNAMED_NURSERY_LEVEL_LABEL = "Nursery 3"
PRE_NURSERY_LEVEL_LABEL = "Pre-Nursery"

# Le FSLC est le pendant anglophone du CEP : je ne l'ajoute que là où le CEP
# existe déjà.
FRANCOPHONE_PRIMARY_EXAM_LABEL = "CEP"
ANGLOPHONE_PRIMARY_EXAM_LABEL = "FSLC"

# (cycle, classe) du général -> (cycle, classe) du technique, année pour année.
TECHNICAL_LEVEL_BY_GENERAL_LEVEL = {
    ("Collège", "6e"): ("Technical lower secondary", "1ère année"),
    ("Collège", "5e"): ("Technical lower secondary", "2e année"),
    ("Collège", "4e"): ("Technical lower secondary", "3e année"),
    ("Collège", "3e"): ("Technical lower secondary", "4e année"),
    ("Lycée", "2nde"): ("Technical upper secondary", "2nde"),
    ("Lycée", "1ère"): ("Technical upper secondary", "1ère"),
    ("Lycée", "Terminale"): ("Technical upper secondary", "Terminale"),
}


def add_technical_stages(get_model):
    if not get_model("EstablishmentType").objects.filter(label=TECHNICAL_TYPE_LABEL).exists():
        return
    for stage_label, stage_content in TECHNICAL_STAGES.items():
        stage, _ = get_model("Stage").objects.get_or_create(
            label=stage_label,
            defaults={
                "label_fr": stage_content["label_fr"],
                "label_en": stage_content["label_en"],
            },
        )
        for level_label in stage_content["level_labels"]:
            get_model("StudyLevel").objects.get_or_create(stage=stage, label=level_label)


def add_missing_levels(get_model):
    for stage_label, level_label in MISSING_LEVEL_LABELS.items():
        stage = get_model("Stage").objects.filter(label=stage_label).first()
        if stage is not None:
            get_model("StudyLevel").objects.get_or_create(stage=stage, label=level_label)


# Je renomme la ligne au lieu d'en créer une : son identifiant reste celui que
# d'anciennes soumissions peuvent citer.
def rename_third_nursery_year(get_model):
    nursery_levels = get_model("StudyLevel").objects.filter(stage__label=NURSERY_STAGE_LABEL)
    if nursery_levels.filter(label=PRE_NURSERY_LEVEL_LABEL).exists():
        return
    nursery_levels.filter(label=MISNAMED_NURSERY_LEVEL_LABEL).update(
        label=PRE_NURSERY_LEVEL_LABEL
    )


def add_anglophone_primary_exam(get_model):
    exams = get_model("Exam").objects
    if not exams.filter(label=FRANCOPHONE_PRIMARY_EXAM_LABEL).exists():
        return
    exams.get_or_create(label=ANGLOPHONE_PRIMARY_EXAM_LABEL)


# Une école technique qui a déjà des frais pour la classe d'arrivée et la même
# année garde ses deux lignes : la contrainte d'unicité interdit le
# déplacement, et je ne choisis pas à sa place lequel des deux montants garder.
def move_fee(fee, technical_level, school_fees):
    is_target_taken = school_fees.filter(
        establishment=fee.establishment, level=technical_level, school_year=fee.school_year
    ).exists()
    if is_target_taken:
        return
    fee.level = technical_level
    fee.save(update_fields=["level"])


def move_technical_school_fees(get_model):
    school_fees = get_model("SchoolFee").objects
    study_levels = get_model("StudyLevel").objects
    for general_level, technical_level in TECHNICAL_LEVEL_BY_GENERAL_LEVEL.items():
        general_stage_label, general_level_label = general_level
        technical_stage_label, technical_level_label = technical_level
        target_level = study_levels.filter(
            stage__label=technical_stage_label, label=technical_level_label
        ).first()
        if target_level is None:
            continue
        fees_on_general_level = school_fees.filter(
            establishment__type__label=TECHNICAL_TYPE_LABEL,
            level__stage__label=general_stage_label,
            level__label=general_level_label,
        )
        for fee in fees_on_general_level:
            move_fee(fee, target_level, school_fees)


def complete_school_nomenclature(apps, schema_editor):
    def get_model(model_name):
        return apps.get_model("edufinder", model_name)

    add_technical_stages(get_model)
    add_missing_levels(get_model)
    rename_third_nursery_year(get_model)
    add_anglophone_primary_exam(get_model)
    move_technical_school_fees(get_model)


class Migration(migrations.Migration):

    dependencies = [
        ("edufinder", "0008_bilingual_school_content"),
    ]

    operations = [
        migrations.RunPython(complete_school_nomenclature, migrations.RunPython.noop),
    ]
