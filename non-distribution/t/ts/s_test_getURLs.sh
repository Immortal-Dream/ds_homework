#!/bin/bash
# This is a student test

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/..$R_FOLDER" || exit 1


FAIL_COUNT=0

# Helper function to test a scenario
run_test_scenario() {
  local scenario_name="$1"
  local base_url="$2"
  local html_input="$3"
  shift 3  # shift past those three
  local expected_urls=("$@")

  echo "Running scenario: $scenario_name"
  
  # Execute getURLs.js, feeding in our HTML input
  local output
  output=$(echo "$html_input" | c/getURLs.js "$base_url")

  # Print the raw output for debugging
  echo "Output:"
  echo "$output"
  echo

  # Check that each expected URL is present in the output
  for url_snippet in "${expected_urls[@]}"; do
    if ! grep -q "$url_snippet" <<< "$output"; then
      echo "ERROR: Missing expected URL '$url_snippet' in scenario '$scenario_name'"
      ((FAIL_COUNT++))
    else
      echo "FOUND: '$url_snippet' ✓"
    fi
  done

  echo "---------------------------"
  echo
}

# Scenario 1: Simple absolute URL
SCENARIO_1_HTML='<html><body>
  <a href="http://example.com/page.html">Example Link</a>
</body></html>'
SCENARIO_1_EXPECTED=("http://example.com/page.html")

run_test_scenario \
  "Scenario 1: Single absolute link" \
  "https://test-base-url.com/anypath/" \
  "$SCENARIO_1_HTML" \
  "${SCENARIO_1_EXPECTED[@]}"

# Scenario 2: Relative links
SCENARIO_2_HTML='<html><body>
  <a href="about.html">About Page</a>
  <a href="../docs/index.html">Docs Page</a>
  <a href="/absolute/path">Absolute Path from Root</a>
</body></html>'
SCENARIO_2_EXPECTED=(
  "https://test-base.com/test/about.html"
  "https://test-base.com/docs/index.html"
  "https://test-base.com/absolute/path"
)

run_test_scenario \
  "Scenario 2: Relative links" \
  "https://test-base.com/test/index.html" \
  "$SCENARIO_2_HTML" \
  "${SCENARIO_2_EXPECTED[@]}"

# Scenario 3: Multiple anchor tags + query params
SCENARIO_3_HTML='<html><body>
  <a href="/api?token=abc123">API Link</a>
  <a href="login.php?user=admin&ref=1">Login Link</a>
</body></html>'
SCENARIO_3_EXPECTED=(
  "https://mysite.org/api?token=abc123"
  "https://mysite.org/login.php?user=admin&ref=1"
)

run_test_scenario \
  "Scenario 3: Query parameters" \
  "https://mysite.org/index.html" \
  "$SCENARIO_3_HTML" \
  "${SCENARIO_3_EXPECTED[@]}"


# Final Status
if [[ $FAIL_COUNT -eq 0 ]]; then
  echo "test-getURLs-alt.sh success: All scenarios passed."
  exit 0
else
  echo "test-getURLs-alt.sh failure: $FAIL_COUNT issue(s) found."
  exit 1
fi