/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../config.js');
const local = distribution.local;
const http = require('http');
const routes = local.routes;

test('(1 pts) student test', (done) => {
    const message = { foo: 'bar' };

    // Create a temporary HTTP server to mock a remote service
    const server = http.createServer((req, res) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            // Simulate a correct response
            const responseObj = { success: true, received: true };
            const responseBody = distribution.util.serialize(responseObj);
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(responseBody)
            });
            res.end(responseBody);
        });
    });

    // Listen on a random available port
    server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        // Construct the remote object for the send function
        const node = {
            host: '127.0.0.1',
            port: port,
            gid: 'test' // Custom gid, defaults to "local" if not specified
        };
        const remote = {
            node: node,
            service: 'testService',
            method: 'testMethod'
        };

        // Call send() and check if it correctly processes the response
        distribution.local.comm.send(message, remote, (err, result) => {
            try {
                expect(err).toBeNull();
                expect(result).toEqual({ success: true, received: true });
                server.close(done);
            } catch (error) {
                server.close(() => done(error));
            }
        });
    });
});

// Test Case 2: send() should return an error when the remote node responds with a non-200 status code.
test('(1 pts) student test', (done) => {
    const message = { foo: 'bar' };

    // Create a temporary HTTP server to simulate an error response
    const server = http.createServer((req, res) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            // Simulate an error response (e.g., 404 Not Found)
            const errorResponse = { error: 'Not Found' };
            const responseBody = distribution.util.serialize(errorResponse);
            res.writeHead(404, {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(responseBody)
            });
            res.end(responseBody);
        });
    });

    server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        const node = {
            host: '127.0.0.1',
            port: port,
            gid: 'test'
        };
        const remote = {
            node: node,
            service: 'testService',
            method: 'testMethod'
        };

        // Call send() and verify that it correctly handles the error
        distribution.local.comm.send(message, remote, (err, result) => {
            try {
                expect(err).toBeTruthy();
                expect(err).toBeInstanceOf(Error);
                expect(err.message).toContain('Request failed with status code 404');
                expect(result).toBeFalsy();
                server.close(done);
            } catch (error) {
                server.close(() => done(error));
            }
        });
    });
});

// Test case for status.get(unknownKey): Ensure it returns an error for an unknown status key
test('(1 pts) student test', (done) => {
    local.status.get('unknownKey', (e, v) => {
        try {
            expect(e).toBeDefined();
            expect(e).toBeInstanceOf(Error);
            expect(v).toBeFalsy(); // Should not return a value for an unknown key
            done();
        } catch (error) {
            done(error);
        }
    });
});
// Test case for get(): Successfully retrieving a registered service
test('(1 pts) student test', (done) => {
    const status = { status: 'active' }; // Mock status object

    // First, register the service to ensure it exists
    routes.put(status, 'status', (e, v) => {
        expect(e).toBeFalsy();

        routes.get('status', (e, v) => {
            try {
                expect(e).toBeFalsy();
                expect(v).toBe(status); // The retrieved object should be the same reference
                done();
            } catch (error) {
                done(error);
            }
        });
    });
});

// Test case for put(): Adding a new service successfully
test('(1 pts) student test', (done) => {
    const testService = { foo: 'bar' };

  routes.put(testService, 'testService', (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toBe('testService'); // Ensure the service name is returned

      // Verify the service was correctly stored
      routes.get('testService', (e, v) => {
        try {
          expect(e).toBeFalsy();
          expect(v).toBe(testService);
          done();
        } catch (error) {
          done(error);
        }
      });
    } catch (error) {
      done(error);
    }
  });
});