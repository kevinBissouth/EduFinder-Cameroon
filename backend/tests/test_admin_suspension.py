"""Tests de la suspension et de la réactivation d'un établissement."""
from sqlmodel import select

from app.models import (
    Establishment,
    EstablishmentStatus,
    EstablishmentStatusChange,
    UserEstablishment,
)

SUSPENSION_REASON = "Fees published without official approval"
UNKNOWN_UUID = "00000000-0000-0000-0000-000000000000"


def login(client, account: dict) -> dict:
    response = client.post(
        "/auth/login",
        data={"username": account["email"], "password": account["password"]},
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def suspend(client, headers: dict, establishment_uuid: str, reason: str = SUSPENSION_REASON):
    return client.post(
        f"/admin/establishments/{establishment_uuid}/suspend",
        json={"reason": reason},
        headers=headers,
    )


def reactivate(client, headers: dict, establishment_uuid: str):
    return client.post(
        f"/admin/establishments/{establishment_uuid}/reactivate", headers=headers
    )


def test_suspension_endpoints_require_admin_role(client, manager_account, seed_ids):
    alpha_uuid = seed_ids["published_alpha_uuid"]

    assert suspend(client, {}, alpha_uuid).status_code == 401
    assert reactivate(client, {}, alpha_uuid).status_code == 401

    manager_headers = login(client, manager_account)
    assert suspend(client, manager_headers, alpha_uuid).status_code == 403
    assert reactivate(client, manager_headers, alpha_uuid).status_code == 403


def test_suspension_hides_establishment_from_public_api(client, admin_account, seed_ids):
    alpha_uuid = seed_ids["published_alpha_uuid"]

    response = suspend(client, login(client, admin_account), alpha_uuid)

    assert response.status_code == 200
    assert response.json() == {
        "establishment_uuid": alpha_uuid,
        "establishment_status": "suspended",
    }
    assert client.get(f"/institutions/{alpha_uuid}").status_code == 404
    listed_uuids = [item["uuid"] for item in client.get("/institutions").json()]
    assert alpha_uuid not in listed_uuids


def test_suspension_is_recorded_with_author_and_reason(
    client, database_session, admin_account, seed_ids
):
    suspend(client, login(client, admin_account), seed_ids["published_alpha_uuid"])

    status_changes = database_session.exec(select(EstablishmentStatusChange)).all()
    assert len(status_changes) == 1
    recorded_change = status_changes[0]
    assert recorded_change.id_establishment == seed_ids["published_alpha"]
    assert recorded_change.id_user == admin_account["id_user"]
    assert recorded_change.previous_status == EstablishmentStatus.published
    assert recorded_change.new_status == EstablishmentStatus.suspended
    assert recorded_change.reason == SUSPENSION_REASON


def test_reactivation_makes_establishment_public_again(
    client, database_session, admin_account, seed_ids
):
    alpha_uuid = seed_ids["published_alpha_uuid"]
    admin_headers = login(client, admin_account)
    suspend(client, admin_headers, alpha_uuid)

    response = reactivate(client, admin_headers, alpha_uuid)

    assert response.status_code == 200
    assert response.json()["establishment_status"] == "published"
    assert client.get(f"/institutions/{alpha_uuid}").status_code == 200
    recorded_statuses = [
        status_change.new_status
        for status_change in database_session.exec(
            select(EstablishmentStatusChange).order_by(
                EstablishmentStatusChange.id_status_change
            )
        ).all()
    ]
    assert recorded_statuses == [
        EstablishmentStatus.suspended,
        EstablishmentStatus.published,
    ]


def test_only_a_published_establishment_can_be_suspended(client, admin_account, seed_ids):
    admin_headers = login(client, admin_account)

    assert suspend(client, admin_headers, seed_ids["pending_uuid"]).status_code == 409
    assert suspend(client, admin_headers, seed_ids["suspended_uuid"]).status_code == 409


def test_only_a_suspended_establishment_can_be_reactivated(
    client, database_session, admin_account, seed_ids
):
    admin_headers = login(client, admin_account)

    assert reactivate(client, admin_headers, seed_ids["published_alpha_uuid"]).status_code == 409
    # Le cas critique : une réactivation ne doit jamais publier une fiche
    # qui n'a pas encore été validée.
    assert reactivate(client, admin_headers, seed_ids["pending_uuid"]).status_code == 409
    assert client.get(f"/institutions/{seed_ids['pending_uuid']}").status_code == 404
    assert database_session.exec(select(EstablishmentStatusChange)).all() == []


def test_unknown_establishment_returns_404(client, admin_account, seed_ids):
    admin_headers = login(client, admin_account)

    assert suspend(client, admin_headers, UNKNOWN_UUID).status_code == 404
    assert reactivate(client, admin_headers, UNKNOWN_UUID).status_code == 404


def test_suspension_requires_meaningful_reason(client, admin_account, seed_ids):
    admin_headers = login(client, admin_account)
    alpha_uuid = seed_ids["published_alpha_uuid"]

    assert suspend(client, admin_headers, alpha_uuid, reason="  ").status_code == 422
    assert client.post(
        f"/admin/establishments/{alpha_uuid}/suspend", headers=admin_headers
    ).status_code == 422
    assert client.get(f"/institutions/{alpha_uuid}").status_code == 200


def test_admin_list_shows_reason_only_while_suspended(client, admin_account, seed_ids):
    alpha_uuid = seed_ids["published_alpha_uuid"]
    admin_headers = login(client, admin_account)

    def listed_alpha() -> dict:
        establishments = client.get("/admin/establishments", headers=admin_headers).json()
        return next(
            item for item in establishments if item["establishment_uuid"] == alpha_uuid
        )

    assert listed_alpha()["suspension_reason"] is None

    suspend(client, admin_headers, alpha_uuid)
    assert listed_alpha()["suspension_reason"] == SUSPENSION_REASON

    reactivate(client, admin_headers, alpha_uuid)
    assert listed_alpha()["suspension_reason"] is None


def test_approving_a_modification_keeps_a_suspended_establishment_hidden(
    client, database_session, admin_account, manager_account, seed_ids
):
    alpha_uuid = seed_ids["published_alpha_uuid"]
    database_session.add(
        UserEstablishment(
            id_user=manager_account["id_user"],
            id_establishment=seed_ids["published_alpha"],
        )
    )
    database_session.commit()
    proposal = client.post(
        f"/my/establishments/{alpha_uuid}/modification-proposals",
        json={"name": "Alpha Renamed School"},
        headers=login(client, manager_account),
    )
    assert proposal.status_code == 201
    admin_headers = login(client, admin_account)
    suspend(client, admin_headers, alpha_uuid)

    approval = client.post(
        f"/admin/submissions/{proposal.json()['submission_uuid']}/approve",
        headers=admin_headers,
    )

    assert approval.status_code == 200
    assert approval.json()["establishment_status"] == "suspended"
    assert client.get(f"/institutions/{alpha_uuid}").status_code == 404
    establishment = database_session.get(Establishment, seed_ids["published_alpha"])
    database_session.refresh(establishment)
    assert establishment.name == "Alpha Renamed School"
