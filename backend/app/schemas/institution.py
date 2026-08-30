from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from app.models import Establishment
from app.services.data_rules import get_exam_type_violation

 
ServiceName = Annotated[str, StringConstraints(max_length=100)]


ExamRequirementRaw = Annotated[
    str, StringConstraints(pattern=r"^\d+:[0-9]{1,3}(\.[0-9]{1,2})?$")
]



class InstitutionFilters(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    city_id: int | None = None
    type_id: int | None = None
    linguistic_section_id: int | None = None
    program_id: int | None = None
    sector_id: int | None = None
    region_id: int | None = None
    min_fee: Decimal | None = Field(default=None, ge=0, description="Minimum annual fee in FCFA")
    max_fee: Decimal | None = Field(default=None, ge=0, description="Maximum annual fee in FCFA")
    service_names: list[ServiceName] = Field(
        default_factory=list, alias="service", max_length=8, description="Services the school must offer"
    )
    exam_requirements: list[ExamRequirementRaw] = Field(
        default_factory=list, alias="exam", max_length=5, description="exam_id:min_pass_rate pairs"
    )
    search_term: str | None = Field(default=None, max_length=100, alias="q")



class InstitutionSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)


    uuid: str
    name: str
    city: str
    type: str
    sector: str
    linguistic_section: str
    phone: str | None = None
    website: str | None = None
    recommended: bool = False
    min_tuition: Decimal | None = None
    best_pass_rate: Decimal | None = None
    cover_url: str | None = None



class FeeInfo(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    # Identifiant du niveau : rendu ici pour permettre au responsable de
    # modifier les frais de l'année en cours via une proposition (il doit
    # renvoyer id_level dans le payload SchoolFeeInput).
    id_level: int
    class_name: str = Field(alias="class", serialization_alias="class")
    stage: str
    amount: Decimal
    school_year: str
    payment_methods: list[str]



class ServiceInfo(BaseModel):
    name: str
    description: str | None = None


class ExamResultInfo(BaseModel):
    id_exam: int
    exam: str
    session: str
    pass_rate: Decimal



class MediaInfo(BaseModel):
    id_media: int
    type: str
    url: str
    caption: str | None = None


class InstitutionDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    uuid: str
    name: str
    description: str | None = None
    director_name: str | None = None
    director_title: str | None = None
    director_bio: str | None = None
    director_photo_url: str | None = None
    address: str | None = None
    phone: str | None = None
    contact_email: str | None = None
    website: str | None = None
    city: str
    region: str
    type: str
    sector: str
    linguistic_section: str
    latitude: float | None = None
    longitude: float | None = None
    fees: list[FeeInfo]
    services: list[ServiceInfo]
    exam_results: list[ExamResultInfo]
    programs: list[str]
    media: list[MediaInfo]


class ManagerEstablishmentDetail(InstitutionDetail):
    status: str
    has_pending_submission: bool
    updated_at: datetime | None = None
    recommended: bool = False
    views_count: int = 0
    inquiries_count: int = 0


class ManagerBenchmarks(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    your_min_tuition: Decimal | None = None
    avg_min_tuition_same_type: Decimal | None = None
    same_type_sample_size: int = 0
    your_best_pass_rate: Decimal | None = None
    avg_best_pass_rate_same_type: Decimal | None = None
    pass_rate_sample_size: int = 0



class ReferenceItem(BaseModel):
    id: int
    name: str


class StudyLevelItem(BaseModel):

    id: int
    name: str


class FiltersMeta(BaseModel):
    regions: list[ReferenceItem]
    sectors: list[ReferenceItem]
    exams: list[ReferenceItem]
    services: list[str]
    cities: list[ReferenceItem]
    types: list[ReferenceItem]
    languages: list[ReferenceItem]
    levels: list[StudyLevelItem]
    programs: list[ReferenceItem]
    # Modalités de paiement référencées (labels) : liste fermée servant à
    # choisir, côté gestionnaire, les plans rattachés au frais d'une classe.
    payment_methods: list[str] = Field(default_factory=list)

    featured_type_ids: list[int] = []



class PlatformStats(BaseModel):
    institutions: int
    cities: int
    fee_plans: int
    exam_results: int



def to_filters_meta(
    regions,
    sectors,
    exams,
    services,
    cities,
    types,
    languages,
    levels=None,
    programs=None,
    payment_methods=None,
    featured_type_ids=None,
) -> FiltersMeta:
    return FiltersMeta(
        regions=[ReferenceItem(id=region.id_region, name=region.name) for region in regions],
        sectors=[ReferenceItem(id=sector.id_sector, name=sector.label) for sector in sectors],
        exams=[ReferenceItem(id=exam.id_exam, name=exam.label) for exam in exams],
        services=services,
        cities=[ReferenceItem(id=city.id_city, name=city.name) for city in cities],
        types=[ReferenceItem(id=type_record.id_type, name=type_record.label) for type_record in types],
        languages=[ReferenceItem(id=language.id_linguistic_section, name=language.label) for language in languages],
        levels=[
            StudyLevelItem(id=level.id_level, name=f"{level.stage.label} — {level.label}")
            for level in (levels or [])
        ],
        programs=[
            ReferenceItem(id=program.id_program, name=program.name)
            for program in (programs or [])
        ],
        payment_methods=[
            payment_method.label for payment_method in (payment_methods or [])
        ],
        featured_type_ids=featured_type_ids or [],
    )


def to_institution_summary(
    establishment: Establishment,
    *,
    min_tuition: Decimal | None = None,
    best_pass_rate: Decimal | None = None,
    cover_url: str | None = None,
) -> InstitutionSummary:
    return InstitutionSummary(
        uuid=establishment.uuid,
        name=establishment.name,
        city=establishment.city.name,
        type=establishment.type.label,
        sector=establishment.sector.label,
        linguistic_section=establishment.linguistic_section.label,
        phone=establishment.phone,
        website=establishment.website,
        recommended=establishment.recommended,
        min_tuition=min_tuition,
        best_pass_rate=best_pass_rate,
        cover_url=cover_url,
    )


def to_institution_detail(establishment: Establishment) -> InstitutionDetail:
    return InstitutionDetail(
        uuid=establishment.uuid,
        name=establishment.name,
        description=establishment.description,
        director_name=establishment.director_name,
        director_title=establishment.director_title,
        director_bio=establishment.director_bio,
        director_photo_url=establishment.director_photo_url,
        address=establishment.address,
        phone=establishment.phone,
        contact_email=establishment.contact_email,
        website=establishment.website,
        city=establishment.city.name,
        region=establishment.city.region.name,
        type=establishment.type.label,
        sector=establishment.sector.label,
        linguistic_section=establishment.linguistic_section.label,
        latitude=establishment.latitude,
        longitude=establishment.longitude,
        fees=[
            FeeInfo(
                id_level=fee_record.id_level,
                class_name=fee_record.level.label,
                stage=fee_record.level.stage.label,
                amount=fee_record.amount,
                school_year=fee_record.school_year,
                payment_methods=[
                    payment_method.payment_method.label
                    for payment_method in fee_record.payment_methods
                ],
            )
            for fee_record in establishment.fees
        ],
        services=[
            ServiceInfo(name=service_record.name, description=service_record.description)
            for service_record in establishment.services
        ],
        exam_results=[
            ExamResultInfo(
                id_exam=exam_result.id_exam,
                exam=exam_result.exam.label,
                session=exam_result.session,
                pass_rate=exam_result.pass_rate,
            )
            for exam_result in establishment.exam_results
            # Garde-fou : un résultat dont l'examen contredit le type de
            # l'établissement ne sort jamais de l'API publique.
            if get_exam_type_violation(exam_result.exam.label, establishment.type.label) is None
        ],
        programs=[
            program_offer.program.name for program_offer in establishment.program_offers
        ],
        media=[
            MediaInfo(
                id_media=media_item.id_media,
                type=media_item.type.value,
                url=media_item.url,
                caption=media_item.caption,
            )
            for media_item in establishment.media
        ],
    )


def to_manager_establishment_detail(
    establishment: Establishment, *, has_pending_submission: bool
) -> ManagerEstablishmentDetail:
  
    base = to_institution_detail(establishment)
    return ManagerEstablishmentDetail(
        **base.model_dump(),
        status=establishment.status.value,
        has_pending_submission=has_pending_submission,
        updated_at=establishment.updated_at,
        recommended=establishment.recommended,
        views_count=establishment.views_count,
        inquiries_count=establishment.inquiries_count,
    )