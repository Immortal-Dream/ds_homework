/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../config.js');

// local.mem.put update same key returns updated value
test('(1 pts) student test', (done) => {
  const key = 'updateKey';
  const user1 = { first: 'Alice', last: 'Smith' };
  const user2 = { first: 'Alice', last: 'Johnson' };

  // First, store user1 under the given key.
  distribution.local.mem.put(user1, key, (e, v) => {
    if (e) return done(e);
    // Then, update the same key with user2.
    distribution.local.mem.put(user2, key, (e, v) => {
      if (e) return done(e);
      // Finally, retrieve the value and ensure it matches user2.
      distribution.local.mem.get(key, (e, v) => {
        try {
          expect(e).toBeFalsy();
          expect(v).toEqual(user2);
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
});

// Idempotence - Putting the same key twice should yield the same stored value.
test('(1 pts) student test', (done) => {
  const key = 'idempotenceTest';
  const user = { first: 'Alice', last: 'Smith' };

  // First put
  distribution.local.mem.put(user, key, (e, v) => {
    if (e) return done(e);
    // Second put with the same value and key
    distribution.local.mem.put(user, key, (e2, v2) => {
      if (e2) return done(e2);
      // Get should return the same user value
      distribution.local.mem.get(key, (e3, v3) => {
        try {
          expect(e3).toBeFalsy();
          expect(v3).toEqual(user);
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
});


test('(1 pts) student test', (done) => {
  const user = { first: 'Test', last: 'User3' };
  const key = 'test_put_del';
  distribution.local.mem.put(user, key, (e, v) => {
    distribution.local.mem.del(key, (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v).toEqual(user);
        // Now attempt to get the key, which should fail.
        distribution.local.mem.get(key, (e, v) => {
          try {
            expect(e).toBeInstanceOf(Error);
            expect(v).toBeFalsy();
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
});

test('(1 pts) student test', (done) => {
  const group = 'storeListTest';
  const key = 'listKey';
  const user = { first: 'Test', last: 'User' };

  // First, ensure the group is initialized and list keys returns (at least) an empty array.
  distribution.local.store.get({ gid: group, key: null }, (e, filesBefore) => {
    try {
      expect(e).toBeFalsy();
      // Now, put a value in the group.
      distribution.local.store.put(user, { gid: group, key: key }, (e, v) => {
        if (e) return done(e);
        // List keys again.
        distribution.local.store.get({ gid: group, key: null }, (e, filesAfter) => {
          try {
            expect(e).toBeFalsy();
            // The stored filename is sanitized.
            const sanitizedKey = key.replace(/[^a-z0-9]/gi, '');
            expect(filesAfter).toEqual(expect.arrayContaining([sanitizedKey]));
            done();
          } catch (error) {
            done(error);
          }
        });
      });
    } catch (error) {
      done(error);
    }
  });
});

test('(1 pts) student test', (done) => {
  const group = 'storeUpdateTest';
  const key = 'updateKey';
  const user1 = { first: 'Initial', last: 'Value' };
  const user2 = { first: 'Updated', last: 'Value' };

  distribution.local.store.put(user1, { gid: group, key: key }, (e, v) => {
    if (e) return done(e);
    // Update the same key with a new value.
    distribution.local.store.put(user2, { gid: group, key: key }, (e, v) => {
      if (e) return done(e);
      // Get the key and check that it now returns the updated value.
      distribution.local.store.get({ gid: group, key: key }, (e, v) => {
        try {
          expect(e).toBeFalsy();
          expect(v).toEqual(user2);
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
});
