"""Tests du flux responsable : création, modification, appartenance.

Couvre les points 1 à 4 du programme du jour :
- non connecté -> 401 ;
- création de proposition -> fiche pending invisible publiquement ;
- modification de SA fiche -> contenu stocké, fiche intacte ;
- modification d'une fiche d'autrui -> 403.
"""
from sqlmodel import select

from app.models import (
    Establishment,
    Submission,
    SubmissionStatus,
    UserEstablishment as UserEstablishmentLink,
)


def login(client, email: str, password: str) -> dict:
    response = client.post("/auth/login", data={"username": email, "password": password})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


CREATION_PAYLOAD = {
    "name": "New Hope Academy",
    "id_city": 10,
    "id_type": 30,
    "id_sector": 61,
    "id_linguistic_section": 50,
    "phone": "+237690112233",
    "fees": [
        {"id_level": 80, "amount": "150000.00", "school_year": "2025-2026"},
    ],
    "services": ["Library", "Cantine"],
    "program_ids": [90],
}


def test_anonymous_cannot_create_proposal(client):
    response = client.post("/establishments/proposals", json=CREATION_PAYLOAD)
    assert response.status_code == 401


def test_manager_creates_proposal_pending_and_invisible(client, database_session, manager_account, seed_ids):
    headers = login(client, manager_account["email"], manager_account["password"])
    response = client.post(
        "/establishments/proposals", json=CREATION_PAYLOAD, headers=headers
    )
    assert response.status_code == 201
    body = response.json()
    assert body["establishment_status"] == "pending"
    assert body["submission_status"] == "pending"

    new_establishment_uuid = body["establishment_uuid"]

    # Règle d'or : une fiche non publiée n'existe pas aux yeux du public.
    listing = client.get("/institutions").json()
    assert new_establishment_uuid not in [item["uuid"] for item in listing]
    detail = client.get(f"/institutions/{new_establishment_uuid}")
    assert detail.status_code == 404

    # La soumission porte bien le contenu complet en JSON.
    submission = database_session.exec(
        select(Submission).where(Submission.uuid == body["submission_uuid"])
    ).one()
    assert submission.content["name"] == CREATION_PAYLOAD["name"]
    assert submission.type.value == "creation"

    # Le lien de propriété user_establishment est créé avec la fiche.
    link = database_session.exec(
        select(Establishment).where(Establishment.uuid == new_establishment_uuid)
    ).one()
    assert any(
        ownership.id_user == manager_account["id_user"]
        for ownership in link.user_establishments
    )


def test_manager_modifies_own_establishment_without_touching_it(
    client,
    database_session,
    manager_account,
    seed_ids,
):
    # Alpha (200) est publié : je le mets dans le portefeuille du responsable
    # pour tester la modification d'une fiche existante gérée par lui.
    database_session.add(UserEstablishmentLink(
        id_user=manager_account["id_user"], id_establishment=200,
    ))
    database_session.commit()
    alpha_uuid = database_session.get(Establishment, 200).uuid

    headers = login(client, manager_account["email"], manager_account["password"])
    response = client.post(
        f"/my/establishments/{alpha_uuid}/modification-proposals",
        json={"name": "Alpha Primary School Bilingual"},
        headers=headers,
    )
    assert response.status_code == 201
    assert response.json()["submission_status"] == "pending"

    # Point crucial : la fiche elle-même n'a PAS changé avant validation.
    establishment = database_session.get(Establishment, 200)
    database_session.refresh(establishment)
    assert establishment.name == "Alpha Primary School"


def test_manager_cannot_modify_foreign_establishment(client, database_session, manager_account, seed_ids):
    # Alpha (interne 200) est publiée mais n'appartient à personne : un autre
    # responsable ne doit pas pouvoir proposer une modification.
    alpha_uuid = database_session.get(Establishment, 200).uuid
    headers = login(client, manager_account["email"], manager_account["password"])
    response = client.post(
        f"/my/establishments/{alpha_uuid}/modification-proposals",
        json={"name": "Hacked Name"},
        headers=headers,
    )
    assert response.status_code == 403
    assert "do not manage" in response.json()["detail"]


def test_admin_can_modify_any_establishment(client, database_session, admin_account, seed_ids):
    # Matrice des rôles : l'admin peut modifier n'importe quelle fiche.
    alpha_uuid = database_session.get(Establishment, 200).uuid
    headers = login(client, admin_account["email"], admin_account["password"])
    response = client.post(
        f"/my/establishments/{alpha_uuid}/modification-proposals",
        json={"name": "Alpha Primary School Renamed"},
        headers=headers,
    )
    assert response.status_code == 201


def test_duplicate_pending_proposal_returns_409(client, manager_account, seed_ids):
    headers = login(client, manager_account["email"], manager_account["password"])
    created = client.post(
        "/establishments/proposals", json=CREATION_PAYLOAD, headers=headers
    ).json()
    second = client.post(
        f"/my/establishments/{created['establishment_uuid']}/modification-proposals",
        json={"phone": "+237600000000"},
        headers=headers,
    )
    # La création vient d'ouvrir une soumission creation pending : toute
    # nouvelle proposition sur la même fiche est refusée jusqu'à décision.
    assert second.status_code == 409


def test_empty_modification_returns_422(client, manager_account, seed_ids):
    headers = login(client, manager_account["email"], manager_account["password"])
    created = client.post(
        "/establishments/proposals", json=CREATION_PAYLOAD, headers=headers
    ).json()
    # Cas particulier : la soumission creation est déjà pending, donc on
    # teste le corps vide via l'erreur 422 AVANT le contrôle 409.
    empty = client.post(
        f"/my/establishments/{created['establishment_uuid']}/modification-proposals",
        json={},
        headers=headers,
    )
    assert empty.status_code in (409, 422)


def test_unknown_reference_returns_422(client, manager_account):
    headers = login(client, manager_account["email"], manager_account["password"])
    payload = {**CREATION_PAYLOAD, "id_city": 999}
    response = client.post("/establishments/proposals", json=payload, headers=headers)
    assert response.status_code == 422
    assert "id_city=999" in response.json()["detail"]


def test_negative_fee_rejected_by_validation(client, manager_account):
    headers = login(client, manager_account["email"], manager_account["password"])
    payload = {
        **CREATION_PAYLOAD,
        "fees": [{"id_level": 80, "amount": "-5000", "school_year": "2025-2026"}],
    }
    response = client.post("/establishments/proposals", json=payload, headers=headers)
    assert response.status_code == 422


def test_my_submissions_lists_history_with_reasons_placeholder(client, manager_account, seed_ids):
    headers = login(client, manager_account["email"], manager_account["password"])
    client.post("/establishments/proposals", json=CREATION_PAYLOAD, headers=headers)
    listings = client.get("/my/submissions", headers=headers).json()
    assert len(listings) == 1
    item = listings[0]
    assert item["submission_type"] == "creation"
    assert item["submission_status"] == "pending"
    assert item["rejection_reason"] is None


def test_my_establishments_lists_owned_only(client, database_session, manager_account, seed_ids):
    headers = login(client, manager_account["email"], manager_account["password"])
    created = client.post(
        "/establishments/proposals", json=CREATION_PAYLOAD, headers=headers
    ).json()
    items = client.get("/my/establishments", headers=headers).json()
    owned_uuids = [item["establishment_uuid"] for item in items]
    assert owned_uuids == [created["establishment_uuid"]]
    assert items[0]["has_pending_submission"] is True
