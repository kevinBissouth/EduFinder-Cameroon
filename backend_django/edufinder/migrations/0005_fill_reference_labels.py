"""Remplit les libellés français et anglais des listes de référence.

La clé (colonne name ou label) n'est jamais modifiée : je ne fais qu'écrire
les deux colonnes d'affichage ajoutées par la migration précédente. Une valeur
absente de ces tables garde ses libellés vides et s'affiche avec sa clé.
"""
from django.db import migrations

# Par modèle : la colonne qui porte la clé, puis clé -> (français, anglais).
REFERENCE_LABELS = {
    "Region": (
        "name",
        {
            "Adamawa": ("Adamaoua", "Adamawa"),
            "Centre": ("Centre", "Centre"),
            "East": ("Est", "East"),
            "Far North": ("Extrême-Nord", "Far North"),
            "Littoral": ("Littoral", "Littoral"),
            "North": ("Nord", "North"),
            "Northwest": ("Nord-Ouest", "Northwest"),
            "South": ("Sud", "South"),
            "Southwest": ("Sud-Ouest", "Southwest"),
            "West": ("Ouest", "West"),
        },
    ),
    "EstablishmentType": (
        "label",
        {
            "Nursery": ("Maternelle", "Nursery"),
            "Primary": ("Primaire", "Primary"),
            "Secondary general": ("Secondaire général", "Secondary general"),
            "Secondary technical": ("Secondaire technique", "Secondary technical"),
            "Higher institute": ("Institut supérieur", "Higher institute"),
            "Private university": ("Université privée", "Private university"),
        },
    ),
    "LinguisticSection": (
        "label",
        {
            "Francophone": ("Francophone", "Francophone"),
            "Anglophone": ("Anglophone", "Anglophone"),
            "Bilingual": ("Bilingue", "Bilingual"),
        },
    ),
    "Sector": (
        "label",
        {
            "public": ("Public", "Public"),
            "private": ("Privé", "Private"),
            "privé": ("Privé", "Private"),
        },
    ),
    # Les sigles d'examens sont des noms officiels : seul le baccalauréat a
    # une orthographe propre à chaque langue.
    "Exam": (
        "label",
        {
            "Baccalaureate": ("Baccalauréat", "Baccalaureate"),
        },
    ),
    "Stage": (
        "label",
        {
            "Maternelle": ("Maternelle", "Nursery"),
            "Nursery": ("Maternelle", "Nursery"),
            "Primaire": ("Primaire", "Primary"),
            "Primary": ("Primaire", "Primary"),
            "Collège": ("Collège", "Lower secondary"),
            "Lower secondary": ("Premier cycle du secondaire", "Lower secondary"),
            "Lycée": ("Lycée", "Upper secondary"),
            "Upper secondary": ("Second cycle du secondaire", "Upper secondary"),
            "Supérieur": ("Supérieur", "Higher education"),
            "Higher": ("Supérieur", "Higher education"),
        },
    ),
    "Program": (
        "name",
        {
            "Arts and humanities": ("Lettres et sciences humaines", "Arts and humanities"),
            "Lettres et sciences humaines": ("Lettres et sciences humaines", "Arts and humanities"),
            "Civil engineering and construction": ("Génie civil et BTP", "Civil engineering and construction"),
            "Génie civil et BTP": ("Génie civil et BTP", "Civil engineering and construction"),
            "Computer science and software engineering": (
                "Informatique et génie logiciel",
                "Computer science and software engineering",
            ),
            "Informatique et génie logiciel": (
                "Informatique et génie logiciel",
                "Computer science and software engineering",
            ),
            "Economics and management": ("Sciences économiques et de gestion", "Economics and management"),
            "Sciences économiques et de gestion": (
                "Sciences économiques et de gestion",
                "Economics and management",
            ),
            "Electrical engineering": ("Génie électrique", "Electrical engineering"),
            "Génie électrique": ("Génie électrique", "Electrical engineering"),
            "Health sciences": ("Sciences de la santé", "Health sciences"),
            "Sciences de la santé": ("Sciences de la santé", "Health sciences"),
            "Pure sciences": ("Sciences pures", "Pure sciences"),
            "Sciences pures": ("Sciences pures", "Pure sciences"),
        },
    ),
    "PaymentMethod": (
        "label",
        {
            "1 installment": ("1 tranche", "1 installment"),
            "1 tranche": ("1 tranche", "1 installment"),
            "2 installments": ("2 tranches", "2 installments"),
            "2 tranches": ("2 tranches", "2 installments"),
            "3 installments": ("3 tranches", "3 installments"),
            "3 tranches": ("3 tranches", "3 installments"),
        },
    ),
}


def fill_reference_labels(apps, schema_editor):
    for model_name, (key_column, labels_by_key) in REFERENCE_LABELS.items():
        reference_model = apps.get_model("edufinder", model_name)
        for key, (label_fr, label_en) in labels_by_key.items():
            reference_model.objects.filter(**{key_column: key}).update(
                label_fr=label_fr, label_en=label_en
            )


class Migration(migrations.Migration):

    dependencies = [
        ("edufinder", "0004_bilingual_reference_labels"),
    ]

    operations = [
        # Le retour arrière n'a rien à défaire : supprimer les colonnes
        # (migration précédente) emporte leur contenu.
        migrations.RunPython(fill_reference_labels, migrations.RunPython.noop),
    ]
