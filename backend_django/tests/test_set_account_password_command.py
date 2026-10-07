import getpass
from io import StringIO

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from edufinder.services.security import verify_password

NEW_PASSWORD = "a brand new passphrase"


@pytest.fixture(name="type_passwords")
def type_passwords_fixture(monkeypatch):
    def type_passwords(*typed_passwords: str) -> None:
        remaining_passwords = list(typed_passwords)
        monkeypatch.setattr(getpass, "getpass", lambda prompt: remaining_passwords.pop(0))

    return type_passwords


def run_command(email: str) -> str:
    command_output = StringIO()
    call_command("set_account_password", email, stdout=command_output)
    return command_output.getvalue()


@pytest.mark.django_db
def test_password_is_replaced_by_its_hash_and_never_printed(manager, type_passwords):
    type_passwords(NEW_PASSWORD, NEW_PASSWORD)

    command_output = run_command(manager.email)

    manager.refresh_from_db()
    assert manager.password_hash != NEW_PASSWORD
    assert verify_password(NEW_PASSWORD, manager.password_hash)
    assert NEW_PASSWORD not in command_output
    assert "Password updated for manager@example.com (manager)" in command_output


@pytest.mark.django_db
def test_new_password_allows_logging_in(client, manager, type_passwords):
    type_passwords(NEW_PASSWORD, NEW_PASSWORD)
    run_command(manager.email)

    response = client.post(
        "/auth/login",
        data=f"username={manager.email}&password={NEW_PASSWORD}",
        content_type="application/x-www-form-urlencoded",
    )

    assert response.status_code == 200


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("typed_passwords", "expected_message"),
    [
        (("short",), "at least 8 characters"),
        (("é" * 40,), "at most 72 bytes"),
        ((NEW_PASSWORD, "a different passphrase"), "do not match"),
    ],
)
def test_invalid_password_is_refused_and_the_account_is_unchanged(
    manager, type_passwords, typed_passwords, expected_message
):
    type_passwords(*typed_passwords)

    with pytest.raises(CommandError, match=expected_message):
        run_command(manager.email)

    manager.refresh_from_db()
    assert manager.password_hash == "not-a-real-hash"


@pytest.mark.django_db
def test_unknown_account_is_refused_before_asking_for_a_password(type_passwords):
    type_passwords()

    with pytest.raises(CommandError, match="No account for nobody@example.com"):
        run_command("nobody@example.com")
