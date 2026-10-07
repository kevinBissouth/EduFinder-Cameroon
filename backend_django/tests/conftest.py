from collections.abc import Callable

import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

from edufinder.models import (
    City,
    Establishment,
    EstablishmentStatus,
    EstablishmentType,
    LinguisticSection,
    Region,
    Sector,
    User,
    UserRole,
)
from edufinder.services.security import create_access_token


# Le cache vit dans la mémoire du processus : sans cette remise à zéro, un
# événement de suivi dédoublonné dans un test le resterait dans le suivant.
@pytest.fixture(autouse=True)
def clear_cache_between_tests():
    cache.clear()


@pytest.fixture(name="client")
def client_fixture() -> APIClient:
    return APIClient()


@pytest.fixture(name="city")
def city_fixture() -> City:
    region = Region.objects.create(name="Littoral")
    return City.objects.create(name="Douala", region=region)


@pytest.fixture(name="create_establishment")
def create_establishment_fixture(city) -> Callable[..., Establishment]:
    default_references = {
        "city": city,
        "type": EstablishmentType.objects.create(label="Secondaire"),
        "sector": Sector.objects.create(label="Privé laïc"),
        "linguistic_section": LinguisticSection.objects.create(label="Francophone"),
    }

    def create_establishment(
        name: str = "Collège de la Paix",
        status: EstablishmentStatus = EstablishmentStatus.PUBLISHED,
        **overridden_fields,
    ) -> Establishment:
        return Establishment.objects.create(
            name=name, status=status, **{**default_references, **overridden_fields}
        )

    return create_establishment


@pytest.fixture(name="establishment")
def establishment_fixture(create_establishment) -> Establishment:
    return create_establishment()


@pytest.fixture(name="manager")
def manager_fixture() -> User:
    # Le hash n'est pas vérifié par les tests de modèles : une valeur factice
    # suffit et aucun mot de passe réel n'apparaît dans le dépôt.
    return User.objects.create(
        name="Awa Manager",
        email="manager@example.com",
        password_hash="not-a-real-hash",
        role=UserRole.MANAGER,
    )


@pytest.fixture(name="super_admin")
def super_admin_fixture() -> User:
    return User.objects.create(
        name="Sam Admin",
        email="admin@example.com",
        password_hash="not-a-real-hash",
        role=UserRole.SUPER_ADMIN,
    )


# Ouvre une session en posant directement le cookie : les tests des espaces
# privés n'ont pas à repasser par la connexion (et son calcul bcrypt).
@pytest.fixture(name="log_in_as")
def log_in_as_fixture(client) -> Callable[[User], None]:
    def log_in_as(user: User) -> None:
        client.cookies["token"] = create_access_token(user)

    return log_in_as
