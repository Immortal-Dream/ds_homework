/*
    Checklist:

    1. Serialize strings
    2. Serialize numbers
    3. Serialize booleans
    4. Serialize (non-circular) Objects
    5. Serialize (non-circular) Arrays
    6. Serialize undefined and null
    7. Serialize Date, Error objects
    8. Serialize (non-native) functions
    9. Serialize circular objects and arrays
    10. Serialize native functions
*/

const repl = require('repl');
const builtinModules = repl._builtinLibs;

// Built-in registry for known native objects/constructors.
const builtinRegistry = new Map([
  [Object, 'Object'],
  [Array, 'Array'],
  [Object.prototype, 'Object.prototype'],
]);

// Inverse mapping for deserialization.
const builtinInverseRegistry = {
  'Object': Object,
  'Array': Array,
  'Object.prototype': Object.prototype,
};

let idCounter = 0;
let circularReferences = new WeakMap();

/**
 * Serializes a value into a JSON string.
 *
 * @param {*} value - The value to serialize.
 * @returns {string} - The JSON string representation.
 */
// function serialize(value) {
//   circularReferences = new WeakMap();
//   idCounter = 0;
//   const result = serializeHelper(value);
//   return JSON.stringify(result);
// }
/**
 * DEBUG!!!
 */
let serialize = require('@brown-ds/distribution/distribution/util/serialization').serialize;
/**
 * Recursively serializes a value into a structured object representation.
 * Handles primitives, functions, objects, arrays, dates, errors, built-ins, and circular references.
 *
 * @param {*} value - The value to serialize.
 * @returns {object} - The structured serialized representation.
 */
function serializeHelper(value) {
  // Handle null and undefined explicitly.
  if (value === null) return { type: "null" };
  if (value === undefined) return { type: "undefined" };

  // Check if the value is one of the known built-in objects or constructors.
  if (builtinRegistry.has(value)) {
    return { type: 'builtin', name: builtinRegistry.get(value) };
  }

  const type = typeof value;

  // Handle primitive types.
  if (type === 'number') return { type: "number", value: value.toString() };
  if (type === 'string') return { type: "string", value: value };
  if (type === 'boolean') return { type: "boolean", value: value.toString() };

  // Handle functions.
  if (type === 'function') {
    // For functions, first try to locate it in native modules or global objects.
    const funcInfo = findNativeFunctionPath(value);
    if (funcInfo) {
      return { type: 'nativefunction', ...funcInfo };
    } else {
      // If not native, fall back to serializing its string representation.
      return { type: 'function', value: value.toString() };
    }
  }

  // Handle objects (arrays, Date, Error, plain objects, etc.)
  if (type === 'object') {
    // Check for circular references.
    if (circularReferences.has(value)) {
      return { type: "reference", id: circularReferences.get(value) };
    }
    // Assign a unique ID for circular reference resolution.
    const currentId = `id${++idCounter}`;
    circularReferences.set(value, currentId);

    // Special handling for Date objects.
    if (value instanceof Date) {
      return { type: "date", id: currentId, value: value.toISOString() };
    }

    // Special handling for Error objects.
    if (value instanceof Error) {
      return {
        type: "error",
        id: currentId,
        value: {
          name: value.name,
          message: value.message,
          // Include additional enumerable properties.
          ...Object.fromEntries(Object.entries(value))
        }
      };
    }

    // Handling for arrays.
    if (Array.isArray(value)) {
      return {
        type: "array",
        id: currentId,
        value: value.map(serializeHelper)
      };
    }

    // Generic object handling: serialize each own property.
    const obj = {};
    for (const key in value) {
      if (Object.hasOwnProperty.call(value, key)) {
        const serializedValue = serializeHelper(value[key]);
        // Store each property's serialized representation as a JSON string.
        obj[key] = JSON.stringify(serializedValue);
      }
    }
    return { type: "object", id: currentId, value: obj };
  }

  throw new Error(`Unsupported type: ${type}`);
}

/**
 * Recursively searches for the target function within an object.
 * Returns the path (array of property names) if found.
 *
 * @param {object} obj - The object to search.
 * @param {function} targetFunc - The function to locate.
 * @param {WeakSet} visited - Set of visited objects to avoid cycles.
 * @param {Array} path - The current property path.
 * @returns {Array|null} - The path array if found, or null.
 */
function findFunctionInObject(obj, targetFunc, visited = new WeakSet(), path = []) {
  if (visited.has(obj)) return null;
  visited.add(obj);

  if (obj === targetFunc) return path;
  if (typeof obj !== 'object' || obj === null) return null;

  const ownProps = Object.getOwnPropertyNames(obj);
  for (const key of ownProps) {
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    if (desc) {
      if (desc.value !== undefined) {
        if (
          desc.value === targetFunc ||
          (typeof desc.value === 'function' &&
           desc.value.toString() === targetFunc.toString())
        ) {
          return [...path, key];
        }
        if (typeof desc.value === 'object' && desc.value !== null) {
          const result = findFunctionInObject(desc.value, targetFunc, visited, [...path, key]);
          if (result) return result;
        }
      }
      if (desc.get) {
        if (
          desc.get === targetFunc ||
          (typeof desc.get === 'function' &&
           desc.get.toString() === targetFunc.toString())
        ) {
          return [...path, key];
        }
        if (typeof desc.get === 'object' && desc.get !== null) {
          const result = findFunctionInObject(desc.get, targetFunc, visited, [...path, key]);
          if (result) return result;
        }
      }
    }
  }

  // Also search in the object's prototype.
  const proto = Object.getPrototypeOf(obj);
  if (proto) {
    const result = findFunctionInObject(proto, targetFunc, visited, [...path, '__proto__']);
    if (result) return result;
  }

  return null;
}

/**
 * Attempts to locate the native function's path within built-in modules or global objects.
 *
 * @param {function} func - The function to locate.
 * @returns {object|null} - An object with module and path if found, or null.
 */
function findNativeFunctionPath(func) {
  // Explicit check for console.log.
  if (func === console.log) {
    return { module: 'global', path: ['console', 'log'] };
  }
  // Check built-in modules.
  for (const moduleName of builtinModules) {
    try {
      const mod = require(moduleName);
      const path = findFunctionInObject(mod, func);
      if (path) return { module: moduleName, path };
    } catch (e) {
      continue;
    }
  }
  // Check the global object.
  const globalPath = findFunctionInObject(global, func);
  if (globalPath) return { module: 'global', path: globalPath };
  // Check the process object.
  const processPath = findFunctionInObject(process, func);
  if (processPath) return { module: 'process', path: processPath };

  return null;
}

// DEBUG!!!
let deserialize = require('@brown-ds/distribution/distribution/util/serialization').deserialize;
/**
 * Deserializes a JSON string back into the original value.
 *
 * @param {string} serializedString - The JSON string.
 * @returns {*} - The deserialized value.
 */
// function deserialize(serializedString) {
//   let parsed;
//   try {
//     parsed = JSON.parse(serializedString);
//   } catch (e) {
//     throw new SyntaxError("Invalid JSON format");
//   }

//   const objectMap = new Map();
//   return deserializeHelper(parsed, objectMap);
// }

/**
 * Recursively rebuilds the original value from its serialized representation.
 *
 * @param {object} data - The structured serialized data.
 * @param {Map} objectMap - Map to resolve circular references.
 * @returns {*} - The deserialized value.
 */
function deserializeHelper(data, objectMap) {
  if (!data || typeof data !== 'object' || !data.type) {
    throw new Error("Invalid serialized structure");
  }
  switch (data.type) {
    case "null":
      return null;
    case "undefined":
      return undefined;
    case "number":
      return Number(data.value);
    case "string":
      return data.value;
    case "boolean":
      return data.value === "true";
    case "builtin":
      // Return the built-in object or constructor.
      return builtinInverseRegistry[data.name];
    case "function":
      // Rebuild non-native functions via eval (caution: use with trusted input).
      try {
        return eval(`(${data.value})`);
      } catch {
        return () => { throw Error("Deserialization failed") };
      }
    
    // just simply return the stored string representation.
    case "nativefunction":
      if (data.module && data.path) {
        let mod;
        if (data.module === 'global') mod = global;
        else if (data.module === 'process') mod = process;
        else mod = require(data.module);
        let current = mod;
        for (const key of data.path) {
          current = current[key];
          if (current === undefined) throw new Error(`Path ${data.path.join('.')} not found`);
        }
        return current;
      } else {
        return data.value;
      }
    case "date": {
      const date = new Date(data.value);
      if (data.id) objectMap.set(data.id, date);
      return date;
    }
    
    // Reconstruct Error objects.
    case "error": {
      const error = new Error(data.value.message);
      // Apply all properties from the serialized error.
      Object.assign(error, data.value);
      if (data.id) objectMap.set(data.id, error);
      return error;
    }
    
    // Reconstruct arrays.
    case "array": {
      const arr = [];
      if (data.id) objectMap.set(data.id, arr);
      // Map each serialized element back to its value.
      arr.push(...data.value.map(item => deserializeHelper(item, objectMap)));
      return arr;
    }
    
    // Reconstruct generic objects.
    case "object": {
      const obj = {};
      if (data.id) objectMap.set(data.id, obj);
      // Each property was stringified; parse it back before deserializing.
      for (const [key, valueStr] of Object.entries(data.value)) {
        const parsedValue = JSON.parse(valueStr);
        obj[key] = deserializeHelper(parsedValue, objectMap);
      }
      return obj;
    }
    
    // Resolve a reference using the stored object id.
    case "reference": {
      const ref = objectMap.get(data.id);
      if (!ref) throw new Error("Unresolved reference");
      return ref;
    }
    
    default:
      throw new Error(`Unknown type: ${data.type}`);
  }
}

module.exports = {
  serialize: serialize,
  deserialize: deserialize,
};
