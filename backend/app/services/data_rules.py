
import re
from typing import Literal, NamedTuple

from sqlmodel import Session, select

from app.db.session import engine
from app.models.establishment import Establishment, ExamResult

EXAM_ALLOWED_TYPE_LABELS = {
    "CEP": {"Primary"},
    "FSLC": {"Primary"},
    "BEPC": {"Secondary general", "Secondary technical"},
    "GCE O-Level": {"Secondary general", "Secondary technical"},
    "Probatoire": {"Secondary general", "Secondary technical"},
    "Baccalaureate": {"Secondary general", "Secondary technical"},
    "CAP": {"Secondary technical"},
 
    "BTS": {"Higher institute"},
    "GCE A-Level": {"Secondary general", "Secondary technical"},
}

FRANCOPHONE_EXAMS = {"CEP", "BEPC", "Probatoire", "Baccalaureate", "CAP", "BTS"}
ANGLOPHONE_EXAMS = {"FSLC", "GCE O-Level", "GCE A-Level"}


ALLOWED_EXAM_FAMILIES_BY_SECTION = {
    "Francophone": {"francophone"},
    "Anglophone": {"anglophone"},
    "Bilingual": {"francophone", "anglophone"},
}

_ANGLOPHONE_LEVEL_PATTERN = re.compile(r"^(Class \d|Form \d|Nursery \d|(?:Lower|Upper) Sixth)$")
_FRANCOPHONE_LEVEL_PATTERN = re.compile(
    r"^(Petite Section|Moyenne Section|Grande Section|CP|CE[12]|CM[12]|\d+e|2nde|1ère|Terminale)$"
)

LanguageFamily = Literal["francophone", "anglophone"]


def get_level_language_family(level_label: str) -> LanguageFamily | None:
    """Famille d'un niveau d'étude ; None si partagé entre les deux secteurs."""
    if _ANGLOPHONE_LEVEL_PATTERN.match(level_label):
        return "anglophone"
    if _FRANCOPHONE_LEVEL_PATTERN.match(level_label):
        return "francophone"
    return None


class ExamResultFinding(NamedTuple):
    id_result: int
    establishment_id: int
    establishment_name: str
    section_label: str
    type_label: str
    exam_label: str
    session_label: str
    reason: str


class BilingualCoverageFinding(NamedTuple):
    establishment_id: int
    establishment_name: str
    present_families: tuple[str, ...]
    missing_families: tuple[str, ...]


def get_exam_type_violation(exam_label: str, type_label: str) -> str | None:
    """Raison si ce couple examen/type est interdit, None s'il est cohérent."""
    allowed_types = EXAM_ALLOWED_TYPE_LABELS.get(exam_label)
    if allowed_types is None:
        return None  # examen sans cartographie : revue humaine, pas une faute automatique
    if type_label not in allowed_types:
        allowed = ", ".join(sorted(allowed_types))
        return f"'{exam_label}' est réservé aux types : {allowed} (reçu : '{type_label}')"
    return None


def get_exam_language_family(exam_label: str) -> LanguageFamily | None:
    """Famille linguistique d'un examen ; None si non cartographié."""
    if exam_label in FRANCOPHONE_EXAMS:
        return "francophone"
    if exam_label in ANGLOPHONE_EXAMS:
        return "anglophone"
    return None


def get_exam_section_violation(exam_label: str, section_label: str) -> str | None:
    """Raison si la section linguistique ne peut pas présenter cet examen."""
    allowed_families = ALLOWED_EXAM_FAMILIES_BY_SECTION.get(section_label)
    if allowed_families is None:
        return None  
    family = get_exam_language_family(exam_label)
    if family is None or family in allowed_families:
        return None
    return f"'{exam_label}' est un examen {family} (section reçue : '{section_label}')"


def find_incoherent_exam_results(session: Session) -> list[ExamResultFinding]:
    """Résultats dont l'examen contredit le type OU la section de l'école."""
    findings = []
    for result in session.exec(select(ExamResult)).all():
        exam_label = result.exam.label
        type_label = result.establishment.type.label
        section_label = result.establishment.linguistic_section.label
        reasons = [
            reason
            for reason in (
                get_exam_type_violation(exam_label, type_label),
                get_exam_section_violation(exam_label, section_label),
            )
            if reason is not None
        ]
        if not reasons:
            continue
        findings.append(
            ExamResultFinding(
                id_result=result.id_result,
                establishment_id=result.id_establishment,
                establishment_name=result.establishment.name,
                section_label=section_label,
                type_label=type_label,
                exam_label=exam_label,
                session_label=result.session,
                reason=" ; ".join(reasons),
            )
        )
    return findings


def find_unmapped_exams(session: Session) -> list[str]:
    """Examens présents en base mais absents de la cartographie."""
    unmapped = []
    for result in session.exec(select(ExamResult)).all():
        if result.exam.label not in EXAM_ALLOWED_TYPE_LABELS:
            unmapped.append(result.exam.label)
    return sorted(set(unmapped))


def find_bilingual_coverage_gaps(session: Session) -> list[BilingualCoverageFinding]:
    """Écoles bilingues qui ne facturent pas les deux secteurs à la fois."""
    findings = []
    for establishment in session.exec(
        select(Establishment).where(Establishment.linguistic_section.has(label="Bilingual"))
    ).all():
        families = {
            family
            for fee in establishment.fees
            if (family := get_level_language_family(fee.level.label)) is not None
        }
        missing = tuple(
            family for family in ("francophone", "anglophone") if family not in families
        )
        if missing:
            findings.append(
                BilingualCoverageFinding(
                    establishment_id=establishment.id_establishment,
                    establishment_name=establishment.name,
                    present_families=tuple(sorted(families)),
                    missing_families=missing,
                )
            )
    return findings


def remove_incoherent_exam_results(session: Session) -> list[ExamResultFinding]:
    findings = find_incoherent_exam_results(session)
    if not findings:
        return []
    ids_to_remove = [finding.id_result for finding in findings]
    results = session.exec(
        select(ExamResult).where(ExamResult.id_result.in_(ids_to_remove))
    ).all()
    for result in results:
        session.delete(result)
    session.commit()
    return findings


def print_audit_report(session: Session) -> int:
    """Affiche le rapport complet ; renvoie le nombre total d'anomalies."""
    exam_findings = find_incoherent_exam_results(session)
    print(f"=== Examens vs type/section : {len(exam_findings)} violation(s) ===")
    for finding in exam_findings:
        print(
            f"  [{finding.id_result}] école {finding.establishment_id} "
            f"'{finding.establishment_name}' [{finding.type_label} / "
            f"{finding.section_label}] -> {finding.exam_label} "
            f"({finding.session_label}) : {finding.reason}"
        )

    unmapped = find_unmapped_exams(session)
    print(f"=== Examens non cartographiés : {len(unmapped)} ===")
    for exam_label in unmapped:
        print(f"  {exam_label}")

    coverage_findings = find_bilingual_coverage_gaps(session)
    print(f"=== Couverture bilingue incomplète : {len(coverage_findings)} école(s) ===")
    for finding in coverage_findings:
        print(
            f"  école {finding.establishment_id} '{finding.establishment_name}' : "
            f"présent={finding.present_families or 'aucun'}, "
            f"manquant={finding.missing_families}"
        )

    return len(exam_findings) + len(unmapped) + len(coverage_findings)


if __name__ == "__main__":
    with Session(engine) as session:
        raise SystemExit(1 if print_audit_report(session) else 0)
