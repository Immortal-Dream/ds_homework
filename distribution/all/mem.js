const distribution = global.distribution;
const util = distribution.util;

function mem(config) {
  const context = {};
  context.gid = config.gid || 'all';
  context.hash = config.hash || global.distribution.util.id.naiveHash;


  function chooseNode(keyString, method) {
    const kid = util.id.getID(keyString);
    // TODO: Get nids by group id.
    const group = global.distribution.local.groups.get(context.gid, (error, value) => console.log(value));
    // targetNodes is an array of node IDs (5 digits)
    let nids = Object.keys(group);
    console.log("nids: ", nids);
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
      global.distribution.local.comm.send([configuration], remote, callback);
    },

    put: (state, configuration, callback) => {
      if (configuration === null) {
        configuration = state;
      }
      const remote = chooseNode(configuration, "put");
      global.distribution.local.comm.send([state, configuration], remote, callback);
      
    },

    del: (configuration, callback) => {
      const remote = chooseNode(configuration, "del");
      global.distribution.local.comm.send([configuration], remote, callback);
    },

    reconf: (configuration, callback) => {

    },
  };
};

module.exports = mem;
