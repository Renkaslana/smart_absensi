"""
Base class for all models.
Import this in other model files.
"""

from app.db.session import Base

# Import all models here so alembic can discover them
from app.models.user import User  # noqa
from app.models.face_encoding import FaceEncoding  # noqa
from app.models.absensi import Absensi  # noqa
from app.models.refresh_token import RefreshToken  # noqa
from app.models.audit_log import AuditLog  # noqa
