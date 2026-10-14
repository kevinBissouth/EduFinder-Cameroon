from dataclasses import dataclass

import pytest

from edufinder.models import (
    Establishment,
    EstablishmentType,
    Exam,
    LinguisticSection,
    PaymentMethod,
    Program,
    Stage,
    StudyLevel,
    Submission,
    SubmissionStatus,
    SchoolFee,
    SubmissionType,
    User,
    UserEstablishment,
    UserRole,
)

CREATION_URL = "/establishments/proposals"
UPLOADED_IMAGE_URL = "/media/0123456789abcdef0123456789abcdef.jpg"
UPLOADED_VIDEO_URL = "/media/0123456789abcdef0123456789abcdef.mp4"


@dataclass(frozen=True)
class References:
    primary_type: EstablishmentType
    francophone_section: LinguisticSection
    study_level: StudyLevel
    program: Program
    cep_exam: Exam
    payment_method: PaymentMethod


@pytest.fixture(name="references")
def references_fixture() -> References:
    stage = Stage.objects.create(label="Primaire")
    return References(
        primary_type=EstablishmentType.objects.create(label="Primary"),
        francophone_section=LinguisticSection.objects.create(label="Francophone"),
        study_level=StudyLevel.objects.create(label="CM2", stage=stage),
        program=Program.objects.create(name="Informatique"),
        cep_exam=Exam.objects.create(label="CEP"),
        payment_method=PaymentMethod.objects.create(label="2 tranches"),
    )


@pytest.fixture(name="creation_payload")
def creation_payload_fixture(city, establishment, references) -> dict:
    return {
        "name": "New Hope Academy",
        "id_city": city.pk,
        "id_type": references.primary_type.pk,
        "id_sector": establishment.sector.pk,
        "id_linguistic_section": references.francophone_section.pk,
        "phone": "+237690112233",
        "fees": [
            {
                "id_level": references.study_level.pk,
                "amount": "150000",
                "school_year": "2025-2026",
                "payment_methods": ["2 tranches"],
            }
        ],
        "services": ["Library", "Cantine"],
        "program_ids": [references.program.pk],
        "exam_results": [
            {"id_exam": references.cep_exam.pk, "session": "2025", "pass_rate": "85.5"}
        ],
    }


@pytest.fixture(name="managed_establishment")
def managed_establishment_fixture(establishment, manager) -> Establishment:
    UserEstablishment.objects.create(user=manager, establishment=establishment)
    return establishment


def modification_url(establishment: Establishment) -> str:
    return f"/my/establishments/{establishment.uuid}/modification-proposals"


def post_json(client, url: str, payload: dict, **request_headers):
    return client.post(url, payload, format="json", **request_headers)


# --- Accès --------------------------------------------------------------------


@pytest.mark.django_db
def test_anonymous_cannot_submit_proposals(client, creation_payload, establishment):
    creation_response = post_json(client, CREATION_URL, creation_payload)
    modification_response = post_json(
        client, modification_url(establishment), {"name": "Hacked Name"}
    )

    assert creation_response.status_code == 401
    assert modification_response.status_code == 401
    assert Submission.objects.count() == 0


@pytest.mark.django_db
def test_manager_cannot_modify_an_establishment_of_another_manager(
    client, log_in_as, managed_establishment
):
    other_manager = User.objects.create(
        name="Other", email="other@example.com", password_hash="x", role=UserRole.MANAGER
    )
    log_in_as(other_manager)

    response = post_json(
        client, modification_url(managed_establishment), {"name": "Hacked Name"}
    )

    assert response.status_code == 403
    assert response.json() == {"detail": "You do not manage this establishment"}
    assert Submission.objects.count() == 0


@pytest.mark.django_db
def test_super_admin_can_propose_a_modification_on_any_establishment(
    client, log_in_as, establishment, super_admin
):
    log_in_as(super_admin)

    response = post_json(client, modification_url(establishment), {"name": "Renamed"})

    assert response.status_code == 201


@pytest.mark.django_db
def test_proposal_from_untrusted_origin_is_rejected(
    client, log_in_as, manager, creation_payload
):
    log_in_as(manager)

    response = post_json(
        client, CREATION_URL, creation_payload, HTTP_ORIGIN="https://evil.example"
    )

    assert response.status_code == 403
    assert Submission.objects.count() == 0


# --- Création -----------------------------------------------------------------


@pytest.mark.django_db
def test_creation_opens_a_pending_establishment_invisible_to_the_public(
    client, log_in_as, manager, creation_payload
):
    log_in_as(manager)

    response = post_json(client, CREATION_URL, creation_payload)

    assert response.status_code == 201
    created = response.json()
    assert created["establishment_status"] == "pending"
    assert created["submission_status"] == "pending"
    new_establishment = Establishment.objects.get(uuid=created["establishment_uuid"])
    assert new_establishment.name == "New Hope Academy"
    assert new_establishment.fees.count() == 0
    # Le lien de propriété est créé avec la fiche.
    assert UserEstablishment.objects.filter(
        user=manager, establishment=new_establishment
    ).exists()
    # Règle d'or : une fiche non publiée n'existe pas aux yeux du public.
    public_uuids = [item["uuid"] for item in client.get("/institutions").json()]
    assert created["establishment_uuid"] not in public_uuids
    assert client.get(f"/institutions/{created['establishment_uuid']}").status_code == 404


@pytest.mark.django_db
def test_creation_stores_the_complete_content_in_the_submission(
    client, log_in_as, manager, creation_payload, references
):
    log_in_as(manager)

    created = post_json(client, CREATION_URL, creation_payload).json()

    submission = Submission.objects.get(uuid=created["submission_uuid"])
    assert submission.type == SubmissionType.CREATION
    assert submission.user == manager
    assert submission.content["name"] == "New Hope Academy"
    assert submission.content["fees"] == [
        {
            "id_level": references.study_level.pk,
            "amount": "150000.00",
            "school_year": "2025-2026",
            "payment_methods": ["2 tranches"],
        }
    ]
    assert submission.content["exam_results"][0]["pass_rate"] == "85.50"
    # Chaque champ figure dans le contenu, vide s'il n'a pas été saisi.
    assert submission.content["description"] is None
    assert submission.content["cover_photo"] is None
    assert submission.content["videos"] == []


@pytest.mark.django_db
def test_creation_ignores_fields_a_manager_must_not_set(
    client, log_in_as, manager, creation_payload
):
    log_in_as(manager)
    forged_payload = {
        **creation_payload,
        "status": "published",
        "recommended": True,
        "views_count": 9999,
    }

    created = post_json(client, CREATION_URL, forged_payload).json()

    new_establishment = Establishment.objects.get(uuid=created["establishment_uuid"])
    submission = Submission.objects.get(uuid=created["submission_uuid"])
    assert new_establishment.status == "pending"
    assert new_establishment.recommended is False
    assert new_establishment.views_count == 0
    assert {"status", "recommended", "views_count"}.isdisjoint(submission.content)


@pytest.mark.django_db
def test_creation_accepts_uploaded_media(client, log_in_as, manager, creation_payload):
    log_in_as(manager)
    payload = {
        **creation_payload,
        "cover_photo": UPLOADED_IMAGE_URL,
        "videos": [UPLOADED_VIDEO_URL],
        "director_photo": "/media/director_17.png",
    }

    response = post_json(client, CREATION_URL, payload)

    assert response.status_code == 201


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("field_name", "unsafe_value"),
    [
        ("cover_photo", "https://evil.example/pixel.png"),
        ("cover_photo", "/media/../.env"),
        ("cover_photo", "javascript:alert(1)"),
        ("cover_photo", UPLOADED_VIDEO_URL),
        ("director_photo", "//evil.example/photo.jpg"),
        ("videos", ["https://evil.example/video.mp4"]),
        ("videos", [UPLOADED_IMAGE_URL]),
        ("website", "javascript:alert(1)"),
        ("website", "JavaScript:alert(1)"),
        ("website", "java\tscript:alert(1)"),
        ("website", "data:text/html,<script>alert(1)</script>"),
        ("contact_email", "not-an-email"),
    ],
)
def test_creation_rejects_unsafe_public_values(
    client, log_in_as, manager, creation_payload, field_name, unsafe_value
):
    log_in_as(manager)

    response = post_json(
        client, CREATION_URL, {**creation_payload, field_name: unsafe_value}
    )

    assert response.status_code == 422
    assert field_name in response.json()
    assert Submission.objects.count() == 0


@pytest.mark.django_db
@pytest.mark.parametrize(
    "website", ["www.school.cm", "https://school.cm/admissions", "http://school.cm"]
)
def test_creation_accepts_ordinary_websites(
    client, log_in_as, manager, creation_payload, website
):
    log_in_as(manager)

    response = post_json(client, CREATION_URL, {**creation_payload, "website": website})

    assert response.status_code == 201


@pytest.mark.django_db
@pytest.mark.parametrize(
    "phone", ["+237 6 90 11 22 33", "690 112 233", "+237690112233", "690112233"]
)
def test_creation_stores_a_cameroonian_phone_without_spaces(
    client, log_in_as, manager, creation_payload, phone
):
    log_in_as(manager)

    response = post_json(client, CREATION_URL, {**creation_payload, "phone": phone})

    assert response.status_code == 201
    submission = Submission.objects.get(uuid=response.json()["submission_uuid"])
    assert submission.content["phone"] in {"+237690112233", "690112233"}


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("overridden_fields", "rejected_field"),
    [
        ({"name": "A"}, "name"),
        ({"phone": "69O112233"}, "phone"),
        ({"phone": "6571713726"}, "phone"),
        ({"phone": "+33690112233"}, "phone"),
        ({"phone": "6901122"}, "phone"),
        ({"name": None}, "name"),
        ({"latitude": 91}, "latitude"),
        ({"longitude": -181}, "longitude"),
        ({"fees": [{"id_level": 1, "amount": "-5000", "school_year": "2025-2026"}]}, "fees"),
        ({"fees": [{"id_level": 1, "amount": "0", "school_year": "2025-2026"}]}, "fees"),
        ({"fees": [{"id_level": 1, "amount": "1000", "school_year": "2025"}]}, "fees"),
        (
            {"exam_results": [{"id_exam": 1, "session": "2025", "pass_rate": "101"}]},
            "exam_results",
        ),
        (
            {"exam_results": [{"id_exam": 1, "session": "25", "pass_rate": "50"}]},
            "exam_results",
        ),
        ({"services": ["s"] * 16}, "services"),
        ({"services": ["Cantine", "cantine"]}, "services"),
        ({"program_ids": [1, 1]}, "program_ids"),
    ],
)
def test_creation_rejects_invalid_input_with_422(
    client, log_in_as, manager, creation_payload, overridden_fields, rejected_field
):
    log_in_as(manager)

    response = post_json(client, CREATION_URL, {**creation_payload, **overridden_fields})

    assert response.status_code == 422
    assert rejected_field in response.json()
    assert Submission.objects.count() == 0


@pytest.mark.django_db
def test_creation_without_a_required_field_is_rejected(
    client, log_in_as, manager, creation_payload
):
    log_in_as(manager)
    del creation_payload["id_city"]

    response = post_json(client, CREATION_URL, creation_payload)

    assert response.status_code == 422
    assert "id_city" in response.json()


@pytest.mark.django_db
def test_creation_rejects_two_fees_for_the_same_level_and_year(
    client, log_in_as, manager, creation_payload
):
    log_in_as(manager)
    creation_payload["fees"] = creation_payload["fees"] * 2

    response = post_json(client, CREATION_URL, creation_payload)

    assert response.status_code == 422
    assert "Duplicate fee" in str(response.json()["fees"])


@pytest.mark.django_db
def test_creation_with_unknown_references_lists_them_all(
    client, log_in_as, manager, creation_payload
):
    log_in_as(manager)
    payload = {**creation_payload, "id_city": 999999, "program_ids": [888888]}
    payload["fees"][0]["payment_methods"] = ["Unknown plan"]

    response = post_json(client, CREATION_URL, payload)

    assert response.status_code == 422
    assert response.json() == {
        "detail": "Unknown reference id(s): id_city=999999, "
        "payment_method=Unknown plan, id_program=888888"
    }
    # Rien n'est écrit quand la proposition est refusée.
    assert Submission.objects.count() == 0
    assert not Establishment.objects.filter(name="New Hope Academy").exists()


@pytest.mark.django_db
def test_creation_rejects_an_exam_that_contradicts_the_type(
    client, log_in_as, manager, creation_payload
):
    log_in_as(manager)
    bepc_exam = Exam.objects.create(label="BEPC")
    creation_payload["exam_results"] = [
        {"id_exam": bepc_exam.pk, "session": "2025", "pass_rate": "80"}
    ]

    response = post_json(client, CREATION_URL, creation_payload)

    assert response.status_code == 422
    assert response.json()["detail"].startswith(
        "Incoherent exam result: 'BEPC' is reserved for the types:"
    )
    assert not Establishment.objects.filter(name="New Hope Academy").exists()


@pytest.mark.django_db
def test_creation_rejects_an_exam_that_contradicts_the_linguistic_section(
    client, log_in_as, manager, creation_payload
):
    log_in_as(manager)
    fslc_exam = Exam.objects.create(label="FSLC")
    creation_payload["exam_results"] = [
        {"id_exam": fslc_exam.pk, "session": "2025", "pass_rate": "80"}
    ]

    response = post_json(client, CREATION_URL, creation_payload)

    assert response.status_code == 422
    assert "'FSLC' is a anglophone exam" in response.json()["detail"]


# --- Modification -------------------------------------------------------------


def build_fee(study_level: StudyLevel) -> dict:
    return {"id_level": study_level.pk, "amount": "70000", "school_year": "2026-2027"}


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("stage_label", "level_label", "expected_reason"),
    [
        ("Collège", "4e", "'Collège' is reserved for the types:"),
        ("Primary", "Class 4", "'Primary' belongs to the anglophone system"),
    ],
)
def test_creation_rejects_a_fee_for_a_class_the_school_cannot_teach(
    client, log_in_as, manager, creation_payload, stage_label, level_label, expected_reason
):
    # L'école proposée est une primaire francophone.
    log_in_as(manager)
    study_level = StudyLevel.objects.create(
        label=level_label, stage=Stage.objects.create(label=stage_label)
    )
    creation_payload["fees"] = [build_fee(study_level)]

    response = post_json(client, CREATION_URL, creation_payload)

    assert response.status_code == 422
    assert response.json()["detail"].startswith(f"Incoherent fee: {expected_reason}")
    assert not Establishment.objects.filter(name="New Hope Academy").exists()


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("head_title", "expected_status"),
    [("Headmistress", 201), ("Proviseur", 422), ("Fondateur", 422)],
)
def test_creation_accepts_only_the_head_titles_of_the_school_type(
    client, log_in_as, manager, creation_payload, head_title, expected_status
):
    # L'école proposée est une primaire : son chef est directeur ou directrice.
    log_in_as(manager)

    response = post_json(
        client, CREATION_URL, {**creation_payload, "director_title": head_title}
    )

    assert response.status_code == expected_status
    if expected_status == 422:
        assert response.json()["detail"] == (
            f"Incoherent head title: '{head_title}' is not a head title of the type "
            "'Primary' (allowed: Headmaster, Headmistress)"
        )
        assert Submission.objects.count() == 0


@pytest.mark.django_db
def test_modification_keeps_a_published_free_title_but_refuses_a_new_one(
    client, log_in_as, manager, managed_establishment, references
):
    log_in_as(manager)
    managed_establishment.type = references.primary_type
    managed_establishment.director_title = "Founding Director"
    managed_establishment.save(update_fields=["type", "director_title"])
    url = modification_url(managed_establishment)

    unchanged_response = post_json(
        client, url, {"director_title": "Founding Director", "phone": "+237690112233"}
    )
    list_title_response = post_json(client, url, {"director_title": "Headmaster"})
    free_title_response = post_json(client, url, {"director_title": "Chief"})

    assert unchanged_response.status_code == 201
    assert list_title_response.status_code == 201
    assert free_title_response.status_code == 422
    assert "Incoherent head title" in free_title_response.json()["detail"]


@pytest.mark.django_db
def test_modification_checks_the_head_title_against_the_proposed_type(
    client, log_in_as, manager, managed_establishment, references
):
    log_in_as(manager)
    secondary_type = EstablishmentType.objects.create(label="Secondary general")

    accepted_response = post_json(
        client,
        modification_url(managed_establishment),
        {"id_type": secondary_type.pk, "director_title": "Principale"},
    )
    rejected_response = post_json(
        client,
        modification_url(managed_establishment),
        {"id_type": references.primary_type.pk, "director_title": "Principale"},
    )

    assert accepted_response.status_code == 201
    assert rejected_response.status_code == 422


# Le jour de référence des tests est en octobre 2025 : 2024-2025 est passée,
# 2027-2028 est trop lointaine.
@pytest.mark.django_db
@pytest.mark.parametrize("closed_school_year", ["2024-2025", "2027-2028"])
def test_creation_rejects_a_fee_for_a_closed_school_year(
    client, log_in_as, manager, creation_payload, references, closed_school_year
):
    log_in_as(manager)
    creation_payload["fees"] = [
        {**build_fee(references.study_level), "school_year": closed_school_year}
    ]

    response = post_json(client, CREATION_URL, creation_payload)

    assert response.status_code == 422
    assert response.json()["detail"] == (
        f"Incoherent fee: school year '{closed_school_year}' is closed "
        "(open: 2025-2026, 2026-2027)"
    )
    assert Submission.objects.count() == 0


@pytest.mark.django_db
def test_modification_corrects_a_past_year_line_but_adds_none(
    client, log_in_as, manager, managed_establishment, references
):
    log_in_as(manager)
    managed_establishment.type = references.primary_type
    managed_establishment.save(update_fields=["type"])
    SchoolFee.objects.create(
        establishment=managed_establishment,
        level=references.study_level,
        amount="60000",
        school_year="2024-2025",
    )
    other_level = StudyLevel.objects.create(label="CM1", stage=references.study_level.stage)
    past_year_fee = {**build_fee(references.study_level), "school_year": "2024-2025"}

    corrected_response = post_json(
        client, modification_url(managed_establishment), {"fees": [past_year_fee]}
    )
    added_response = post_json(
        client,
        modification_url(managed_establishment),
        {"fees": [{**past_year_fee, "id_level": other_level.pk}]},
    )

    assert corrected_response.status_code == 201
    assert added_response.status_code == 422
    assert "school year '2024-2025' is closed" in added_response.json()["detail"]


@pytest.mark.django_db
def test_creation_lets_a_primary_school_publish_its_nursery_fees(
    client, log_in_as, manager, creation_payload
):
    log_in_as(manager)
    nursery_level = StudyLevel.objects.create(
        label="Petite Section", stage=Stage.objects.create(label="Maternelle")
    )
    creation_payload["fees"].append(build_fee(nursery_level))

    response = post_json(client, CREATION_URL, creation_payload)

    assert response.status_code == 201


@pytest.mark.django_db
def test_modification_rejects_a_new_class_but_keeps_published_ones_editable(
    client, log_in_as, manager, managed_establishment, references
):
    # Un complexe typé « secondaire général » publie déjà les frais de son
    # CM2 : il peut encore les mettre à jour, mais pas ajouter une autre
    # classe du primaire.
    log_in_as(manager)
    secondary_type = EstablishmentType.objects.create(label="Secondary general")
    managed_establishment.type = secondary_type
    managed_establishment.save(update_fields=["type"])
    SchoolFee.objects.create(
        establishment=managed_establishment,
        level=references.study_level,
        amount="60000",
        school_year="2025-2026",
    )
    other_primary_level = StudyLevel.objects.create(
        label="CM1", stage=references.study_level.stage
    )

    accepted_response = post_json(
        client,
        modification_url(managed_establishment),
        {"fees": [build_fee(references.study_level)]},
    )
    rejected_response = post_json(
        client,
        modification_url(managed_establishment),
        {"fees": [build_fee(other_primary_level)]},
    )

    assert accepted_response.status_code == 201
    assert rejected_response.status_code == 422
    assert "Incoherent fee" in rejected_response.json()["detail"]


@dataclass(frozen=True)
class TechnicalReferences:
    technical_type: EstablishmentType
    general_type: EstablishmentType
    anglophone_section: LinguisticSection
    technical_level: StudyLevel
    general_level: StudyLevel


@pytest.fixture(name="technical_references")
def technical_references_fixture() -> TechnicalReferences:
    return TechnicalReferences(
        technical_type=EstablishmentType.objects.create(label="Secondary technical"),
        general_type=EstablishmentType.objects.create(label="Secondary general"),
        anglophone_section=LinguisticSection.objects.create(label="Anglophone"),
        technical_level=StudyLevel.objects.create(
            label="1ère année",
            stage=Stage.objects.create(label="Technical lower secondary"),
        ),
        general_level=StudyLevel.objects.create(
            label="6e", stage=Stage.objects.create(label="Collège")
        ),
    )


def build_secondary_payload(creation_payload: dict, **overridden_fields) -> dict:
    return {**creation_payload, "fees": [], "exam_results": [], **overridden_fields}


def build_exam_result(exam_label: str) -> dict:
    exam = Exam.objects.create(label=exam_label)
    return {"id_exam": exam.pk, "session": "2026", "pass_rate": "75"}


@pytest.mark.django_db
def test_an_anglophone_technical_school_has_the_classes_and_exams_of_a_francophone_one(
    client, log_in_as, manager, creation_payload, technical_references
):
    log_in_as(manager)
    payload = build_secondary_payload(
        creation_payload,
        id_type=technical_references.technical_type.pk,
        id_linguistic_section=technical_references.anglophone_section.pk,
        fees=[build_fee(technical_references.technical_level)],
        exam_results=[build_exam_result("CAP"), build_exam_result("Probatoire")],
    )

    response = post_json(client, CREATION_URL, payload)

    assert response.status_code == 201


@pytest.mark.django_db
def test_a_technical_school_does_not_sit_the_bepc(
    client, log_in_as, manager, creation_payload, technical_references
):
    log_in_as(manager)
    payload = build_secondary_payload(
        creation_payload,
        id_type=technical_references.technical_type.pk,
        exam_results=[build_exam_result("BEPC")],
    )

    response = post_json(client, CREATION_URL, payload)

    assert response.status_code == 422
    assert response.json()["detail"] == (
        "Incoherent exam result: 'BEPC' is reserved for the types: Secondary general "
        "(received: 'Secondary technical')"
    )
    assert Submission.objects.count() == 0


@pytest.mark.django_db
def test_a_technical_school_cannot_publish_fees_for_a_general_class(
    client, log_in_as, manager, creation_payload, technical_references
):
    log_in_as(manager)
    payload = build_secondary_payload(
        creation_payload,
        id_type=technical_references.technical_type.pk,
        fees=[build_fee(technical_references.general_level)],
    )

    response = post_json(client, CREATION_URL, payload)

    assert response.status_code == 422
    assert response.json()["detail"].startswith(
        "Incoherent fee: 'Collège' is reserved for the types: Secondary general"
    )
    assert Submission.objects.count() == 0


@pytest.mark.django_db
def test_a_general_school_cannot_publish_fees_for_a_technical_class(
    client, log_in_as, manager, creation_payload, technical_references
):
    log_in_as(manager)
    payload = build_secondary_payload(
        creation_payload,
        id_type=technical_references.general_type.pk,
        fees=[build_fee(technical_references.technical_level)],
    )

    response = post_json(client, CREATION_URL, payload)

    assert response.status_code == 422
    assert "Incoherent fee: 'Technical lower secondary'" in response.json()["detail"]


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("type_name", "expected_status"),
    [("technical_type", 422), ("general_type", 201)],
)
def test_gce_is_reserved_for_general_secondary_schools(
    client, log_in_as, manager, creation_payload, technical_references, type_name, expected_status
):
    log_in_as(manager)
    payload = build_secondary_payload(
        creation_payload,
        id_type=getattr(technical_references, type_name).pk,
        id_linguistic_section=technical_references.anglophone_section.pk,
        exam_results=[build_exam_result("GCE O-Level")],
    )

    response = post_json(client, CREATION_URL, payload)

    assert response.status_code == expected_status
    if expected_status == 422:
        assert response.json()["detail"].startswith(
            "Incoherent exam result: 'GCE O-Level' is reserved for the types: Secondary general"
        )
        assert Submission.objects.count() == 0


@pytest.mark.django_db
def test_an_anglophone_primary_school_can_publish_its_fslc_result(
    client, log_in_as, manager, creation_payload, technical_references
):
    log_in_as(manager)
    anglophone_level = StudyLevel.objects.create(
        label="Class 6", stage=Stage.objects.create(label="Primary")
    )
    payload = build_secondary_payload(
        creation_payload,
        id_linguistic_section=technical_references.anglophone_section.pk,
        fees=[build_fee(anglophone_level)],
        exam_results=[build_exam_result("FSLC")],
    )

    response = post_json(client, CREATION_URL, payload)

    assert response.status_code == 201


@pytest.mark.django_db
def test_modification_is_stored_without_touching_the_establishment(
    client, log_in_as, manager, managed_establishment
):
    log_in_as(manager)

    response = post_json(
        client,
        modification_url(managed_establishment),
        {"name": "Collège de la Paix Bilingue", "description": None},
    )

    assert response.status_code == 201
    assert response.json()["establishment_status"] == "published"
    submission = Submission.objects.get(uuid=response.json()["submission_uuid"])
    assert submission.type == SubmissionType.MODIFICATION
    assert submission.status == SubmissionStatus.PENDING
    # Seul ce qui change est stocké ; une valeur nulle n'est pas un changement.
    assert submission.content == {"name": "Collège de la Paix Bilingue"}
    # Point crucial : la fiche elle-même n'a PAS changé avant validation.
    managed_establishment.refresh_from_db()
    assert managed_establishment.name == "Collège de la Paix"


@pytest.mark.django_db
@pytest.mark.parametrize("empty_payload", [{}, {"name": None}, {"unknown_field": 1}])
def test_modification_without_any_change_is_rejected(
    client, log_in_as, manager, managed_establishment, empty_payload
):
    log_in_as(manager)

    response = post_json(client, modification_url(managed_establishment), empty_payload)

    assert response.status_code == 422
    assert response.json() == {"detail": "No changes provided"}


@pytest.mark.django_db
def test_modification_checks_exam_coherence_against_the_proposed_type(
    client, log_in_as, manager, managed_establishment, references
):
    # L'établissement de test est de type « Secondaire » (hors cartographie) :
    # le CEP n'y est refusé que si la proposition le fait passer au secondaire
    # général, et accepté si elle le fait passer au primaire.
    log_in_as(manager)
    secondary_type = EstablishmentType.objects.create(label="Secondary general")
    cep_result = {"id_exam": references.cep_exam.pk, "session": "2025", "pass_rate": "80"}

    rejected_response = post_json(
        client,
        modification_url(managed_establishment),
        {"id_type": secondary_type.pk, "exam_results": [cep_result]},
    )
    accepted_response = post_json(
        client,
        modification_url(managed_establishment),
        {"id_type": references.primary_type.pk, "exam_results": [cep_result]},
    )

    assert rejected_response.status_code == 422
    assert "Incoherent exam result" in rejected_response.json()["detail"]
    assert accepted_response.status_code == 201


@pytest.mark.django_db
def test_manager_can_propose_changes_to_the_same_element_at_will(
    client, log_in_as, manager, managed_establishment, references
):
    log_in_as(manager)
    # Les frais proposés sont ceux d'un CM2 : l'école doit être une primaire.
    managed_establishment.type = references.primary_type
    managed_establishment.save(update_fields=["type"])
    url = modification_url(managed_establishment)

    def propose_fee(amount: str):
        fee = {
            "id_level": references.study_level.pk,
            "amount": amount,
            "school_year": "2025-2026",
        }
        return post_json(client, url, {"fees": [fee]})

    responses = [
        propose_fee("120000"),
        propose_fee("130000"),
        post_json(client, url, {"phone": "+237600000001"}),
        post_json(client, url, {"phone": "+237600000002"}),
        post_json(client, url, {"services": ["Library"]}),
        post_json(client, url, {"services": ["Cantine"]}),
    ]

    assert [response.status_code for response in responses] == [201] * 6
    # Chaque proposition attend sa propre décision du super administrateur,
    # et la fiche n'a toujours pas bougé.
    pending_submissions = Submission.objects.filter(
        establishment=managed_establishment, status=SubmissionStatus.PENDING
    )
    assert pending_submissions.count() == 6
    managed_establishment.refresh_from_db()
    assert managed_establishment.phone is None
    assert managed_establishment.fees.count() == 0


@pytest.mark.django_db
def test_manager_can_propose_changes_while_the_creation_is_still_pending(
    client, log_in_as, manager, creation_payload
):
    log_in_as(manager)
    created = post_json(client, CREATION_URL, creation_payload).json()
    new_establishment = Establishment.objects.get(uuid=created["establishment_uuid"])

    response = post_json(
        client, modification_url(new_establishment), {"phone": "+237600000000"}
    )

    assert response.status_code == 201
    assert response.json()["establishment_status"] == "pending"
    # La proposition ne publie rien : la fiche reste en attente et invisible.
    new_establishment.refresh_from_db()
    assert new_establishment.status == "pending"
    assert new_establishment.phone == "+237690112233"
    assert client.get(f"/institutions/{new_establishment.uuid}").status_code == 404
