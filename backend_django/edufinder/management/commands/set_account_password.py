"""Réinitialise le mot de passe d'un compte existant.

Usage (depuis backend_django/) :
    python manage.py set_account_password <email>

Le mot de passe est demandé au clavier, sans écho : passé en argument, il
resterait dans l'historique du shell et serait visible dans la liste des
processus. Il n'est jamais affiché ni journalisé, seul son hash bcrypt part
en base. Je limite volontairement l'outil aux comptes déjà existants.
"""
import getpass

from django.core.management.base import BaseCommand, CommandError

from edufinder.models import User
from edufinder.services.security import BCRYPT_MAX_PASSWORD_BYTES, hash_password

MIN_PASSWORD_LENGTH = 8


class Command(BaseCommand):
    help = "Reset the password of an existing account (prompted, never echoed)."

    def add_arguments(self, parser) -> None:
        parser.add_argument("email", help="E-mail of the existing account")

    def handle(self, *args, **options) -> None:
        account = User.objects.filter(email=options["email"]).first()
        if account is None:
            raise CommandError(f"No account for {options['email']}.")
        account.password_hash = hash_password(self._ask_new_password())
        account.save(update_fields=["password_hash"])
        self.stdout.write(
            self.style.SUCCESS(f"Password updated for {account.email} ({account.role}).")
        )

    def _ask_new_password(self) -> str:
        new_password = getpass.getpass("New password: ")
        if len(new_password) < MIN_PASSWORD_LENGTH:
            raise CommandError(
                f"Password must be at least {MIN_PASSWORD_LENGTH} characters long."
            )
        # Au-delà, bcrypt refuse le mot de passe : le compte ne pourrait plus
        # se connecter.
        if len(new_password.encode("utf-8")) > BCRYPT_MAX_PASSWORD_BYTES:
            raise CommandError(
                f"Password must be at most {BCRYPT_MAX_PASSWORD_BYTES} bytes long."
            )
        if getpass.getpass("New password (again): ") != new_password:
            raise CommandError("The two passwords do not match.")
        return new_password
