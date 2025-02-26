const util = global.distribution.util;
// In-memory store for key-value pairs
/*store =  {"local": {key: value, key2, value2}
    "group1": {key: value}
 }
*/
const store = {};

/**
 * Stores a value under a given key.
 * If key is null, computes the key as the sha256 hash of the JSON serialized value.
 *
 * @param {*} value - The object to be stored.
 * @param {string|null} key - The primary key; if null, a hash is computed.
 * @param {function(Error, *): void} callback - The callback to invoke with (error, value).
 */
function put(value, key, callback) {
  let gid = 'local';
  // If no key is provided, compute the sha256 hash of the serialized object
  if (key === null) {
    key = util.id.getID(value);
  } else if (typeof key === 'object') {
    gid = key.gid;
    key = key.key;
  }
  if (!store[gid]) {
    store[gid] = {};
  }
  // Idempotently store or update the value under the key
  store[gid][key] = value;
  callback(null, value);
}

/**
 * Retrieves a value from the store using the key.
 *
 * @param {string} key - The primary key. It can be an Object!!!
 * @param {function(Error, *): void} callback - The callback to invoke with (error, value).
 */
function get(key, callback) {
  let gid = 'local';
  
  if (key === null) {
    // If no key is provided, return an array of all keys in the store.
    callback(null, Object.keys(store));
  } else {
    if (typeof key === 'object') {
      gid = key.gid;
      key = key.key;
    }
    if (!store[gid]) {
      store[gid] = {};
    }

    if (key in store[gid]) {
      callback(null, store[gid][key]);
    } else {
      callback(new Error("Key not found"), null);
    }
  }
}

/**
 * Deletes a value from the store using the key.
 *
 * @param {string} key - The primary key.
 * @param {function(Error, *): void} callback - The callback to invoke with (error, value).
 */
function del(key, callback) {
  let gid = "local";
  if (typeof key === "object") {
    gid = key.gid;
    key = key.key;
  }
  if (!store[gid]) {
    store[gid] = {};
  }
  if (key in store[gid]) {
    const value = store[gid][key];
    delete store[gid][key];
    callback(null, value);
  } else {
    callback(new Error("Key not found"), null);
  }
}

module.exports = { put, get, del };
