const distribution = global.distribution;
const util = distribution.util;


function store(config) {
  const context = {};
  context.gid = config.gid || 'all';
  // Use the provided hash function, or default to naiveHash.
  context.hash = config.hash || global.distribution.util.id.naiveHash;


  function chooseNode(keyString, method) {
    const kid = util.id.getID(keyString);
    const group = global.distribution.local.groups.get(context.gid, (error, value) => {});
    let nids = Object.keys(group);
    const targetNid = context.hash(kid, nids);
    const nodeInfo = group[targetNid];
    const remote = {
      node: nodeInfo,
      service: "store",
      method: method
    };
    return remote;
  }

  return {
    /**
     * get: Retrieves an object from the persistent store.
     */
    get: (configuration, callback) => {
      const remote = chooseNode(configuration, "get");
      // The message is an array containing an object with the key and group id.
      global.distribution.local.comm.send([{ key: configuration, gid: context.gid }], remote, callback);
    },

    /**
     * put: Persists an object in the persistent store.
     */
    put: (state, configuration, callback) => {
      if (configuration === null) {
        configuration = util.id.getID(state);
      }
      const remote = chooseNode(configuration, "put");
      // The message includes both the object to store and an object specifying key and group.
      global.distribution.local.comm.send([state, { key: configuration, gid: context.gid }], remote, callback);
    },

    /**
     * del: Deletes an object from the persistent store.
     */
    del: (configuration, callback) => {
      const remote = chooseNode(configuration, "del");
      global.distribution.local.comm.send([{ key: configuration, gid: context.gid }], remote, callback);
    },

    /**
     * reconf: Reconfigures the store service.
     */
    reconf: (configuration, callback) => {
      if (configuration.hash) {
        context.hash = configuration.hash;
      }
      callback(null, `Reconfigured store service for group: ${context.gid}`);
    },
  };
}

module.exports = store;
