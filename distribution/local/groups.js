// TODO: Initialize the all and local by default
// Local storage for the mapping of group names to node sets

// The groups service object
var groups = {"all": {}};

/**
 * Retrieve the node-set for the given group name.
 * @param {string} name - The group name (GID). IT CAN BE A STRING OR OBJECT!!!!!!
 * @param {function} callback - Callback function(err, result)
 */
groups.get = function (name, callback) {
  let groupName;
  if (typeof name === "object") {
    groupName = name.gid || "all";
  } else {
    groupName = name
  }
  if (!(groupName in groups)) {
    // Group not found: return an error and false value.
    return callback(new Error("Group not found: " + groupName), false);
  }
  callback(null, groups[groupName]);
  return groups[groupName]
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
groups.put = function (config, group, callback) {
  const configuration = typeof config === "string" ? config : config.gid || "all";
  // Dynamically instantiate the distributed version of each service for this group.
  global.distribution[configuration] = {
    status: require('../all/status')({ gid: configuration }),
    comm: require('../all/comm')({ gid: configuration }),
    gossip: require('../all/gossip')({ gid: configuration }),
    groups: require('../all/groups')({ gid: configuration }),
    routes: require('../all/routes')({ gid: configuration }),
    mem: require('../all/mem')({ gid: configuration }),
    store: require('../all/store')({ gid: configuration })
  };
  groups[configuration] = group
  // add all nodes to 'all'
  if (configuration !== "all") {
    Object.keys(group).forEach((sid) => {
      groups["all"][sid] = group[sid];
    });
  }
  callback(undefined, group)
};


/**
 * Delete the entire group mapping for the given group name.
 *
 * @param {string} name - The group name.
 * @param {function} callback - Callback function(err, result)
 */
groups.del = function (name, callback) {
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
groups.add = function (name, node, callback) {
  if (!groups.hasOwnProperty(name)) {
    if (typeof callback === "function") {
      return callback(new Error("Group not found: " + name), false);
    }
    return;
  }
  // Use the provided id.getSID function to compute the node's SID.
  const sid = (typeof node === "object") ? distribution.util.id.getSID(node) : node;
  groups[name][sid] = node;
  groups['all'][sid] = node;
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
groups.rem = function (name, node, callback) {
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
    delete groups['all'][sid];
  }
  if (typeof callback === "function") {
    callback(null, groups[name]);
  }
};

module.exports = groups;
