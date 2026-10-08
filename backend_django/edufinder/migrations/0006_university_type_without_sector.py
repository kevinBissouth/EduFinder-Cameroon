"""Le type « Private university » devient « University ».

Le caractère public ou privé d'un établissement est porté par son secteur :
un type qui le répétait obligeait à classer une université d'État comme
« université privée ». Seul le libellé du type change, aucun établissement
n'est modifié.
"""
from django.db import migrations

SECTOR_BOUND_LABELS = {
    "label": "Private university",
    "label_fr": "Université privée",
    "label_en": "Private university",
}
NEUTRAL_LABELS = {
    "label": "University",
    "label_fr": "Université",
    "label_en": "University",
}


def rename_university_type(apps, current_label, new_labels):
    establishment_type_model = apps.get_model("edufinder", "EstablishmentType")
    establishment_type_model.objects.filter(label=current_label).update(**new_labels)


def make_university_type_neutral(apps, schema_editor):
    rename_university_type(apps, SECTOR_BOUND_LABELS["label"], NEUTRAL_LABELS)


def restore_sector_bound_type(apps, schema_editor):
    rename_university_type(apps, NEUTRAL_LABELS["label"], SECTOR_BOUND_LABELS)


class Migration(migrations.Migration):

    dependencies = [
        ("edufinder", "0005_fill_reference_labels"),
    ]

    operations = [
        migrations.RunPython(make_university_type_neutral, restore_sector_bound_type),
    ]
