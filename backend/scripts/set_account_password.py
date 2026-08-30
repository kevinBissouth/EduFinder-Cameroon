"""Réinitialise le mot de passe d'un compte existant.

Usage (depuis backend/) :
    python scripts/set_account_password.py <email> <nouveau_mot_de_passe>

Le mot de passe n'est jamais affiché ni loggé : seul son hash bcrypt part
en base. Je limite volontairement l'outil aux comptes déjà existants — la
création de comptes restera un flux applicatif à part.
"""
import sys

from sqlmodel import Session, select

from app.db.session import engine
from app.models import User
from app.services.security import hash_password


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: python scripts/set_account_password.py <email> <new_password>")
        return 1

    email_argument, new_password = sys.argv[1], sys.argv[2]
    if len(new_password) < 8:
        print("Refusé : le mot de passe doit faire au moins 8 caractères.")
        return 1

    with Session(engine) as session:
        account = session.exec(
            select(User).where(User.email == email_argument)
        ).first()
        if account is None:
            print(f"Aucun compte pour {email_argument}.")
            return 1

        account.password_hash = hash_password(new_password)
        session.add(account)
        session.commit()
        print(f"Mot de passe mis à jour pour {account.email} ({account.role.value}).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
