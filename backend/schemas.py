# ================================================================
# FILE: backend/schemas.py
# ================================================================

from pydantic import BaseModel, field_validator
from typing import Optional, List, Literal
from datetime import datetime

RoleType     = Literal["Admin", "CEO", "CFO", "DCFO", "GM/DGM", "User"]
CategoryType = Literal["Application", "Dashboard", "Form", "Website"]
IconType     = Literal["preset", "upload", "auto", "url"]


# ── Auth ─────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    nik: str
    password: str

    @field_validator("nik", "password")
    @classmethod
    def tidak_boleh_kosong(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field tidak boleh kosong")
        return v.strip()


class MicrosoftLoginRequest(BaseModel):
    # Raw Microsoft Entra ID token from MSAL; verified on the server (ms_auth.py)
    id_token: str


class Token(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         "SessionUserResponse"


class AuthOptions(BaseModel):
    guest_login: bool


# ── Department ────────────────────────────────────────────────

class DepartmentBase(BaseModel):
    department_name: str
    is_active:       bool = True

    @field_validator("department_name")
    @classmethod
    def nama_tidak_kosong(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Nama departemen tidak boleh kosong")
        return v.strip()


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    department_name: Optional[str]  = None
    is_active:       Optional[bool] = None

    @field_validator("department_name")
    @classmethod
    def nama_tidak_kosong(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Nama departemen tidak boleh kosong")
        return v.strip() if v else v


class DepartmentResponse(DepartmentBase):
    id:         int
    created_at: Optional[datetime] = None
    user_count: Optional[int]      = 0

    model_config = {"from_attributes": True}


# ── User ─────────────────────────────────────────────────────

class UserBase(BaseModel):
    nik:           str
    full_name:     str
    role:          RoleType
    department:    Optional[str] = None
    department_id: Optional[int] = None


class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def password_cukup_panjang(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password minimal 6 karakter")
        return v


class UserUpdate(BaseModel):
    full_name:     Optional[str]      = None
    role:          Optional[RoleType] = None
    department:    Optional[str]      = None
    department_id: Optional[int]      = None
    password:      Optional[str]      = None


class UserResponse(UserBase):
    id:              int
    created_at:      Optional[datetime] = None
    department_name: Optional[str]      = None

    model_config = {"from_attributes": True}


class SessionUserResponse(UserResponse):
    """The signed-in identity: a real user, or the read-only "Guest" (id 0, not in the DB)."""
    role: Literal["Admin", "CEO", "CFO", "DCFO", "GM/DGM", "User", "Guest"]


# ── Application Card ─────────────────────────────────────────

class CardBase(BaseModel):
    page_name:         str
    page_detail:       Optional[str]   = None
    link_url:          str
    logo_url:          Optional[str]   = None
    category:          CategoryType    = "Application"
    target_roles:      List[RoleType]  = []
    target_department: List[int]       = []   # [] = semua dept, [1,3] = dept tertentu
    icon_name:         Optional[str]   = "globe"
    icon_color:        Optional[str]   = "#8B0000"
    icon_type:         IconType        = "preset"
    icon_value:        Optional[str]   = "globe"
    sort_order:        Optional[int]   = 0
    is_general: bool = False   # Jika true, card akan ditampilkan untuk semua user tanpa mempedulikan role/department

    @field_validator("page_name", "link_url")
    @classmethod
    def tidak_boleh_kosong(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field tidak boleh kosong")
        return v.strip()


class CardCreate(CardBase):
    pass


class CardUpdate(BaseModel):
    page_name:         Optional[str]            = None
    page_detail:       Optional[str]            = None
    link_url:          Optional[str]            = None
    logo_url:          Optional[str]            = None
    category:          Optional[CategoryType]   = None
    target_roles:      Optional[List[RoleType]] = None
    target_department: Optional[List[int]]      = None   # None = tidak diubah
    icon_name:         Optional[str]            = None
    icon_color:        Optional[str]            = None
    icon_type:         Optional[IconType]       = None
    icon_value:        Optional[str]            = None
    sort_order:        Optional[int]            = None
    is_general: Optional[bool] = None


class CardResponse(CardBase):
    id:         int
    created_at: Optional[datetime] = None
    is_general: bool = False

    model_config = {"from_attributes": True}


Token.model_rebuild()

# ── Card Click ───────────────────────────────────────────────

class CardClickResponse(BaseModel):
    card_id:     int
    click_count: int
    is_general: bool = False

    model_config = {"from_attributes": True}


# ── Announcement ─────────────────────────────────────────────

PriorityType = Literal["high", "medium", "low"]

class AnnouncementBase(BaseModel):
    activity:           str
    description:        Optional[str]         = None
    link_url:           Optional[str]         = None
    link_label:         Optional[str]         = None
    priority:           PriorityType          = "medium"
    target_roles:       List[RoleType]        = []   # [] = semua role
    target_departments: List[int]             = []   # [] = semua dept
    is_active:          bool                  = True
    announce_date:      Optional[datetime]    = None

    @field_validator("activity")
    @classmethod
    def tidak_boleh_kosong(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Activity tidak boleh kosong")
        return v.strip()


class AnnouncementCreate(AnnouncementBase):
    pass


class AnnouncementUpdate(BaseModel):
    activity:           Optional[str]             = None
    description:        Optional[str]             = None
    link_url:           Optional[str]             = None
    link_label:         Optional[str]             = None
    priority:           Optional[PriorityType]    = None
    target_roles:       Optional[List[RoleType]]  = None
    target_departments: Optional[List[int]]       = None
    is_active:          Optional[bool]            = None
    announce_date:      Optional[datetime]        = None


class AnnouncementResponse(AnnouncementBase):
    id:         int
    created_by: Optional[int]      = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}