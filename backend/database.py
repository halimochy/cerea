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
from sqlalchemy.pool import NullPool
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
        "MariaDB/MySQL connection, e.g. mysql+pymysql://USER:PASSWORD@localhost:3306/cerea "
        "(or a PostgreSQL one, e.g. postgresql://USER:PASSWORD@HOST:5432/postgres for Supabase)"
    )

# Hosting providers hand out plain "mysql://" / "postgres://" URLs;
# SQLAlchemy needs the driver name in the scheme.
if DATABASE_URL.startswith("mysql://"):
    DATABASE_URL = "mysql+pymysql://" + DATABASE_URL[len("mysql://"):]
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = "postgresql+psycopg2://" + DATABASE_URL[len("postgres://"):]
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = "postgresql+psycopg2://" + DATABASE_URL[len("postgresql://"):]

IS_POSTGRES = DATABASE_URL.startswith("postgresql")

# Serverless hosts (Vercel) start many short-lived instances, so a local connection
# pool only wastes database connections: open one per use and rely on the provider's
# pooler (e.g. Supabase "Transaction pooler"). Enabled automatically when VERCEL is
# set, or with DB_POOL=null.
USE_NULL_POOL = os.getenv("DB_POOL", "").strip().lower() == "null" or bool(os.getenv("VERCEL"))

# Buat engine — ini adalah "jembatan" antara Python dan MariaDB / PostgreSQL
if USE_NULL_POOL:
    engine = create_engine(DATABASE_URL, poolclass=NullPool, echo=False)
else:
    # Hosted Postgres poolers (Supabase) allow few connections, so the pool is smaller there.
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,                    # test koneksi sebelum pakai (auto-reconnect)
        pool_recycle=3600,                     # daur ulang koneksi setiap 1 jam
        pool_size=5 if IS_POSTGRES else 10,    # jumlah koneksi paralel yang tersedia
        max_overflow=5 if IS_POSTGRES else 20, # koneksi tambahan jika pool penuh
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
