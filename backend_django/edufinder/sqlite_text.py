"""Recherche de texte insensible aux accents et à la casse sur SQLite.

MySQL compare déjà le texte ainsi (« college » trouve « Collège »). SQLite,
utilisé pour l'hébergement de démonstration et pour les tests, ne le fait que
pour les lettres non accentuées : un parent qui tape « college » ne
trouverait plus aucun collège. Je remplace donc l'opérateur LIKE de SQLite
par une version qui compare les textes sans accents ni majuscules, pour que
la recherche se comporte de la même façon sur les deux bases.
"""
import re
import unicodedata
from functools import lru_cache

from django.db.backends.base.base import BaseDatabaseWrapper
from django.db.backends.signals import connection_created

SQLITE_VENDOR = "sqlite"
COMPILED_PATTERNS_CACHE_SIZE = 256


def fold_text(text: str) -> str:
    decomposed_text = unicodedata.normalize("NFKD", text)
    unaccented_text = "".join(
        character for character in decomposed_text if not unicodedata.combining(character)
    )
    return unaccented_text.casefold()


# Un motif LIKE devient une expression régulière : « % » vaut n'importe quelle
# suite de caractères, « _ » un seul caractère, et le caractère d'échappement
# rend littéral celui qui le suit.
@lru_cache(maxsize=COMPILED_PATTERNS_CACHE_SIZE)
def _compile_like_pattern(like_pattern: str, escape_character: str | None) -> re.Pattern:
    regex_parts = []
    characters = iter(like_pattern)
    for character in characters:
        if character == escape_character:
            regex_parts.append(re.escape(next(characters, "")))
        elif character == "%":
            regex_parts.append(".*")
        elif character == "_":
            regex_parts.append(".")
        else:
            regex_parts.append(re.escape(character))
    return re.compile("".join(regex_parts), re.DOTALL)


# SQLite appelle cette fonction pour « valeur LIKE motif » : le motif vient en
# premier. Comme en SQL, une valeur absente ne correspond à rien.
def like_ignoring_accents(
    like_pattern: str | None, value: object, escape_character: str | None = None
) -> bool | None:
    if like_pattern is None or value is None:
        return None
    compiled_pattern = _compile_like_pattern(fold_text(like_pattern), escape_character)
    return compiled_pattern.fullmatch(fold_text(str(value))) is not None


def _install_text_search(connection: BaseDatabaseWrapper, **signal_arguments) -> None:
    if connection.vendor != SQLITE_VENDOR:
        return
    # LIKE existe avec et sans clause ESCAPE : je remplace les deux formes.
    for argument_count in (2, 3):
        connection.connection.create_function(
            "like", argument_count, like_ignoring_accents, deterministic=True
        )


def install_on_new_connections() -> None:
    connection_created.connect(_install_text_search)
