"""Décide (rejette) les soumissions pending des établissements d'un manager.

Usage (depuis backend/) :
    python scripts/decide_pending_submissions.py kevin@gmail.com

Pourquoi un rejet plutôt qu'une approbation : les soumissions en attente du
compte de démo sont des essais de test (frais, services,) et les approuver
écrirait réellement ces valeurs sur les fiches de démonstration. Les rejeter
libère le blocage « une soumission est déjà pending » sans toucher aux données.
La décision passe par reject_submission (logique métier) pour rester cohérente
avec le reste de l'application et garder un historique décisionnel complet.

Le script n'agit que sur les établissements réellement gérés par le manager
(user_establishment) : les soumissions orphelines des autres écoles ne sont
pas dans son périmètre.
"""
import sys

from sqlmodel import Session, select

from app.db.session import engine
from app.models.establishment import Establishment, UserEstablishment
from app.models.enums import SubmissionStatus
from app.models.submission import Submission
from app.models.user import User
from app.services.validation import reject_submission


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage : python scripts/decide_pending_submissions.py <email_manager>")
        return 1

    manager_email = sys.argv[1]
    with Session(engine) as session:
        manager = session.exec(
            select(User).where(User.email == manager_email)
        ).first()
        if manager is None:
            print(f"Manager {manager_email} introuvable.")
            return 1
        admin = session.exec(
            select(User).where(User.email == "admin@edufinder.cm")
        ).first()
        if admin is None:
            print("Compte super_admin introuvable, décision impossible.")
            return 1

        owned_ids = [
            link.id_establishment
            for link in session.exec(
                select(UserEstablishment).where(UserEstablishment.id_user == manager.id_user)
            ).all()
        ]
        pending = session.exec(
            select(Submission).where(
                Submission.id_user == manager.id_user,
                Submission.id_establishment.in_(owned_ids),
                Submission.status == SubmissionStatus.pending,
            )
        ).all()

        if not pending:
            print("Aucune soumission pending à décider : déjà débloqué.")
            return 0

        reason = "Soumission de test refusée pour permettre un nouvel essai."
        for submission in pending:
            reject_submission(session, admin, submission.uuid, reason)
            establishment = session.get(Establishment, submission.id_establishment)
            print(f"Rejetée : {establishment.name} — {submission.type.value}")
        return 0


if __name__ == "__main__":
    raise SystemExit(main())