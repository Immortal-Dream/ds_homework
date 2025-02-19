const http = require('http');
const url = require('url');
const log = require('../util/log');
const util = require('../util/util');

const routes = require('./routes');
/*
    The start function will be called to start your node.
    It will take a callback as an argument.
    After your node has booted, you should call the callback.
*/


const start = function (callback) {
  const server = http.createServer((req, res) => {
    /* Your server will be listening for PUT requests. */

    // Write some code...
    if (req.method !== 'PUT') {
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('Method Not Allowed');
      return;
    }

    /*
      The path of the http request will determine the service to be used.
      The url will have the form: http://node_ip:node_port/service/method
    */

    // Write some code...
    const parsedUrl = url.parse(req.url);
    const pathParts = parsedUrl.pathname.split('/').filter(part => part !== '');
    
    let gid, serviceName, methodName;
    if (pathParts.length === 3) {
      // Path has the form /<gid>/<service>/<method>
      [gid, serviceName, methodName] = pathParts;
    } else if (pathParts.length === 2) {
      // Path has the form /<service>/<method>; default gid to "local"
      gid = 'local';
      [serviceName, methodName] = pathParts;
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }

    /*

      A common pattern in handling HTTP requests in Node.js is to have a
      subroutine that collects all the data chunks belonging to the same
      request. These chunks are aggregated into a body variable.

      When the req.on('end') event is emitted, it signifies that all data from
      the request has been received. Typically, this data is in the form of a
      string. To work with this data in a structured format, it is often parsed
      into a JSON object using JSON.parse(body), provided the data is in JSON
      format.

      Our nodes expect data in JSON format.
  */

    // Write some code...
    let body = [];

    req.on('data', (chunk) => {
      // Collect each chunk of data.
      body.push(chunk);
    });

    req.on('end', () => {
      let args;
      try {
        const rawBody = Buffer.concat(body).toString();
        args = util.deserialize(rawBody);
        if (!Array.isArray(args)) {
          throw new Error('Expected an array of arguments');
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(util.serialize({ error: e.message }));
        return;
      }

      // Use routes.get with a configuration object so that the group is respected.
      routes.get({ service: serviceName, gid: gid }, (err, service) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(util.serialize({ error: err.message }));
          return;
        }
  
        const method = service[methodName];
        if (typeof method !== 'function') {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(util.serialize({ error: `Method ${methodName} not found in service ${serviceName}` }));
          return;
        }
  
        try {
          method(...args, (error, value) => {
            if (error) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(util.serialize({ error: error.message }));
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(util.serialize(value));
            }
          });
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(util.serialize({ error: `Internal server error: ${e.message}` }));
        }
      });
    });
  });

  /*
    Your server will be listening on the port and ip specified in the config.
    When the server has successfully started, call the provided callback.
  */
  server.listen(global.nodeConfig.port, global.nodeConfig.ip, () => {
    log(`Server running at http://${global.nodeConfig.ip}:${global.nodeConfig.port}/`);
    global.distribution.node.server = server;
    callback(server);
  });

  server.on('error', (error) => {
    log(`Server error: ${error}`);
    throw error;
  });
};

module.exports = {
  start: start,
};
