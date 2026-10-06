from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Clean database URL if needed (convert postgres:// to postgresql://)
db_url = settings.DATABASE_URL
if not db_url:
    raise RuntimeError(
        "DATABASE_URL or DIRECT_URL environment variable is missing. "
        "Please configure server/.env with your database connection string."
    )

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Ensure port 6543 for Supabase transaction pooler
if "pooler.supabase.com:5432" in db_url:
    db_url = db_url.replace("pooler.supabase.com:5432", "pooler.supabase.com:6543")

from sqlalchemy.pool import NullPool

is_supabase_pooler = "pooler.supabase.com" in db_url or ":6543" in db_url

if is_supabase_pooler:
    # Supabase Transaction Pooler (PgBouncer port 6543) manages connection pooling on the server.
    # NullPool disables SQLAlchemy client-side connection pooling, eliminating QueuePool timeouts.
    engine = create_engine(
        db_url,
        poolclass=NullPool,
        connect_args={"sslmode": "require"} if "supabase.com" in db_url else {}
    )
else:
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_size=20,
        max_overflow=40,
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
