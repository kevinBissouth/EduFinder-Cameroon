"""Ajoute quelques soumissions réelles pour le compte démo du manager Kevin.

Usage (depuis backend/) :
    python scripts/seed_manager_submissions.py

Le but : donner du contenu à « Soumissions récentes », « Aperçu des
activités » et aux compteurs du dashboard manager. La base ne contenait
aucune soumission (total = 0), donc je construis ici un petit historique
cohérent sur les deux établissements gérés par Kevin. Le script est
idempotent : il ne réinsère rien si Kevin a déjà des soumissions.

Rappel de la règle projet : je fournis submitted_at explicitement (défauts
définis côté Python seulement) et je lie les décisions d'approbation/refus
à un super_admin réel pour garder l'historique cohérent.
"""
from datetime import datetime, timedelta, timezone

from sqlmodel import Session, select

from app.db.session import engine
from app.models.establishment import Establishment
from app.models.enums import (
    DecisionStatus,
    SubmissionStatus,
    SubmissionType,
)
from app.models.submission import Submission, ValidationDecision
from app.models.user import User


# Établissements gérés par Kevin (id_user 8) — valeurs réelles en base.
ORIGIN_SUBMISSIONS = [
    {
        "establishment_id": 20,
        "type": SubmissionType.modification,
        "status": SubmissionStatus.approved,
        "days_ago": 18,
        "content": {
            "name": "Groupe Scolaire Les Palmiers",
            "fees": [
                {
                    "id_level": 76,
                    "amount": "156000.00",
                    "school_year": "2025-2026",
                },
            ],
            "note": "Mise à jour des frais de scolarité 2025-2026.",
        },
    },
    {
        "establishment_id": 19,
        "type": SubmissionType.modification,
        "status": SubmissionStatus.approved,
        "days_ago": 35,
        "content": {
            "name": "Institut Supérieur d'Ingénierie et de Technologie (ISIT)",
            "program_ids": [29, 31],
            "note": "Ajout de nouveaux programmes de formation.",
        },
    },
    {
        "establishment_id": 20,
        "type": SubmissionType.modification,
        "status": SubmissionStatus.pending,
        "days_ago": 3,
        "content": {
            "name": "Groupe Scolaire Les Palmiers",
            "services": ["Library", "Canteen", "Transport"],
            "note": "Mise à jour des services proposés.",
        },
    },
    {
        "establishment_id": 19,
        "type": SubmissionType.modification,
        "status": SubmissionStatus.rejected,
        "days_ago": 60,
        "content": {
            "name": "Institut Supérieur d'Ingénierie et de Technologie",
            "phone": "+237699000111",
            "note": "Changement de téléphone de contact.",
        },
    },
]


def main() -> int:
    with Session(engine) as session:
        manager = session.exec(
            select(User).where(User.email == "kevin@gmail.com")
        ).first()
        if manager is None:
            print("Compte manager kevin@gmail.com introuvable.")
            return 1
        admin = session.exec(
            select(User).where(User.email == "admin@edufinder.cm")
        ).first()
        if admin is None:
            print("Compte super_admin introuvable, décisions impossibles.")
            return 1

        existing = session.exec(
            select(Submission).where(Submission.id_user == manager.id_user)
        ).all()
        if existing:
            print(f"Kevin a déjà {len(existing)} soumission(s) : rien à ajouter.")
            return 0

        now = datetime.now(timezone.utc)
        for entry in ORIGIN_SUBMISSIONS:
            establishment = session.get(
                Establishment, entry["establishment_id"]
            )
            submitted_at = now - timedelta(days=entry["days_ago"])
            submission = Submission(
                id_user=manager.id_user,
                id_establishment=establishment.id_establishment,
                type=entry["type"],
                status=entry["status"],
                content=entry["content"],
                submitted_at=submitted_at,
            )
            session.add(submission)
            session.flush()

            # Une décision est cohérente pour approuvé/refusé : elle porte un
            # motif de refus le cas échéant pour que la raison soit affichable.
            if entry["status"] == SubmissionStatus.approved:
                session.add(ValidationDecision(
                    id_submission=submission.id_submission,
                    id_user=admin.id_user,
                    status=DecisionStatus.approved,
                    decided_at=submitted_at + timedelta(hours=6),
                ))
            elif entry["status"] == SubmissionStatus.rejected:
                session.add(ValidationDecision(
                    id_submission=submission.id_submission,
                    id_user=admin.id_user,
                    status=DecisionStatus.rejected,
                    rejection_reason="Numéro de téléphone incomplet, merci de le corriger.",
                    decided_at=submitted_at + timedelta(days=1),
                ))

        session.commit()
        print(
            f"{len(ORIGIN_SUBMISSIONS)} soumission(s) ajoutée(s) pour Kevin "
            f"({manager.name})."
        )
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
