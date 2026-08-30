
from sqlmodel import select

from app.models import Establishment, Submission


def login(client, account: dict) -> dict:
    response = client.post(
        "/auth/login",
        data={"username": account["email"], "password": account["password"]},
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


CREATION_PAYLOAD = {
    "name": "Rising Star Complex",
    "id_city": 10,
    "id_type": 30,
    "id_sector": 61,
    "id_linguistic_section": 50,
    "phone": "+237691234567",
    "fees": [
        {"id_level": 80, "amount": "180000.00", "school_year": "2025-2026"},
        {"id_level": 80, "amount": "160000.00", "school_year": "2024-2025"},
    ],
    "services": ["Library", "Transport"],
    "program_ids": [90],
}


def _create_pending_proposal(client, manager_account: dict) -> int:
    headers = login(client, manager_account)
    response = client.post(
        "/establishments/proposals", json=CREATION_PAYLOAD, headers=headers
    )
    assert response.status_code == 201
    return response.json()["submission_uuid"]


def test_admin_endpoints_require_authentication(client):
    assert client.get("/admin/submissions").status_code == 401
    assert client.get("/admin/submissions/1").status_code == 401
    assert client.post("/admin/submissions/1/approve").status_code == 401
    assert client.post(
        "/admin/submissions/1/reject", json={"reason": "not enough"}
    ).status_code == 401


def test_manager_cannot_access_admin_endpoints(client, manager_account):
    headers = login(client, manager_account)
    assert client.get("/admin/submissions", headers=headers).status_code == 403
    assert client.post(
        "/admin/submissions/1/approve", headers=headers
    ).status_code == 403


def test_admin_sees_pending_proposals_with_content(client, admin_account, manager_account, seed_ids):
    submission_uuid = _create_pending_proposal(client, manager_account)
    headers = login(client, admin_account)

    pending_list = client.get(
        "/admin/submissions?status=pending", headers=headers
    ).json()
    listed_uuids = [item["submission_uuid"] for item in pending_list]
    assert submission_uuid in listed_uuids

    detail = client.get(f"/admin/submissions/{submission_uuid}", headers=headers)
    assert detail.status_code == 200
    detail_body = detail.json()
    assert detail_body["content"]["name"] == CREATION_PAYLOAD["name"]
    assert len(detail_body["content"]["fees"]) == 2


def test_approval_publishes_and_makes_public(client, database_session, admin_account, manager_account, seed_ids):
    submission_uuid = _create_pending_proposal(client, manager_account)
    establishment_uuid = database_session.exec(
        select(Submission).where(Submission.uuid == submission_uuid)
    ).one().establishment.uuid

    headers = login(client, admin_account)
    approval = client.post(f"/admin/submissions/{submission_uuid}/approve", headers=headers)
    assert approval.status_code == 200
    body = approval.json()
    assert body["submission_status"] == "approved"
    assert body["establishment_status"] == "published"

    listing = client.get("/institutions").json()
    assert establishment_uuid in [item["uuid"] for item in listing]
    detail = client.get(f"/institutions/{establishment_uuid}")
    assert detail.status_code == 200

    # Les frais proposés ont été appliqués (2 lignes, années distinctes).
    fees = [fee.amount for fee in database_session.exec(
        select(Establishment).where(Establishment.uuid == establishment_uuid)
    ).one().fees]
    assert sorted(str(amount) for amount in fees) == ["160000.00", "180000.00"]

    # Deuxième décision impossible : la soumission est déjà décidée.
    second = client.post(f"/admin/submissions/{submission_uuid}/approve", headers=headers)
    assert second.status_code == 409


def test_rejection_records_reason_and_leaves_published_card_intact(
    client,
    database_session,
    admin_account,
    manager_account,
    seed_ids,
):
    # Alpha (200), publiée, devient gérée par le responsable qui propose
    # une modification que l'admin refuse.
    from app.models import UserEstablishment

    database_session.add(UserEstablishment(id_user=manager_account["id_user"], id_establishment=200))
    database_session.commit()
    alpha_uuid = database_session.get(Establishment, 200).uuid

    manager_headers = login(client, manager_account)
    proposal = client.post(
        f"/my/establishments/{alpha_uuid}/modification-proposals",
        json={"name": "Wrong Renaming"},
        headers=manager_headers,
    )
    assert proposal.status_code == 201
    submission_uuid = proposal.json()["submission_uuid"]

    admin_headers = login(client, admin_account)
    rejection = client.post(
        f"/admin/submissions/{submission_uuid}/reject",
        json={"reason": "Name does not match official registration"},
        headers=admin_headers,
    )
    assert rejection.status_code == 200
    assert rejection.json()["establishment_status"] == "published"

    # La fiche garde son nom d'origine.
    establishment = database_session.get(Establishment, 200)
    database_session.refresh(establishment)
    assert establishment.name == "Alpha Primary School"

    # Le responsable voit le motif dans son historique.
    my_submissions = client.get("/my/submissions", headers=manager_headers).json()
    rejected_item = next(
        item for item in my_submissions if item["submission_uuid"] == submission_uuid
    )
    assert rejected_item["rejection_reason"] == "Name does not match official registration"


def test_rejected_creation_stays_invisible(client, database_session, admin_account, manager_account, seed_ids):
    submission_uuid = _create_pending_proposal(client, manager_account)
    establishment_id = database_session.exec(
        select(Submission).where(Submission.uuid == submission_uuid)
    ).one().id_establishment

    admin_headers = login(client, admin_account)
    rejection = client.post(
        f"/admin/submissions/{submission_uuid}/reject",
        json={"reason": "Missing official documents"},
        headers=admin_headers,
    )
    assert rejection.status_code == 200
    assert rejection.json()["establishment_status"] == "rejected"

    establishment_uuid = database_session.exec(
        select(Submission).where(Submission.uuid == submission_uuid)
    ).one().establishment.uuid
    listing = client.get("/institutions").json()
    assert establishment_uuid not in [item["uuid"] for item in listing]
    assert client.get(f"/institutions/{establishment_uuid}").status_code == 404


def test_reject_requires_meaningful_reason(client, admin_account, manager_account, seed_ids):
    submission_uuid = _create_pending_proposal(client, manager_account)
    headers = login(client, admin_account)
    too_short = client.post(
        f"/admin/submissions/{submission_uuid}/reject",
        json={"reason": "no"},
        headers=headers,
    )
    assert too_short.status_code == 422


def test_approval_replaces_fee_payment_methods(
    client,
    database_session,
    admin_account,
    manager_account,
    seed_ids,
):
    # Alpha (200) commence avec 2 modalités sur son frais 2024-2025 ; je propose
    # de le passer à une seule modalité via une modification approuvée.
    from app.models import SchoolFee, SchoolFeePaymentMethod, UserEstablishment
    from sqlmodel import select as select_stmt

    database_session.add(UserEstablishment(
        id_user=manager_account["id_user"], id_establishment=200,
    ))
    database_session.commit()
    alpha_uuid = database_session.get(Establishment, 200).uuid

    manager_headers = login(client, manager_account)
    proposal = client.post(
        f"/my/establishments/{alpha_uuid}/modification-proposals",
        json={
            "fees": [
                {
                    "id_level": 80,
                    "amount": "100000.00",
                    "school_year": "2024-2025",
                    "payment_methods": ["trimestriel"],
                },
            ],
        },
        headers=manager_headers,
    )
    assert proposal.status_code == 201
    submission_uuid = proposal.json()["submission_uuid"]

    admin_headers = login(client, admin_account)
    approval = client.post(
        f"/admin/submissions/{submission_uuid}/approve", headers=admin_headers
    )
    assert approval.status_code == 200

    # Le frais de la classe porte désormais exactement la modalité soumise.
    fee = database_session.exec(
        select_stmt(SchoolFee).where(
            SchoolFee.id_establishment == 200,
            SchoolFee.id_level == 80,
            SchoolFee.school_year == "2024-2025",
        )
    ).one()
    links = database_session.exec(
        select_stmt(SchoolFeePaymentMethod).where(
            SchoolFeePaymentMethod.id_fee == fee.id_fee
        )
    ).all()
    assert [link.payment_method.label for link in links] == ["trimestriel"]


def test_unknown_payment_method_label_returns_422(client, manager_account):
    headers = login(client, manager_account)
    payload = {
        **CREATION_PAYLOAD,
        "fees": [
            {
                "id_level": 80,
                "amount": "150000.00",
                "school_year": "2025-2026",
                "payment_methods": ["mensuel inexistant"],
            },
        ],
    }
    response = client.post("/establishments/proposals", json=payload, headers=headers)
    assert response.status_code == 422
    assert "payment_method=mensuel inexistant" in response.json()["detail"]


def test_unknown_submission_returns_404(client, admin_account, seed_ids):
    headers = login(client, admin_account)
    unknown_uuid = "00000000-0000-0000-0000-000000009999"
    assert client.get(f"/admin/submissions/{unknown_uuid}", headers=headers).status_code == 404
    assert client.post(f"/admin/submissions/{unknown_uuid}/approve", headers=headers).status_code == 404
