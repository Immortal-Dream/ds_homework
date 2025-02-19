const distribution = require('../../config.js');

/**
 * Distributed status service.
 *
 * @param {object} config - Configuration object. Expected to include a 'gid' property.
 * @return {object} - An object with distributed status methods: get, spawn, stop.
 */
const status = function(config) {
  const context = {};
  // Use provided group id or default to 'all'
  context.gid = config.gid || 'all';

  return {
    /**
     * Retrieves and aggregates status information from all nodes in the group.
     * Each node is expected to return an object with properties:
     *   - count
     *   - heapTotal
     *   - heapUsed
     *
     * The responses are aggregated by summing the corresponding fields.
     *
     * @param {object} configuration - Additional configuration if needed.
     * @param {import("../types").Callback} callback - Callback invoked with aggregated results.
     */
    get: (configuration, callback) => {
      // Use the distributed comm service to send a "get" request.
      distribution[context.gid].comm.send(
        ["get"],
        { service: "status", method: "get" },
        (errMap, resultMap) => {
          // Aggregate results from all nodes.
          let aggregated = { count: 0, heapTotal: 0, heapUsed: 0 };
          for (const sid in resultMap) {
            const res = resultMap[sid];
            aggregated.count += res.count || 0;
            aggregated.heapTotal += res.heapTotal || 0;
            aggregated.heapUsed += res.heapUsed || 0;
          }
          // Return aggregated result.
          callback(errMap, aggregated);
        }
      );
    },

    spawn: (configuration, callback) => {
    },

    stop: (callback) => {
    },
  };
};

module.exports = status;

