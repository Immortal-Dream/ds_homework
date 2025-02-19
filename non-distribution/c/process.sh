#!/bin/bash

# Convert input to a stream of non-stopword terms
# Usage: ./process.sh < input > output

# Convert each line to one word per line, **remove non-letter characters**, make lowercase, convert to ASCII; then remove stopwords (inside d/stopwords.txt)
# Commands that will be useful: tr, iconv, grep

STOPWORDS_FILE="./d/stopwords.txt"

# Ensure the stopwords file exists
if [ ! -f "$STOPWORDS_FILE" ]; then
  echo "Error: The specified stopwords file '$STOPWORDS_FILE' cannot be found."
  exit 1
fi

# Process the input
tr -c '[:alpha:]' ' ' |  
tr -s ' ' '\n' |   
tr '[:upper:]' '[:lower:]' |              
iconv -c -t ASCII//TRANSLIT |                                             
grep -vFx -f "$STOPWORDS_FILE" | 
grep -v '^$'