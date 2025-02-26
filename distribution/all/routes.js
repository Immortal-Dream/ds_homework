/** @typedef {import("../types").Callback} Callback */
const distribution = global.distribution;

function routes(config) {
  const context = {};
  context.gid = config.gid || 'all';


  function put(service, name, callback = () => { }) {
    const message = [service, name];
    const remoteSpec = { service: "routes", method: "put", gid: context.gid };
    // distribution[context.gid]
    distribution[context.gid].comm.send(message, remoteSpec, callback);
  }

  function rem(service, name, callback = () => { }) {
    const message = [service, name];
    const remoteSpec = { service: "routes", method: "rem", gid: context.gid };
    distribution[context.gid].comm.send(message, remoteSpec, callback);
  }

  return { put, rem };
}

module.exports = routes;
