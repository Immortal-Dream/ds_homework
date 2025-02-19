#!/usr/bin/env node

/*
Extract all text from an HTML page.
Usage: ./getText.js <input > output
*/

const {convert} = require('html-to-text');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
});

const lines = [];

// 1. Read HTML input from standard input, line by line
rl.on('line', (line) => {
  lines.push(line);
});

// 2. After all input is received, use 'convert' to output plain text
rl.on('close', () => {
  const htmlContent = lines.join('\n');
  const text = convert(htmlContent, {wordwrap: 140});
  console.log(text);
});


