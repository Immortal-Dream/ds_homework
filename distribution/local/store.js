const fs = require('fs');
const path = require('path');
const util = global.distribution.util;
// Define an absolute path for the persistent storage directory.
// Using __dirname ensures the path is independent of the current working directory.
const STORE_DIR = path.join(__dirname, 'store_data');

// Ensure that the storage directory exists; create it if not.
if (!fs.existsSync(STORE_DIR)) {
  fs.mkdirSync(STORE_DIR, { recursive: true });
}

/* Helper function: sanitizeKey
 * Converts a key to an alphanumeric-only string, removing unsupported characters.
 */
function sanitizeKey(key) {
  return key.replace(/[^a-z0-9]/gi, '');
}

/* 
 * Function put(state, configuration, callback)
 *
 * Persists an object to disk. The 'state' parameter is the value to store,
 * and 'configuration' is the key. If configuration is null, a sha256 hash of
 * the JSON-serialized state is computed and used as the key.
 *
 * Uses an absolute file path (using the path module) to ensure the service
 * works regardless of where the code is running from.
 */
function put(state, configuration, callback) {
  let key = configuration;
  const serialized = JSON.stringify(state);
  // If no key is provided, compute the key as the sha256 hash of the serialized state.
  if (key === null) {
    key = util.id.getID;
  }
  // Sanitize the key to ensure a valid filename.
  const safeKey = sanitizeKey(key);
  // Construct the absolute file path for this key.
  const filePath = path.join(STORE_DIR, safeKey);
  // Write the serialized state to disk asynchronously.
  fs.writeFile(filePath, serialized, 'utf8', (err) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, state);
    }
  });
}

/* 
 * Function get(configuration, callback)
 *
 * Retrieves a value from the persistent store. If configuration (the key)
 * is null, the function returns an array of all keys in the store.
 * Otherwise, it reads the file corresponding to the sanitized key, deserializes
 * the JSON content, and returns the stored value.
 */
function get(configuration, callback) {
  // If no key is provided, list all stored keys (filenames).
  if (configuration === null) {
    fs.readdir(STORE_DIR, (err, files) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, files);
      }
    });
  } else {
    const safeKey = sanitizeKey(configuration);
    const filePath = path.join(STORE_DIR, safeKey);
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        callback(new Error("Key not found"), null);
      } else {
        let value;
        try {
          value = JSON.parse(data);
        } catch (parseError) {
          return callback(parseError, null);
        }
        callback(null, value);
      }
    });
  }
}

/* 
 * Function del(configuration, callback)
 *
 * Deletes the value stored under the provided key. It first reads the file to
 * retrieve the stored value, then deletes the file. If the key does not exist,
 * it returns an error.
 */
function del(configuration, callback) {
  // For deletion, a null key is not valid.
  if (configuration === null) {
    return callback(new Error("Invalid key"), null);
  }
  const safeKey = sanitizeKey(configuration);
  const filePath = path.join(STORE_DIR, safeKey);
  // Read the file first to obtain the stored value.
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return callback(new Error("Key not found"), null);
    }
    let value;
    try {
      value = JSON.parse(data);
    } catch (parseError) {
      return callback(parseError, null);
    }
    // Delete the file after retrieving the value.
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
