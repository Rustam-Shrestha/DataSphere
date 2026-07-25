import psycopg2
from psycopg2.extras import RealDictCursor
from .config import DATABASE_URL


def get_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


def list_distinct_test_types():
    with get_connection() as conn:
        with conn.cursor() as cur:
            # Determine which test status columns have data
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
                    # Convert camelCase to readable
                    import re
                    readable = re.sub(r'(?<=[a-z])(?=[A-Z])', ' ', name).strip()
                    test_names.add(readable)
            return sorted(test_names)


def list_distinct_cities():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT DISTINCT "city" FROM "ComplianceRecord" ORDER BY 1')
            return [row["city"] for row in cur.fetchall()]
