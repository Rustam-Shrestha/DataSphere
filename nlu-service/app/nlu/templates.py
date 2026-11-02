"""
PostgreSQL queries for the flat ComplianceRecord table.
All queries use parameterized %s placeholders for safety.
"""

from typing import Optional, Tuple, List

TEST_STATUS_COLUMNS = {
    "Corrosion": '"corrosionTestStatus"',
    "Spill Buckets": '"spillBucketTestStatus"',
    "Spill Bucket": '"spillBucketTestStatus"',
    "Overfill Protection Device": '"overfillProtectionDeviceTestStatus"',
    "Overfill Protection": '"overfillProtectionDeviceTestStatus"',
    "LLD / Line Tightness": '"lldLineTightnessTestStatus"',
    "LLD": '"lldLineTightnessTestStatus"',
    "Line Tightness": '"lldLineTightnessTestStatus"',
    "ATG / Probes": '"atgProbesTestStatus"',
    "ATG": '"atgProbesTestStatus"',
    "Probes": '"atgProbesTestStatus"',
    "Sump": '"sumpTestStatus"',
    "Stage 1": '"stage1TestStatus"',
    "Stage": '"stage1TestStatus"',
}

TEST_DATE_COLUMNS = {
    "Corrosion": '"corrosionTestDate"',
    "Spill Buckets": '"spillBucketsTestDate"',
    "Spill Bucket": '"spillBucketsTestDate"',
    "Overfill Protection Device": '"overfillProtectionDeviceTestDate"',
    "Overfill Protection": '"overfillProtectionDeviceTestDate"',
    "LLD / Line Tightness": '"lldLineTightnessTestDate"',
    "LLD": '"lldLineTightnessTestDate"',
    "Line Tightness": '"lldLineTightnessTestDate"',
    "ATG / Probes": '"atgProbesTestDate"',
    "ATG": '"atgProbesTestDate"',
    "Probes": '"atgProbesTestDate"',
    "Sump": '"sumpTestDate"',
    "Stage 1": '"stage1TestDate"',
    "Stage": '"stage1TestDate"',
}

ALL_TEST_COLUMNS: List[Tuple[str, str, str]] = [
    ("Corrosion", '"corrosionTestStatus"', '"corrosionTestDate"'),
    ("Spill Buckets", '"spillBucketTestStatus"', '"spillBucketsTestDate"'),
    ("Overfill Protection", '"overfillProtectionDeviceTestStatus"', '"overfillProtectionDeviceTestDate"'),
    ("LLD / Line Tightness", '"lldLineTightnessTestStatus"', '"lldLineTightnessTestDate"'),
    ("ATG / Probes", '"atgProbesTestStatus"', '"atgProbesTestDate"'),
    ("Sump", '"sumpTestStatus"', '"sumpTestDate"'),
    ("Stage 1", '"stage1TestStatus"', '"stage1TestDate"'),
]


def _build_filter_clauses(
    city: Optional[str] = None,
    store_number: Optional[int] = None,
) -> Tuple[List[str], List]:
    clauses = []
    params = []
    if city:
        clauses.append('"city" ILIKE %s')
        params.append(city)
    if store_number:
        clauses.append('"storeNumber" = %s')
        params.append(store_number)
    return clauses, params


def failure_rate_sql(
    test_type: Optional[str],
    city: Optional[str] = None,
    store_number: Optional[int] = None,
) -> Tuple[str, tuple]:
    """Return status breakdown for a specific test type or all tests."""
    if not test_type:
        return overall_failure_rate_sql(city, store_number)

    col = TEST_STATUS_COLUMNS.get(test_type, '"corrosionTestStatus"')
    clauses, params = _build_filter_clauses(city, store_number)
    clauses.append(f"{col} IS NOT NULL")

    where = " WHERE " + " AND ".join(clauses)
    sql = (
        f"SELECT {col} AS status, count(*)::int AS cnt "
        f'FROM "ComplianceRecord"'
        f"{where} "
        f"GROUP BY status "
        f"ORDER BY cnt DESC"
    )
    return sql, tuple(params)


def overall_failure_rate_sql(
    city: Optional[str] = None,
    store_number: Optional[int] = None,
) -> Tuple[str, tuple]:
    """Aggregate PASS, FAIL, PENDING counts across all 7 test types."""
    unions = []
    params = []

    for _, status_col, _ in ALL_TEST_COLUMNS:
        clauses, p = _build_filter_clauses(city, store_number)
        clauses.append(f"{status_col} IS NOT NULL")
        where = " WHERE " + " AND ".join(clauses)
        unions.append(
            f"SELECT {status_col} AS status, count(*)::int AS cnt "
            f'FROM "ComplianceRecord"'
            f"{where} GROUP BY {status_col}"
        )
        params.extend(p)

    sql = (
        "SELECT status, sum(cnt)::int AS cnt FROM ("
        + " UNION ALL ".join(unions)
        + ") sub GROUP BY status ORDER BY cnt DESC"
    )
    return sql, tuple(params)


def summary_sql(
    city: Optional[str] = None,
    store_number: Optional[int] = None,
) -> Tuple[str, tuple]:
    """Comprehensive summary of pass/fail/pending counts for every test category."""
    select_parts = []
    params = []

    for test_name, status_col, _ in ALL_TEST_COLUMNS:
        clauses, p = _build_filter_clauses(city, store_number)
        where = (" WHERE " + " AND ".join(clauses)) if clauses else ""
        select_parts.append(
            f"SELECT '{test_name}' AS test, "
            f"count(*) FILTER (WHERE {status_col} IS NOT NULL)::int AS total, "
            f"count(*) FILTER (WHERE {status_col} = 'PASS')::int AS pass_count, "
            f"count(*) FILTER (WHERE {status_col} = 'FAIL')::int AS fail_count, "
            f"count(*) FILTER (WHERE {status_col} NOT IN ('PASS', 'FAIL') AND {status_col} IS NOT NULL)::int AS pending_count "
            f'FROM "ComplianceRecord"{where}'
        )
        params.extend(p)

    sql = " UNION ALL ".join(select_parts)
    return sql, tuple(params)


def status_counts_sql(
    test_type: Optional[str],
    status_filter: Optional[str],
    city: Optional[str] = None,
    store_number: Optional[int] = None,
) -> Tuple[str, tuple]:
    """Get counts grouped by status for a test type (or all tests)."""
    if not test_type:
        base_clauses, base_params = _build_filter_clauses(city, store_number)
        if status_filter:
            # Aggregate this specific status across all 7 test columns.
            # Each UNION leg gets its own independent copy of params — no shared mutation.
            unions = []
            all_params: List = []
            for _, status_col, _ in ALL_TEST_COLUMNS:
                leg_clauses = list(base_clauses) + [f"{status_col} = %s"]
                leg_params = list(base_params) + [status_filter.upper()]
                where = " WHERE " + " AND ".join(leg_clauses)
                unions.append(f'SELECT count(*)::int AS cnt FROM "ComplianceRecord"{where}')
                all_params.extend(leg_params)
            sql = (
                f"SELECT '{status_filter.upper()}' AS status, sum(cnt)::int AS cnt FROM ("
                + " UNION ALL ".join(unions)
                + ") sub"
            )
            return sql, tuple(all_params)
        return overall_failure_rate_sql(city, store_number)

    col = TEST_STATUS_COLUMNS.get(test_type, '"corrosionTestStatus"')
    clauses, params = _build_filter_clauses(city, store_number)
    clauses.append(f"{col} IS NOT NULL")
    if status_filter:
        clauses.append(f"{col} = %s")
        params.append(status_filter.upper())

    where = " WHERE " + " AND ".join(clauses)
    sql = (
        f"SELECT {col} AS status, count(*)::int AS cnt "
        f'FROM "ComplianceRecord"'
        f"{where} "
        f"GROUP BY {col} "
        f"ORDER BY cnt DESC"
    )
    return sql, tuple(params)


def list_records_sql(
    city: Optional[str] = None,
    store_number: Optional[int] = None,
    limit: int = 50,
) -> Tuple[str, tuple]:
    clauses, params = _build_filter_clauses(city, store_number)
    where = (" WHERE " + " AND ".join(clauses)) if clauses else ""

    sql = (
        'SELECT "id", "storeNumber", "city", "streetName", '
        '"corrosionTestStatus", "spillBucketTestStatus", '
        '"overfillProtectionDeviceTestStatus", "lldLineTightnessTestStatus", '
        '"atgProbesTestStatus", "sumpTestStatus", "stage1TestStatus", '
        '"deliveryCertificateExpiredDate", "insuranceExpiredDate" '
        'FROM "ComplianceRecord"'
        f"{where} "
        'ORDER BY "storeNumber" ASC, "createdAt" DESC LIMIT %s'
    )
    params.append(limit)
    return sql, tuple(params)


def expiring_soon_sql(days: int = 30) -> Tuple[str, tuple]:
    sql = (
        "SELECT 'Delivery Certificate' AS type, count(*)::int AS cnt "
        'FROM "ComplianceRecord" '
        'WHERE "deliveryCertificateExpiredDate" BETWEEN CURRENT_DATE AND CURRENT_DATE + %s::int '
        "UNION ALL "
        "SELECT 'Insurance' AS type, count(*)::int AS cnt "
        'FROM "ComplianceRecord" '
        'WHERE "insuranceExpiredDate" BETWEEN CURRENT_DATE AND CURRENT_DATE + %s::int'
    )
    return sql, (days, days)


def overdue_sql() -> Tuple[str, tuple]:
    sql = (
        "SELECT 'Delivery Certificate' AS type, count(*)::int AS cnt, "
        'MIN("deliveryCertificateExpiredDate")::text AS earliest '
        'FROM "ComplianceRecord" '
        'WHERE "deliveryCertificateExpiredDate" < CURRENT_DATE '
        "UNION ALL "
        "SELECT 'Insurance' AS type, count(*)::int AS cnt, "
        'MIN("insuranceExpiredDate")::text AS earliest '
        'FROM "ComplianceRecord" '
        'WHERE "insuranceExpiredDate" < CURRENT_DATE'
    )
    return sql, ()


def chart_data_sql(city: Optional[str] = None, store_number: Optional[int] = None) -> Tuple[str, tuple]:
    """Pass vs Fail counts across all test types."""
    return summary_sql(city, store_number)


def pass_fail_ratio_sql(test_type: Optional[str] = None) -> Tuple[str, tuple]:
    if test_type:
        col = TEST_STATUS_COLUMNS.get(test_type, '"corrosionTestStatus"')
        sql = (
            f"SELECT '{test_type}' AS test, "
            f"count(*) FILTER (WHERE {col} = 'PASS')::int AS pass_count, "
            f"count(*) FILTER (WHERE {col} = 'FAIL')::int AS fail_count "
            f'FROM "ComplianceRecord" '
            f"WHERE {col} IS NOT NULL"
        )
        return sql, ()
    return chart_data_sql()


def trend_sql(
    test_type: Optional[str] = None,
    city: Optional[str] = None,
    store_number: Optional[int] = None,
) -> Tuple[str, tuple]:
    """Group pass/fail counts by month period."""
    if test_type:
        status_col = TEST_STATUS_COLUMNS.get(test_type, '"corrosionTestStatus"')
        date_col = TEST_DATE_COLUMNS.get(test_type, '"corrosionTestDate"')
        clauses, params = _build_filter_clauses(city, store_number)
        clauses.append(f"{status_col} IS NOT NULL")
        clauses.append(f"{date_col} IS NOT NULL")
        where = " WHERE " + " AND ".join(clauses)

        sql = (
            f"SELECT to_char({date_col}, 'YYYY-MM') AS period, "
            f"count(*) FILTER (WHERE {status_col} = 'PASS')::int AS pass_count, "
            f"count(*) FILTER (WHERE {status_col} = 'FAIL')::int AS fail_count "
            f'FROM "ComplianceRecord"'
            f"{where} "
            f"GROUP BY period "
            f"ORDER BY period ASC"
        )
        return sql, tuple(params)
    else:
        # Aggregate all tests grouped by month
        unions = []
        params = []
        for _, status_col, date_col in ALL_TEST_COLUMNS:
            clauses, p = _build_filter_clauses(city, store_number)
            clauses.append(f"{status_col} IS NOT NULL")
            clauses.append(f"{date_col} IS NOT NULL")
            where = " WHERE " + " AND ".join(clauses)
            unions.append(
                f"SELECT to_char({date_col}, 'YYYY-MM') AS period, "
                f"count(*) FILTER (WHERE {status_col} = 'PASS')::int AS pass_count, "
                f"count(*) FILTER (WHERE {status_col} = 'FAIL')::int AS fail_count "
                f'FROM "ComplianceRecord"{where} '
                f"GROUP BY period"
            )
            params.extend(p)

        sql = (
            "SELECT period, "
            "sum(pass_count)::int AS pass_count, "
            "sum(fail_count)::int AS fail_count "
            "FROM (" + " UNION ALL ".join(unions) + ") sub "
            "GROUP BY period "
            "ORDER BY period ASC"
        )
        return sql, tuple(params)


def scatter_data_sql(
    test_type_a: str,
    test_type_b: str,
    city: Optional[str] = None,
    store_number: Optional[int] = None,
) -> Tuple[str, tuple]:
    col_a = TEST_STATUS_COLUMNS.get(test_type_a, '"corrosionTestStatus"')
    col_b = TEST_STATUS_COLUMNS.get(test_type_b, '"spillBucketTestStatus"')
    clauses, params = _build_filter_clauses(city, store_number)
    clauses.append(f"{col_a} IS NOT NULL")
    clauses.append(f"{col_b} IS NOT NULL")
    where = " WHERE " + " AND ".join(clauses)

    sql = (
        f"SELECT {col_a} AS test_a, {col_b} AS test_b, "
        f'"storeNumber", "city" '
        f'FROM "ComplianceRecord"'
        f"{where} "
        f'ORDER BY "storeNumber" ASC'
    )
    return sql, tuple(params)


def comparison_sql(
    test_type_a: str,
    test_type_b: str,
    city: Optional[str] = None,
    store_number: Optional[int] = None,
) -> Tuple[str, tuple]:
    col_a = TEST_STATUS_COLUMNS.get(test_type_a, '"corrosionTestStatus"')
    col_b = TEST_STATUS_COLUMNS.get(test_type_b, '"spillBucketTestStatus"')

    clauses_a, params_a = _build_filter_clauses(city, store_number)
    where_a = (" WHERE " + " AND ".join(clauses_a)) if clauses_a else ""

    clauses_b, params_b = _build_filter_clauses(city, store_number)
    where_b = (" WHERE " + " AND ".join(clauses_b)) if clauses_b else ""

    sql = (
        f"SELECT '{test_type_a}' AS test, "
        f"count(*) FILTER (WHERE {col_a} = 'PASS')::int AS pass_count, "
        f"count(*) FILTER (WHERE {col_a} = 'FAIL')::int AS fail_count, "
        f"count(*) FILTER (WHERE {col_a} IS NOT NULL)::int AS total "
        f'FROM "ComplianceRecord"{where_a} '
        f"UNION ALL "
        f"SELECT '{test_type_b}' AS test, "
        f"count(*) FILTER (WHERE {col_b} = 'PASS')::int AS pass_count, "
        f"count(*) FILTER (WHERE {col_b} = 'FAIL')::int AS fail_count, "
        f"count(*) FILTER (WHERE {col_b} IS NOT NULL)::int AS total "
        f'FROM "ComplianceRecord"{where_b}'
    )
    return sql, tuple(params_a + params_b)


def histogram_sql(
    test_type: Optional[str] = None,
    city: Optional[str] = None,
    store_number: Optional[int] = None,
) -> Tuple[str, tuple]:
    """Distribution of failure counts across stores."""
    clauses, params = _build_filter_clauses(city, store_number)
    where = (" WHERE " + " AND ".join(clauses)) if clauses else ""

    if test_type:
        col = TEST_STATUS_COLUMNS.get(test_type, '"corrosionTestStatus"')
        c = list(clauses)
        c.append(f"{col} IS NOT NULL")
        w = " WHERE " + " AND ".join(c)
        sql = (
            f"SELECT {col} AS label, count(*)::int AS cnt "
            f'FROM "ComplianceRecord"{w} '
            f"GROUP BY {col} ORDER BY cnt DESC"
        )
        return sql, tuple(params)

    # Count how many total failed tests each store has (0 failures, 1 failure, 2 failures, ...)
    fail_exprs = " + ".join(
        f"CASE WHEN {sc} = 'FAIL' THEN 1 ELSE 0 END"
        for _, sc, _ in ALL_TEST_COLUMNS
    )
    sql = (
        f"SELECT (fail_count || ' failures') AS label, count(*)::int AS cnt FROM ("
        f"SELECT ({fail_exprs}) AS fail_count "
        f'FROM "ComplianceRecord"{where}'
        f") sub GROUP BY fail_count ORDER BY fail_count ASC"
    )
    return sql, tuple(params)
