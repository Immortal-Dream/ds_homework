const distribution = global.distribution;
const util = distribution.util;

function mem(config) {
  const context = {};
  context.gid = config.gid || 'all';
  context.hash = config.hash || global.distribution.util.id.naiveHash;


  function chooseNode(keyString, method) {
    const kid = util.id.getID(keyString);
    // TODO: Get nids by group id.
    const group = global.distribution.local.groups.get(context.gid, (error, value) => {});    // targetNodes is an array of node IDs (5 digits)

    let nids = Object.keys(group);
    const targetNid = context.hash(kid, nids); // Use the hash function to choose a node
    const nodeInfo = group[targetNid];
    const remote = {
      node: nodeInfo,
      service: "mem",
      method: method
     };
    return remote;
  }

  /* For the distributed mem service, the configuration will
          always be a string */
  
  return {
    // cofiguration is a key string
    get: (configuration, callback) => {
      const remote = chooseNode(configuration, "get");
      global.distribution.local.comm.send([{key: configuration, gid: context.gid}], remote, callback);
    },

    put: (state, configuration, callback) => {
      if (configuration === null) {
        configuration = util.id.getID(state);
      }
      const remote = chooseNode(configuration, "put");
      global.distribution.local.comm.send([state, {key: configuration, gid: context.gid}], remote, callback);
      
    },

    del: (configuration, callback) => {
      const remote = chooseNode(configuration, "del");
      global.distribution.local.comm.send([{key: configuration, gid: context.gid}], remote, callback);
    },

    reconf: (configuration, callback) => {
      if (configuration.hash) {
        context.hash = configuration.hash;
      }
      callback(null, `Reconfigured mem service for group: ${context.gid}`);
    },
  };
};

module.exports = mem;
