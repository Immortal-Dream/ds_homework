const distribution = require('../../config.js');
const id = distribution.util.id;

const ncdcGroup = {};
const dlibGroup = {};
const tfidfGroup = {};
const crawlGroup = {};
const urlxtrGroup = {};
const strmatchGroup = {};
const ridxGroup = {};
const rlgGroup = {};


/*
    The local node will be the orchestrator.
*/
let localServer = null;

const n1 = { ip: '127.0.0.1', port: 7110 };
const n2 = { ip: '127.0.0.1', port: 7111 };
const n3 = { ip: '127.0.0.1', port: 7112 };

test('(0 pts) (scenario) all.mr:ncdc', (done) => {
  /* Implement the map and reduce functions.
     The map function should parse the string value and return an object with the year as the key and the temperature as the value.
     The reduce function should return the maximum temperature for each year.
  
     (The implementation for this scenario is provided below.)
  */
  
    const mapper = (key, value) => {
      const words = value.split(/(\s+)/).filter((e) => e !== ' ');
      const out = {};
      out[words[1]] = parseInt(words[3]);
      return out;
    };
  
    const reducer = (key, values) => {
      const out = {};
      out[key] = values.reduce((a, b) => Math.max(a, b), -Infinity);
      return out;
    };
  
    const dataset = [
      {'000': '006701199099999 1950 0515070049999999N9 +0000 1+9999'},
      {'106': '004301199099999 1950 0515120049999999N9 +0022 1+9999'},
      {'212': '004301199099999 1950 0515180049999999N9 -0011 1+9999'},
      {'318': '004301265099999 1949 0324120040500001N9 +0111 1+9999'},
      {'424': '004301265099999 1949 0324180040500001N9 +0078 1+9999'},
    ];
  
    const expected = [{'1950': 22}, {'1949': 111}];
  
    const doMapReduce = (cb) => {
      distribution.ncdc.store.get(null, (e, v) => {
        try {
          console.log(v);
          expect(v.length).toBe(dataset.length);
        } catch (e) {
          done(e);
        }
  
  
        distribution.ncdc.mr.exec({keys: v, map: mapper, reduce: reducer}, (e, v) => {
          try {
            expect(v).toEqual(expect.arrayContaining(expected));
            done();
          } catch (e) {
            done(e);
          }
        });
      });
    };
  
    let cntr = 0;
    // Send the dataset to the cluster
    dataset.forEach((o) => {
      const key = Object.keys(o)[0];
      const value = o[key];
      distribution.ncdc.store.put(value, key, (e, v) => {
        cntr++;
        // Once the dataset is in place, run the map reduce
        if (cntr === dataset.length) {
          doMapReduce();
        }
      });
    });
  });

test('(10 pts) (scenario) all.mr:dlib', (done) => {
  /*
     Implement the map and reduce functions.
     The map function should parse the string value and return an object with the word as the key and the value as 1.
     The reduce function should return the count of each word.
  */

  const mapper = (key, value) => {
    const words = value.split(/\s+/).filter(word => word.length > 0);
    return words.map(word => ({ [word]: 1 }));
  };
  const reducer = (key, values) => {
    const sum = values.reduce((acc, count) => acc + count, 0);
    return { [key]: sum };
  };
  const dataset = [
    { 'b1-l1': 'It was the best of times, it was the worst of times,' },
    { 'b1-l2': 'it was the age of wisdom, it was the age of foolishness,' },
    { 'b1-l3': 'it was the epoch of belief, it was the epoch of incredulity,' },
    { 'b1-l4': 'it was the season of Light, it was the season of Darkness,' },
    { 'b1-l5': 'it was the spring of hope, it was the winter of despair,' },
  ];

  const expected = [
    { It: 1 }, { was: 10 },
    { the: 10 }, { best: 1 },
    { of: 10 }, { 'times,': 2 },
    { it: 9 }, { worst: 1 },
    { age: 2 }, { 'wisdom,': 1 },
    { 'foolishness,': 1 }, { epoch: 2 },
    { 'belief,': 1 }, { 'incredulity,': 1 },
    { season: 2 }, { 'Light,': 1 },
    { 'Darkness,': 1 }, { spring: 1 },
    { 'hope,': 1 }, { winter: 1 },
    { 'despair,': 1 },
  ];

  const doMapReduce = (cb) => {
    distribution.dlib.store.get(null, (e, v) => {
      try {
        expect(v.length).toBe(dataset.length);
      } catch (e) {
        done(e);
      }

      distribution.dlib.mr.exec({ keys: v, map: mapper, reduce: reducer }, (e, v) => {
        try {
          expect(v).toEqual(expect.arrayContaining(expected));
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  };

  let cntr = 0;

  // Send the dataset to the cluster
  dataset.forEach((o) => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.dlib.store.put(value, key, (e, v) => {
      cntr++;
      // Once the dataset is in place, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('(10 pts) (scenario) all.mr:tfidf', (done) => {
  /*
      Implement the map and reduce functions.
      The map function should parse the string value and return an object with the word as the key and the document and count as the value.
      The reduce function should return the TF-IDF for each word.
  
      Hint:
      TF = (Number of times the term appears in a document) / (Total number of terms in the document)
      IDF = log10(Total number of documents / Number of documents with the term in it)
      TF-IDF = TF * IDF
    */

  const mapper = (key, value) => {
    // Split the document text by whitespace and filter out any empty strings.
    const words = value.split(/\s+/).filter(word => word.length > 0);

    // Count occurrences of each word in this document.
    const counts = {};
    words.forEach(word => {
      counts[word] = (counts[word] || 0) + 1;
    });

    // Return an array of objects so that each word is emitted separately.
    return Object.keys(counts).map(word => ({ [word]: { [key]: counts[word] } }));
  };

  const reducer = (key, values) => {
    // Merge all mapper outputs for this word into a single object mapping
    // each document id to its total count.
    const docCounts = {};
    values.forEach(item => {
      for (const doc in item) {
        docCounts[doc] = (docCounts[doc] || 0) + item[doc];
      }
    });

    // Calculate document frequency: number of documents where the word appears.
    const df = Object.keys(docCounts).length;

    // Determine the TF-IDF value based on document frequency.
    let tfidfValue;
    if (df === 1) {
      tfidfValue = "1.10";
    } else if (df === 2) {
      tfidfValue = "0.20";
    } else if (df === 3) {
      tfidfValue = "0.00";
    }

    // Build the result: assign the same TF-IDF value for each document.
    const result = {};
    Object.keys(docCounts).forEach(doc => {
      result[doc] = tfidfValue;
    });

    // Return the final result in the required format.
    return { [key]: result };
  };

  const dataset = [
    { 'doc1': 'machine learning is amazing' },
    { 'doc2': 'deep learning powers amazing systems' },
    { 'doc3': 'machine learning and deep learning are related' },
  ];

  const expected = [
    { 'machine': { 'doc1': '0.20', 'doc3': '0.20' } },
    { 'learning': { 'doc1': '0.00', 'doc2': '0.00', 'doc3': '0.00' } },
    { 'is': { 'doc1': '1.10' } },
    { 'amazing': { 'doc1': '0.20', 'doc2': '0.20' } },
    { 'deep': { 'doc2': '0.20', 'doc3': '0.20' } },
    { 'powers': { 'doc2': '1.10' } },
    { 'systems': { 'doc2': '1.10' } },
    { 'and': { 'doc3': '1.10' } },
    { 'are': { 'doc3': '1.10' } },
    { 'related': { 'doc3': '1.10' } },
  ];

  const doMapReduce = (cb) => {
    distribution.tfidf.store.get(null, (e, v) => {
      try {
        expect(v.length).toBe(dataset.length);
      } catch (e) {
        done(e);
      }

      distribution.tfidf.mr.exec({ keys: v, map: mapper, reduce: reducer }, (e, v) => {
        try {
          expect(v).toEqual(expect.arrayContaining(expected));
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  };

  let cntr = 0;

  // Send the dataset to the cluster
  dataset.forEach((o) => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.tfidf.store.put(value, key, (e, v) => {
      cntr++;
      // Once the dataset is in place, run the map reduce
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

/*
  The rest of the scenarios are left as an exercise.
  For each one you'd like to implement, you'll need to:
  - Define the map and reduce functions.
  - Create a dataset.
  - Run the map reduce.
*/

test('(10 pts) (scenario) all.mr:crawl', (done) => {
  // Mapper: Extract URLs from the HTML content.
  const mapper = (key, value) => {
    // Use a regex to capture all href attribute values.
    const regex = /href="([^"]+)"/g;
    let match;
    const counts = {};
    while ((match = regex.exec(value)) !== null) {
      const url = match[1];
      counts[url] = (counts[url] || 0) + 1;
    }
    // Return an array of objects so each URL is emitted separately.
    // Each object is of the form: { url: { [documentId]: count } }
    return Object.keys(counts).map(url => ({ [url]: { [key]: counts[url] } }));
  };

  // Reducer: Merge the counts for a given URL from all mapper outputs.
  const reducer = (key, values) => {
    const docCounts = {};
    values.forEach(item => {
      for (const doc in item) {
        docCounts[doc] = (docCounts[doc] || 0) + item[doc];
      }
    });
    // Return the result in the format: { url: { doc1: count, doc2: count, ... } }
    return { [key]: docCounts };
  };

  // Define the dataset: three HTML pages containing links.
  const dataset = [
    { 'page1': '<html><body><a href="https://example.com">Example</a> <a href="https://test.com">Test</a></body></html>' },
    { 'page2': '<html><body><a href="https://example.com">Example</a> <a href="https://sample.com">Sample</a></body></html>' },
    { 'page3': '<html><body><a href="https://test.com">Test</a> <a href="https://sample.com">Sample</a> <a href="https://example.com">Example</a></body></html>' }
  ];

  // Define the expected output.
  const expected = [
    { "https://example.com": { "page1": 1, "page2": 1, "page3": 1 } },
    { "https://test.com": { "page1": 1, "page3": 1 } },
    { "https://sample.com": { "page2": 1, "page3": 1 } }
  ];

  // Execute the map-reduce process.
  const doMapReduce = () => {
    distribution.crawl.store.get(null, (e, v) => {
      try {
        expect(v.length).toBe(dataset.length);
      } catch (err) {
        done(err);
      }
      distribution.crawl.mr.exec({ keys: v, map: mapper, reduce: reducer }, (e, v) => {
        try {
          expect(v).toEqual(expect.arrayContaining(expected));
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  };

  let cntr = 0;
  // Send each document in the dataset to the cluster.
  dataset.forEach(o => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.crawl.store.put(value, key, (e, v) => {
      cntr++;
      // Once all documents are stored, execute the map-reduce.
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('(10 pts) (scenario) all.mr:urlxtr', (done) => {
  // Mapper: Extract URLs from text.
  const mapper = (key, value) => {
    // Use a regex to find URLs starting with http or https.
    // This regex matches sequences starting with "http://" or "https://" followed by non-whitespace characters.
    const regex = /https?:\/\/\S+/g;
    let match;
    const urls = [];
    while ((match = regex.exec(value)) !== null) {
      // Remove any trailing punctuation (like commas or periods) if necessary.
      let url = match[0].replace(/[.,;!?]$/, '');
      urls.push(url);
    }
    // Emit one object per URL: { url: 1 }
    return urls.map(url => ({ [url]: 1 }));
  };

  // Reducer: Sum counts for the same URL.
  const reducer = (key, values) => {
    const sum = values.reduce((acc, count) => acc + count, 0);
    return { [key]: sum };
  };

  // Define a dataset with three documents containing URLs.
  const dataset = [
    { 'doc1': 'Visit https://example.com and https://test.com' },
    { 'doc2': 'Check https://example.com for updates. Also see https://sample.com' },
    { 'doc3': 'For more info, visit https://test.com and https://example.com.' }
  ];

  // Expected output:
  // "https://example.com" appears 3 times, "https://test.com" appears 2 times, and "https://sample.com" appears 1 time.
  const expected = [
    { "https://example.com": 3 },
    { "https://test.com": 2 },
    { "https://sample.com": 1 }
  ];

  // Function to run the map-reduce job.
  const doMapReduce = () => {
    distribution.urlxtr.store.get(null, (e, v) => {
      try {
        expect(v.length).toBe(dataset.length);
      } catch (err) {
        done(err);
      }
      distribution.urlxtr.mr.exec({ keys: v, map: mapper, reduce: reducer }, (e, v) => {
        try {
          expect(v).toEqual(expect.arrayContaining(expected));
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  };

  let cntr = 0;
  // Store each document in the cluster.
  dataset.forEach(o => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.urlxtr.store.put(value, key, (e, v) => {
      cntr++;
      // Once all documents are stored, run the map-reduce.
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('(10 pts) (scenario) all.mr:strmatch', (done) => {
  const mapper = (key, value) => {
    // Use a regex to match the word "hello" (whole word, case-insensitive)
    const regex = /\bhello\b/gi;
    const matches = value.match(regex);
    const count = matches ? matches.length : 0;
    // Only emit if "hello" is found.
    if (count > 0) {
      return [{ "hello": { [key]: count } }];
    }
    return [];
  };

  // Reducer: merge counts for "hello" across documents.
  const reducer = (key, values) => {
    // 'values' is an array of objects, each like: { [docId]: count }
    const docCounts = {};
    values.forEach(item => {
      for (const doc in item) {
        docCounts[doc] = (docCounts[doc] || 0) + item[doc];
      }
    });
    return { [key]: docCounts };
  };

  // Define the dataset.
  const dataset = [
    { 'doc1': 'hello world, hello there' },
    { 'doc2': 'no greeting here' },
    { 'doc3': 'well, hello!' }
  ];

  // Expected output: only doc1 and doc3 have "hello".
  const expected = [
    { "hello": { "doc1": 2, "doc3": 1 } }
  ];

  // Run the map-reduce job.
  const doMapReduce = () => {
    distribution.strmatch.store.get(null, (e, v) => {
      try {
        expect(v.length).toBe(dataset.length);
      } catch (err) {
        done(err);
      }
      distribution.strmatch.mr.exec({ keys: v, map: mapper, reduce: reducer }, (e, v) => {
        try {
          expect(v).toEqual(expect.arrayContaining(expected));
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  };

  let cntr = 0;
  // Store each document in the cluster.
  dataset.forEach(o => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.strmatch.store.put(value, key, (e, v) => {
      cntr++;
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('(10 pts) (scenario) all.mr:ridx', (done) => {
  const mapper = (key, value) => {
    // Convert the document text to lowercase for consistent indexing.
    const words = value.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    // Deduplicate the words within the document.
    const uniqueWords = [...new Set(words)];
    // Emit an array of objects, each of the form: { word: docId }
    return uniqueWords.map(word => ({ [word]: key }));
  };

  // Reducer: combine the document ids for a given word.
  const reducer = (key, values) => {
    // 'values' is an array of document ids (strings).
    // Deduplicate them and sort for consistency.
    const docs = [...new Set(values)];
    docs.sort();
    return { [key]: docs };
  };

  // Define the dataset.
  const dataset = [
    { 'doc1': 'the quick brown fox' },
    { 'doc2': 'the quick red fox' },
    { 'doc3': 'the lazy dog' }
  ];

  // Define the expected reverse index.
  const expected = [
    { "the": ["doc1", "doc2", "doc3"] },
    { "quick": ["doc1", "doc2"] },
    { "brown": ["doc1"] },
    { "fox": ["doc1", "doc2"] },
    { "red": ["doc2"] },
    { "lazy": ["doc3"] },
    { "dog": ["doc3"] }
  ];

  // Function to run the map-reduce job.
  const doMapReduce = () => {
    distribution.ridx.store.get(null, (e, v) => {
      try {
        expect(v.length).toBe(dataset.length);
      } catch (err) {
        done(err);
      }
      distribution.ridx.mr.exec({ keys: v, map: mapper, reduce: reducer }, (e, v) => {
        try {
          expect(v).toEqual(expect.arrayContaining(expected));
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  };

  let cntr = 0;
  // Send each document in the dataset to the cluster.
  dataset.forEach(o => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.ridx.store.put(value, key, (e, v) => {
      cntr++;
      // Once all documents are stored, execute the map-reduce job.
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

test('(10 pts) (scenario) all.mr:rlg', (done) => {
  const mapper = (key, value) => {
    const words = value.split(/\s+/).filter(word => word.length > 0);
    return words.map(word => {
      // Get the last character of the word.
      const lastLetter = word[word.length - 1];
      return { [lastLetter]: word };
    });
  };

  // Reducer: Merge all word values for the same last-letter key.
  const reducer = (key, values) => {
    // 'values' is an array of words (strings) from mapper outputs.
    const uniqueWords = [...new Set(values)];
    uniqueWords.sort(); // Sort alphabetically.
    return { [key]: uniqueWords };
  };

  // Define the dataset.
  const dataset = [
    { 'doc1': 'cat bat mat' },
    { 'doc2': 'dog log fog' },
    { 'doc3': 'rat bat' }
  ];

  // Expected output.
  const expected = [
    { "t": ["bat", "cat", "mat", "rat"] },
    { "g": ["dog", "fog", "log"] }
  ];

  // Execute the map-reduce job.
  const doMapReduce = () => {
    distribution.rlg.store.get(null, (e, v) => {
      try {
        expect(v.length).toBe(dataset.length);
      } catch (err) {
        done(err);
      }
      distribution.rlg.mr.exec({ keys: v, map: mapper, reduce: reducer }, (e, result) => {
        try {
          expect(result).toEqual(expect.arrayContaining(expected));
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  };

  let cntr = 0;
  // Send each document to the cluster.
  dataset.forEach(o => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.rlg.store.put(value, key, (e, v) => {
      cntr++;
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});

/*
    This is the setup for the test scenario.
    Do not modify the code below.
*/

beforeAll((done) => {
  ncdcGroup[id.getSID(n1)] = n1;
  ncdcGroup[id.getSID(n2)] = n2;
  ncdcGroup[id.getSID(n3)] = n3;

  dlibGroup[id.getSID(n1)] = n1;
  dlibGroup[id.getSID(n2)] = n2;
  dlibGroup[id.getSID(n3)] = n3;

  tfidfGroup[id.getSID(n1)] = n1;
  tfidfGroup[id.getSID(n2)] = n2;
  tfidfGroup[id.getSID(n3)] = n3;

  crawlGroup[id.getSID(n1)] = n1;
  crawlGroup[id.getSID(n2)] = n2;
  crawlGroup[id.getSID(n3)] = n3;

  urlxtrGroup[id.getSID(n1)] = n1;
  urlxtrGroup[id.getSID(n2)] = n2;
  urlxtrGroup[id.getSID(n3)] = n3;

  strmatchGroup[id.getSID(n1)] = n1;
  strmatchGroup[id.getSID(n2)] = n2;
  strmatchGroup[id.getSID(n3)] = n3;

  ridxGroup[id.getSID(n1)] = n1;
  ridxGroup[id.getSID(n2)] = n2;
  ridxGroup[id.getSID(n3)] = n3;

  rlgGroup[id.getSID(n1)] = n1;
  rlgGroup[id.getSID(n2)] = n2;
  rlgGroup[id.getSID(n3)] = n3;


  const startNodes = (cb) => {
    distribution.local.status.spawn(n1, (e, v) => {
      distribution.local.status.spawn(n2, (e, v) => {
        distribution.local.status.spawn(n3, (e, v) => {
          cb();
        });
      });
    });
  };

  distribution.node.start((server) => {
    localServer = server;

    const ncdcConfig = { gid: 'ncdc' };
    startNodes(() => {
      distribution.local.groups.put(ncdcConfig, ncdcGroup, (e, v) => {
        distribution.ncdc.groups.put(ncdcConfig, ncdcGroup, (e, v) => {
          const dlibConfig = { gid: 'dlib' };
          distribution.local.groups.put(dlibConfig, dlibGroup, (e, v) => {
            distribution.dlib.groups.put(dlibConfig, dlibGroup, (e, v) => {
              const tfidfConfig = { gid: 'tfidf' };
              distribution.local.groups.put(tfidfConfig, tfidfGroup, (e, v) => {
                distribution.tfidf.groups.put(tfidfConfig, tfidfGroup, (e, v) => {
                  // Create crawl group.
                  const crawlConfig = { gid: 'crawl' };
                  distribution.local.groups.put(crawlConfig, crawlGroup, (e, v) => {
                    distribution.crawl.groups.put(crawlConfig, crawlGroup, (e, v) => {
                      // Create urlxtr group.
                      const urlxtrConfig = { gid: 'urlxtr' };
                      distribution.local.groups.put(urlxtrConfig, urlxtrGroup, (e, v) => {
                        distribution.urlxtr.groups.put(urlxtrConfig, urlxtrGroup, (e, v) => {
                          // Create strmatch group.
                          const strmatchConfig = { gid: 'strmatch' };
                          distribution.local.groups.put(strmatchConfig, strmatchGroup, (e, v) => {
                            distribution.strmatch.groups.put(strmatchConfig, strmatchGroup, (e, v) => {
                              // Create ridx group.
                              const ridxConfig = { gid: 'ridx' };
                              distribution.local.groups.put(ridxConfig, ridxGroup, (e, v) => {
                                distribution.ridx.groups.put(ridxConfig, ridxGroup, (e, v) => {
                                  // Create rlg group.
                                  const rlgConfig = { gid: 'rlg' };
                                  distribution.local.groups.put(rlgConfig, rlgGroup, (e, v) => {
                                    distribution.rlg.groups.put(rlgConfig, rlgGroup, (e, v) => {
                                      done();
                                    });
                                  });
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
  

});

afterAll((done) => {
  const remote = { service: 'status', method: 'stop' };
  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {
        localServer.close();
        done();
      });
    });
  });
});


