#!/bin/bash
# This is a student test


T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}

# Create test input (d9.txt) and expected output (d10.txt) files
# Designed to validate stem.js stemming functionality comprehensively
if $DIFF <(cat "$T_FOLDER"/d/d9.txt | c/stem.js | sort) <(sort "$T_FOLDER"/d/d10.txt) >&2;
then
    echo "$0 success: stemmed words are identical"
    exit 0
else
    echo "$0 failure: stemmed words are not identical"
    exit 1
fi
