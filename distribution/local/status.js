const status = {};

global.moreStatus = {
  sid: distribution.util.id.getSID(global.nodeConfig),
  nid: distribution.util.id.getNID(global.nodeConfig),
  ip: global.nodeConfig && global.nodeConfig.ip || '127.0.0.1',
  port: global.nodeConfig && global.nodeConfig.port || 3000,
  counts: 0,
};

status.get = function (configuration, callback) {
  callback = callback || function () { };
  // Check if the requested configuration is in the global status
  if (global.moreStatus.hasOwnProperty(configuration)) {
    callback(null, global.moreStatus[configuration]);
    return;
  }

  // Check if the requested configuration is in the process memory usage
  if (configuration === 'heapTotal') {
    callback(null, process.memoryUsage().heapTotal);
    return;
  }
  if (configuration === 'heapUsed') {
    callback(null, process.memoryUsage().heapUsed);
    return;
  }
  callback(new Error('Status key not found'));
};


// status.spawn = require('@brown-ds/distribution/distribution/local/status').spawn; 
// status.stop = require('@brown-ds/distribution/distribution/local/status').stop; 
status.spawn = function(configuration, callback) {
  callback = callback || function() { };
  callback(configuration);
};

status.stop = function(callback) {
  callback = callback || function() { };
  callback();
};
module.exports = status;
