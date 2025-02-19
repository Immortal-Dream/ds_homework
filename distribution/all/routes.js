/** @typedef {import("../types").Callback} Callback */
const distribution = require('../../config.js');
const id = require('../util/id');

function routes(config) {
  const context = {};
  context.gid = config.gid || 'all';


  function put(service, name, callback = () => {}) {
    const message = [service, name];
    const remoteSpec = { service: "routes", method: "put" };
    distribution.all.comm.send(message, remoteSpec, callback);
  }

  function rem(service, name, callback = () => {}) {
    const message = [service, name];
    const remoteSpec = { service: "routes", method: "rem" };
    distribution.all.comm.send(message, remoteSpec, callback);
  }

  return { put, rem };
}

module.exports = routes;
