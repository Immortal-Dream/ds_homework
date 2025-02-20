const http = require('http');
const url = require('url');
const log = require('../util/log');
const util = global.distribution.util;
const routes = global.distribution.local.routes;

/**
 * Starts the HTTP server to handle incoming requests.
 * The server listens for PUT requests and routes them to the appropriate service.
 * @param {Function} callback - Callback function executed once the server starts.
 */
const start = function(callback) {
  const server = http.createServer((req, res) => {
    // Only allow PUT requests
    if (req.method !== 'PUT') {
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('Method Not Allowed');
      return;
    }

    // Parse URL to extract gid, service, and method
    const parsedUrl = url.parse(req.url, true);
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);

    if (pathSegments.length < 3) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(util.serialize({ error: "Invalid request format" }));
      return;
    }

    const [gid, service, method] = pathSegments;

    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        // Parse request body
        const parsedBody = util.deserialize(body);
        const args = parsedBody.args || [];

        // Retrieve the requested service based on gid and service name
        routes.get({ service, gid }, (err, serviceObject) => {
          if (err) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(util.serialize({ error: `Service "${service}" not found in gid "${gid}"` }));
            return;
          }

          // Check if the requested method exists in the service
          if (typeof serviceObject[method] !== "function") {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(util.serialize({ error: `Method "${method}" not found in service "${service}"` }));
            return;
          }

          // Execute the requested method and handle response
          serviceObject[method](...args, (error, result) => {
            if (error instanceof Error) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(util.serialize({ error: error, value: undefined }));
              return;
            } 
            console.error(error);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(util.serialize({ error: error, value: result }));
          });
        });

      } catch (err) {
        // Handle JSON parsing errors
        // console.error(err)
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(util.serialize({ err: "Invalid JSON payload" }));
        return;
      }
    });
  });

  // Start the server on the specified IP and port
  server.listen(global.nodeConfig.port, global.nodeConfig.ip, () => {
    log(`Server running at http://${global.nodeConfig.ip}:${global.nodeConfig.port}/`);
    global.distribution.node.server = server;
    callback(server);
    return;
  });

  // Handle server errors
  server.on('error', (error) => {
    log(`Server error: ${error}`);
    throw error;
  });
};

module.exports = {
  start,
};
