#!/usr/bin/env node

/*
Extract all URLs from a web page.
Usage: ./getURLs.js <base_url>
*/

const readline = require('readline');
const {JSDOM} = require('jsdom');
const {URL} = require('url');

// 1. Read the base URL from the command-line argument using `process.argv`.
let baseURL = process.argv[2];

// If baseURL ends with 'index.html', remove it
if (baseURL.endsWith('index.html')) {
  baseURL = baseURL.slice(0, baseURL.length - 'index.html'.length);
}

// If baseURL does not end with '/', add a '/' for correct URL resolution
if (!baseURL.endsWith('/')) {
  baseURL += '/';
}

const rl = readline.createInterface({
  input: process.stdin,
});

const lines = [];
// 2. Read each line of HTML from stdin and append it to htmlContent
rl.on('line', (line) => lines.push(line));

// 3. Once input is closed, parse the HTML and extract URLs
rl.on('close', () => {
  const htmlContent = lines.join('\n');
  // Parse the HTML using jsdom
  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;

  // 4. Select all <a> tags that have an href attribute
  const anchors = document.querySelectorAll('a[href]');

  // 5. Use a Set to ensure URLs are unique
  const uniqueURLs = new Set();

  // Attempt to build absolute URLs and store them in the set
  anchors.forEach((anchor) => {
    const hrefValue = anchor.getAttribute('href');
    if (hrefValue) {
      try {
        const absoluteURL = new URL(hrefValue, baseURL).href;
        uniqueURLs.add(absoluteURL);
      } catch (err) {
      }
    }
  });

  // 6. Print each unique URL to the console
  uniqueURLs.forEach((url) => console.log(url));
});
