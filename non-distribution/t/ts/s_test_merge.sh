#!/bin/bash
# This is a student test

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/..$R_FOLDER" || exit 1

# We’ll store our temporary global index in this file.
GLOBAL_INDEX_TEMP="d/global-index-alt.txt"
rm -f "$GLOBAL_INDEX_TEMP"
touch "$GLOBAL_INDEX_TEMP"

FAIL_COUNT=0

# Helper: Merge given local data inline
merge_inline() {
  local localData="$1"
  echo "$localData" | c/merge.js "$GLOBAL_INDEX_TEMP" > "${GLOBAL_INDEX_TEMP}.new"
  mv "${GLOBAL_INDEX_TEMP}.new" "$GLOBAL_INDEX_TEMP"
}

# Helper: check term’s line in global index
# Usage: check_line term expectedLine
check_line() {
  local term="$1"
  local expected="$2"
  # Grab the line from $GLOBAL_INDEX_TEMP for the given term, ignoring variations in whitespace
  local line
  line=$(grep "^${term}[[:space:]]*|" "$GLOBAL_INDEX_TEMP" || true)

  if [[ -z "$line" ]]; then
    echo "ERROR: Term '$term' not found in global index"
    ((FAIL_COUNT++))
    return
  fi

  # Check if the line matches the expected text
  # (We can do a direct string comparison or a substring check)
  if [[ "$line" == *"$expected"* ]]; then
    echo "OK: Found expected content for '$term': $expected"
  else
    echo "ERROR: Mismatch for term '$term'. Expected something containing '$expected', got: $line"
    ((FAIL_COUNT++))
  fi
}

# Scenario 1: Merge a simple local index
LOCAL_INDEX_1=$(
  cat <<EOF
word1 word2 | 8 | url1
word3 | 1 | url9
EOF
)

merge_inline "$LOCAL_INDEX_1"

# Check that the global index has:
#  - "word1 word2 | url1 8"
#  - "word3 | url9 1"
echo "Scenario 1: Checking merges..."
check_line "word1 word2" "url1 8"
check_line "word3" "url9 1"

echo "---------------------------------"
echo

# Scenario 2: Merge another local index with overlapping terms
LOCAL_INDEX_2=$(
  cat <<EOF
word1 word2 | 2 | url2
word4 | 10 | url3
EOF
)

merge_inline "$LOCAL_INDEX_2"

# Now "word1 word2" should contain both url1 (freq 8) and url2 (freq 2), sorted by freq desc
# "word4" should appear with url3 freq=10
echo "Scenario 2: Checking merges..."
check_line "word1 word2" "url1 8 url2 2"
check_line "word4" "url3 10"

echo "---------------------------------"
echo

# Scenario 3: Merge an invalid or malformed line and see if it’s handled gracefully
LOCAL_INDEX_3=$(
  cat <<EOF
wordX wordY | 5
malformed line with no pipe
EOF
)
# The script as written might skip lines with fewer than 3 parts quietly.
merge_inline "$LOCAL_INDEX_3"

# Check that no 'wordX wordY' or 'malformed' lines were added
# because they're malformed. We'll just check that 'wordX wordY'
# doesn't appear at all. If it appears, that's an error.
echo "Scenario 3: Checking merges with malformed lines..."
if grep -q "^wordX wordY" "$GLOBAL_INDEX_TEMP"; then
  echo "ERROR: Malformed line was incorrectly merged!"
  ((FAIL_COUNT++))
else
  echo "OK: Malformed line was skipped, as expected."
fi

echo "---------------------------------"
echo

# Final outcome
if [[ $FAIL_COUNT -eq 0 ]]; then
  echo "test-merge-alt.sh success: All scenarios passed!"
  exit 0
else
  echo "test-merge-alt.sh failure: $FAIL_COUNT issue(s) found."
  exit 1
fi