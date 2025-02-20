const http = require("http");
const util = global.distribution.util;

function send(message, remote, callback = () => {}) {
  try {
    if (!remote || !remote.node || !remote.service || !remote.method) {
      callback(new Error("Invalid remote target information"));
      return;
    }

    if (!global.nodeConfig) {
      callback(new Error("Global node configuration is missing"));
      return;
    }

    // Ensure proper gid handling
    const gid = remote.gid || "local";  
    const path = `/${gid}/${remote.service}/${remote.method}`;

    // Prepare request payload
    const payload = util.serialize({ args: message });

    const options = {
      hostname: remote.node.ip,
      port: remote.node.port,
      path: path,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
      timeout: 5000, // Added timeout
    };


    const req = http.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 404) {
          callback(new Error(`Service "${remote.service}" not found in gid "${gid}"`));
          return;
        }

        if (res.statusCode < 200 || res.statusCode >= 300) {
          callback(new Error(`HTTP error: ${res.statusCode} - ${responseData}`));
          return;
        }

        try {
          const result = util.deserialize(responseData);
          if (result.error instanceof Error) {
            callback(new Error(result.error));
            return;
          }
          callback(result.error, result.value);
          return;
        } catch (err) {
          callback(new Error("Failed to parse server response"));
          return;
        }
      });
    });

    req.on("error", (err) => callback(new Error(`Request error: ${err.message}`)));

    req.write(payload);
    req.end();
  } catch (error) {
    callback(new Error("Unexpected error in comm.send: " + error.message));
    return;
  }
}

module.exports = { send };
