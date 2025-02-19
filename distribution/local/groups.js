

// TODO: Initialize the all and local by default
// Local storage for the mapping of group names to node sets

const comm = require('../all/comm');


// The groups service object
var groups = {};

/**
 * Retrieve the node-set for the given group name.
 * @param {string} name - The group name (GID).
 * @param {function} callback - Callback function(err, result)
 */
groups.get = function(name, callback) {
    if (!groups.hasOwnProperty(name)) {
      // Group not found: return an error and false value.
      return callback(new Error("Group not found: " + name), false);
    }
    callback(null, groups[name]);
  };
  

/**
 * Put a new group mapping.
 * This stores the node set under the given group name and instantiates
 * a corresponding distribution[gid] object.
 *
 * @param {string} name - The group name (GID).
 * @param {Object} config - An object mapping SIDs to node objects.
 * @param {function} callback - Callback function(err, result)
 */
groups.put = function(name, config, callback) {
    groups[name] = config;
    // Dynamically instantiate the distributed version of each service for this group.
    global.distribution.mygroup = {
      status: require('../all/status')({gid: config}),
      comm: require('../all/comm')({gid: config}),
      gossip: require('../all/gossip')({gid: config}),
      groups: require('../all/groups')({gid: config}),
      routes: require('../all/routes')({gid: config}),
      mem: require('../all/mem')({gid: config}),
      store: require('../all/store')({gid: config})
    };
    if (typeof callback === "function") {
      callback(null, config);
    }
  };
  

/**
 * Delete the entire group mapping for the given group name.
 *
 * @param {string} name - The group name.
 * @param {function} callback - Callback function(err, result)
 */
groups.del = function(name, callback) {
    if (!groups.hasOwnProperty(name)) {
      // Group not found: return an error and false value.
      return callback(new Error("Group not found: " + name), false);
    }
    // Capture the group mapping before deletion.
    const deletedGroup = groups[name];
    // Delete the group mapping.
    delete groups[name];
    // Also remove the corresponding distribution entry if it exists.
    if (typeof distribution !== "undefined" && distribution.hasOwnProperty(name)) {
      delete distribution[name];
    }
    callback(null, deletedGroup);
  };


/**
 * Add a node to the specified group.
 * If the group doesn't exist, this is a no-op.
 *
 * @param {string} name - The group name.
 * @param {Object|string} node - A node object (or its SID if already computed).
 * @param {function} [callback] - Optional callback function(err, result)
 */
groups.add = function(name, node, callback) {
    if (!groups.hasOwnProperty(name)) {
      if (typeof callback === "function") {
        return callback(new Error("Group not found: " + name), false);
      }
      return;
    }
    // Use the provided id.getSID function to compute the node's SID.
    const sid = (typeof node === "object") ? distribution.util.id.getSID(node) : node;
    groups[name][sid] = node;
    if (typeof callback === "function") {
      callback(null, groups[name]);
    }
  };

/**
 * Remove a node from the specified group.
 * If the group or the node does not exist, this is a no-op.
 *
 * @param {string} name - The group name.
 * @param {Object|string} node - A node object (or its SID).
 * @param {function} [callback] - Optional callback function(err, result)
 */
groups.rem = function(name, node, callback) {
  if (!groups[name]) {
    // Group does not exist; no-op.
    if (typeof callback === "function") {
      callback(null, undefined);
    }
    return;
  }
  var sid = (typeof node === "object") ? distribution.util.id.getSID(node) : node;
  if (groups[name].hasOwnProperty(sid)) {
    delete groups[name][sid];
  }
  if (typeof callback === "function") {
    callback(null, groups[name]);
  }
};

module.exports = groups;
