const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Top-level store_data directory
const STORE_DIR = path.join(__dirname, 'store_data');

// Ensure that the storage directory exists
if (!fs.existsSync(STORE_DIR)) {
  fs.mkdirSync(STORE_DIR, { recursive: true });
}

/**
 * Converts a key to alphanumeric-only string, removing unsupported characters.
 */
function sanitizeKey(key) {
  return key.replace(/[^a-z0-9]/gi, '');
}

/**
 * If configuration is an object => { gid: configuration.gid||"local", key: configuration.key }
 * Otherwise => { gid: "local", key: configuration }.
 */
function parseConfig(configuration) {
  let gid = 'local';
  let key = configuration;
  if (typeof configuration === 'object' && configuration !== null) {
    gid = configuration.gid || 'local';
    key = configuration.key;
  }
  return { gid, key };
}

/**
 * PUT:
 * - If key is null, compute sha256 of the JSON stringified state.
 * - Store as store_data/<gid>/<safeKey>.
 */
function put(state, configuration, callback) {
  const serialized = JSON.stringify(state);
  const { gid, key: rawKey } = parseConfig(configuration);

  let key = rawKey;
  if (key === null) {
    // Use sha256 of the serialized object as the key
    key = crypto.createHash('sha256').update(serialized).digest('hex');
  }

  // Make sure gid and key are sanitized for safe directory/filenames
  const safeGid = sanitizeKey(gid);
  const safeKey = sanitizeKey(key || '');

  // Ensure the group subdirectory exists
  const groupDir = path.join(STORE_DIR, safeGid);
  if (!fs.existsSync(groupDir)) {
    fs.mkdirSync(groupDir, { recursive: true });
  }

  // Construct filePath
  const filePath = path.join(groupDir, safeKey);

  fs.writeFile(filePath, serialized, 'utf8', (err) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, state);
    }
  });
}

/**
 * GET:
 * - If configuration is null or if parseConfig(...) yields key===null,
 *   list all filenames in store_data/<gid>.
 * - Otherwise read store_data/<gid>/<safeKey>.
 */
function get(configuration, callback) {
  const { gid, key: rawKey } = parseConfig(configuration);
  const safeGid = sanitizeKey(gid);
  const groupDir = path.join(STORE_DIR, safeGid);

  // If key is null => return all keys (filenames) under this gid's directory
  if (rawKey === null) {
    fs.readdir(groupDir, (err, files) => {
      if (err) {
        // If the directory doesn't exist, we can treat it as empty
        if (err.code === 'ENOENT') {
          return callback(null, []);
        }
        return callback(err, null);
      } else {
        callback(null, files);
      }
    });
  } else {
    // read store_data/<gid>/<safeKey>
    const safeKey = sanitizeKey(rawKey || '');
    const filePath = path.join(groupDir, safeKey);
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        return callback(new Error('Key not found'), null);
      }
      try {
        const value = JSON.parse(data);
        callback(null, value);
      } catch (parseErr) {
        callback(parseErr, null);
      }
    });
  }
}

/**
 * DEL:
 * - If key is null => return Error("Invalid key").
 * - Otherwise remove store_data/<gid>/<safeKey>, returning the deleted object.
 */
function del(configuration, callback) {
  const { gid, key: rawKey } = parseConfig(configuration);
  if (rawKey === null) {
    return callback(new Error('Invalid key'), null);
  }

  const safeGid = sanitizeKey(gid);
  const groupDir = path.join(STORE_DIR, safeGid);
  const safeKey = sanitizeKey(rawKey);
  const filePath = path.join(groupDir, safeKey);

  // First read the file to get the stored object
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return callback(new Error('Key not found'), null);
    }
    let value;
    try {
      value = JSON.parse(data);
    } catch (parseError) {
      return callback(parseError, null);
    }
    // Delete the file after retrieving its content
    fs.unlink(filePath, (err2) => {
      if (err2) {
        callback(err2, null);
      } else {
        callback(null, value);
      }
    });
  });
}

module.exports = { put, get, del };
