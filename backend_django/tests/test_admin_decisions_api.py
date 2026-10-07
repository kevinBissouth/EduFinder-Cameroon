from decimal import Decimal

import pytest

from edufinder.models import (
    EstablishmentStatus,
    EstablishmentType,
    Exam,
    ExamResult,
    Media,
    MediaType,
    PaymentMethod,
    Program,
    ProgramOffer,
    SchoolFee,
    SchoolFeePaymentMethod,
    Service,
    Stage,
    StudyLevel,
    Submission,
    SubmissionStatus,
    SubmissionType,
    UserEstablishment,
    ValidationDecision,
)

UNKNOWN_UUID = "00000000-0000-0000-0000-000000000000"
REJECTION_REASON = "Fees are not documented"
JPEG_CONTENT = b"\xff\xd8\xff\xe0" + b"\x00" * 64


@pytest.fixture(name="study_level")
def study_level_fixture() -> StudyLevel:
    return StudyLevel.objects.create(
        label="6e", stage=Stage.objects.create(label="Secondary")
    )


@pytest.fixture(name="propose")
def propose_fixture(manager):
    def propose(establishment, content: dict, submission_type=SubmissionType.MODIFICATION):
        return Submission.objects.create(
            user=manager,
            establishment=establishment,
            type=submission_type,
            status=SubmissionStatus.PENDING,
            content=content,
        )

    return propose


@pytest.fixture(name="store_file")
def store_file_fixture(isolated_media_root):
    def store_file(file_name: str) -> str:
        isolated_media_root.mkdir(exist_ok=True)
        (isolated_media_root / file_name).write_bytes(JPEG_CONTENT)
        return f"/media/{file_name}"

    return store_file


def approve(client, submission: Submission):
    return client.post(f"/admin/submissions/{submission.uuid}/approve")


def reject(client, submission: Submission, reason: str | None = REJECTION_REASON):
    return client.post(
        f"/admin/submissions/{submission.uuid}/reject", {"reason": reason}, format="json"
    )


def stored_file_names(media_root) -> list[str]:
    return sorted(path.name for path in media_root.iterdir())


# --- Accès --------------------------------------------------------------------


@pytest.mark.django_db
def test_decisions_require_the_super_admin_role(
    client, log_in_as, manager, establishment, propose
):
    UserEstablishment.objects.create(user=manager, establishment=establishment)
    submission = propose(establishment, {"name": "Renamed"})

    anonymous_responses = [approve(client, submission), reject(client, submission)]
    log_in_as(manager)
    # Un responsable ne peut pas valider sa propre proposition.
    manager_responses = [approve(client, submission), reject(client, submission)]

    assert [response.status_code for response in anonymous_responses] == [401, 401]
    assert [response.status_code for response in manager_responses] == [403, 403]
    submission.refresh_from_db()
    establishment.refresh_from_db()
    assert submission.status == SubmissionStatus.PENDING
    assert establishment.name == "Collège de la Paix"


@pytest.mark.django_db
def test_approval_from_untrusted_origin_is_rejected(
    client, log_in_as, super_admin, establishment, propose
):
    submission = propose(establishment, {"name": "Renamed"})
    log_in_as(super_admin)

    response = client.post(
        f"/admin/submissions/{submission.uuid}/approve",
        HTTP_ORIGIN="https://evil.example",
    )

    assert response.status_code == 403
    submission.refresh_from_db()
    assert submission.status == SubmissionStatus.PENDING


@pytest.mark.django_db
def test_deciding_an_unknown_submission_is_404(client, log_in_as, super_admin):
    log_in_as(super_admin)

    approval_response = client.post(f"/admin/submissions/{UNKNOWN_UUID}/approve")
    rejection_response = client.post(
        f"/admin/submissions/{UNKNOWN_UUID}/reject",
        {"reason": REJECTION_REASON},
        format="json",
    )

    assert approval_response.status_code == 404
    assert approval_response.json() == {"detail": "Submission not found"}
    assert rejection_response.status_code == 404


# --- Approbation d'une création -----------------------------------------------


@pytest.mark.django_db
def test_approving_a_creation_publishes_the_establishment_with_its_content(
    client, log_in_as, super_admin, create_establishment, propose, study_level
):
    primary_type = EstablishmentType.objects.create(label="Primary")
    cep_exam = Exam.objects.create(label="CEP")
    program = Program.objects.create(name="Informatique")
    PaymentMethod.objects.create(label="2 tranches")
    new_establishment = create_establishment(
        name="New Hope Academy", status=EstablishmentStatus.PENDING, type=primary_type
    )
    creation = propose(
        new_establishment,
        {
            "name": "New Hope Academy",
            "description": "A bilingual primary school.",
            "director_name": "Mrs Ngo Bassa",
            "latitude": 4.0511,
            "longitude": 9.7679,
            "website": "www.newhope.cm",
            "fees": [
                {
                    "id_level": study_level.pk,
                    "amount": "150000.00",
                    "school_year": "2025-2026",
                    "payment_methods": ["2 tranches"],
                }
            ],
            "services": ["Library", "Cantine"],
            "program_ids": [program.pk],
            "exam_results": [
                {"id_exam": cep_exam.pk, "session": "2025", "pass_rate": "85.50"}
            ],
            "cover_photo": "/media/cover.jpg",
            "videos": ["/media/tour.mp4"],
            "director_photo": "/media/director.png",
        },
        SubmissionType.CREATION,
    )
    log_in_as(super_admin)

    response = approve(client, creation)

    assert response.status_code == 200
    assert response.json() == {
        "submission_uuid": creation.uuid,
        "submission_status": "approved",
        "establishment_status": "published",
    }
    public_profile = client.get(f"/institutions/{new_establishment.uuid}").json()
    assert public_profile["description"] == "A bilingual primary school."
    assert public_profile["director_name"] == "Mrs Ngo Bassa"
    assert public_profile["director_photo_url"] == "/media/director.png"
    assert public_profile["latitude"] == pytest.approx(4.0511)
    assert public_profile["website"] == "www.newhope.cm"
    assert public_profile["fees"] == [
        {
            "id_level": study_level.pk,
            "class": "6e",
            "stage": "Secondary",
            "amount": "150000.00",
            "school_year": "2025-2026",
            "payment_methods": ["2 tranches"],
        }
    ]
    assert [service["name"] for service in public_profile["services"]] == [
        "Cantine",
        "Library",
    ]
    assert public_profile["programs"] == ["Informatique"]
    assert public_profile["exam_results"][0]["pass_rate"] == "85.50"
    assert [(media["type"], media["url"]) for media in public_profile["media"]] == [
        ("image", "/media/cover.jpg"),
        ("video", "/media/tour.mp4"),
    ]


@pytest.mark.django_db
def test_approval_records_who_decided(
    client, log_in_as, super_admin, establishment, propose
):
    submission = propose(establishment, {"name": "Renamed"})
    log_in_as(super_admin)

    approve(client, submission)

    decision = ValidationDecision.objects.get(submission=submission)
    assert decision.user == super_admin
    assert decision.status == "approved"
    assert decision.rejection_reason is None
    assert decision.decided_at is not None


# --- Approbation d'une modification -------------------------------------------


@pytest.mark.django_db
def test_approving_a_modification_applies_only_the_proposed_fields(
    client, log_in_as, super_admin, create_establishment, propose
):
    establishment = create_establishment(phone="+237600000000", address="Rue 1")
    submission = propose(establishment, {"phone": "+237611111111"})
    log_in_as(super_admin)

    response = approve(client, submission)

    assert response.json()["establishment_status"] == "published"
    establishment.refresh_from_db()
    assert establishment.phone == "+237611111111"
    assert establishment.address == "Rue 1"
    assert establishment.name == "Collège de la Paix"
    assert establishment.updated_at is not None


@pytest.mark.django_db
def test_approval_never_applies_fields_outside_the_allowed_list(
    client, log_in_as, super_admin, establishment, propose
):
    # Un contenu forgé directement en base ne doit pas pouvoir publier,
    # recommander ou gonfler un compteur.
    submission = propose(
        establishment,
        {"name": "Renamed", "recommended": True, "views_count": 9999, "status": "suspended"},
    )
    log_in_as(super_admin)

    approve(client, submission)

    establishment.refresh_from_db()
    assert establishment.name == "Renamed"
    assert establishment.recommended is False
    assert establishment.views_count == 0
    assert establishment.status == EstablishmentStatus.PUBLISHED


@pytest.mark.django_db
@pytest.mark.parametrize(
    "unpublished_status",
    [EstablishmentStatus.PENDING, EstablishmentStatus.REJECTED, EstablishmentStatus.SUSPENDED],
)
def test_approving_a_modification_never_publishes_an_unpublished_establishment(
    client, log_in_as, super_admin, create_establishment, propose, unpublished_status
):
    # Seule l'approbation de la création (ou une réactivation explicite) rend
    # une fiche publique : une modification approuvée ne lève ni l'attente, ni
    # un refus, ni une suspension.
    establishment = create_establishment(status=unpublished_status)
    submission = propose(establishment, {"phone": "+237611111111"})
    log_in_as(super_admin)

    response = approve(client, submission)

    assert response.status_code == 200
    assert response.json()["establishment_status"] == unpublished_status
    establishment.refresh_from_db()
    assert establishment.status == unpublished_status
    assert establishment.phone == "+237611111111"
    assert client.get(f"/institutions/{establishment.uuid}").status_code == 404


@pytest.mark.django_db
def test_modification_then_creation_can_be_approved_in_any_order(
    client, log_in_as, super_admin, create_establishment, propose
):
    new_establishment = create_establishment(status=EstablishmentStatus.PENDING)
    creation = propose(
        new_establishment, {"name": "New Hope Academy"}, SubmissionType.CREATION
    )
    modification = propose(new_establishment, {"phone": "+237611111111"})
    log_in_as(super_admin)

    approve(client, modification)
    assert client.get(f"/institutions/{new_establishment.uuid}").status_code == 404

    approve(client, creation)
    public_profile = client.get(f"/institutions/{new_establishment.uuid}").json()
    assert public_profile["name"] == "New Hope Academy"
    assert public_profile["phone"] == "+237611111111"


@pytest.mark.django_db
def test_last_approved_submission_wins_on_the_same_field(
    client, log_in_as, super_admin, establishment, propose
):
    first_submission = propose(establishment, {"phone": "+237600000001"})
    second_submission = propose(establishment, {"phone": "+237600000002"})
    log_in_as(super_admin)

    approve(client, second_submission)
    approve(client, first_submission)

    establishment.refresh_from_db()
    assert establishment.phone == "+237600000001"


@pytest.mark.django_db
def test_fees_and_exam_results_are_applied_incrementally(
    client, log_in_as, super_admin, establishment, propose, study_level
):
    other_level = StudyLevel.objects.create(label="5e", stage=study_level.stage)
    exam = Exam.objects.create(label="Brevet blanc")
    SchoolFee.objects.create(
        establishment=establishment, level=study_level, amount=100000, school_year="2025-2026"
    )
    SchoolFee.objects.create(
        establishment=establishment, level=other_level, amount=110000, school_year="2025-2026"
    )
    ExamResult.objects.create(
        establishment=establishment, exam=exam, session="2024", pass_rate=70
    )
    submission = propose(
        establishment,
        {
            "fees": [
                {"id_level": study_level.pk, "amount": "120000.00", "school_year": "2025-2026"},
                {"id_level": study_level.pk, "amount": "130000.00", "school_year": "2026-2027"},
            ],
            "exam_results": [
                {"id_exam": exam.pk, "session": "2024", "pass_rate": "75.00"},
                {"id_exam": exam.pk, "session": "2025", "pass_rate": "80.00"},
            ],
        },
    )
    log_in_as(super_admin)

    approve(client, submission)

    fees = {
        (fee.level.label, fee.school_year): fee.amount
        for fee in SchoolFee.objects.filter(establishment=establishment)
    }
    assert fees == {
        ("6e", "2025-2026"): Decimal("120000.00"),
        ("6e", "2026-2027"): Decimal("130000.00"),
        # La classe non citée par la proposition garde son frais.
        ("5e", "2025-2026"): Decimal("110000.00"),
    }
    pass_rates = dict(
        ExamResult.objects.filter(establishment=establishment).values_list(
            "session", "pass_rate"
        )
    )
    assert pass_rates == {"2024": Decimal("75.00"), "2025": Decimal("80.00")}


@pytest.mark.django_db
def test_payment_methods_are_replaced_only_when_proposed(
    client, log_in_as, super_admin, establishment, propose, study_level
):
    two_instalments = PaymentMethod.objects.create(label="2 tranches")
    PaymentMethod.objects.create(label="trimestriel")
    school_fee = SchoolFee.objects.create(
        establishment=establishment, level=study_level, amount=100000, school_year="2025-2026"
    )
    SchoolFeePaymentMethod.objects.create(fee=school_fee, payment_method=two_instalments)
    fee_change = {"id_level": study_level.pk, "amount": "120000.00", "school_year": "2025-2026"}
    log_in_as(super_admin)

    def payment_labels() -> list[str]:
        return list(
            SchoolFeePaymentMethod.objects.filter(fee=school_fee).values_list(
                "payment_method__label", flat=True
            )
        )

    # Modalités absentes, ou nulles comme dans les contenus de l'ancien
    # backend : elles restent telles quelles.
    approve(client, propose(establishment, {"fees": [fee_change]}))
    approve(client, propose(establishment, {"fees": [{**fee_change, "payment_methods": None}]}))
    assert payment_labels() == ["2 tranches"]

    approve(
        client,
        propose(establishment, {"fees": [{**fee_change, "payment_methods": ["trimestriel"]}]}),
    )
    assert payment_labels() == ["trimestriel"]

    approve(client, propose(establishment, {"fees": [{**fee_change, "payment_methods": []}]}))
    assert payment_labels() == []


@pytest.mark.django_db
def test_services_and_programs_are_replaced_as_a_whole(
    client, log_in_as, super_admin, establishment, propose
):
    kept_program = Program.objects.create(name="Sciences")
    dropped_program = Program.objects.create(name="Lettres")
    added_program = Program.objects.create(name="Informatique")
    for program in (kept_program, dropped_program):
        ProgramOffer.objects.create(establishment=establishment, program=program)
    for service_name in ("Cantine", "Internat"):
        Service.objects.create(establishment=establishment, name=service_name)
    submission = propose(
        establishment,
        {
            "services": ["cantine", "Library"],
            "program_ids": [kept_program.pk, added_program.pk],
        },
    )
    log_in_as(super_admin)

    approve(client, submission)

    # « cantine » désigne le service existant « Cantine » : il est conservé tel
    # quel, « Internat » disparaît, « Library » est ajouté.
    assert sorted(
        Service.objects.filter(establishment=establishment).values_list("name", flat=True)
    ) == ["Cantine", "Library"]
    assert set(
        ProgramOffer.objects.filter(establishment=establishment).values_list(
            "program__name", flat=True
        )
    ) == {"Sciences", "Informatique"}


@pytest.mark.django_db
def test_absent_lists_are_left_untouched(
    client, log_in_as, super_admin, establishment, propose
):
    Service.objects.create(establishment=establishment, name="Cantine")
    log_in_as(super_admin)

    approve(client, propose(establishment, {"phone": "+237611111111"}))
    assert Service.objects.filter(establishment=establishment).count() == 1

    approve(client, propose(establishment, {"services": []}))
    assert Service.objects.filter(establishment=establishment).count() == 0


@pytest.mark.django_db
def test_approval_is_refused_when_a_reference_has_disappeared(
    client, log_in_as, super_admin, establishment, propose, study_level
):
    submission = propose(
        establishment,
        {
            "phone": "+237611111111",
            "fees": [
                {"id_level": study_level.pk, "amount": "120000.00", "school_year": "2025-2026"}
            ],
        },
    )
    deleted_level_id = study_level.pk
    study_level.delete()
    log_in_as(super_admin)

    response = approve(client, submission)

    assert response.status_code == 409
    assert response.json() == {
        "detail": "Submission content can no longer be applied: "
        f"Unknown reference id(s): id_level={deleted_level_id}"
    }
    # Rien n'a été appliqué, et la soumission reste à décider.
    establishment.refresh_from_db()
    submission.refresh_from_db()
    assert establishment.phone is None
    assert submission.status == SubmissionStatus.PENDING
    assert ValidationDecision.objects.count() == 0


# --- Médias -------------------------------------------------------------------


@pytest.mark.django_db
def test_approving_a_media_addition_publishes_it_once(
    client, log_in_as, super_admin, establishment, propose
):
    media_addition = {"url": "/media/yard.jpg", "type": "image", "caption": "yard.jpg"}
    log_in_as(super_admin)

    approve(client, propose(establishment, {"media_additions": [media_addition]}))
    approve(client, propose(establishment, {"media_additions": [media_addition]}))

    public_profile = client.get(f"/institutions/{establishment.uuid}").json()
    assert [
        (media["type"], media["url"], media["caption"]) for media in public_profile["media"]
    ] == [("image", "/media/yard.jpg", "yard.jpg")]


@pytest.mark.django_db
def test_approving_a_media_removal_deletes_the_media_and_its_file(
    client, log_in_as, super_admin, establishment, propose, store_file, isolated_media_root
):
    removed_media = Media.objects.create(
        establishment=establishment, type=MediaType.IMAGE, url=store_file("old.jpg")
    )
    kept_media = Media.objects.create(
        establishment=establishment, type=MediaType.IMAGE, url=store_file("kept.jpg")
    )
    log_in_as(super_admin)

    approve(client, propose(establishment, {"media_removals": [removed_media.pk]}))

    assert list(Media.objects.values_list("pk", flat=True)) == [kept_media.pk]
    assert stored_file_names(isolated_media_root) == ["kept.jpg"]


@pytest.mark.django_db
def test_media_removal_cannot_reach_another_establishment(
    client, log_in_as, super_admin, establishment, create_establishment, propose
):
    foreign_media = Media.objects.create(
        establishment=create_establishment(name="Foreign school"),
        type=MediaType.IMAGE,
        url="/media/foreign.jpg",
    )
    log_in_as(super_admin)

    response = approve(client, propose(establishment, {"media_removals": [foreign_media.pk]}))

    assert response.status_code == 200
    assert Media.objects.filter(pk=foreign_media.pk).exists()


@pytest.mark.django_db
def test_approving_a_director_photo_replaces_it_and_deletes_the_old_file(
    client, log_in_as, super_admin, create_establishment, propose, store_file, isolated_media_root
):
    establishment = create_establishment(director_photo_url=store_file("old_director.jpg"))
    submission = propose(establishment, {"director_photo": store_file("new_director.jpg")})
    log_in_as(super_admin)

    approve(client, submission)

    establishment.refresh_from_db()
    assert establishment.director_photo_url == "/media/new_director.jpg"
    assert stored_file_names(isolated_media_root) == ["new_director.jpg"]


# --- Refus --------------------------------------------------------------------


@pytest.mark.django_db
def test_rejecting_a_modification_records_the_reason_and_leaves_the_profile_intact(
    client, log_in_as, super_admin, establishment, propose
):
    submission = propose(establishment, {"name": "Renamed"})
    log_in_as(super_admin)

    response = reject(client, submission, f"  {REJECTION_REASON}  ")

    assert response.status_code == 200
    assert response.json() == {
        "submission_uuid": submission.uuid,
        "submission_status": "rejected",
        "establishment_status": "published",
    }
    decision = ValidationDecision.objects.get(submission=submission)
    assert decision.user == super_admin
    assert decision.status == "rejected"
    assert decision.rejection_reason == REJECTION_REASON
    establishment.refresh_from_db()
    assert establishment.name == "Collège de la Paix"
    assert client.get(f"/institutions/{establishment.uuid}").status_code == 200


@pytest.mark.django_db
def test_rejected_creation_stays_invisible(
    client, log_in_as, super_admin, create_establishment, propose
):
    new_establishment = create_establishment(status=EstablishmentStatus.PENDING)
    creation = propose(new_establishment, {"name": "New Hope"}, SubmissionType.CREATION)
    log_in_as(super_admin)

    response = reject(client, creation)

    assert response.json()["establishment_status"] == "rejected"
    assert client.get(f"/institutions/{new_establishment.uuid}").status_code == 404


@pytest.mark.django_db
@pytest.mark.parametrize("invalid_reason", ["", "  ", "no", "a" * 501, None])
def test_rejection_requires_a_meaningful_reason(
    client, log_in_as, super_admin, establishment, propose, invalid_reason
):
    submission = propose(establishment, {"name": "Renamed"})
    log_in_as(super_admin)

    response = reject(client, submission, invalid_reason)

    assert response.status_code == 422
    assert "reason" in response.json()
    submission.refresh_from_db()
    assert submission.status == SubmissionStatus.PENDING


@pytest.mark.django_db
def test_rejection_deletes_the_files_uploaded_for_the_submission(
    client, log_in_as, super_admin, establishment, propose, store_file, isolated_media_root
):
    current_photo_url = store_file("current_director.jpg")
    establishment.director_photo_url = current_photo_url
    establishment.save()
    shared_url = store_file("shared.jpg")
    rejected_submission = propose(
        establishment,
        {
            "media_additions": [
                {"url": store_file("abandoned.jpg"), "type": "image", "caption": None},
                {"url": shared_url, "type": "image", "caption": None},
            ],
            # Le formulaire renvoie parfois la photo actuelle : elle doit rester.
            "director_photo": current_photo_url,
        },
    )
    propose(
        establishment,
        {"media_additions": [{"url": shared_url, "type": "image", "caption": None}]},
    )
    log_in_as(super_admin)

    reject(client, rejected_submission)

    assert stored_file_names(isolated_media_root) == [
        "current_director.jpg",
        "shared.jpg",
    ]


# --- Une soumission ne se décide qu'une fois ----------------------------------


@pytest.mark.django_db
def test_a_submission_cannot_be_decided_twice(
    client, log_in_as, super_admin, establishment, propose
):
    approved_submission = propose(establishment, {"phone": "+237600000001"})
    rejected_submission = propose(establishment, {"phone": "+237600000002"})
    log_in_as(super_admin)
    approve(client, approved_submission)
    reject(client, rejected_submission)

    responses = [
        approve(client, approved_submission),
        reject(client, approved_submission),
        approve(client, rejected_submission),
        reject(client, rejected_submission),
    ]

    assert [response.status_code for response in responses] == [409] * 4
    assert responses[0].json() == {
        "detail": f"Submission {approved_submission.uuid} is already decided "
        "(status=approved)"
    }
    assert ValidationDecision.objects.count() == 2
    establishment.refresh_from_db()
    assert establishment.phone == "+237600000001"


# --- Parcours complet ---------------------------------------------------------


@pytest.mark.django_db
def test_full_workflow_from_proposal_to_public_profile(
    client, log_in_as, manager, super_admin, establishment
):
    log_in_as(manager)
    created = client.post(
        "/establishments/proposals",
        {
            "name": "New Hope Academy",
            "id_city": establishment.city.pk,
            "id_type": establishment.type.pk,
            "id_sector": establishment.sector.pk,
            "id_linguistic_section": establishment.linguistic_section.pk,
            "services": ["Library"],
        },
        format="json",
    ).json()
    new_uuid = created["establishment_uuid"]
    assert client.get(f"/institutions/{new_uuid}").status_code == 404

    log_in_as(super_admin)
    pending_uuids = [
        item["submission_uuid"] for item in client.get("/admin/submissions").json()
    ]
    assert pending_uuids == [created["submission_uuid"]]
    approval = client.post(f"/admin/submissions/{created['submission_uuid']}/approve")

    assert approval.json()["establishment_status"] == "published"
    public_profile = client.get(f"/institutions/{new_uuid}").json()
    assert public_profile["name"] == "New Hope Academy"
    assert [service["name"] for service in public_profile["services"]] == ["Library"]
    assert client.get("/admin/submissions").json() == []
    log_in_as(manager)
    my_submission = client.get("/my/submissions").json()[0]
    assert my_submission["submission_status"] == "approved"
    my_establishments = client.get("/my/establishments").json()
    assert [(item["name"], item["establishment_status"]) for item in my_establishments] == [
        ("New Hope Academy", "published")
    ]
