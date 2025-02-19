#!/bin/bash
# This is a student test

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}
cd "$(dirname "$0")/..$R_FOLDER" || exit 1

FAIL_COUNT=0

# Scenario 1: Basic HTML

HTML_INPUT_1="<html><body><h1>Hello World!</h1><p>This is a test.</p></body></html>"
EXPECTED_1=("Hello World!" "This is a test.")

OUTPUT_1="$(echo "$HTML_INPUT_1" | c/getText.js)"

echo "Scenario 1 Output:"
echo "$OUTPUT_1"
echo

# Check if each piece of expected text is present
for snippet in "${EXPECTED_1[@]}"; do
  if grep -q "$snippet" <<<"$OUTPUT_1"; then
    echo "Scenario 1: Found \"$snippet\" ✓"
  else
    echo "Scenario 1: Missing \"$snippet\" ✗"
    ((FAIL_COUNT++))
  fi
done

# Scenario 2: Complex HTML with tags

HTML_INPUT_2="<html><head><title>My Page</title></head><body>\
<ul><li>Item A</li><li>Item B</li></ul>\
<footer>Contact: <a href='mailto:test@example.com'>test@example.com</a></footer>\
</body></html>"

# We expect the text extraction to contain these items. The exact formatting (newlines/spaces)
# may vary, so we just look for key fragments.
EXPECTED_2=("Item A" "Item B" "Contact: test@example.com")

OUTPUT_2="$(echo "$HTML_INPUT_2" | c/getText.js)"

echo "Scenario 2 Output:"
echo "$OUTPUT_2"
echo

for snippet in "${EXPECTED_2[@]}"; do
  if grep -q "$snippet" <<<"$OUTPUT_2"; then
    echo "Scenario 2: Found \"$snippet\" ✓"
  else
    echo "Scenario 2: Missing \"$snippet\" ✗"
    ((FAIL_COUNT++))
  fi
done

# Scenario 3: Multi-line + wordwrap check

# We'll input a paragraph that's long enough to wrap at wordwrap=140 if you want to test that feature.
# We'll see if certain words are present after the transform.
HTML_INPUT_3="<html><body><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. \
Sed id ipsum ac erat luctus consequat. Nullam nec hendrerit ante, nec volutpat quam.</p></body></html>"

EXPECTED_3=("Lorem ipsum dolor sit amet" "consectetur adipiscing elit" "Nullam nec hendrerit ante")

OUTPUT_3="$(echo "$HTML_INPUT_3" | c/getText.js)"

echo "Scenario 3 Output:"
echo "$OUTPUT_3"
echo

for snippet in "${EXPECTED_3[@]}"; do
  if grep -q "$snippet" <<<"$OUTPUT_3"; then
    echo "Scenario 3: Found \"$snippet\" ✓"
  else
    echo "Scenario 3: Missing \"$snippet\" ✗"
    ((FAIL_COUNT++))
  fi
done

# Final Status

if [ "$FAIL_COUNT" -eq 0 ]; then
  echo "test-getText-alt.sh success: all scenarios passed."
  exit 0
else
  echo "test-getText-alt.sh failure: $FAIL_COUNT test(s) failed."
  exit 1
fi