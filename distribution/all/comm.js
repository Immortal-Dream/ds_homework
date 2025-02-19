/** @typedef {import("../types").Callback} Callback */
const id = distribution.util.id;
/**
 * NOTE: This Target is slightly different from local.all.Target
 * @typdef {Object} Target
 * @property {string} service
 * @property {string} method
 */

/**
 * @param {object} config
 * @return {object}
 */
function comm(config) {
  const context = {};
  context.gid = config.gid || 'all';
  
  /**
   * @param {Array} message
   * @param {object} configuration
   * @param {Callback} callback
   */
  function send(message, configuration, callback) {
    let targetNodes = [];

    // add nodes to targetNodes
    
    targetNodes.push(configuration.node);

    // If there are no target nodes, immediately invoke the callback.
    if (targetNodes.length === 0) {
      return callback({}, {});
    }
    // Prepare objects to collect aggregated errors and results.
    const aggregatedErrors = {};
    const aggregatedResults = {};
    let count = 0;

    targetNodes.forEach((node) => {
      const remote = {
        node: node,
        service: configuration.service,
        method: configuration.method,
      };
      distribution.local.comm.send(message, remote, (error, result) => {
        if (error) {
          aggregatedErrors[node.nid] = error;
        } else {
          aggregatedResults[node.nid] = result;
        }
        count++;
        if (count === targetNodes.length) {
          callback(aggregatedErrors, aggregatedResults);
        }
      });
    });

  }

  return { send };
};

module.exports = comm;
