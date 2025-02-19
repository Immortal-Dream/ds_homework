const serialize = require('./serialization').serialize;
const deserialize = require('./serialization').deserialize;
const id = require('./id');
const log = require('./log');

global.rpc = global.rpc || {};

/**
 * create a RPC stub on this node for other nodes to call.
 * The passed function (func) is the original function that will be executed on
 * this node. The returned stub (after placeholder replacement) is sent to remote
 * nodes so that when they invoke it, the proper node configuration and method
 * identifier are embedded.
 *
 * @param {Function} func - The function to be remotely callable (should be async).
 * @return {Function} - The RPC stub function.
 */
function createRPC(func) {
  // Generate a unique remote method identifier (pointer) for this function.
  const methodId = id.getRID();
  log(`Creating RPC stub for function ${func.name || '<anonymous>'} with methodId: ${methodId}`);

  // Register the actual function in our global RPC mapping so that remote calls can look it up.
  global.rpc[methodId] = func;

  // Define the stub function that will be serialized and sent to remote nodes.
  const stub = function (...args) {
    // Extract callback (assumed to be the last argument); if none, use a no-op.
    const callback = args.pop() || function () {};
    
    // Build a remote descriptor with placeholders. Note that the placeholders will be
    // replaced in the serialized form.
    const remote = {
      node: '__NODE_INFO__',
      service: 'rpc',
      method: '__METHOD_ID__',
    };

    // Send the arguments (already serialized by the comm layer) to the remote endpoint.
    // The remote endpoint is expected to lookup the function via global.rpc[methodId].
    global.distribution.local.comm.send(args, remote, callback);
  };

  // Serialize the stub function.
  let serializedStub = serialize(stub);

  // Prepare the node configuration literal.
  // We replace double quotes with single quotes to match the placeholders’ format.
  const nodeConfigLiteral = JSON.stringify(global.nodeConfig).replace(/"/g, '\'');

  // Replace the placeholders with actual values:
  // - '__NODE_INFO__' is replaced with the node's config literal.
  // - '__METHOD_ID__' is replaced with the method identifier.
  serializedStub = serializedStub
    .replace(/'__NODE_INFO__'/g, nodeConfigLiteral)
    .replace(/'__METHOD_ID__'/g, `'${methodId}'`);

  // Return the deserialized stub so that the remote node receives a function with
  // the proper node information and method identifier.
  return deserialize(serializedStub);
}

/**
 * toAsync converts a synchronous function that returns a value into an asynchronous
 * one that takes a callback as its last argument.
 *
 * @param {Function} func - The synchronous function.
 * @return {Function} - The asynchronous version of the function.
 */
function toAsync(func) {
  return function (...args) {
    const callback = args.pop() || function () {};
    try {
      const result = func(...args);
      callback(null, result);
    } catch (error) {
      callback(error);
    }
  };
}

module.exports = {
  createRPC: createRPC,
  toAsync: toAsync,
};