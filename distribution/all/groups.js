const distribution = require('../../config.js');
const id = require('../util/id');

/**
 * Distributed Groups Service.
 * This service extends the local groups service by propagating
 * group updates (and queries) to all nodes in the group.
 *
 * @param {object} config - Configuration object. Expected to include a 'gid' property.
 * @return {object} - An object exposing methods: put, del, get, add, rem.
 */
const groups = function(config) {
  const context = {};
  context.gid = config.gid || 'all';

  return {
    /**
     * Propagates a group "put" to all nodes in the group.
     * @param {object} configParam - A configuration object (e.g., may contain metadata).
     * @param {object} group - The group mapping (node set) to store.
     * @param {Function} callback - Callback (errMap, resultMap).
     */
    put: (configParam, group, callback) => {
      const message = [configParam, group];
      const remote = { service: "groups", method: "put" };
      distribution.all.comm.send(message, remote, callback);
    },

    /**
     * Propagates a group "del" (delete) to all nodes.
     * @param {string} name - The group name.
     * @param {Function} callback - Callback (errMap, resultMap).
     */
    del: (name, callback) => {
      const message = [name];
      const remote = { service: "groups", method: "del" };
      distribution.all.comm.send(message, remote, callback);
    },

    /**
     * Propagates a group "get" to all nodes, retrieving each node's view of the group.
     * @param {string} name - The group name.
     * @param {Function} callback - Callback (errMap, resultMap).
     */
    get: (name, callback) => {
      const message = [name];
      const remote = { service: "groups", method: "get" };
      distribution.all.comm.send(message, remote, callback);
    },

    /**
     * Propagates a group "add" operation to all nodes.
     * @param {string} name - The group name.
     * @param {object} node - The node to add.
     * @param {Function} callback - Callback (errMap, resultMap).
     */
    add: (name, node, callback) => {
      const message = [name, node];
      const remote = { service: "groups", method: "add" };
      distribution.all.comm.send(message, remote, callback);
    },

    /**
     * Propagates a group "rem" (remove) operation to all nodes.
     * @param {string} name - The group name.
     * @param {object} node - The node to remove.
     * @param {Function} callback - Callback (errMap, resultMap).
     */
    rem: (name, node, callback) => {
      const message = [name, node];
      const remote = { service: "groups", method: "rem" };
      distribution.all.comm.send(message, remote, callback);
    },
  };
};

module.exports = groups;
