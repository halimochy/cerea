# ================================================================
# FILE: backend/main.py  (v2 — tambah Department endpoints & Fix MariaDB)
# Jalankan: uv run uvicorn main:app --reload --port 8000
# ================================================================

from fastapi import FastAPI, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import os
import uuid

from dotenv import load_dotenv
load_dotenv()

import models, schemas, auth
from database import get_db, engine

# Auto-create tabel jika belum ada
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
# Email domain for Microsoft sign-in ({NIK}@EMAIL_DOMAIN) — used in messages
EMAIL_DOMAIN = os.getenv("EMAIL_DOMAIN", "example.com")

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
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads", "icons")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")), name="uploads")

ALLOWED_IMAGE_EXT = {".png", ".jpg", ".jpeg", ".svg", ".webp", ".gif"}
MAX_UPLOAD_SIZE    = 2 * 1024 * 1024  # 2 MB

security = HTTPBearer()


# ════════════════════════════════════════════════════════════
# DEPENDENCIES
# ════════════════════════════════════════════════════════════

def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(security),
    db:    Session = Depends(get_db),
) -> models.User:
    payload = auth.decode_token(creds.credentials)
    if not payload:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED,
                            detail="Token tidak valid atau kadaluarsa")
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


@app.post("/auth/microsoft", response_model=schemas.Token, tags=["🔑 Auth"])
def microsoft_sso(req: schemas.MicrosoftLoginRequest, db: Session = Depends(get_db)):
    """
    Alur verifikasi SSO Microsoft:
    1. Frontend sudah validasi akun via MSAL (tenant + client)
    2. Frontend ekstrak NIK dari email (prefix sebelum @)
    3. Endpoint ini cocokkan NIK ke database lokal
    4. Return JWT portal + data user (role, department, dll)

    Strict: HANYA lookup by NIK — tidak ada fallback display_name.
    Jika NIK tidak ditemukan, user harus didaftarkan admin terlebih dahulu.
    """
    import re as _re

    # ── Validasi: email harus ada ─────────────────────────────────
    if not req.email or "@" not in req.email:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Format email tidak valid. Email Microsoft tidak diterima."
        )

    # ── Ekstrak NIK dari prefix email (sebelum @) ─────────────────
    nik_from_email = req.email.split("@")[0].strip().lower()

    # Validasi: prefix harus berupa angka (format NIK)
    if not _re.match(r"^\d+$", nik_from_email):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Format email tidak sesuai standar NIK. "
                f"Email harus menggunakan format NIK@{EMAIL_DOMAIN} "
                f"(contoh: 100123@{EMAIL_DOMAIN}). "
                f"Email diterima: {req.email}"
            )
        )

    # ── Cari user di database lokal berdasarkan NIK ───────────────
    user = db.query(models.User).filter(
        models.User.nik == nik_from_email
    ).first()

    if not user:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            detail=(
                f"NIK '{nik_from_email}' tidak terdaftar di sistem portal. "
                f"Hubungi IT Department untuk pendaftaran akun."
            )
        )

    # ── Buat JWT token portal dengan data dari DB lokal ──────────
    token = auth.create_access_token({
        "sub":  user.nik,
        "role": user.role,
        "sso":  True,   # flag: login via SSO (bisa dipakai untuk audit log)
    })

    return {"access_token": token, "token_type": "bearer", "user": _enrich_user(user)}


@app.get("/auth/me", response_model=schemas.UserResponse, tags=["🔑 Auth"])
def get_me(current_user: models.User = Depends(get_current_user)):
    return _enrich_user(current_user)


@app.post("/auth/forgot-password", tags=["🔑 Auth"])
def forgot_password(body: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset password darurat — tanpa email.
    Generate password sementara 8 karakter, tampilkan ke user di layar.
    User wajib ganti setelah login pertama.
    """
    import secrets, string
 
    user = db.query(models.User).filter(models.User.nik == body.nik.strip()).first()
    if not user:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            detail="NIK tidak ditemukan. Periksa kembali atau hubungi IT Department."
        )
 
    # Generate password acak: huruf besar + angka, 8 karakter
    chars   = string.ascii_uppercase + string.digits
    temp_pw = "".join(secrets.choice(chars) for _ in range(8))
 
    # Simpan langsung ke DB (hashed)
    user.password = auth.hash_password(temp_pw)
    db.commit()
 
    return {
        "message":       "Password sementara berhasil dibuat.",
        "nik":           user.nik,
        "full_name":     user.full_name,
        "temp_password": temp_pw,
        "peringatan":    "Segera ganti password ini setelah berhasil login.",
    }


# ════════════════════════════════════════════════════════════
# DEPARTMENTS  (Admin only)
# ════════════════════════════════════════════════════════════

@app.get("/departments", response_model=List[schemas.DepartmentResponse], tags=["🏢 Departments"])
def list_departments(
    active_only: bool = Query(False, description="True = hanya departemen aktif"),
    db:          Session = Depends(get_db),
    _:           models.User = Depends(get_current_user),   # semua user login bisa akses (untuk dropdown)
):
    """
    Mengambil daftar departemen.
    - active_only=false (default) → semua departemen (untuk halaman admin)
    - active_only=true            → hanya yang aktif (untuk dropdown form user)
    """
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
    category:     Optional[str] = Query(None),
    current_user: models.User   = Depends(get_current_user),
    db:           Session       = Depends(get_db),
):
    q = db.query(models.ApplicationCard)
    if current_user.role != "Admin":
        # Layer 1 — Role RBAC
        q = q.filter(
            func.json_contains(
                models.ApplicationCard.target_roles,
                func.json_quote(current_user.role),
            )
        )
        # Layer 2 — Department filter
        # [] = semua dept bisa akses; [1,3] = hanya dept tertentu
        if current_user.department_id:
            q = q.filter(
                (func.json_length(models.ApplicationCard.target_department) == 0)
                | (func.json_contains(
                    models.ApplicationCard.target_department,
                    str(current_user.department_id),
                ))
            )
        else:
            # User tanpa dept hanya lihat kartu yg target_department kosong
            q = q.filter(
                func.json_length(models.ApplicationCard.target_department) == 0
            )
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
    limit:        int         = 6,
    current_user: models.User = Depends(get_current_user),
    db:           Session     = Depends(get_db),
):
    """
    Urutan: click_count DESC (per user) → sort_order ASC sebagai tiebreaker.
    Hanya kartu yang lolos RBAC (role + department) yang masuk.
    Jika belum pernah klik → fallback ke 0, lalu diurutkan berdasarkan sort_order.
    """
    clicks_sub = (
        db.query(models.CardClick.card_id, models.CardClick.click_count)
        .filter(models.CardClick.user_id == current_user.id)
        .subquery()
    )

    q = (
        db.query(models.ApplicationCard)
        .outerjoin(clicks_sub, models.ApplicationCard.id == clicks_sub.c.card_id)
    )

    if current_user.role != "Admin":
        q = q.filter(
            func.json_contains(
                models.ApplicationCard.target_roles,
                func.json_quote(current_user.role),
            )
        )
        if current_user.department_id:
            q = q.filter(
                (func.json_length(models.ApplicationCard.target_department) == 0)
                | (func.json_contains(
                    models.ApplicationCard.target_department,
                    str(current_user.department_id),
                ))
            )
        else:
            q = q.filter(
                func.json_length(models.ApplicationCard.target_department) == 0
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
    active_only: bool = True,
    db:          Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
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
    if current_user.role == "Admin":
        return announcements

    # Non-admin → filter berdasarkan target_roles & target_departments
    result = []
    for ann in announcements:
        roles = ann.target_roles or []
        depts = ann.target_departments or []

        role_match = (len(roles) == 0) or (current_user.role in roles)
        dept_match = (len(depts) == 0) or (current_user.department_id in depts)

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