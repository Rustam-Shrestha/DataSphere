"""
Fixed SQL templates for the flat ComplianceRecord table.

Each template is a hand-written, parameterized SQL string with %s placeholders.
No string interpolation into SQL values — always use psycopg2 parameter lists.
"""

from datetime import date
from typing import Optional

TEST_STATUS_COLUMNS = {
    "Corrosion": '"corrosionTestStatus"',
    "Spill Buckets": '"spillBucketTestStatus"',
    "Spill Bucket": '"spillBucketTestStatus"',
    "Overfill Protection Device": '"overfillProtectionDeviceTestStatus"',
    "Overfill Protection": '"overfillProtectionDeviceTestStatus"',
    "LLD": '"lldLineTightnessTestStatus"',
    "Line Tightness": '"lldLineTightnessTestStatus"',
    "LLD / Line Tightness": '"lldLineTightnessTestStatus"',
    "ATG": '"atgProbesTestStatus"',
    "Probes": '"atgProbesTestStatus"',
    "ATG / Probes": '"atgProbesTestStatus"',
    "Sump": '"sumpTestStatus"',
    "Stage 1": '"stage1TestStatus"',
    "Stage": '"stage1TestStatus"',
}

TEST_DATE_COLUMNS = {
    "Corrosion": '"corrosionTestDate"',
    "Spill Buckets": '"spillBucketTestDate"',
    "Spill Bucket": '"spillBucketTestDate"',
    "Overfill Protection Device": '"overfillProtectionDeviceTestDate"',
    "Overfill Protection": '"overfillProtectionDeviceTestDate"',
    "LLD": '"lldLineTightnessTestDate"',
    "Line Tightness": '"lldLineTightnessTestDate"',
    "LLD / Line Tightness": '"lldLineTightnessTestDate"',
    "ATG": '"atgProbesTestDate"',
    "Probes": '"atgProbesTestDate"',
    "ATG / Probes": '"atgProbesTestDate"',
    "Sump": '"sumpTestDate"',
    "Stage 1": '"stage1TestDate"',
    "Stage": '"stage1TestDate"',
}


def failure_rate_sql(
    test_type: Optional[str],
    city: Optional[str],
    store_number: Optional[int],
) -> tuple[str, tuple]:
    status_col = TEST_STATUS_COLUMNS.get(test_type, "corrosionTestStatus") if test_type else None
    date_col = TEST_DATE_COLUMNS.get(test_type, "corrosionTestDate") if test_type else None

    clauses: list[str] = []
    params: list = []

    if status_col:
        clauses.append(f"{status_col} IS NOT NULL")
    if city:
        clauses.append('"city" = %s')
        params.append(city)
    if store_number:
        clauses.append('"storeNumber" = %s')
        params.append(store_number)

    where = (" WHERE " + " AND ".join(clauses)) if clauses else ""
    col_ref = status_col or '"corrosionTestStatus"'

    sql = (
        f"SELECT {col_ref} AS status, count(*)::int AS cnt "
        f'FROM "ComplianceRecord"'
        f'{where} '
        f"GROUP BY status"
    )
    return (sql, tuple(params))


def status_counts_sql(
    test_type: Optional[str],
    status_filter: Optional[str],
    city: Optional[str],
    store_number: Optional[int],
) -> tuple[str, tuple]:
    status_col = TEST_STATUS_COLUMNS.get(test_type, "corrosionTestStatus") if test_type else None

    clauses: list[str] = []
    params: list = []

    if status_col:
        clauses.append(f"{status_col} IS NOT NULL")
    if status_filter:
        col = status_col or '"corrosionTestStatus"'
        clauses.append(f'{col} = %s')
        params.append(status_filter.upper())
    if city:
        clauses.append('"city" = %s')
        params.append(city)
    if store_number:
        clauses.append('"storeNumber" = %s')
        params.append(store_number)

    where = (" WHERE " + " AND ".join(clauses)) if clauses else ""

    col = status_col or '"corrosionTestStatus"'
    sql = (
        f"SELECT {col} AS status, count(*)::int AS cnt "
        f'FROM "ComplianceRecord"'
        f'{where} '
        f"GROUP BY status"
    )
    return (sql, tuple(params))


def list_records_sql(
    city: Optional[str],
    store_number: Optional[int],
    limit: int = 50,
) -> tuple[str, tuple]:
    clauses: list[str] = []
    params: list = []

    if city:
        clauses.append('"city" = %s')
        params.append(city)
    if store_number:
        clauses.append('"storeNumber" = %s')
        params.append(store_number)

    where = (" WHERE " + " AND ".join(clauses)) if clauses else ""

    sql = (
        f'SELECT * FROM "ComplianceRecord"'
        f'{where} '
        f'ORDER BY "createdAt" DESC LIMIT %s'
    )
    params.append(limit)
    return (sql, tuple(params))


def expiring_soon_sql(days: int = 30) -> tuple[str, tuple]:
    sql = (
        "SELECT 'Delivery Certificate' AS type, count(*)::int AS cnt "
        'FROM "ComplianceRecord" '
        'WHERE "deliveryCertificateExpiredDate" BETWEEN CURRENT_DATE AND CURRENT_DATE + %s::int '
        'UNION ALL '
        "SELECT 'Insurance' AS type, count(*)::int AS cnt "
        'FROM "ComplianceRecord" '
        'WHERE "insuranceExpiredDate" BETWEEN CURRENT_DATE AND CURRENT_DATE + %s::int'
    )
    return (sql, (days, days))


def chart_data_sql() -> tuple[str, tuple]:
    sql = (
        "SELECT 'Corrosion' AS test, "
        "  count(*) FILTER (WHERE \"corrosionTestStatus\" = 'PASS') AS pass_count, "
        "  count(*) FILTER (WHERE \"corrosionTestStatus\" = 'FAIL') AS fail_count "
        'FROM "ComplianceRecord" '
        "UNION ALL "
        "SELECT 'Spill Buckets', "
        "  count(*) FILTER (WHERE \"spillBucketTestStatus\" = 'PASS'), "
        "  count(*) FILTER (WHERE \"spillBucketTestStatus\" = 'FAIL') "
        'FROM "ComplianceRecord" '
        "UNION ALL "
        "SELECT 'Overfill Protection', "
        "  count(*) FILTER (WHERE \"overfillProtectionDeviceTestStatus\" = 'PASS'), "
        "  count(*) FILTER (WHERE \"overfillProtectionDeviceTestStatus\" = 'FAIL') "
        'FROM "ComplianceRecord" '
        "UNION ALL "
        "SELECT 'LLD / Line Tightness', "
        "  count(*) FILTER (WHERE \"lldLineTightnessTestStatus\" = 'PASS'), "
        "  count(*) FILTER (WHERE \"lldLineTightnessTestStatus\" = 'FAIL') "
        'FROM "ComplianceRecord" '
        "UNION ALL "
        "SELECT 'ATG / Probes', "
        "  count(*) FILTER (WHERE \"atgProbesTestStatus\" = 'PASS'), "
        "  count(*) FILTER (WHERE \"atgProbesTestStatus\" = 'FAIL') "
        'FROM "ComplianceRecord" '
        "UNION ALL "
        "SELECT 'Sump', "
        "  count(*) FILTER (WHERE \"sumpTestStatus\" = 'PASS'), "
        "  count(*) FILTER (WHERE \"sumpTestStatus\" = 'FAIL') "
        'FROM "ComplianceRecord" '
        "UNION ALL "
        "SELECT 'Stage 1', "
        "  count(*) FILTER (WHERE \"stage1TestStatus\" = 'PASS'), "
        "  count(*) FILTER (WHERE \"stage1TestStatus\" = 'FAIL') "
        'FROM "ComplianceRecord"'
    )
    return (sql, ())


def overdue_sql() -> tuple[str, tuple]:
    sql = (
        "SELECT 'Delivery Certificate' AS type, count(*)::int AS cnt, "
        "MIN(\"deliveryCertificateExpiredDate\")::text AS earliest "
        'FROM "ComplianceRecord" '
        'WHERE "deliveryCertificateExpiredDate" < CURRENT_DATE '
        "UNION ALL "
        "SELECT 'Insurance' AS type, count(*)::int AS cnt, "
        "MIN(\"insuranceExpiredDate\")::text AS earliest "
        'FROM "ComplianceRecord" '
        'WHERE "insuranceExpiredDate" < CURRENT_DATE'
    )
    return (sql, ())
