#!/usr/bin/env node

/*
Convert each term to its stem
Usage: ./stem.js <input >output
*/

const readline = require('readline');
const natural = require('natural');

// Create an interface to read lines from stdin without prompting
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on('line', (line) => {
  // Split the input line into tokens by whitespace
  const tokens = line.trim().split(/\s+/);

  // Apply Porter stemming from 'natural' to each token
  const stems = tokens.map((token) => natural.PorterStemmer.stem(token));

  // Print the stemmed tokens as a single space-separated line
  console.log(stems.join(' '));
});
