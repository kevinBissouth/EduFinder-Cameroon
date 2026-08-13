import enum


class RoleUtilisateur(str, enum.Enum):
    responsable = "responsable"
    super_admin = "super_admin"


class StatutEtablissement(str, enum.Enum):
    en_attente = "en_attente"
    publie = "publie"
    rejetee = "rejetee"
    suspendu = "suspendu"


class StatutSoumission(str, enum.Enum):
    en_attente = "en_attente"
    validee = "validee"
    rejetee = "rejetee"


class StatutDecision(str, enum.Enum):
    validee = "validee"
    rejetee = "rejetee"


class TypeSoumission(str, enum.Enum):
    creation = "creation"
    modification = "modification"


class TypeMedia(str, enum.Enum):
    image = "image"
    pdf = "pdf"
