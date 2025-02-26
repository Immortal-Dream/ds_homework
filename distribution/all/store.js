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
     * If configuration is null, it lists all stored keys for the group.
     */
    get: (configuration, callback) => {
      if (configuration === null) {
        // Special handling: list all keys in the group.
        // Send the request to the current node, assuming its local store
        // get implementation will list all keys when key is null.
        const remote = { node: distribution.node.config, service: "store", method: "get" };
        global.distribution.local.comm.send([{ key: null, gid: context.gid }], remote, (err, result) => {
          // If no error and result is an array (list of keys), convert it to an object.
          if (!err && Array.isArray(result)) {
            const obj = {};
            result.forEach((r, i) => {
              obj[i] = r;
            });
            // Return an empty object for error and our object as value.
            callback({}, obj);
          } else {
            callback(err, result);
          }
        });
        return;
      }
      const remote = chooseNode(configuration, "get");
      global.distribution.local.comm.send([{ key: configuration, gid: context.gid }], remote, callback);
    },

    /**
     * put: Persists an object in the persistent store.
     * If no key is provided (configuration is null), compute a new key from the object's sha256.
     */
    put: (state, configuration, callback) => {
      if (configuration === null) {
        configuration = util.id.getID(state);
      }
      const remote = chooseNode(configuration, "put");
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
