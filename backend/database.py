# ================================================================
# FILE: backend/database.py
# TUGAS: Mengelola koneksi ke MariaDB menggunakan SQLAlchemy
#
# ALUR:
#   Aplikasi → database.py → MariaDB
#   database.py menyediakan "sesi" (SessionLocal) yang dipakai
#   setiap route handler untuk query/insert/update/delete data.
# ================================================================

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

# Muat variabel dari file .env
load_dotenv()

# Ambil URL koneksi dari .env (lihat backend/.env.example)
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. Copy backend/.env.example to backend/.env and fill in your "
        "MariaDB/MySQL connection, e.g. mysql+pymysql://USER:PASSWORD@localhost:3306/cerea"
    )

# Hosting providers (Railway, Aiven, ...) hand out plain "mysql://" URLs;
# SQLAlchemy needs the PyMySQL driver name in the scheme.
if DATABASE_URL.startswith("mysql://"):
    DATABASE_URL = "mysql+pymysql://" + DATABASE_URL[len("mysql://"):]

# Buat engine — ini adalah "jembatan" antara Python dan MariaDB
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,   # test koneksi sebelum pakai (auto-reconnect)
    pool_recycle=3600,    # daur ulang koneksi setiap 1 jam
    pool_size=10,         # jumlah koneksi paralel yang tersedia
    max_overflow=20,      # koneksi tambahan jika pool penuh
    echo=False,           # set True untuk mencetak query SQL ke terminal (debug)
)

# SessionLocal = "pabrik" pembuat sesi database
# Setiap request HTTP akan mendapat sesi sendiri (tidak shared)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base = kelas induk untuk semua model ORM (models.py)
Base = declarative_base()


def get_db():
    """
    FastAPI Dependency — yield sesi DB, tutup setelah request selesai.

    Cara pakai di route:
        @app.get("/contoh")
        def contoh(db: Session = Depends(get_db)):
            hasil = db.query(User).all()
            return hasil
    """
    db = SessionLocal()
    try:
        yield db          # berikan sesi ke route handler
    finally:
        db.close()        # SELALU tutup sesi, bahkan jika terjadi error
