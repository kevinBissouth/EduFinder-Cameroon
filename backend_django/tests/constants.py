from edufinder.models import EstablishmentStatus

# Tout statut autre que « published » doit rester invisible de l'API publique.
HIDDEN_STATUSES = [
    EstablishmentStatus.PENDING,
    EstablishmentStatus.REJECTED,
    EstablishmentStatus.SUSPENDED,
]
