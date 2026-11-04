"""
Unit and integration tests for NLU intent classification, entity extraction,
chart suppression for scalar queries, summarizer calculations, and typo tolerance.
"""

from app.nlu import intents, entities, templates, summarizer


def test_intent_classification():
    assert intents.classify("What is the failure rate for Corrosion tests?") == "FAILURE_RATE"
    assert intents.classify("overall failure rate across all tests") in ("FAILURE_RATE", "SUMMARY")
    assert intents.classify("How many spill buckets passed?") == "STATUS_COUNTS"
    assert intents.classify("how many failure is in spill bucket test") == "STATUS_COUNTS"
    assert intents.classify("how many tests have neither pass nor fail") == "STATUS_COUNTS"
    assert intents.classify("Show me a pie chart of pass/fail for Spill Buckets") == "CHART_DATA"
    assert intents.classify("Plot a line chart of test trends over time") == "CHART_DATA"
    assert intents.classify("Compare corrosion vs spill buckets") == "CHART_DATA"
    assert intents.classify("Scatter plot ATG vs Stage 1") == "CHART_DATA"
    assert intents.classify("Histogram of store failures") == "CHART_DATA"
    assert intents.classify("Show me records for store #38") == "LIST_RECORDS"
    assert intents.classify("What certificates are expiring in 60 days?") == "EXPIRING_SOON"
    assert intents.classify("What items are overdue?") == "OVERDUE"
    assert intents.classify("Summary of all compliance tests") == "SUMMARY"


def test_chart_intent_and_suppression():
    """Verify wants_chart only triggers when visual representations are explicitly requested."""
    assert not intents.wants_chart("how many failures in spill bucket test")
    assert not intents.wants_chart("what is the failure rate for corrosion")
    assert not intents.wants_chart("show records for store 38")
    assert not intents.wants_chart("how many tests passed")

    # Explicit visual requests
    assert intents.wants_chart("show me a pie chart of spill bucket")
    assert intents.wants_chart("give me a bar graph")
    assert intents.wants_chart("plot trend over time")
    assert intents.wants_chart("histogram of store failures")
    assert intents.wants_chart("visualize failure rate")


def test_typo_tolerance_intents():
    """Test that misspellings and informal phrasing still map to the right intent."""
    assert intents.classify("corrision failure rate") == "FAILURE_RATE"
    assert intents.classify("what overdue") == "OVERDUE"
    assert intents.classify("show a bar graph of spill bucket results") == "CHART_DATA"
    assert intents.classify("store 38 records") == "LIST_RECORDS"
    assert intents.classify("what certificates are running out soon") == "EXPIRING_SOON"
    assert intents.classify("insurance near expiry") == "EXPIRING_SOON"
    assert intents.classify("which certifications have lapsed") == "OVERDUE"
    assert intents.classify("give me all records") == "LIST_RECORDS"


def test_typo_tolerance_test_types():
    """Test that misspelled test names are still resolved to canonical types."""
    assert intents.extract_test_type("corrision failure rate") == "Corrosion"
    assert intents.extract_test_type("corosion test status") == "Corrosion"
    assert intents.extract_test_type("spil bucket chart") == "Spill Buckets"
    assert intents.extract_test_type("spill buckt test") == "Spill Buckets"
    assert intents.extract_test_type("atg probbe status") == "ATG / Probes"
    assert intents.extract_test_type("atg probs results") == "ATG / Probes"
    assert intents.extract_test_type("overfil protection status") == "Overfill Protection Device"
    assert intents.extract_test_type("ldd line tightness") == "LLD / Line Tightness"


def test_chart_type_extraction_with_typos():
    assert intents.extract_chart_type("show me a pie chart") == "pie"
    assert intents.extract_chart_type("give me a pi chart") == "pie"
    assert intents.extract_chart_type("make a py chart") == "pie"
    assert intents.extract_chart_type("draw a barchart") == "bar"
    assert intents.extract_chart_type("plot a linee graph") == "line"
    assert intents.extract_chart_type("scatter plot of tests") == "scatter"
    assert intents.extract_chart_type("radar chart") == "radar"


def test_summarizer_custom_statuses_and_rates():
    """Verify that failure and pass rate math correctly evaluates valid tests without distorting denominator."""
    rows = [
        {"status": "PASS", "cnt": 80},
        {"status": "FAIL", "cnt": 20},
        {"status": "PENDING", "cnt": 10},
        {"status": "N/A", "cnt": 5},
    ]

    answer = summarizer.build_text_answer(
        intent="FAILURE_RATE",
        rows=rows,
        test_type="Spill Buckets",
        has_chart=False,
    )
    # Evaluated = 80 + 20 = 100. Fail rate = 20.0%, Pass rate = 80.0%
    assert "20.0%" in answer
    assert "80.0%" in answer
    assert "80 passed" in answer
    assert "20 failed" in answer
    assert "**10** pending" in answer
    assert "other statuses" in answer

    # Test status count for scalar request
    scalar_answer = summarizer.build_text_answer(
        intent="STATUS_COUNTS",
        rows=rows,
        test_type="Spill Buckets",
        status_filter="FAIL",
        has_chart=False,
    )
    assert "**20** FAIL" in scalar_answer


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

    sql, params = templates.histogram_sql()
    assert "fail_count" in sql

    sql, params = templates.scatter_data_sql("Corrosion", "ATG / Probes")
    assert "corrosionTestStatus" in sql
    assert "atgProbesTestStatus" in sql


if __name__ == "__main__":
    test_intent_classification()
    test_chart_intent_and_suppression()
    test_typo_tolerance_intents()
    test_typo_tolerance_test_types()
    test_chart_type_extraction_with_typos()
    test_summarizer_custom_statuses_and_rates()
    test_entities_extraction()
    test_templates_sql_validity()
    print("ALL NLU UNIT AND INTEGRATION TESTS PASSED SUCCESSFULLY!")
