/** @typedef {import("../types").Callback} Callback */
const groups = require("../local/groups");


/**
 * NOTE: This Target is slightly different from local.all.Target
 * @typedef {Object} Target
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
    callback = callback || function () { };

    const group = groups.get(context.gid, (error, value) => console.log(value));
    targetNodes = Object.keys(group);
    // Total number of nodes needed to be sent
    const total = targetNodes.length;

    // If there is no node, just return with Null
    if (total === 0) {
      return callback({}, {});
    }

    // Initialize the object with aggregate error and result
    let pending = total;
    const aggregatedErrors = {};
    const aggregatedResults = {};

    // Call local comm method for each target node
    targetNodes.forEach(nodeId => {
      const nodeInfo = group[nodeId];
      const remote = {
        node: nodeInfo,
        service: configuration.service,
        method: configuration.method
      };

      global.distribution.local.comm.send(message, remote, (error, result) => {
        if (error) {
          aggregatedErrors[nodeId] = error;
        } else {
          aggregatedResults[nodeId] = result;
        }
        pending--;
        // Return aggregated results after getting reponses from all nodes.
        if (pending === 0) {
          callback(aggregatedErrors, aggregatedResults);
        }
      });
    });
  }

  return { send };
};

module.exports = comm;
