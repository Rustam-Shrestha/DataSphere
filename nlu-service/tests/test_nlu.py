"""
Unit and integration tests for NLU intent classification, entity extraction, and templates.
Includes typo tolerance, synonym expansion, and informal phrasing tests.
"""

from app.nlu import intents, entities, templates


def test_intent_classification():
    assert intents.classify("What is the failure rate for Corrosion tests?") == "FAILURE_RATE"
    assert intents.classify("overall failure rate across all tests") in ("FAILURE_RATE", "SUMMARY")
    assert intents.classify("How many spill buckets passed?") == "STATUS_COUNTS"
    assert intents.classify("Show me a pie chart of pass/fail for Spill Buckets") == "CHART_DATA"
    assert intents.classify("Plot a line chart of test trends over time") == "CHART_DATA"
    assert intents.classify("Compare corrosion vs spill buckets") == "CHART_DATA"
    assert intents.classify("Scatter plot ATG vs Stage 1") == "CHART_DATA"
    assert intents.classify("Histogram of store failures") == "CHART_DATA"
    assert intents.classify("Show me records for store #38") == "LIST_RECORDS"
    assert intents.classify("What certificates are expiring in 60 days?") == "EXPIRING_SOON"
    assert intents.classify("What items are overdue?") == "OVERDUE"
    assert intents.classify("Summary of all compliance tests") == "SUMMARY"


def test_typo_tolerance_intents():
    """Test that misspellings and informal phrasing still map to the right intent."""
    # Typo: "corrision" → corrosion → FAILURE_RATE
    assert intents.classify("corrision failure rate") == "FAILURE_RATE"
    # Informal: "how much failure" → FAILURE_RATE
    assert intents.classify("how much failure is there overall") in ("FAILURE_RATE", "STATUS_COUNTS")
    # Informal: "what overdue" → OVERDUE
    assert intents.classify("what overdue") == "OVERDUE"
    # Typo in chart word: "chrt" won't match but "grph of" should hit CHART_DATA
    assert intents.classify("show a bar graph of spill bucket results") == "CHART_DATA"
    # Informal list: "store 38 records" → LIST_RECORDS
    assert intents.classify("store 38 records") == "LIST_RECORDS"
    # Synonym: "running out" → EXPIRING_SOON
    assert intents.classify("what certificates are running out soon") == "EXPIRING_SOON"
    # Synonym: "near expiry" → EXPIRING_SOON
    assert intents.classify("insurance near expiry") == "EXPIRING_SOON"
    # Synonym: "lapsed" → OVERDUE
    assert intents.classify("which certifications have lapsed") == "OVERDUE"
    # Informal: "give me all records" → LIST_RECORDS
    assert intents.classify("give me all records") == "LIST_RECORDS"
    # Informal: "tell me records for store 10" → LIST_RECORDS
    assert intents.classify("tell me records for store 10") == "LIST_RECORDS"
    # Broken/not passing → leans toward FAILURE_RATE or STATUS_COUNTS
    result = intents.classify("how many tests are broken or not passing")
    assert result in ("FAILURE_RATE", "STATUS_COUNTS")


def test_typo_tolerance_test_types():
    """Test that misspelled test names are still resolved to canonical types."""
    # Corrosion typos
    assert intents.extract_test_type("corrision failure rate") == "Corrosion"
    assert intents.extract_test_type("corosion test status") == "Corrosion"
    # Spill Buckets typos
    assert intents.extract_test_type("spil bucket chart") == "Spill Buckets"
    assert intents.extract_test_type("spill buckt test") == "Spill Buckets"
    # ATG / Probes typos
    assert intents.extract_test_type("atg probbe status") == "ATG / Probes"
    assert intents.extract_test_type("atg probs results") == "ATG / Probes"
    # Overfill typo
    assert intents.extract_test_type("overfil protection status") == "Overfill Protection Device"
    # LLD typo
    assert intents.extract_test_type("ldd line tightness") == "LLD / Line Tightness"


def test_test_type_abbreviations():
    assert intents.extract_test_type("what is failure rate for atg probes?") == "ATG / Probes"
    assert intents.extract_test_type("how many atg failed?") == "ATG / Probes"
    assert intents.extract_test_type("check lld line tightness") == "LLD / Line Tightness"
    assert intents.extract_test_type("check lld results") == "LLD / Line Tightness"
    assert intents.extract_test_type("overfill status") == "Overfill Protection Device"
    assert intents.extract_test_type("spill buckets status") == "Spill Buckets"
    assert intents.extract_test_type("sump test status") == "Sump"
    assert intents.extract_test_type("corrosion tests") == "Corrosion"


def test_chart_type_extraction():
    assert intents.extract_chart_type("show me a pie chart") == "pie"
    assert intents.extract_chart_type("make a doughnut chart") == "doughnut"
    assert intents.extract_chart_type("draw a bar graph") == "bar"
    assert intents.extract_chart_type("plot a line chart") == "line"
    assert intents.extract_chart_type("scatter plot of tests") == "scatter"
    assert intents.extract_chart_type("radar chart") == "radar"


def test_entities_extraction():
    assert entities.extract_n_days("what expires in 60 days?") == 60
    assert entities.extract_n_days("what expires in 3 weeks?") == 21
    assert entities.extract_n_days("expiring soon") == 30

    known_cities = ["Dallas", "Houston", "Austin", "San Antonio"]
    assert entities.extract_city("failure rate in Dallas for corrosion", known_cities) == "Dallas"
    assert entities.extract_city("show records in houston city", known_cities) == "Houston"
    assert entities.extract_city("what is the overall failure rate?", known_cities) is None


def test_templates_sql_validity():
    sql, params = templates.failure_rate_sql("Corrosion", "Dallas", 10)
    assert "corrosionTestStatus" in sql
    assert len(params) == 2

    sql, params = templates.overall_failure_rate_sql()
    assert "UNION ALL" in sql
    assert "cnt" in sql

    sql, params = templates.summary_sql()
    assert "Corrosion" in sql
    assert "Spill Buckets" in sql

    sql, params = templates.trend_sql("Corrosion")
    assert "ORDER BY period ASC" in sql

    sql, params = templates.trend_sql(None)
    assert "ORDER BY period ASC" in sql

    sql, params = templates.histogram_sql()
    assert "fail_count" in sql

    sql, params = templates.scatter_data_sql("Corrosion", "ATG / Probes")
    assert "corrosionTestStatus" in sql
    assert "atgProbesTestStatus" in sql


if __name__ == "__main__":
    test_intent_classification()
    test_typo_tolerance_intents()
    test_typo_tolerance_test_types()
    test_test_type_abbreviations()
    test_chart_type_extraction()
    test_entities_extraction()
    test_templates_sql_validity()
    print("ALL NLU UNIT TESTS PASSED SUCCESSFULLY!")


