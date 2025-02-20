const distribution = global.distribution;

/**
 * Distributed Groups Service.
 * This service extends the local groups service by propagating
 * group updates (and queries) to all nodes in the group.
 *
 * @param {object} config - Configuration object. Expected to include a 'gid' property.
 * @return {object} - An object exposing methods: put, del, get, add, rem.
 */
const groups = function (config) {
  const context = {};
  context.gid = config.gid || 'all';

  return {

    put: (config, group, callback) => {
      const remoteSpec = {
        service: "groups",
        method: "put",
        gid: context.gid
      };
      distribution[context.gid].comm.send(
        [config, group], remoteSpec, callback
      );
    },

    /**
     * Propagates a group "del" (delete) to all nodes.
     */
    del: (name, callback) => {
      const remoteSpec = {
        service: "groups",
        method: "del",
        gid: context.gid
      };
      distribution[context.gid].comm.send(
        [name], remoteSpec, callback
      );
    },

    /**
     * Propagates a group "get" to all nodes, retrieving each node's view of the group.
     */
    get: (name, callback) => {
      const remoteSpec = {
        service: "groups",
        method: "get",
        gid: context.gid
      };
      global.distribution[context.gid].comm.send(
        [name], remoteSpec, callback
      );
    },


    /**
     * Propagates a group "add" operation to all nodes.
     */

    add: (name, node, callback) => {
      const remoteSpec = {
        service: "groups",
        method: "add",
        gid: context.gid
      };

      distribution[context.gid].comm.send(
        [name, node], remoteSpec, callback
      );
    },

    /**
     * Propagates a group "rem" (remove) operation to all nodes.
     */
    rem: (name, node, callback) => {
      const remoteSpec = {
        service: "groups",
        method: "rem",
        gid: context.gid
      };

      distribution[context.gid].comm.send(
        [name, node], remoteSpec, callback
      );
    },
  };
};

module.exports = groups;
