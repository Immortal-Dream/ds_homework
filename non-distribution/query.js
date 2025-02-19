#!/usr/bin/env node

/*
Search the inverted index for a particular (set of) terms.
Usage: ./query.js your search terms

The behavior of this JavaScript file should be similar to the following shell pipeline:
grep "$(echo "$@" | ./c/process.sh | ./c/stem.js | tr "\r\n" "  ")" d/global-index.txt

Here is one idea on how to develop it:
1. Read the command-line arguments using `process.argv`. A user can provide any string to search for.
2. Normalize, remove stopwords from and stem the query string — use already developed components
3. Search the global index using the processed query string.
4. Print the matching lines from the global index file.

Examples:
./query.js A     # Search for "A" in the global index. This should return all lines that contain "A" as part of an 1-gram, 2-gram, or 3-gram.
./query.js A B   # Search for "A B" in the global index. This should return all lines that contain "A B" as part of a 2-gram, or 3-gram.
./query.js A B C # Search for "A B C" in the global index. This should return all lines that contain "A B C" as part of a 3-gram.

Note: Since you will be removing stopwords from the search query, you will not find any matches for words in the stopwords list.

The simplest way to use existing components is to call them using execSync.
For example, `execSync(`echo "${input}" | ./c/process.sh`, {encoding: 'utf-8'});`
*/


const fs = require('fs');
const {execSync} = require('child_process');
// const path = require('path');


// Helper: Run the text through process.sh and stem.js pipelines
function runNormalizationPipeline(userInput) {
  try {
    const output = execSync(`echo "${userInput}" | ./c/process.sh | ./c/stem.js`, {
      encoding: 'utf-8',
    }).trim();
    return output;
  } catch (error) {
    console.error('Error processing query:', error.message);
    process.exit(1);
  }
}

// Helper: Read the global index file contents
function readIndexFileContents(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error('Error reading the global index file:', error.message);
    process.exit(1);
  }
}

// Helper: Find lines in the global index that include the processed query string
function filterIndexLines(inputLines, pattern) {
  return inputLines.filter((line) => line.includes(pattern));
}

// Helper: Print the matching lines or a no-match message
function printMatches(originalInput, results) {
  if (results.length > 0) {
    results.forEach((line) => console.log(line));
  } else {
    console.log(`No matches found for query: "${originalInput}"`);
  }
}

function query(indexFile, args) {
  // 1. Combine user arguments into one string
  const combinedInput = args.join(' ');

  // 2. Normalize the text (remove stopwords, stem it, etc.)
  const normalizedQuery = runNormalizationPipeline(combinedInput);
  if (!normalizedQuery) {
    console.error('The query resulted in no valid terms after processing.');
    process.exit(1);
  }

  // 3. Turn multiline output into a single space-separated pattern
  const pattern = normalizedQuery.replace(/\r?\n/g, ' ');

  // 4. Read and split the global index file
  const fileContents = readIndexFileContents(indexFile);
  const fileLines = fileContents.split('\n');

  // 5. Filter lines that contain the processed pattern
  const matchedResults = filterIndexLines(fileLines, pattern);

  // 6. Print the matching lines (or note if no matches)
  printMatches(combinedInput, matchedResults);
}

const args = process.argv.slice(2); // Get command-line arguments
if (args.length < 1) {
  console.error('Usage: ./query.js [query_strings...]');
  process.exit(1);
}

const indexFile = 'd/global-index.txt'; // Path to the global index file
query(indexFile, args);
