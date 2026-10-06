
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
    assert client.get("/admin/establishments").status_code == 401


def test_manager_cannot_access_admin_endpoints(client, manager_account):
    headers = login(client, manager_account)
    assert client.get("/admin/submissions", headers=headers).status_code == 403
    assert client.post(
        "/admin/submissions/1/approve", headers=headers
    ).status_code == 403
    assert client.get("/admin/establishments", headers=headers).status_code == 403


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


def test_approved_modification_replaces_services_programs_but_fees_are_incremental(
    client,
    database_session,
    admin_account,
    manager_account,
    seed_ids,
):
    # Alpha (200) démarre avec le service « Cantine », deux frais (2023-2024 et
    # 2024-2025) et l'offre du programme 90. La proposition retire tous les
    # services et programmes (remplacement exact) mais ne soumet que le frais
    # 2024-2025 : en mode incrémental, le frais 2023-2024 non soumis reste.
    from app.models import ProgramOffer, SchoolFee, Service, UserEstablishment
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
            "services": [],
            "program_ids": [],
            "fees": [
                {
                    "id_level": 80,
                    "amount": "150000.00",
                    "school_year": "2024-2025",
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

    # Incrémental : le frais soumis (2024-2025) est mis à jour, mais le frais
    # 2023-2024, absent de la proposition, est conservé tel quel.
    remaining_fees = database_session.exec(
        select_stmt(SchoolFee).where(SchoolFee.id_establishment == 200)
    ).all()
    assert sorted((fee.school_year, str(fee.amount)) for fee in remaining_fees) == [
        ("2023-2024", "250000.00"),
        ("2024-2025", "150000.00"),
    ]

    # Remplacement exact pour les services et programmes : la liste vide en
    # retire l'intégralité.
    remaining_services = database_session.exec(
        select_stmt(Service).where(Service.id_establishment == 200)
    ).all()
    assert remaining_services == []

    remaining_offers = database_session.exec(
        select_stmt(ProgramOffer).where(ProgramOffer.id_establishment == 200)
    ).all()
    assert remaining_offers == []


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


def test_admin_lists_establishments_with_owners(client, admin_account, manager_account, database_session, seed_ids):
    from app.models import UserEstablishment

    # Je relie le responsable (id_user=1) à deux établissements : Alpha (200)
    # et Beta (201) ; les autres établissements restent sans propriétaire.
    manager_account_id = manager_account["id_user"]
    database_session.add(
        UserEstablishment(id_user=manager_account_id, id_establishment=200)
    )
    database_session.add(
        UserEstablishment(id_user=manager_account_id, id_establishment=201)
    )
    database_session.commit()

    headers = login(client, admin_account)
    response = client.get("/admin/establishments", headers=headers)
    assert response.status_code == 200

    by_name = {item["name"]: item for item in response.json()}
    # Le nom du responsable (name, pas l'email) est remonté dans owners.
    assert by_name["Alpha Primary School"]["owners"] == ["Account 1"]
    assert by_name["Beta Academy"]["owners"] == ["Account 1"]
    assert by_name["Gamma College"]["owners"] == []
    assert by_name["Delta Pending Institute"]["owners"] == []

    # Un responsable ne peut pas lister tous les établissements (super admin
    # uniquement) : le serveur refuse avec 403 côté appartenance.
    manager_headers = login(client, manager_account)
    assert client.get("/admin/establishments", headers=manager_headers).status_code == 403



def test_creation_proposal_with_cover_and_videos_creates_media_after_approval(
    client,
    database_session,
    admin_account,
    manager_account,
    seed_ids,
):
    from app.models import Media, MediaType

    # Proposition de création qui embarque une couverture et deux vidéos : ces
    # URLs sont soumises puis matérialisées en lignes Media à l'approbation.
    payload = {
        **CREATION_PAYLOAD,
        "cover_photo": "/media/cover_abc.jpg",
        "videos": ["/media/video_one.mp4", "/media/video_two.webm"],
    }
    manager_headers = login(client, manager_account)
    created = client.post(
        "/establishments/proposals", json=payload, headers=manager_headers
    )
    assert created.status_code == 201
    submission_uuid = created.json()["submission_uuid"]

    admin_headers = login(client, admin_account)
    approval = client.post(
        f"/admin/submissions/{submission_uuid}/approve", headers=admin_headers
    )
    assert approval.status_code == 200

    establishment = database_session.exec(
        select(Submission).where(Submission.uuid == submission_uuid)
    ).one().establishment
    rows = database_session.exec(
        select(Media).where(Media.id_establishment == establishment.id_establishment)
    ).all()
    by_type = {row.type: row.url for row in rows}
    assert by_type[MediaType.image] == "/media/cover_abc.jpg"
    videos = sorted(
        row.url for row in rows if row.type == MediaType.video
    )
    assert videos == ["/media/video_one.mp4", "/media/video_two.webm"]


def test_creation_proposal_applies_coordinates_director_payment_methods_and_exam_results(
    client,
    database_session,
    admin_account,
    manager_account,
    seed_ids,
):
    from decimal import Decimal

    from app.models import ExamResult, SchoolFee, SchoolFeePaymentMethod

    # Création complète : coordonnées GPS (carte du profil), direction (nom,
    # titre, bio, photo), frais avec modalités de paiement et un résultat
    # d'examen — tous matérialisés sur la fiche à l'approbation.
    payload = {
        **CREATION_PAYLOAD,
        "latitude": 4.0511,
        "longitude": 9.7075,
        "director_name": "Dr. Marie Ngono",
        "director_title": "Principal",
        "director_bio": "25 ans d'experience dans l'enseignement.",
        "director_photo": "/media/director_face.jpg",
        "fees": [
            {
                "id_level": 80,
                "amount": "180000.00",
                "school_year": "2025-2026",
                "payment_methods": ["trimestriel"],
            }
        ],
        "exam_results": [
            {"id_exam": seed_ids["exam_cep"], "session": "2024", "pass_rate": "88.50"}
        ],
    }
    manager_headers = login(client, manager_account)
    created = client.post(
        "/establishments/proposals", json=payload, headers=manager_headers
    )
    assert created.status_code == 201
    submission_uuid = created.json()["submission_uuid"]

    admin_headers = login(client, admin_account)
    approval = client.post(
        f"/admin/submissions/{submission_uuid}/approve", headers=admin_headers
    )
    assert approval.status_code == 200

    establishment = database_session.exec(
        select(Submission).where(Submission.uuid == submission_uuid)
    ).one().establishment
    assert establishment.latitude == Decimal("4.0511")
    assert establishment.longitude == Decimal("9.7075")
    assert establishment.director_name == "Dr. Marie Ngono"
    assert establishment.director_title == "Principal"
    assert establishment.director_bio == "25 ans d'experience dans l'enseignement."
    assert establishment.director_photo_url == "/media/director_face.jpg"

    fee = database_session.exec(
        select(SchoolFee).where(
            SchoolFee.id_establishment == establishment.id_establishment,
            SchoolFee.id_level == 80,
            SchoolFee.school_year == "2025-2026",
        )
    ).one()
    links = database_session.exec(
        select(SchoolFeePaymentMethod).where(SchoolFeePaymentMethod.id_fee == fee.id_fee)
    ).all()
    assert [link.payment_method.label for link in links] == ["trimestriel"]

    exam_results = database_session.exec(
        select(ExamResult).where(
            ExamResult.id_establishment == establishment.id_establishment,
            ExamResult.id_exam == seed_ids["exam_cep"],
        )
    ).all()
    assert [row.pass_rate for row in exam_results] == [Decimal("88.50")]


def test_media_upload_endpoint_requires_auth(client):
    assert client.post("/my/uploads/media").status_code == 401


def test_media_upload_endpoint_stores_file_and_returns_url(client, manager_account, monkeypatch, tmp_path):
    import io

    import app.api.manager as manager_module

    # Je redirige le stockage vers un dossier temporaire pour un test isolé.
    monkeypatch.setattr(manager_module, "MEDIA_DIR", str(tmp_path))

    # Un vrai PNG minimal (magic bytes reconnus comme image).
    png_bytes = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
    headers = login(client, manager_account)
    response = client.post(
        "/my/uploads/media",
        files={"file": ("logo.png", io.BytesIO(png_bytes), "image/png")},
        headers=headers,
    )
    assert response.status_code == 200
    url = response.json()["url"]
    assert url.startswith("/media/")
    stored_name = url[len("/media/"):]
    assert (tmp_path / stored_name).exists()
