/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../config.js');
const id = distribution.util.id;
const local = distribution.local;

test('(1 pts) student test', (done) => {
  // Attempt to get a non-existent group
  local.groups.get('nonexistent', (e, v) => {
    try {
      expect(e).toBeDefined(); // Error should be defined
      expect(e).toBeInstanceOf(Error); // Should return an error
      expect(v).toBeFalsy(); // Value should be false
      done();
    } catch (error) {
      done(error);
    }
  });
});


test('(1 pts) student test', (done) => {
  // Create a new group with two nodes
  const g = {
    'al57j': {ip: '127.0.0.1', port: 8082},
    'q5mn8': {ip: '127.0.0.1', port: 8083},
  };

  local.groups.put('delta', g, (e, v) => {
    const n3 = {ip: '127.0.0.1', port: 8085};
    
    // Add a new node to the group
    local.groups.add('delta', n3, (e, v) => {
      // Remove the newly added node
      local.groups.rem('delta', id.getSID(n3), (e, v) => {
        const expectedGroup = { ...g };
        
        local.groups.get('delta', (e, v) => {
          try {
            expect(e).toBeFalsy(); // No error should occur
            expect(v).toEqual(expectedGroup); // Group should match original state
            done();
          } catch (error) {
            done(error);
          }
        });
      });
    });
  });
});


test('(1 pts) student test', (done) => {
  // Create and delete a group, then create it again
  const g = {
    'x123a': {ip: '127.0.0.1', port: 8090},
    'z98bc': {ip: '127.0.0.1', port: 8091},
  };

  local.groups.put('theta', g, (e, v) => {
    local.groups.del('theta', (e, v) => {
      local.groups.put('theta', g, (e, v) => {
        local.groups.get('theta', (e, v) => {
          try {
            expect(e).toBeFalsy(); // No error should occur
            expect(v).toBe(g); // The group should be restored
            done();
          } catch (error) {
            done(error);
          }
        });
      });
    });
  });
});

test('(1 pts) student test', (done) => {
  // Create a group and add multiple nodes
  const g = {
    'k1a2b': {ip: '127.0.0.1', port: 8071},
  };

  local.groups.put('sigma', g, (e, v) => {
    const n1 = {ip: '127.0.0.1', port: 8072};
    const n2 = {ip: '127.0.0.1', port: 8073};
    local.groups.add('sigma', n1, (e, v) => {
      local.groups.add('sigma', n2, (e, v) => {
        local.groups.get('sigma', (e, v) => {
          const expectedGroup = {
            ...g, 
            [id.getSID(n1)]: n1,
            [id.getSID(n2)]: n2,
          };
          try {
            expect(e).toBeFalsy(); // No error should occur
            expect(v).toEqual(expectedGroup); // Group should contain all nodes
            done();
          } catch (error) {
            done(error);
          }
        });
      });
    });
  });
});

test('(1 pts) student test', (done) => {
  // Create and delete a group, then try to get it
  const g = {
    'mna5c': {ip: '127.0.0.1', port: 8065},
  };

  local.groups.put('lambda', g, (e, v) => {
    local.groups.del('lambda', (e, v) => {
      local.groups.get('lambda', (e, v) => {
        try {
          expect(e).toBeDefined(); // Error should occur
          expect(e).toBeInstanceOf(Error); // Should return an error
          expect(v).toBeFalsy(); // Value should be false
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
});
