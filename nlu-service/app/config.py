import os
from urllib.parse import urlparse, urlunparse
from dotenv import load_dotenv

load_dotenv()

_raw_db_url = os.getenv("DATABASE_URL", "postgresql://compliance:compliance@localhost:5432/compliance_db")

# Strip Prisma-specific query params (e.g. ?schema=public) that psycopg2 doesn't understand
parsed = urlparse(_raw_db_url)
if parsed.query:
    # Keep only standard libpq query parameters
    safe_params = {}
    for key, val in (p.split("=", 1) for p in parsed.query.split("&") if "=" in p):
        if key in ("connect_timeout", "host", "port", "dbname", "user", "password",
                    "sslmode", "sslcert", "sslkey", "sslrootcert", "sslcrl",
                    "application_name", "keepalives", "keepalives_idle",
                    "keepalives_interval", "keepalives_count", "target_session_attrs",
                    "options", "gssencmode"):
            safe_params[key] = val
    _raw_db_url = urlunparse(parsed._replace(query="&".join(f"{k}={v}" for k, v in safe_params.items())))

DATABASE_URL = _raw_db_url
PORT = int(os.getenv("PORT", "8000"))
