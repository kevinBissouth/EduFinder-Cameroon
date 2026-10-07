import pytest
from rest_framework.test import APIClient


@pytest.fixture(name="client")
def client_fixture() -> APIClient:
    return APIClient()
