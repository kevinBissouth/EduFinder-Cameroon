

import os


os.environ.setdefault("SECRET_KEY", "test-only-secret-key")

from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

import app.models  # noqa: F401 — l'import enregistre toutes les tables
from app.db.session import get_db
from app.main import app
from app.models import (
    City,
    Establishment,
    EstablishmentStatus,
    EstablishmentType,
    Exam,
    ExamResult,
    LinguisticSection,
    Media,
    MediaType,
    PaymentMethod,
    Program,
    ProgramOffer,
    Region,
    SchoolFee,
    SchoolFeePaymentMethod,
    Sector,
    Service,
    Stage,
    StudyLevel,
    User,
    UserRole,
)
from app.services.security import hash_password
from app.services.tracking import TrackingEventDeduplicator, get_tracking_deduplicator


@pytest.fixture(name="database_session")
def database_session_fixture():

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    engine.dispose()


@pytest.fixture(name="client")
def client_fixture(database_session):
    def override_get_db():
        yield database_session

    app.dependency_overrides[get_db] = override_get_db
    # Registre neuf à chaque test : sinon un événement compté dans un test
    # serait vu comme un doublon dans le suivant.
    tracking_deduplicator = TrackingEventDeduplicator()
    app.dependency_overrides[get_tracking_deduplicator] = lambda: tracking_deduplicator
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def insert_public_demo_data(session: Session) -> dict:
    """Jeu de données minimal mais complet pour les cas publics."""
    region_centre = Region(id_region=1, name="Centre")
    region_littoral = Region(id_region=2, name="Littoral")
    city_yaounde = City(id_city=10, id_region=1, name="Yaoundé")
    city_douala = City(id_city=20, id_region=2, name="Douala")

    type_primary = EstablishmentType(id_type=30, label="Primary")
    type_secondary = EstablishmentType(id_type=40, label="Secondary general")
    language_en = LinguisticSection(id_linguistic_section=50, label="English")
    language_fr = LinguisticSection(id_linguistic_section=51, label="French")

    sector_public = Sector(id_sector=60, label="public", is_public=True)
    sector_private_one = Sector(id_sector=61, label="private", is_public=False)
    sector_private_two = Sector(id_sector=62, label="privé", is_public=False)

    stage_primary = Stage(id_stage=70, label="Primary stage")
    level_class6 = StudyLevel(id_level=80, id_stage=70, label="Class 6")

    program_computing = Program(id_program=90, name="Informatique")
    exam_cep = Exam(id_exam=100, label="CEP")
    exam_bepc = Exam(id_exam=101, label="BEPC")

    establishment_a = Establishment(
        id_establishment=200,
        id_city=10,
        id_type=30,
        id_sector=60,
        id_linguistic_section=50,
        name="Alpha Primary School",
        status=EstablishmentStatus.published,
        recommended=True,
        phone="+237600000001",
    )
    establishment_b = Establishment(
        id_establishment=201,
        id_city=10,
        id_type=30,
        id_sector=61,
        id_linguistic_section=50,
        name="Beta Academy",
        status=EstablishmentStatus.published,
    )
    establishment_c = Establishment(
        id_establishment=202,
        id_city=20,
        id_type=40,
        id_sector=62,
        id_linguistic_section=51,
        name="Gamma College",
        status=EstablishmentStatus.published,
    )
    establishment_pending = Establishment(
        id_establishment=203,
        id_city=10,
        id_type=30,
        id_sector=60,
        id_linguistic_section=50,
        name="Delta Pending Institute",
        status=EstablishmentStatus.pending,
    )
    establishment_suspended = Establishment(
        id_establishment=204,
        id_city=20,
        id_type=40,
        id_sector=60,
        id_linguistic_section=51,
        name="Epsilon Suspended High School",
        status=EstablishmentStatus.suspended,
    )

    fees = [
        SchoolFee(id_fee=300, id_establishment=200, id_level=80,
                  amount=Decimal("100000.00"), school_year="2024-2025"),
        SchoolFee(id_fee=301, id_establishment=200, id_level=80,
                  amount=Decimal("250000.00"), school_year="2023-2024"),
        SchoolFee(id_fee=302, id_establishment=201, id_level=80,
                  amount=Decimal("300000.00"), school_year="2024-2025"),
        SchoolFee(id_fee=303, id_establishment=202, id_level=80,
                  amount=Decimal("50000.00"), school_year="2024-2025"),
  
        SchoolFee(id_fee=304, id_establishment=203, id_level=80,
                  amount=Decimal("999999.00"), school_year="2024-2025"),
    ]
    services = [
        Service(id_service=400, id_establishment=200, name="Cantine"),

        Service(id_service=401, id_establishment=201, name="cantine"),
        Service(id_service=402, id_establishment=203, name="Piscine"),
    ]
    payment_method_installments = PaymentMethod(id_payment_method=450, label="2 tranches")
    payment_method_single = PaymentMethod(id_payment_method=451, label="1 tranche")
    payment_method_quarterly = PaymentMethod(id_payment_method=452, label="trimestriel")
    fee_payment_links = [
        # Alpha (200), session 2024-2025 : initialement deux modalités.
        SchoolFeePaymentMethod(id_fee=300, id_payment_method=450),
        SchoolFeePaymentMethod(id_fee=300, id_payment_method=451),
        SchoolFeePaymentMethod(id_fee=303, id_payment_method=452),
    ]
    exam_results = [
        ExamResult(id_result=500, id_establishment=200, id_exam=100,
                   session="2024", pass_rate=Decimal("85.50")),
        ExamResult(id_result=501, id_establishment=201, id_exam=100,
                   session="2024", pass_rate=Decimal("75.00")),
        ExamResult(id_result=502, id_establishment=203, id_exam=100,
                   session="2024", pass_rate=Decimal("99.00")),
    ]
    media_rows = [
        Media(id_media=600, id_establishment=200, type=MediaType.image,
              url="/media/profil_a.jpg"),
        Media(id_media=601, id_establishment=201, type=MediaType.pdf,
              url="/media/brochure_b.pdf"),
        Media(id_media=602, id_establishment=203, type=MediaType.image,
              url="/media/profil_hidden.jpg"),
    ]

    session.add_all([
        region_centre, region_littoral, city_yaounde, city_douala,
        type_primary, type_secondary, language_en, language_fr,
        sector_public, sector_private_one, sector_private_two,
        stage_primary, level_class6, program_computing, exam_cep, exam_bepc,
        payment_method_installments, payment_method_single, payment_method_quarterly,
        establishment_a, establishment_b, establishment_c,
        establishment_pending, establishment_suspended,
        *fees, *services, *exam_results, *media_rows, *fee_payment_links,
    ])
    session.add_all([
        ProgramOffer(id_establishment=200, id_program=90),
        ProgramOffer(id_establishment=201, id_program=90),
    ])
    session.commit()

    return {
        "region_centre": 1,
        "region_littoral": 2,
        "city_yaounde": 10,
        "city_douala": 20,
        "type_primary": 30,
        "type_secondary": 40,
        "language_en": 50,
        "language_fr": 51,
        "sector_public": 60,
        "sector_private_one": 61,
        "sector_private_two": 62,
        "program_computing": 90,
        "exam_cep": 100,
        "exam_bepc": 101,
        
        "published_alpha": 200,
        "published_beta": 201,
        "published_gamma": 202,
        "pending": 203,
        "suspended": 204,
       
        "published_alpha_uuid": establishment_a.uuid,
        "published_beta_uuid": establishment_b.uuid,
        "published_gamma_uuid": establishment_c.uuid,
        "pending_uuid": establishment_pending.uuid,
        "suspended_uuid": establishment_suspended.uuid,
    }


@pytest.fixture(name="seed_ids")
def seed_ids_fixture(database_session):
    return insert_public_demo_data(database_session)


def insert_account(session: Session, *, id_user: int, email: str, role: UserRole) -> dict:
    """Crée un compte avec un mot de passe connu et renvoie ses identifiants."""
    plain_password = f"pass-{id_user}-demo"
    account = User(
        id_user=id_user,
        name=f"Account {id_user}",
        email=email,
        password_hash=hash_password(plain_password),
        role=role,
    )
    session.add(account)
    session.commit()
    return {"id_user": id_user, "email": email, "password": plain_password}


@pytest.fixture(name="manager_account")
def manager_account_fixture(database_session):
    return insert_account(
        database_session,
        id_user=1,
        email="manager@demo.cm",
        role=UserRole.manager,
    )


@pytest.fixture(name="admin_account")
def admin_account_fixture(database_session):
    return insert_account(
        database_session,
        id_user=2,
        email="admin@demo.cm",
        role=UserRole.super_admin,
    )
