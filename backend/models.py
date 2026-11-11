# ================================================================
# FILE: backend/models.py
# ================================================================

from sqlalchemy import (
    Column, Integer, String, DateTime, Text, SmallInteger,
    Boolean, ForeignKey, Enum as SAEnum, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

VALID_ROLES      = ("Admin", "CEO", "CFO", "DCFO", "GM/DGM", "User")
VALID_CATEGORIES = ("Application", "Dashboard", "Form", "Website")


# ── Department ────────────────────────────────────────────────
class Department(Base):
    __tablename__ = "departments"

    id              = Column(Integer,     primary_key=True, autoincrement=True)
    department_name = Column(String(100), nullable=False, unique=True)
    is_active       = Column(Boolean,     nullable=False, default=True)
    created_at      = Column(DateTime,    server_default=func.now())
    updated_at      = Column(DateTime,    server_default=func.now(), onupdate=func.now())

    users = relationship("User", back_populates="department_rel",
                         foreign_keys="User.department_id")

    def __repr__(self):
        return f"<Department id={self.id} name={self.department_name!r}>"


# ── User ──────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id            = Column(Integer,     primary_key=True, autoincrement=True)
    nik           = Column(String(20),  nullable=False, unique=True, index=True)
    password      = Column(String(255), nullable=False)
    full_name     = Column(String(100), nullable=False)
    role          = Column(
        SAEnum(*VALID_ROLES, name="user_role"),
        nullable=False, default="User",
    )
    department    = Column(String(100), nullable=True)
    department_id = Column(
        Integer,
        ForeignKey("departments.id", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True,
        index=True,
    )
    created_at    = Column(DateTime, server_default=func.now())
    updated_at    = Column(DateTime, server_default=func.now(), onupdate=func.now())

    department_rel = relationship("Department", back_populates="users",
                                  foreign_keys=[department_id])

    def __repr__(self):
        return f"<User nik={self.nik!r} role={self.role!r}>"


# ── ApplicationCard ───────────────────────────────────────────
class ApplicationCard(Base):
    __tablename__ = "application_cards"

    id                 = Column(Integer,      primary_key=True, autoincrement=True)
    logo_url           = Column(String(500),  nullable=True)
    page_name          = Column(String(150),  nullable=False)
    page_detail        = Column(Text,         nullable=True)
    link_url           = Column(String(500),  nullable=False)
    is_general = Column(Boolean, default=False, nullable=False)
    category           = Column(
        SAEnum(*VALID_CATEGORIES, name="card_category"),
        nullable=False, default="Application",
    )
    target_roles       = Column(JSON, nullable=False, default=list)
    # [] = semua departemen bisa akses
    # [1, 3] = hanya departemen dengan id 1 dan 3
    target_department  = Column(JSON, nullable=True,  default=list)
    icon_name          = Column(String(50),   nullable=True,  default="globe")
    icon_color         = Column(String(10),   nullable=True,  default="#12365F")
    icon_type          = Column(
        SAEnum("preset", "upload", "auto", "url", name="card_icon_type"),
        nullable=False, default="preset",
    )
    icon_value         = Column(String(500),  nullable=True,  default="globe")
    sort_order         = Column(SmallInteger, nullable=False, default=0)
    created_at         = Column(DateTime,     server_default=func.now())
    updated_at         = Column(DateTime,     server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<ApplicationCard id={self.id} name={self.page_name!r}>"
    
    
# ── CardClick ─────────────────────────────────────────────────
class CardClick(Base):
    """
    Tabel 'card_clicks' — menyimpan jumlah klik tiap user per kartu.
    UNIQUE(user_id, card_id) → satu baris per kombinasi, click_count di-increment.
    """
    __tablename__ = "card_clicks"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    user_id        = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    card_id        = Column(
        Integer,
        ForeignKey("application_cards.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    click_count    = Column(Integer, nullable=False, default=1)
    last_clicked_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    created_at     = Column(DateTime, server_default=func.now())

    def __repr__(self):
        return f"<CardClick user={self.user_id} card={self.card_id} count={self.click_count}>"


# ── Announcement ──────────────────────────────────────────────
class Announcement(Base):
    """
    Tabel 'announcements' — dibuat oleh Admin.
    """
    __tablename__ = "announcements"

    id                 = Column(Integer,     primary_key=True, autoincrement=True)
    activity           = Column(String(200), nullable=False)
    description        = Column(Text,        nullable=True)
    link_url           = Column(String(500), nullable=True)
    link_label         = Column(String(100), nullable=True)
    priority           = Column(
        SAEnum("high", "medium", "low", name="announcement_priority"),
        nullable=False, default="medium",
    )
    target_roles       = Column(JSON, nullable=False, default=list)   # [] = all roles
    target_departments = Column(JSON, nullable=False, default=list)   # [] = all depts
    is_active          = Column(Boolean,  nullable=False, default=True)
    announce_date      = Column(DateTime, nullable=False, server_default=func.now())
    created_by         = Column(Integer,  ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at         = Column(DateTime, server_default=func.now())
    updated_at         = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Announcement id={self.id} activity={self.activity!r}>"