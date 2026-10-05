from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Clean database URL if needed (convert postgres:// to postgresql://)
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Ensure port 6543 for Supabase transaction pooler
if "pooler.supabase.com:5432" in db_url:
    db_url = db_url.replace("pooler.supabase.com:5432", "pooler.supabase.com:6543")

# Connection pool optimized for Supabase transaction pooler
engine = create_engine(
    db_url,
    pool_pre_ping=True,
    pool_size=3,
    max_overflow=5,
    pool_recycle=300,
    connect_args={"sslmode": "require"} if "supabase.com" in db_url else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
