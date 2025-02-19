#!/usr/bin/env node

/*
Merge the current inverted index (assuming the right structure) with the global index file
Usage: cat input | ./merge.js global-index > output

The inverted indices have the different structures!

Each line of a local index is formatted as:
  - `<word/ngram> | <frequency> | <url>`

Each line of a global index is formatted as:
  - `<word/ngram> | <url_1> <frequency_1> <url_2> <frequency_2> ... <url_n> <frequency_n>`
  - Where pairs of `url` and `frequency` are in descending order of frequency
  - Everything after `|` is space-separated

-------------------------------------------------------------------------------------
Example:

local index:
  word1 word2 | 8 | url1
  word3 | 1 | url9
EXISTING global index:
  word1 word2 | url4 2
  word3 | url3 2

merge into the NEW global index:
  word1 word2 | url1 8 url4 2
  word3 | url3 2 url9 1

Remember to error gracefully, particularly when reading the global index file.
*/

const fs = require('fs');
const readline = require('readline');
// const path = require('path');
// The `compare` function can be used for sorting.
const compare = (a, b) => {
  if (a.freq > b.freq) {
    return -1;
  } else if (a.freq < b.freq) {
    return 1;
  } else {
    return 0;
  }
};
const rl = readline.createInterface({
  input: process.stdin,
});

// 1. Read the incoming local index data from standard input (stdin) line by line.
let localIndex = '';
rl.on('line', (line) => {
  localIndex += line + '\n';
});

rl.on('close', () => {
  // 2. Read the global index name/location, using process.argv
  // and call printMerged as a callback
  const globalIndexPath = process.argv[2];
  if (!globalIndexPath) {
    console.error('Error: No global index file specified. Usage: cat localIndex | ./merge.js globalIndex > newIndex');
    process.exit(1);
  }

  fs.readFile(globalIndexPath, 'utf8', (err, data) => {
    printMerged(err, data);
  });
});

const printMerged = (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Split the data into an array of lines
  const localIndexLines = localIndex.split('\n');
  const globalIndexLines = data.split('\n');

  // Remove any trailing empty line if present
  if (localIndexLines.length && !localIndexLines[localIndexLines.length - 1].trim()) {
    localIndexLines.pop();
  }
  if (globalIndexLines.length && !globalIndexLines[globalIndexLines.length - 1].trim()) {
    globalIndexLines.pop();
  }

  const local = {};
  const global = {};

  // 3. For each line in `localIndexLines`, parse them and add them to the `local` object where keys are terms and values contain `url` and `freq`.
  for (const line of localIndexLines) {
    const parts = line.split('|').map((part) => part.trim());
    // We expect exactly 3 parts: [term, frequency, url]
    if (parts.length !== 3) return; // skip malformed lines silently or log an error

    const term = parts[0]; // e.g., "word1 word2"
    const freqStr = parts[1]; // e.g., "8"
    const url = parts[2]; // e.g., "url1"

    const freq = parseInt(freqStr, 10) || 0; // parse frequency

    // Initialize array if first time we see this term
    if (!local[term]) {
      local[term] = [];
    }

    // Push the { url, freq } object
    local[term] = {url, freq};
  }

  // 4. For each line in `globalIndexLines`, parse them and add them to the `global` object where keys are terms and values are arrays of `url` and `freq` objects.
  // Use the .trim() method to remove leading and trailing whitespace from a string.
  for (const line of globalIndexLines) {
    const parts = line.split('|').map((part) => part.trim());
    // We expect at least 2 parts: [term, "url_1 freq_1 url_2 freq_2 ..."]
    if (parts.length < 2) return; // skip malformed lines or log an error

    const term = parts[0];
    const urlFreqString = parts[1];
    const tokens = urlFreqString.split(/\s+/); // e.g., ["url4", "2", "url5", "5", ...]

    // We parse the tokens in pairs: (url, freq)
    const urlfs = [];
    for (let i = 0; i < tokens.length; i += 2) {
      const u = tokens[i];
      const f = parseInt(tokens[i + 1], 10) || 0;
      if (!u) continue; // skip if there's some parsing error
      urlfs.push({url: u, freq: f});
    }
    global[term] = urlfs; // Array of {url, freq} objects
  }

  // 5. Merge the local index into the global index:
  // - For each term in the local index, if the term exists in the global index:
  //     - Append the local index entry to the array of entries in the global index.
  //     - Sort the array by `freq` in descending order.
  // - If the term does not exist in the global index:
  //     - Add it as a new entry with the local index's data.
  Object.keys(local).forEach((term) => {
    // If the term doesn't exist in global index, create it
    if (!global[term]) {
      global[term] = [];
    }

    // Append local entries to the existing array
    const localEntries = local[term];
    global[term] = global[term].concat(localEntries);

    // Sort by descending frequency
    global[term].sort(compare);
  });
  // 6. Print the merged index to the console in the same format as the global index file:
  //    - Each line contains a term, followed by a pipe (`|`), followed by space-separated pairs of `url` and `freq`.
  Object.keys(global).forEach((term) => {
    // Build the right-hand side: "url_1 freq_1 url_2 freq_2 ..."
    const pairs = global[term].map((entry) => `${entry.url} ${entry.freq}`).join(' ');
    console.log(`${term} | ${pairs}`);
  });
};
