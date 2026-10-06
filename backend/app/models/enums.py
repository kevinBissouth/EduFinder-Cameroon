import enum


class UserRole(str, enum.Enum):
    manager = "manager"
    super_admin = "super_admin"


class EstablishmentStatus(str, enum.Enum):
    pending = "pending"
    published = "published"
    rejected = "rejected"
    suspended = "suspended"


class SubmissionStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class DecisionStatus(str, enum.Enum):
    approved = "approved"
    rejected = "rejected"


class SubmissionType(str, enum.Enum):
    creation = "creation"
    modification = "modification"


class MediaType(str, enum.Enum):
    image = "image"
    pdf = "pdf"
    video = "video"