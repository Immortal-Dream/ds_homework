/** @typedef {import("../types").Callback} Callback */

/**
 * Routes service: Manages mapping between service names and configurations.
 */
const services = {};
const status = require('./status');
services['status'] = status;

/**
 * Get a service object by name
 * @param {string} configuration
 * @param {Callback} callback
 * @return {void}
 */
function get(configuration, callback) {
    callback = typeof callback === 'function' ? callback : function () { };
    
    // Determine the service name and the group id.
    let serviceName, groupId;
    if (typeof configuration === 'object' && configuration !== null) {
        serviceName = configuration.service;
        groupId = configuration.gid || 'local';
    } else {
        serviceName = configuration;
        groupId = 'local';
    }
    // debug
    // console.log('services: ', services);


    // where to query the gid?
    // Look up in the distributed services for the provided group. TODO: double check this
    if (global.distribution.hasOwnProperty(groupId)) {
        const groupServices = global.distribution[groupId];
        if (serviceName in groupServices) {
            return callback(null, groupServices[serviceName]);
        } else {
            // console.log("group ID:", distribution[groupId]);
            return callback(new Error(`Service '${serviceName}' not found in group '${groupId}'`));
        }
    } else {
        return callback(new Error(`Group '${groupId}' not found in distribution`));
    }

}

/**
 * Register a new service object under a given name.
 * @param {object} service
 * @param {string} configuration
 * @param {Callback} callback
 * @return {void}
 */
function put(service, configuration, callback) {
    callback = typeof callback === 'function' ? callback : function () { };
    services[configuration] = service;
    groupId = configuration.gid || 'local';
    global.distribution[groupId][configuration] = service;
    callback(null, configuration);
}

/**
 * @param {string} configuration
 * @param {Callback} callback
 */
function rem(configuration, callback) {
    callback = typeof callback === 'function' ? callback : function () { };
    if (services.hasOwnProperty(configuration)) {
        const removed = services[configuration];
        delete services[configuration];
        callback(null, removed);
    } else {
        callback(new Error(`Service '${configuration}' not found`));
    }
};

module.exports = { get, put, rem };
