import psycopg2
from psycopg2 import pool as pg_pool
from psycopg2.extras import RealDictCursor
from .config import DATABASE_URL

_pool: pg_pool.ThreadedConnectionPool | None = None

def _get_pool():
    global _pool
    if _pool is None:
        try:
            _pool = pg_pool.ThreadedConnectionPool(
                minconn=1,
                maxconn=10,
                dsn=DATABASE_URL,
                cursor_factory=RealDictCursor
            )
        except Exception:
            _pool = None
    return _pool

class get_connection:
    """Context manager that checks out / returns a pooled connection, with direct connect fallback."""
    def __init__(self):
        self._conn = None
        self._from_pool = False

    def __enter__(self):
        pool = _get_pool()
        if pool is not None:
            try:
                self._conn = pool.getconn()
                self._from_pool = True
                return self._conn
            except Exception:
                self._from_pool = False
        self._conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        return self._conn

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self._conn is not None:
            if self._from_pool and _pool is not None:
                try:
                    if exc_type is not None:
                        self._conn.rollback()
                    _pool.putconn(self._conn)
                except Exception:
                    pass
            else:
                try:
                    if exc_type is not None:
                        self._conn.rollback()
                    self._conn.close()
                except Exception:
                    pass

def list_distinct_test_types():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT column_name FROM information_schema.columns
                WHERE table_name = 'ComplianceRecord'
                AND column_name LIKE '%TestStatus'
            """)
            columns = [row["column_name"] for row in cur.fetchall()]
            test_names = set()
            for col in columns:
                name = col.replace("TestStatus", "").replace("Test", "")
                if name:
                    import re
                    readable = re.sub(r'(?<=[a-z])(?=[A-Z])', ' ', name).strip()
                    test_names.add(readable)
            return sorted(test_names)

def list_distinct_cities():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT DISTINCT "city" FROM "ComplianceRecord" ORDER BY 1')
            return [row["city"] for row in cur.fetchall()]
