const distribution = require('../../config.js');
const util = distribution.util;

test('(3 pts) (scenario) 40 bytes object', () => {
  /*
          Come up with a JavaScript object, which when serialized,
          will result in a string that is 40 bytes in size.
      */
  let object = "aaa123456789";

  const serialized = util.serialize(object);
  expect(serialized.length).toBe(40);
});

test('(3 pts) (scenario) object fix', () => {
  /* Modify the following object so that when serialized,
           results in the expected string. */

  let object = {a: 'jcerb', b: 1, c: (a, b) => a + b};

  // eslint-disable-next-line
  const serializedObject = '{"type":"object","value":{"a":"{\\"type\\":\\"string\\",\\"value\\":\\"jcerb\\"}","b":"{\\"type\\":\\"number\\",\\"value\\":\\"1\\"}","c":"{\\"type\\":\\"function\\",\\"value\\":\\"(a, b) => a + b\\"}"}}';
  expect(util.serialize(object)).toBe(serializedObject);
});

test('(3 pts) (scenario) string deserialized into target object', () => {
  /*
          Come up with a string that when deserialized, results in the following object:
          {a: 1, b: "two", c: false}
      */

  let string = '{"type":"object","value":{"a":"{\\"type\\":\\"number\\",\\"value\\":\\"1\\"}","b":"{\\"type\\":\\"string\\",\\"value\\":\\"two\\"}","c":"{\\"type\\":\\"boolean\\",\\"value\\":\\"false\\"}"}}';

  const object = {a: 1, b: 'two', c: false};
  const deserialized = util.deserialize(string);
  expect(object).toEqual(deserialized);
});

test('(3 pts) (scenario) object with all supported data types', () => {
/* Come up with an object that uses all valid (serializable)
    built-in data types supported by the serialization library. */
  let object = {
    arr: [1, 2],             // typeof => "object", constructor => "Array"
    date: new Date('2020'),  // typeof => "object", constructor => "Date"
    err: new Error('test'),  // typeof => "object", constructor => "Error"
    obj: {},                 // typeof => "object", constructor => "Object"
    bool: true,              // typeof => "boolean"
    func: function () {},    // typeof => "function"
    nil: null,               // typeof => "object", but is null
    num: 42,                 // typeof => "number"
    str: "hello",            // typeof => "string"
    undef: undefined         // typeof => "undefined"
  };

  const setTypes = new Set();
  for (const k in object) {
    setTypes.add(typeof object[k]);
    if (typeof object[k] == 'object' && object[k] != null) {
      setTypes.add(object[k].constructor.name);
    } else if (typeof object[k] == 'object' && object[k] == null) {
      setTypes.add('null');
    }
  }

  const typeList = Array.from(setTypes).sort();
  const goalTypes = ['Array', 'Date', 'Error', 'Object',
    'boolean', 'function', 'null', 'number', 'object', 'string', 'undefined'];
  expect(typeList).toStrictEqual(goalTypes);

  const serialized = util.serialize(object);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).not.toBeNull();

  // Deleting functions because they are not treated as equivalent by Jest
  for (const k in object) {
    if (typeof object[k] == 'function') {
      delete object[k];
      delete deserialized[k];
    }
  }
  expect(deserialized).toEqual(object);
});

test('(3 pts) (scenario) malformed serialized string', () => {
/* Come up with a string that is not a valid serialized object. */

  let malformedSerializedString = 'not valid JSON !!';


  expect(() => {
    util.deserialize(malformedSerializedString);
  }).toThrow(SyntaxError);
});

// Validates function serialization/deserialization support
test('(student) function serialization/deserialization', () => {
  let object = {
    add: (a, b) => a + b,
    greet: function(name) { return `Hello ${name}`; }
  };

  const serialized = util.serialize(object);
  const deserialized = util.deserialize(serialized);

  expect(deserialized.add(2, 3)).toBe(5);
  expect(deserialized.greet('Alice')).toBe('Hello Alice');
});

// Verifies Date object serialization preserves ISO timestamps
test('(student) date object handling', () => {
  const testDate = new Date('2023-01-01T00:00:00Z');
  const object = { created: testDate };

  const serialized = util.serialize(object);
  const deserialized = util.deserialize(serialized);

  expect(deserialized.created instanceof Date).toBe(true);
  expect(deserialized.created.toISOString()).toBe(testDate.toISOString());
});

// Tests Error object serialization with custom properties
test('(student) error object preservation', () => {
  const testError = new Error('Test message');
  testError.code = 500;
  const object = { error: testError };

  const serialized = util.serialize(object);
  const deserialized = util.deserialize(serialized);

  expect(deserialized.error instanceof Error).toBe(true);
  expect(deserialized.error.message).toBe('Test message');
  expect(deserialized.error.code).toBe(500);
});

// Checks nested object/array structure integrity
test('(student) nested object/array structures', () => {
  const object = {
    users: [
      { id: 1, roles: ['admin', 'user'] },
      { id: 2, roles: ['user'] }
    ],
    metadata: {
      timestamp: new Date(),
      counts: [10, 20, 30]
    }
  };

  const serialized = util.serialize(object);
  const deserialized = util.deserialize(serialized);

  expect(deserialized.users[0].roles).toEqual(['admin', 'user']);
  expect(deserialized.metadata.counts).toEqual([10, 20, 30]);
  expect(deserialized.metadata.timestamp instanceof Date).toBe(true);
});


// Ensures mixed-type array element handling
test('(student) array with mixed types', () => {
  const array = [
    42,
    'test',
    true,
    { key: 'value' },
    new Date('2023-01-01'),
    [1, 2, 3]
  ];

  const serialized = util.serialize(array);
  const deserialized = util.deserialize(serialized);

  expect(deserialized[0]).toBe(42);
  expect(deserialized[3].key).toBe('value');
  expect(deserialized[4] instanceof Date).toBe(true);
  expect(deserialized[5]).toEqual([1, 2, 3]);
});

// Tests empty collection/null value support
test('(student) empty structures handling', () => {
  const object = {
    emptyArray: [],
    emptyObject: {},
    nullValue: null
  };

  const serialized = util.serialize(object);
  const deserialized = util.deserialize(serialized);

  expect(Array.isArray(deserialized.emptyArray)).toBe(true);
  expect(deserialized.emptyArray.length).toBe(0);
  expect(typeof deserialized.emptyObject).toBe('object');
  expect(Object.keys(deserialized.emptyObject).length).toBe(0);
  expect(deserialized.nullValue).toBeNull();
});
// Test for string type
test('(student) basic type: string', () => {
  const value = "Hello, world!";
  const serialized = util.serialize(value);
  const deserialized = util.deserialize(serialized);
  expect(typeof deserialized).toBe("string");
  expect(deserialized).toBe("Hello, world!");
});

// Test for number type
test('(student) basic type: number', () => {
  const value = 12345;
  const serialized = util.serialize(value);
  const deserialized = util.deserialize(serialized);
  expect(typeof deserialized).toBe("number");
  expect(deserialized).toBe(12345);
});

// Test for boolean type
test('(student) basic type: boolean', () => {
  const value = true;
  const serialized = util.serialize(value);
  const deserialized = util.deserialize(serialized);
  expect(typeof deserialized).toBe("boolean");
  expect(deserialized).toBe(true);
});

// Test for undefined
test('(student) basic type: undefined', () => {
  const value = undefined;
  const serialized = util.serialize(value);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toBeUndefined();
});

// Test for null
test('(student) basic type: null', () => {
  const value = null;
  const serialized = util.serialize(value);
  const deserialized = util.deserialize(serialized);
  expect(deserialized).toBeNull();
});