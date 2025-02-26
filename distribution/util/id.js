const assert = require('assert');
const crypto = require('crypto');

// The ID is the SHA256 hash of the JSON representation of the object
function getID(obj) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(obj));
  return hash.digest('hex');
}

// The NID is the SHA256 hash of the JSON representation of the node
function getNID(node) {
  node = {ip: node.ip, port: node.port};
  return getID(node);
}

// The SID is the first 5 characters of the NID
function getSID(node) {
  return getNID(node).substring(0, 5);
}


function getMID(message) {
  const msg = {};
  msg.date = new Date().getTime();
  msg.mss = message;
  return getID(msg);
}

function idToNum(id) {
  const n = parseInt(id, 16);
  assert(!isNaN(n), 'idToNum: id is not in KID form!');
  return n;
}

function naiveHash(kid, nids) {
  nids.sort();
  return nids[idToNum(kid) % nids.length];
}


function consistentHash(kid, nids) {
  // Convert the KID to a numerical representation.
  const kidNum = idToNum(kid);

  // Build a "ring" of nodes: convert each NID into an object with its hash value.
  const ring = nids.map(nid => ({
    id: nid,
    num: idToNum(nid)
  }));

  // Insert the KID (object) into the ring.
  ring.push({ id: kid, num: kidNum });

  // Sort the ring based on the numerical values.
  ring.sort((a, b) => (a.num < b.num ? -1 : a.num > b.num ? 1 : 0));

  // Find the index of the KID in the sorted ring.
  const kidIndex = ring.findIndex(item => item.id === kid);

  // Choose the next element in the ring (wrapping around if necessary).
  const nextIndex = (kidIndex + 1) % ring.length;
  return ring[nextIndex].id;
}


function rendezvousHash(kid, nids) {
  let maxScore = BigInt(0);
  let chosenNid = null;

  // For each node ID, compute the hash score for the combination kid + nid.
  for (const nid of nids) {
    const combined = kid + nid; // Concatenation order: kid + nid.
    const newHash = getID(combined); // Hash the concatenated string.
    const score = idToNum(newHash);
    
    // Select the node with the highest score.
    if (chosenNid === null || score > maxScore) {
      maxScore = score;
      chosenNid = nid;
    }
  }
  return chosenNid;
}

module.exports = {
  getID,
  getNID,
  getSID,
  getMID,
  naiveHash,
  consistentHash,
  rendezvousHash,
};
