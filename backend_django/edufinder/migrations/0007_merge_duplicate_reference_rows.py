"""Fusionne les lignes de référence saisies deux fois, une par langue.

Le secteur privé, les modalités de paiement et les filières existaient en
double (« privé » et « private », « 2 tranches » et « 2 installments »…) :
depuis que chaque ligne porte ses deux libellés, le doublon ne sert plus et
fait apparaître deux fois le même choix dans les formulaires. Je garde la
ligne à clé anglaise, comme pour les autres listes, j'y rattache tout ce qui
pointait vers l'autre, puis je supprime l'autre.

Cette migration ne se défait pas : une fois les liens rattachés, rien ne dit
plus lesquels venaient du doublon. Sauvegarder la base avant de l'appliquer.
"""
from django.db import migrations

# Clé du doublon -> clé de la ligne conservée.
DUPLICATE_SECTORS = {"privé": "private"}
DUPLICATE_PAYMENT_METHODS = {
    "1 tranche": "1 installment",
    "2 tranches": "2 installments",
    "3 tranches": "3 installments",
}
DUPLICATE_PROGRAMS = {
    "Lettres et sciences humaines": "Arts and humanities",
    "Génie civil et BTP": "Civil engineering and construction",
    "Informatique et génie logiciel": "Computer science and software engineering",
    "Sciences économiques et de gestion": "Economics and management",
    "Génie électrique": "Electrical engineering",
    "Sciences de la santé": "Health sciences",
    "Sciences pures": "Pure sciences",
}


# Paires (doublon, conservée) réellement présentes dans cette base : une base
# qui n'a pas le doublon, ou pas la ligne à conserver, n'est pas touchée.
def find_row_pairs(reference_model, key_column, kept_key_by_duplicate_key):
    row_pairs = []
    for duplicate_key, kept_key in kept_key_by_duplicate_key.items():
        duplicate_row = reference_model.objects.filter(**{key_column: duplicate_key}).first()
        kept_row = reference_model.objects.filter(**{key_column: kept_key}).first()
        if duplicate_row and kept_row:
            row_pairs.append((duplicate_row, kept_row))
    return row_pairs


# Les tables de liaison ont une clé primaire composée : je recrée le lien vers
# la ligne conservée puis je supprime l'ancien, plutôt que de modifier une
# colonne de la clé. get_or_create absorbe le cas où les deux liens existaient.
def move_links(link_model, owner_field, reference_field, duplicate_row, kept_row):
    duplicate_links = link_model.objects.filter(**{reference_field: duplicate_row})
    for duplicate_link in duplicate_links:
        link_model.objects.get_or_create(
            **{owner_field: getattr(duplicate_link, owner_field), reference_field: kept_row}
        )
    duplicate_links.delete()


def replace_keeping_order(values, kept_value_by_duplicate_value):
    replaced_values = []
    for value in values:
        kept_value = kept_value_by_duplicate_value.get(value, value)
        if kept_value not in replaced_values:
            replaced_values.append(kept_value)
    return replaced_values


def remap_fee(fee, kept_label_by_duplicate_label):
    if not isinstance(fee, dict) or "payment_methods" not in fee:
        return fee
    return {
        **fee,
        "payment_methods": replace_keeping_order(
            fee["payment_methods"] or [], kept_label_by_duplicate_label
        ),
    }


# Le contenu d'une soumission cite les secteurs et filières par identifiant,
# les modalités de paiement par libellé : je le réécris pour qu'une soumission
# en attente reste applicable et que l'historique reste lisible.
def remap_content(content, kept_values):
    remapped_content = dict(content)
    if content.get("id_sector") in kept_values["sector_ids"]:
        remapped_content["id_sector"] = kept_values["sector_ids"][content["id_sector"]]
    if content.get("program_ids"):
        remapped_content["program_ids"] = replace_keeping_order(
            content["program_ids"], kept_values["program_ids"]
        )
    if content.get("fees"):
        remapped_content["fees"] = [
            remap_fee(fee, kept_values["payment_labels"]) for fee in content["fees"]
        ]
    return remapped_content


def remap_submission_contents(submission_model, kept_values):
    for submission in submission_model.objects.all():
        remapped_content = remap_content(submission.content, kept_values)
        if remapped_content != submission.content:
            submission.content = remapped_content
            submission.save(update_fields=["content"])


def merge_duplicate_reference_rows(apps, schema_editor):
    def get_model(model_name):
        return apps.get_model("edufinder", model_name)

    sector_pairs = find_row_pairs(get_model("Sector"), "label", DUPLICATE_SECTORS)
    payment_pairs = find_row_pairs(
        get_model("PaymentMethod"), "label", DUPLICATE_PAYMENT_METHODS
    )
    program_pairs = find_row_pairs(get_model("Program"), "name", DUPLICATE_PROGRAMS)

    for duplicate_sector, kept_sector in sector_pairs:
        get_model("Establishment").objects.filter(sector=duplicate_sector).update(
            sector=kept_sector
        )
    for duplicate_method, kept_method in payment_pairs:
        move_links(
            get_model("SchoolFeePaymentMethod"),
            "fee",
            "payment_method",
            duplicate_method,
            kept_method,
        )
    for duplicate_program, kept_program in program_pairs:
        move_links(
            get_model("ProgramOffer"),
            "establishment",
            "program",
            duplicate_program,
            kept_program,
        )

    remap_submission_contents(
        get_model("Submission"),
        {
            "sector_ids": {duplicate.pk: kept.pk for duplicate, kept in sector_pairs},
            "program_ids": {duplicate.pk: kept.pk for duplicate, kept in program_pairs},
            "payment_labels": {
                duplicate.label: kept.label for duplicate, kept in payment_pairs
            },
        },
    )

    # Plus rien ne pointe vers les doublons : la base accepte leur suppression.
    for duplicate_row, _ in [*sector_pairs, *payment_pairs, *program_pairs]:
        duplicate_row.delete()


class Migration(migrations.Migration):

    dependencies = [
        ("edufinder", "0006_university_type_without_sector"),
    ]

    operations = [
        migrations.RunPython(merge_duplicate_reference_rows, migrations.RunPython.noop),
    ]
