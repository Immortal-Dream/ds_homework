/** @typedef {import("../types").Callback} Callback */

/**
 * Routes service: Manages mapping between service names and configurations.
 */
const services = {};


/**
 * Get a service object by name
 * @param {string} configuration
 * @param {Callback} callback
 * @return {void}
 */
function get(configuration, callback) {
    callback = callback || function () { };
    if (!configuration) {
        // check empty cofiguration
        callback(new Error('Configuration is required'));
        return;
    }

    // in route's test, configuration is a string
    // Determine the service name and the group id.
    // BUG, input is the serviceName! "bb66a363220902fa5a0e19d5f8787f43da9b46028848f064ae0fd8e292f199cf"
    let serviceName, groupId;
    if (typeof configuration === 'string') {
        serviceName = configuration;
        groupId = 'local';
    } else {
        serviceName = configuration.service;
        groupId = configuration.gid || 'local';
    }
    // Look up in the distributed services for the provided group. TODO: double check this
    if (!services[groupId] || !(services[groupId][serviceName])) {
        const rpc = global.toLocal[serviceName];
        if (rpc) {
            callback(null, {call: rpc});
            return;
        } else {
            callback(new Error(`Service '${serviceName}' not found`));
            return;
        }
    }
    callback(null, services[groupId][serviceName]);
}

/**
 * Register a new service object under a given name.
 * @param {object} service
 * @param {string} configuration CAN BE A STRING OR OBJECT!!!!!!
 * @param {Callback} callback
 * @return {void}
 */
function put(service, configuration, callback) {
    callback = callback || function () { };
    // edge case check
    if (!configuration || (typeof configuration !== 'object' && typeof configuration !== 'string')) {
        callback(new Error('Configuration is required'));
        return
    }
    if (!service || typeof service !== 'object') {
        callback(new Error('Service object is required'));
        return;
    }
    if (typeof configuration !== 'object') {
        serviceName = configuration.service;
        gid = configuration.gid || 'local';
    } else {
        // Local node configuration
        serviceName = configuration;
        gid = 'local';
    }
    if (!services[gid]) {
        services[gid] = {};
    }
    services[gid][configuration] = service;
    callback(null, configuration);
}

/**
 * @param {string} configuration
 * @param {Callback} callback
 */
function rem(configuration, callback) {
    callback = typeof callback === 'function' ? callback : function () { };
    if (configuration in services && (typeof configuration === 'object' || typeof configuration === 'string')) {
        gid = configuration === 'string'? 'local': configuration.gid;
        serviceName = configuration === 'string'? configuration: configuration.service

        const removed = services[gid][serviceName];
        delete services[gid][serviceName];
        callback(null, removed);
    } else {
        callback(new Error(`Service '${configuration}' not found`));
    }
};

module.exports = { get, put, rem };
