from io import StringIO

import pytest
from django.core.management import call_command
from django.db import IntegrityError
from django.db.models import ProtectedError

from edufinder.models import City, Program, Region, Sector, Stage, StudyLevel


@pytest.fixture(name="region")
def region_fixture() -> Region:
    return Region.objects.create(name="Littoral")


@pytest.mark.django_db
def test_models_are_in_sync_with_migrations():
    # Un modèle modifié sans migration ferait diverger Django du schéma réel.
    call_command("makemigrations", "--check", "--dry-run", stdout=StringIO())


@pytest.mark.django_db
def test_city_is_reachable_from_its_region(region):
    city = City.objects.create(name="Douala", region=region)

    assert list(region.cities.all()) == [city]
    assert city.region_id == region.id_region


@pytest.mark.django_db
def test_region_name_is_unique(region):
    with pytest.raises(IntegrityError):
        Region.objects.create(name=region.name)


@pytest.mark.django_db
def test_city_name_is_unique_within_a_region_only(region):
    other_region = Region.objects.create(name="Centre")
    City.objects.create(name="Bonabéri", region=region)

    City.objects.create(name="Bonabéri", region=other_region)

    with pytest.raises(IntegrityError):
        City.objects.create(name="Bonabéri", region=region)


@pytest.mark.django_db
def test_study_level_label_is_unique_within_a_stage_only():
    primary_stage = Stage.objects.create(label="Primaire")
    secondary_stage = Stage.objects.create(label="Secondaire")
    StudyLevel.objects.create(label="Niveau 1", stage=primary_stage)

    StudyLevel.objects.create(label="Niveau 1", stage=secondary_stage)

    with pytest.raises(IntegrityError):
        StudyLevel.objects.create(label="Niveau 1", stage=primary_stage)


@pytest.mark.django_db
def test_program_name_is_unique():
    Program.objects.create(name="Informatique")

    with pytest.raises(IntegrityError):
        Program.objects.create(name="Informatique")


@pytest.mark.django_db
def test_region_with_cities_cannot_be_deleted(region):
    City.objects.create(name="Douala", region=region)

    with pytest.raises(ProtectedError):
        region.delete()


@pytest.mark.django_db
def test_sector_is_private_by_default():
    sector = Sector.objects.create(label="Privé laïc")

    assert sector.is_public is False
