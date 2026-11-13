# ================================================================
# FILE: backend/main.py  (v2 — tambah Department endpoints & Fix MariaDB)
# Jalankan: uv run uvicorn main:app --reload --port 8000
# ================================================================

from fastapi import FastAPI, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func, cast
from sqlalchemy.dialects.postgresql import JSONB
from typing import List, Optional
import os
import uuid

from dotenv import load_dotenv
load_dotenv()

import models, schemas, auth
from database import get_db, engine

# Auto-create tabel jika belum ada.
# Serverless hosts can set AUTO_CREATE_TABLES=false once `python seed.py` has created
# the tables, to avoid the extra queries on every cold start.
if os.getenv("AUTO_CREATE_TABLES", "true").strip().lower() not in ("0", "false", "no"):
    models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cerea — Enterprise Portal API",
    version="2.1.0",
    description="Backend API dengan RBAC + Department Management",
)

# Comma-separated list of allowed browser origins (see .env.example)
CORS_ORIGINS = [
    o.strip() for o in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",") if o.strip()
]
# "Login as Guest": read-only access to all apps + announcements for everyone.
# Off unless explicitly enabled. Disabling it also invalidates guest tokens already issued.
GUEST_LOGIN_ENABLED = os.getenv("GUEST_LOGIN_ENABLED", "false").strip().lower() in ("1", "true", "yes")
GUEST_TOKEN_MINUTES = int(os.getenv("GUEST_TOKEN_MINUTES", "60"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ════════════════════════════════════════════════════════════
# STATIC FILES — upload icon aplikasi (logo card)
#
# Catatan PENTING:
#   File TIDAK bisa otomatis tersimpan ke "frontend/src/assets" karena
#   folder src/* hanya dibaca oleh Vite SAAT BUILD, bukan folder yang
#   bisa ditulis/disajikan saat aplikasi berjalan (runtime).
#   Solusi standar: backend menyimpan file ke folder "uploads/icons/"
#   miliknya sendiri, lalu menyajikannya sebagai URL statis
#   (http://localhost:8000/uploads/icons/xxx.png) yang disimpan
#   sebagai icon_value di database — persis seperti icon_type="url".
# ════════════════════════════════════════════════════════════
#
#   Serverless hosts (Vercel) have a read-only filesystem, so uploads are
#   switched off there (automatically when VERCEL is set, or with
#   UPLOADS_ENABLED=false) and admins use the preset icons instead.
UPLOADS_ENABLED = os.getenv("UPLOADS_ENABLED", "false" if os.getenv("VERCEL") else "true").strip().lower() in ("1", "true", "yes")
UPLOAD_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
UPLOAD_DIR = os.path.join(UPLOAD_ROOT, "icons")
if UPLOADS_ENABLED:
    try:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        app.mount("/uploads", StaticFiles(directory=UPLOAD_ROOT), name="uploads")
    except OSError:          # read-only filesystem
        UPLOADS_ENABLED = False

ALLOWED_IMAGE_EXT = {".png", ".jpg", ".jpeg", ".svg", ".webp", ".gif"}
MAX_UPLOAD_SIZE    = 2 * 1024 * 1024  # 2 MB

security = HTTPBearer()


# ════════════════════════════════════════════════════════════
# DEPENDENCIES
# ════════════════════════════════════════════════════════════

class GuestUser:
    """Read-only visitor from "Login as Guest". Not stored in the database."""
    id            = None
    nik           = "guest"
    full_name     = "Guest"
    role          = "Guest"
    department    = None
    department_id = None
    is_guest      = True

    def as_response(self) -> dict:
        return {"id": 0, "nik": self.nik, "full_name": self.full_name, "role": self.role,
                "department": None, "department_id": None, "department_name": None}


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(security),
    db:    Session = Depends(get_db),
) -> models.User:
    payload = auth.decode_token(creds.credentials)
    if not payload:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED,
                            detail="Token tidak valid atau kadaluarsa")
    if payload.get("guest"):
        if not GUEST_LOGIN_ENABLED:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Guest access is disabled")
        return GuestUser()
    user = db.query(models.User).filter(
        models.User.nik == payload.get("sub")
    ).first()
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED,
                            detail="User tidak ditemukan")
    return user


def require_admin(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    if current_user.role != "Admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN,
                            detail="Akses ditolak — hanya Admin")
    return current_user


class Viewer:
    """Whose point of view the portal data is filtered for.

    Normally the signed-in user. Admins may "preview as user" by passing
    ?as_user_id=<id>  (a real user: their role, department and clicks), or
    ?as_role=<role>&as_department_id=<id|0>  (a hypothetical user, no clicks).
    """
    def __init__(self, user_id, role, department_id, is_preview=False):
        self.id            = user_id
        self.role          = role
        self.department_id = department_id or None
        self.is_preview    = is_preview


def get_viewer(
    as_user_id:       Optional[int] = Query(None, description="Admin only: preview as this user"),
    as_role:          Optional[str] = Query(None, description="Admin only: preview as this role"),
    as_department_id: Optional[int] = Query(None, description="Admin only: department for as_role (0 = none)"),
    current_user:     models.User   = Depends(get_current_user),
    db:               Session       = Depends(get_db),
) -> Viewer:
    if as_user_id is None and as_role is None:
        return Viewer(current_user.id, current_user.role, current_user.department_id)

    if current_user.role != "Admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Preview is only available to admins")

    if as_user_id is not None:
        target = db.query(models.User).filter(models.User.id == as_user_id).first()
        if not target:
            raise HTTPException(404, detail="Preview user not found")
        return Viewer(target.id, target.role, target.department_id, is_preview=True)

    if as_role == "Guest":
        return Viewer(None, "Guest", None, is_preview=True)
    if as_role not in models.VALID_ROLES:
        raise HTTPException(400, detail=f"Unknown role '{as_role}'")
    if as_department_id and not db.query(models.Department).filter(
        models.Department.id == as_department_id
    ).first():
        raise HTTPException(404, detail="Preview department not found")
    return Viewer(None, as_role, as_department_id, is_preview=True)


def _filter_cards_for(q, viewer: Viewer):
    """RBAC for cards: Admin and Guest see all cards (guests are read-only);
    others need a role match AND a department match.
    Which cards appear under "General Apps" is the admin's is_general flag."""
    if viewer.role in ("Admin", "Guest"):
        return q

    # PostgreSQL (e.g. Supabase): same rules with JSONB operators
    if engine.dialect.name == "postgresql":
        roles = cast(models.ApplicationCard.target_roles, JSONB)
        depts = cast(models.ApplicationCard.target_department, JSONB)
        q = q.filter(roles.contains([viewer.role]))
        if viewer.department_id:
            return q.filter(
                (func.jsonb_array_length(depts) == 0)
                | depts.contains([viewer.department_id])
            )
        return q.filter(func.jsonb_array_length(depts) == 0)

    # MySQL / MariaDB
    # Layer 1 — Role RBAC
    q = q.filter(
        func.json_contains(
            models.ApplicationCard.target_roles,
            func.json_quote(viewer.role),
        )
    )
    # Layer 2 — Department filter: [] = semua dept bisa akses; [1,3] = hanya dept tertentu
    if viewer.department_id:
        return q.filter(
            (func.json_length(models.ApplicationCard.target_department) == 0)
            | (func.json_contains(
                models.ApplicationCard.target_department,
                str(viewer.department_id),
            ))
        )
    # User tanpa dept hanya lihat kartu yg target_department kosong
    return q.filter(func.json_length(models.ApplicationCard.target_department) == 0)


def _enrich_user(user: models.User) -> dict:
    """Tambahkan department_name ke response user."""
    d = {c.name: getattr(user, c.name) for c in user.__table__.columns}
    d["department_name"] = (
        user.department_rel.department_name
        if user.department_rel else user.department
    )
    return d


# ════════════════════════════════════════════════════════════
# AUTH
# ════════════════════════════════════════════════════════════

@app.post("/auth/login", response_model=schemas.Token, tags=["🔑 Auth"])
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.nik == req.nik).first()
    if not user or not auth.verify_password(req.password, user.password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED,
                            detail="NIK atau password salah")
    token = auth.create_access_token({"sub": user.nik, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": _enrich_user(user)}


@app.get("/auth/me", response_model=schemas.SessionUserResponse, tags=["🔑 Auth"])
def get_me(current_user: models.User = Depends(get_current_user)):
    if isinstance(current_user, GuestUser):
        return current_user.as_response()
    return _enrich_user(current_user)


@app.get("/auth/options", response_model=schemas.AuthOptions, tags=["🔑 Auth"])
def auth_options():
    """Public: which optional sign-in methods the login page should offer."""
    return {"guest_login": GUEST_LOGIN_ENABLED}


@app.post("/auth/guest", response_model=schemas.Token, tags=["🔑 Auth"])
def guest_login():
    """
    Read-only guest session (no NIK/password): all apps + announcements
    targeted at everyone. No admin access, no department data, clicks not counted.
    """
    if not GUEST_LOGIN_ENABLED:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Guest access is disabled")
    from datetime import timedelta
    token = auth.create_access_token(
        {"sub": "guest", "role": "Guest", "guest": True},
        expires_delta=timedelta(minutes=GUEST_TOKEN_MINUTES),
    )
    return {"access_token": token, "token_type": "bearer", "user": GuestUser().as_response()}


# Password reset: there is intentionally no self-service endpoint.
# An unauthenticated "reset by NIK" lets anyone take over any account.
# Admins reset passwords via PUT /users/{id} (User Management in the dashboard).


# ════════════════════════════════════════════════════════════
# DEPARTMENTS  (Admin only)
# ════════════════════════════════════════════════════════════

@app.get("/departments", response_model=List[schemas.DepartmentResponse], tags=["🏢 Departments"])
def list_departments(
    active_only: bool = Query(False, description="True = hanya departemen aktif"),
    db:          Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),   # semua user login bisa akses (untuk dropdown)
):
    """
    Mengambil daftar departemen.
    - active_only=false (default) → semua departemen (untuk halaman admin)
    - active_only=true            → hanya yang aktif (untuk dropdown form user)
    Guests can't list departments (internal organisation data).
    """
    if isinstance(current_user, GuestUser):
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Not available for guests")
    q = db.query(models.Department)
    if active_only:
        q = q.filter(models.Department.is_active == True)
    depts = q.order_by(models.Department.department_name).all()

    # Hitung jumlah user per departemen
    result = []
    for d in depts:
        count = db.query(func.count(models.User.id)).filter(
            models.User.department_id == d.id
        ).scalar()
        item = schemas.DepartmentResponse.model_validate(d)
        item.user_count = count
        result.append(item)
    return result


@app.post("/departments", response_model=schemas.DepartmentResponse,
          status_code=status.HTTP_201_CREATED, tags=["🏢 Departments"])
def create_department(
    data: schemas.DepartmentCreate,
    db:   Session = Depends(get_db),
    _:    models.User = Depends(require_admin),
):
    """Tambah departemen baru. Nama harus unik."""
    existing = db.query(models.Department).filter(
        models.Department.department_name.ilike(data.department_name)
    ).first()
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT,
                            detail=f"Departemen '{data.department_name}' sudah ada")
    dept = models.Department(**data.model_dump())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


@app.put("/departments/{dept_id}", response_model=schemas.DepartmentResponse, tags=["🏢 Departments"])
def update_department(
    dept_id: int,
    data:    schemas.DepartmentUpdate,
    db:      Session = Depends(get_db),
    _:       models.User = Depends(require_admin),
):
    """Update nama atau status aktif departemen."""
    dept = db.query(models.Department).filter(
        models.Department.id == dept_id
    ).first()
    if not dept:
        raise HTTPException(404, detail="Departemen tidak ditemukan")

    # Cek duplikasi nama jika nama diubah
    if data.department_name and data.department_name != dept.department_name:
        dup = db.query(models.Department).filter(
            models.Department.department_name.ilike(data.department_name),
            models.Department.id != dept_id,
        ).first()
        if dup:
            raise HTTPException(status.HTTP_409_CONFLICT,
                                detail=f"Nama '{data.department_name}' sudah digunakan")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(dept, field, value)
    db.commit()
    db.refresh(dept)
    return dept


@app.delete("/departments/{dept_id}", tags=["🏢 Departments"])
def delete_department(
    dept_id: int,
    db:      Session = Depends(get_db),
    _:       models.User = Depends(require_admin),
):
    """Hapus departemen. Hanya bisa dihapus jika tidak ada user yang terhubung."""
    dept = db.query(models.Department).filter(
        models.Department.id == dept_id
    ).first()
    if not dept:
        raise HTTPException(404, detail="Departemen tidak ditemukan")

    user_count = db.query(func.count(models.User.id)).filter(
        models.User.department_id == dept_id
    ).scalar()
    if user_count > 0:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=f"Tidak dapat menghapus — masih ada {user_count} user di departemen ini. "
                   "Non-aktifkan departemen atau pindahkan user terlebih dahulu.",
        )
    db.delete(dept)
    db.commit()
    return {"message": f"Departemen '{dept.department_name}' berhasil dihapus"}


# ════════════════════════════════════════════════════════════
# USERS  (Admin only)
# ════════════════════════════════════════════════════════════

@app.get("/users", response_model=List[schemas.UserResponse], tags=["👤 Users"])
def list_users(
    department_id: Optional[int] = Query(None, description="Filter by department_id"),
    db: Session = Depends(get_db),
    _:  models.User = Depends(require_admin),
):
    q = db.query(models.User)
    if department_id:
        q = q.filter(models.User.department_id == department_id)
    users = q.order_by(models.User.full_name).all()
    return [_enrich_user(u) for u in users]


@app.post("/users", response_model=schemas.UserResponse,
          status_code=status.HTTP_201_CREATED, tags=["👤 Users"])
def create_user(
    data: schemas.UserCreate,
    db:   Session = Depends(get_db),
    _:    models.User = Depends(require_admin),
):
    if db.query(models.User).filter(models.User.nik == data.nik).first():
        raise HTTPException(status.HTTP_409_CONFLICT,
                            detail=f"NIK '{data.nik}' sudah terdaftar")

    # Validasi department_id jika diberikan
    if data.department_id:
        dept = db.query(models.Department).filter(
            models.Department.id == data.department_id,
            models.Department.is_active == True,
        ).first()
        if not dept:
            raise HTTPException(400,
                detail="department_id tidak valid atau departemen tidak aktif")

    payload = data.model_dump()
    payload["password"] = auth.hash_password(payload["password"])
    user = models.User(**payload)
    db.add(user)
    db.commit()
    db.refresh(user)
    return _enrich_user(user)


@app.put("/users/{user_id}", response_model=schemas.UserResponse, tags=["👤 Users"])
def update_user(
    user_id:      int,
    data:         schemas.UserUpdate,
    db:           Session = Depends(get_db),
    current_admin: models.User = Depends(require_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, detail="User tidak ditemukan")
    if user.id == current_admin.id and data.role and data.role != "Admin":
        raise HTTPException(400, detail="Tidak dapat mengubah role akun sendiri")

    # Validasi department_id baru jika diubah
    if data.department_id is not None:
        if data.department_id == 0:
            # 0 = clear department
            pass
        else:
            dept = db.query(models.Department).filter(
                models.Department.id == data.department_id,
                models.Department.is_active == True,
            ).first()
            if not dept:
                raise HTTPException(400,
                    detail="department_id tidak valid atau departemen tidak aktif")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "password" and value:
            setattr(user, field, auth.hash_password(value))
        elif field == "department_id" and value == 0:
            setattr(user, field, None)
        else:
            setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return _enrich_user(user)


@app.delete("/users/{user_id}", tags=["👤 Users"])
def delete_user(
    user_id:      int,
    db:           Session = Depends(get_db),
    current_admin: models.User = Depends(require_admin),
):
    if user_id == current_admin.id:
        raise HTTPException(400, detail="Tidak dapat menghapus akun sendiri")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, detail="User tidak ditemukan")
    db.delete(user)
    db.commit()
    return {"message": f"User '{user.full_name}' berhasil dihapus"}


# ════════════════════════════════════════════════════════════
# APPLICATION CARDS
# ════════════════════════════════════════════════════════════

@app.get("/cards", response_model=List[schemas.CardResponse], tags=["🃏 Cards"])
def list_cards(
    category: Optional[str] = Query(None),
    viewer:   Viewer        = Depends(get_viewer),
    db:       Session       = Depends(get_db),
):
    q = _filter_cards_for(db.query(models.ApplicationCard), viewer)
    if category:
        q = q.filter(models.ApplicationCard.category == category)
    return q.order_by(models.ApplicationCard.sort_order,
                      models.ApplicationCard.id).all()


@app.post("/cards/upload-icon", tags=["🃏 Cards"])
async def upload_card_icon(
    file: UploadFile = File(...),
    _:    models.User = Depends(require_admin),
):
    """
    Upload gambar icon/logo aplikasi.
    File disimpan di backend/uploads/icons/, lalu URL publiknya
    dikembalikan untuk disimpan sebagai `icon_value` (icon_type="upload").
    """
    if not UPLOADS_ENABLED:
        raise HTTPException(
            status.HTTP_501_NOT_IMPLEMENTED,
            detail="Icon upload is not available on this deployment. Choose a preset icon instead.",
        )
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_IMAGE_EXT:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=f"Format file tidak didukung. Gunakan: {', '.join(sorted(ALLOWED_IMAGE_EXT))}",
        )

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Ukuran file maksimal 2 MB",
        )

    filename  = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as f:
        f.write(contents)

    url = f"/uploads/icons/{filename}"
    return {"url": url, "filename": filename}


@app.post("/cards", response_model=schemas.CardResponse,
          status_code=status.HTTP_201_CREATED, tags=["🃏 Cards"])
def create_card(
    data: schemas.CardCreate,
    db:   Session = Depends(get_db),
    _:    models.User = Depends(require_admin),
):
    card = models.ApplicationCard(**data.model_dump())
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@app.put("/cards/{card_id}", response_model=schemas.CardResponse, tags=["🃏 Cards"])
def update_card(
    card_id: int,
    data:    schemas.CardUpdate,
    db:      Session = Depends(get_db),
    _:       models.User = Depends(require_admin),
):
    card = db.query(models.ApplicationCard).filter(
        models.ApplicationCard.id == card_id
    ).first()
    if not card:
        raise HTTPException(404, detail="Kartu tidak ditemukan")
    from sqlalchemy.orm.attributes import flag_modified
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(card, field, value)
        if isinstance(value, (list, dict)):
            flag_modified(card, field)
    db.commit()
    db.refresh(card)
    return card


@app.delete("/cards/{card_id}", tags=["🃏 Cards"])
def delete_card(
    card_id: int,
    db:      Session = Depends(get_db),
    _:       models.User = Depends(require_admin),
):
    card = db.query(models.ApplicationCard).filter(
        models.ApplicationCard.id == card_id
    ).first()
    if not card:
        raise HTTPException(404, detail="Card not found")
    db.delete(card)
    db.commit()
    return {"message": f"Card '{card.page_name}' deleted successfully"}


# CARD CLICK TRACKING
# ════════════════════════════════════════════════════════════

@app.post("/cards/{card_id}/click", tags=["🃏 Cards"])
def record_card_click(
    card_id:      int,
    current_user: models.User = Depends(get_current_user),
    db:           Session     = Depends(get_db),
):
    """
    Catat 1 klik user pada kartu.
    INSERT click baru atau INCREMENT jika sudah ada (atomic upsert).
    """
    card = db.query(models.ApplicationCard).filter(
        models.ApplicationCard.id == card_id
    ).first()
    if not card:
        raise HTTPException(404, detail="Kartu tidak ditemukan")
    if isinstance(current_user, GuestUser):
        return {"message": "Click not recorded for guests", "card_id": card_id}

    existing = db.query(models.CardClick).filter(
        models.CardClick.user_id == current_user.id,
        models.CardClick.card_id == card_id,
    ).first()

    if existing:
        existing.click_count += 1
    else:
        db.add(models.CardClick(
            user_id=current_user.id,
            card_id=card_id,
            click_count=1,
        ))

    db.commit()
    return {"message": "Click recorded", "card_id": card_id}


@app.get(
    "/cards/frequently-used",
    response_model=List[schemas.CardResponse],
    tags=["🃏 Cards"],
    summary="Top N kartu paling sering diklik oleh user ini",
)
def get_frequently_used(
    limit:  int     = 6,
    viewer: Viewer  = Depends(get_viewer),
    db:     Session = Depends(get_db),
):
    """
    Urutan: click_count DESC (per user) → sort_order ASC sebagai tiebreaker.
    Hanya kartu yang lolos RBAC (role + department) yang masuk.
    Jika belum pernah klik → fallback ke 0, lalu diurutkan berdasarkan sort_order.
    Preview by role (no real user) has no clicks, so it falls back to sort_order.
    """
    clicks_sub = (
        db.query(models.CardClick.card_id, models.CardClick.click_count)
        .filter(models.CardClick.user_id == (viewer.id or -1))
        .subquery()
    )

    q = _filter_cards_for(
        db.query(models.ApplicationCard)
        .outerjoin(clicks_sub, models.ApplicationCard.id == clicks_sub.c.card_id),
        viewer,
    )

    # PERBAIKAN DI SINI: Mengganti .nulls_last() menggunakan func.coalesce agar kompatibel dengan MariaDB
    results = (
        q.order_by(
            func.coalesce(clicks_sub.c.click_count, 0).desc(),
            models.ApplicationCard.sort_order.asc(),
        )
        .limit(limit)
        .all()
    )

    return results


# ════════════════════════════════════════════════════════════
# ANNOUNCEMENTS
# ════════════════════════════════════════════════════════════

@app.get("/announcements", response_model=List[schemas.AnnouncementResponse], tags=["📢 Announcements"])
def list_announcements(
    active_only: bool    = True,
    db:          Session = Depends(get_db),
    viewer:      Viewer  = Depends(get_viewer),
):
    """
    Semua user bisa GET.
    Hasil di-filter berdasarkan role & department_id user yang login.
    Admin mendapat semua announcement (untuk keperluan management).
    """
    q = db.query(models.Announcement)
    if active_only:
        q = q.filter(models.Announcement.is_active == True)

    announcements = q.order_by(models.Announcement.announce_date.desc()).all()

    # Admin → return semua tanpa filter
    if viewer.role == "Admin":
        return announcements

    # Non-admin → filter berdasarkan target_roles & target_departments
    result = []
    for ann in announcements:
        roles = ann.target_roles or []
        depts = ann.target_departments or []

        role_match = (len(roles) == 0) or (viewer.role in roles)
        dept_match = (len(depts) == 0) or (viewer.department_id in depts)

        if role_match and dept_match:
            result.append(ann)

    return result


@app.get("/announcements/all", response_model=List[schemas.AnnouncementResponse], tags=["📢 Announcements"])
def list_all_announcements(
    db:           Session = Depends(get_db),
    _:            models.User = Depends(require_admin),
):
    """Admin only — semua announcement termasuk inactive, untuk management di dashboard."""
    return (
        db.query(models.Announcement)
        .order_by(models.Announcement.announce_date.desc())
        .all()
    )


@app.post("/announcements", response_model=schemas.AnnouncementResponse,
          status_code=201, tags=["📢 Announcements"])
def create_announcement(
    body:         schemas.AnnouncementCreate,
    db:           Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    ann = models.Announcement(
        **body.model_dump(exclude={"announce_date"}),
        announce_date = body.announce_date or func.now(),
        created_by    = current_user.id,
    )
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return ann


@app.put("/announcements/{ann_id}", response_model=schemas.AnnouncementResponse, tags=["📢 Announcements"])
def update_announcement(
    ann_id: int,
    body:   schemas.AnnouncementUpdate,
    db:     Session = Depends(get_db),
    _:      models.User = Depends(require_admin),
):
    ann = db.query(models.Announcement).filter(models.Announcement.id == ann_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement tidak ditemukan")
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(ann, field, val)
    db.commit()
    db.refresh(ann)
    return ann


@app.delete("/announcements/{ann_id}", tags=["📢 Announcements"])
def delete_announcement(
    ann_id: int,
    db:     Session = Depends(get_db),
    _:      models.User = Depends(require_admin),
):
    ann = db.query(models.Announcement).filter(models.Announcement.id == ann_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement tidak ditemukan")
    db.delete(ann)
    db.commit()
    return {"detail": f"Announcement {ann_id} dihapus"}


# ════════════════════════════════════════════════════════════
# UTILITY
# ════════════════════════════════════════════════════════════

@app.get("/health", tags=["🔧 Utility"])
def health():
    return {"status": "ok", "version": "2.1.0"}


def _db_error_reason(exc: Exception) -> str:
    """Map a database error to a short, safe category (never echoes host/user/password)."""
    msg = str(exc).lower()
    if "password authentication failed" in msg or "access denied" in msg:
        return "wrong_credentials"
    if "tenant or user not found" in msg:
        return "pooler_user_or_project_ref_wrong"
    if ("relation" in msg or "table" in msg) and "does not exist" in msg or "doesn't exist" in msg:
        return "tables_missing_run_seed"
    if any(k in msg for k in ("could not translate host", "name or service not known",
                              "network is unreachable", "timed out", "timeout", "connection refused")):
        return "cannot_reach_database"
    if "ssl" in msg:
        return "ssl_problem"
    if "database" in msg and "does not exist" in msg:
        return "database_name_wrong"
    return "other"


@app.get("/health/db", tags=["🔧 Utility"])
def health_db(db: Session = Depends(get_db)):
    """Database connectivity check for deployments. Details go to the server log only."""
    from fastapi.responses import JSONResponse
    import logging
    try:
        users = db.query(func.count(models.User.id)).scalar()
        cards = db.query(func.count(models.ApplicationCard.id)).scalar()
        return {"status": "ok", "dialect": engine.dialect.name, "users": users, "cards": cards}
    except Exception as exc:  # noqa: BLE001
        logging.getLogger("uvicorn.error").exception("health/db failed")
        return JSONResponse(
            status_code=503,
            content={"status": "error", "dialect": engine.dialect.name,
                     "error_type": type(exc).__name__, "reason": _db_error_reason(exc)},
        )