import uuid

# Longueur de la forme texte d'un UUID avec ses tirets.
PUBLIC_UUID_LENGTH = 36


# Les UUID existants sont stockés en texte avec tirets (char(36)). Le
# UUIDField de Django les écrirait sans tirets sur MySQL (char(32)) et ne
# relirait plus les lignes déjà en base : je garde donc un champ texte.
def generate_public_uuid() -> str:
    return str(uuid.uuid4())
