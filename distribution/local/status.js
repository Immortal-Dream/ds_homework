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
  if (configuration in global.nodeConfig) {
    callback(null, global.nodeConfig[configuration]);
  } else if (configuration in global.moreStatus) {
    callback(null, global.moreStatus[configuration]);
  } else if (configuration === 'heapTotal') {
    callback(null, process.memoryUsage().heapTotal);
  } else if (configuration === 'heapUsed') {
    callback(null, process.memoryUsage().heapUsed);
  } else {
    callback(new Error('Status configuration not found'));
  }
};


status.spawn = require('@brown-ds/distribution/distribution/local/status').spawn; 
status.stop = require('@brown-ds/distribution/distribution/local/status').stop; 
// status.spawn = function(configuration, callback) {
//   callback = callback || function() { };
//   callback(configuration);
// };

// status.stop = function(callback) {
//   callback = callback || function() { };
//   callback();
// };
module.exports = status;
