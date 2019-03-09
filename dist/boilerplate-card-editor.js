import { a as LitElement, b as html, c as css, d as __decorate, e as property, f as customElement } from './chunk-23407cba.js';

/**
 * Define a struct error.
 *
 * @type {StructError}
 */

class StructError extends TypeError {
  static format(attrs) {
    const { type, path, value } = attrs;
    const message = `Expected a value of type \`${type}\`${path.length ? ` for \`${path.join('.')}\`` : ''} but received \`${JSON.stringify(value)}\`.`;
    return message;
  }

  constructor(attrs) {
    const message = StructError.format(attrs);
    super(message);

    const { data, path, value, reason, type, errors = [] } = attrs;
    this.data = data;
    this.path = path;
    this.value = value;
    this.reason = reason;
    this.type = type;
    this.errors = errors;

    if (!errors.length) {
      errors.push(this);
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error().stack;
    }
  }
}

var toString = Object.prototype.toString;

var kindOf = function kindOf(val) {
  if (val === void 0) return 'undefined';
  if (val === null) return 'null';

  var type = typeof val;
  if (type === 'boolean') return 'boolean';
  if (type === 'string') return 'string';
  if (type === 'number') return 'number';
  if (type === 'symbol') return 'symbol';
  if (type === 'function') {
    return isGeneratorFn(val) ? 'generatorfunction' : 'function';
  }

  if (isArray(val)) return 'array';
  if (isBuffer(val)) return 'buffer';
  if (isArguments(val)) return 'arguments';
  if (isDate(val)) return 'date';
  if (isError(val)) return 'error';
  if (isRegexp(val)) return 'regexp';

  switch (ctorName(val)) {
    case 'Symbol': return 'symbol';
    case 'Promise': return 'promise';

    // Set, Map, WeakSet, WeakMap
    case 'WeakMap': return 'weakmap';
    case 'WeakSet': return 'weakset';
    case 'Map': return 'map';
    case 'Set': return 'set';

    // 8-bit typed arrays
    case 'Int8Array': return 'int8array';
    case 'Uint8Array': return 'uint8array';
    case 'Uint8ClampedArray': return 'uint8clampedarray';

    // 16-bit typed arrays
    case 'Int16Array': return 'int16array';
    case 'Uint16Array': return 'uint16array';

    // 32-bit typed arrays
    case 'Int32Array': return 'int32array';
    case 'Uint32Array': return 'uint32array';
    case 'Float32Array': return 'float32array';
    case 'Float64Array': return 'float64array';
  }

  if (isGeneratorObj(val)) {
    return 'generator';
  }

  // Non-plain objects
  type = toString.call(val);
  switch (type) {
    case '[object Object]': return 'object';
    // iterators
    case '[object Map Iterator]': return 'mapiterator';
    case '[object Set Iterator]': return 'setiterator';
    case '[object String Iterator]': return 'stringiterator';
    case '[object Array Iterator]': return 'arrayiterator';
  }

  // other
  return type.slice(8, -1).toLowerCase().replace(/\s/g, '');
};

function ctorName(val) {
  return val.constructor ? val.constructor.name : null;
}

function isArray(val) {
  if (Array.isArray) return Array.isArray(val);
  return val instanceof Array;
}

function isError(val) {
  return val instanceof Error || (typeof val.message === 'string' && val.constructor && typeof val.constructor.stackTraceLimit === 'number');
}

function isDate(val) {
  if (val instanceof Date) return true;
  return typeof val.toDateString === 'function'
    && typeof val.getDate === 'function'
    && typeof val.setDate === 'function';
}

function isRegexp(val) {
  if (val instanceof RegExp) return true;
  return typeof val.flags === 'string'
    && typeof val.ignoreCase === 'boolean'
    && typeof val.multiline === 'boolean'
    && typeof val.global === 'boolean';
}

function isGeneratorFn(name, val) {
  return ctorName(name) === 'GeneratorFunction';
}

function isGeneratorObj(val) {
  return typeof val.throw === 'function'
    && typeof val.return === 'function'
    && typeof val.next === 'function';
}

function isArguments(val) {
  try {
    if (typeof val.length === 'number' && typeof val.callee === 'function') {
      return true;
    }
  } catch (err) {
    if (err.message.indexOf('callee') !== -1) {
      return true;
    }
  }
  return false;
}

/**
 * If you need to support Safari 5-7 (8-10 yr-old browser),
 * take a look at https://github.com/feross/is-buffer
 */

function isBuffer(val) {
  if (val.constructor && typeof val.constructor.isBuffer === 'function') {
    return val.constructor.isBuffer(val);
  }
  return false;
}

/**
 * A private string to identify structs by.
 *
 * @type {String}
 */

const IS_STRUCT = '@@__STRUCT__@@';

/**
 * A private string to refer to a struct's kind.
 *
 * @type {String}
 */

const KIND = '@@__KIND__@@';

/**
 * Check if a `value` is a struct.
 *
 * @param {Any} value
 * @return {Boolean}
 */

function isStruct(value) {
  return !!(value && value[IS_STRUCT]);
}

/**
 * Resolve `defaults`, for an optional `value`.
 *
 * @param {Function|Any} defaults
 * @param {Any} value
 * @return {Any}
 */

function resolveDefaults(defaults, value) {
  return typeof defaults === 'function' ? defaults(value) : defaults;
}

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

/**
 * Kind.
 *
 * @type {Kind}
 */

class Kind {
  constructor(name, type, validate) {
    this.name = name;
    this.type = type;
    this.validate = validate;
  }
}

/**
 * Any.
 *
 * @param {Array|Function|Object|String} schema
 * @param {Any} defaults
 * @param {Object} options
 */

function any(schema, defaults$$1, options) {
  if (isStruct(schema)) {
    return schema[KIND];
  }

  if (schema instanceof Kind) {
    return schema;
  }

  switch (kindOf(schema)) {
    case 'array':
      {
        return schema.length > 1 ? tuple(schema, defaults$$1, options) : list(schema, defaults$$1, options);
      }

    case 'function':
      {
        return func(schema, defaults$$1, options);
      }

    case 'object':
      {
        return object(schema, defaults$$1, options);
      }

    case 'string':
      {
        let required = true;
        let type;

        if (schema.endsWith('?')) {
          required = false;
          schema = schema.slice(0, -1);
        }

        if (schema.includes('|')) {
          const scalars = schema.split(/\s*\|\s*/g);
          type = union(scalars, defaults$$1, options);
        } else if (schema.includes('&')) {
          const scalars = schema.split(/\s*&\s*/g);
          type = intersection(scalars, defaults$$1, options);
        } else {
          type = scalar(schema, defaults$$1, options);
        }

        if (!required) {
          type = optional(type, undefined, options);
        }

        return type;
      }
  }

  if (process.env.NODE_ENV !== 'production') {
    throw new Error(`A schema definition must be an object, array, string or function, but you passed: ${schema}`);
  } else {
    throw new Error(`Invalid schema: ${schema}`);
  }
}

/**
 * Dict.
 *
 * @param {Array} schema
 * @param {Object} defaults
 * @param {Object} options
 */

function dict(schema, defaults$$1, options) {
  if (kindOf(schema) !== 'array' || schema.length !== 2) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(`Dict structs must be defined as an array with two elements, but you passed: ${schema}`);
    } else {
      throw new Error(`Invalid schema: ${schema}`);
    }
  }

  const obj = scalar('object', undefined, options);
  const keys = any(schema[0], undefined, options);
  const values = any(schema[1], undefined, options);
  const name = 'dict';
  const type = `dict<${keys.type},${values.type}>`;
  const validate = value => {
    const resolved = resolveDefaults(defaults$$1);
    value = resolved ? _extends({}, resolved, value) : value;
    const [error] = obj.validate(value);

    if (error) {
      error.type = type;
      return [error];
    }

    const ret = {};
    const errors = [];

    for (let k in value) {
      const v = value[k];
      const [e, r] = keys.validate(k);

      if (e) {
        const allE = e.errors || [e];
        allE.forEach(singleE => {
          singleE.path = [k].concat(singleE.path);
          singleE.data = value;
          errors.push(singleE);
        });
        continue;
      }

      k = r;
      const [e2, r2] = values.validate(v);

      if (e2) {
        const allE2 = e2.errors || [e2];
        allE2.forEach(singleE => {
          singleE.path = [k].concat(singleE.path);
          singleE.data = value;
          errors.push(singleE);
        });
        continue;
      }

      ret[k] = r2;
    }

    if (errors.length) {
      const first = errors[0];
      first.errors = errors;
      return [first];
    }

    return [undefined, ret];
  };

  return new Kind(name, type, validate);
}

/**
 * Enum.
 *
 * @param {Array} schema
 * @param {Any} defaults
 * @param {Object} options
 */

function en(schema, defaults$$1, options) {
  if (kindOf(schema) !== 'array') {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(`Enum structs must be defined as an array, but you passed: ${schema}`);
    } else {
      throw new Error(`Invalid schema: ${schema}`);
    }
  }

  const name = 'enum';
  const type = schema.map(s => {
    try {
      return JSON.stringify(s);
    } catch (e) {
      return String(s);
    }
  }).join(' | ');

  const validate = (value = resolveDefaults(defaults$$1)) => {
    return schema.includes(value) ? [undefined, value] : [{ data: value, path: [], value, type }];
  };

  return new Kind(name, type, validate);
}

/**
 * Enums.
 *
 * @param {Array} schema
 * @param {Any} defaults
 * @param {Object} options
 */

function enums(schema, defaults$$1, options) {
  const e = en(schema, undefined, options);
  const l = list([e], defaults$$1, options);
  return l;
}

/**
 * Function.
 *
 * @param {Function} schema
 * @param {Any} defaults
 * @param {Object} options
 */

function func(schema, defaults$$1, options) {
  if (kindOf(schema) !== 'function') {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(`Function structs must be defined as a function, but you passed: ${schema}`);
    } else {
      throw new Error(`Invalid schema: ${schema}`);
    }
  }

  const name = 'function';
  const type = '<function>';
  const validate = (value = resolveDefaults(defaults$$1), data) => {
    const result = schema(value, data);
    let failure = { path: [], reason: null };
    let isValid;

    switch (kindOf(result)) {
      case 'boolean':
        {
          isValid = result;
          break;
        }
      case 'string':
        {
          isValid = false;
          failure.reason = result;
          break;
        }
      case 'object':
        {
          isValid = false;
          failure = _extends({}, failure, result);
          break;
        }
      default:
        {
          if (process.env.NODE_ENV !== 'production') {
            throw new Error(`Validator functions must return a boolean, an error reason string or an error reason object, but you passed: ${schema}`);
          } else {
            throw new Error(`Invalid result: ${result}`);
          }
        }
    }

    return isValid ? [undefined, value] : [_extends({ type, value, data: value }, failure)];
  };

  return new Kind(name, type, validate);
}

/**
 * Instance.
 *
 * @param {Array} schema
 * @param {Any} defaults
 * @param {Object} options
 */

function instance(schema, defaults$$1, options) {
  const name = 'instance';
  const type = `instance<${schema.name}>`;
  const validate = (value = resolveDefaults(defaults$$1)) => {
    return value instanceof schema ? [undefined, value] : [{ data: value, path: [], value, type }];
  };

  return new Kind(name, type, validate);
}

/**
 * Interface.
 *
 * @param {Object} schema
 * @param {Object} defaults
 * @param {Object} options
 */

function inter(schema, defaults$$1, options) {
  if (kindOf(schema) !== 'object') {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(`Interface structs must be defined as an object, but you passed: ${schema}`);
    } else {
      throw new Error(`Invalid schema: ${schema}`);
    }
  }

  const ks = [];
  const properties = {};

  for (const key in schema) {
    ks.push(key);
    const s = schema[key];
    const kind = any(s, undefined, options);
    properties[key] = kind;
  }

  const name = 'interface';
  const type = `{${ks.join()}}`;
  const validate = value => {
    const resolved = resolveDefaults(defaults$$1);
    value = resolved ? _extends({}, resolved, value) : value;
    const errors = [];
    const ret = value;

    for (const key in properties) {
      let v = value[key];
      const kind = properties[key];

      if (v === undefined) {
        const d = defaults$$1 && defaults$$1[key];
        v = resolveDefaults(d, value);
      }

      const [e, r] = kind.validate(v, value);

      if (e) {
        const allE = e.errors || [e];
        allE.forEach(singleE => {
          singleE.path = [key].concat(singleE.path);
          singleE.data = value;
          errors.push(singleE);
        });
        continue;
      }

      if (key in value || r !== undefined) {
        ret[key] = r;
      }
    }

    if (errors.length) {
      const first = errors[0];
      first.errors = errors;
      return [first];
    }

    return [undefined, ret];
  };

  return new Kind(name, type, validate);
}

/**
 * Lazy.
 *
 * @param {Function} schema
 * @param {Any} defaults
 * @param {Object} options
 */

function lazy(schema, defaults$$1, options) {
  if (kindOf(schema) !== 'function') {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(`Lazy structs must be defined as an function that returns a schema, but you passed: ${schema}`);
    } else {
      throw new Error(`Invalid schema: ${schema}`);
    }
  }

  let kind;
  let struct;
  const name = 'lazy';
  const type = `lazy...`;
  const compile = value => {
    struct = schema();
    kind.name = struct.kind;
    kind.type = struct.type;
    kind.validate = struct.validate;
    return kind.validate(value);
  };

  kind = new Kind(name, type, compile);
  return kind;
}

/**
 * List.
 *
 * @param {Array} schema
 * @param {Array} defaults
 * @param {Object} options
 */

function list(schema, defaults$$1, options) {
  if (kindOf(schema) !== 'array' || schema.length !== 1) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(`List structs must be defined as an array with a single element, but you passed: ${schema}`);
    } else {
      throw new Error(`Invalid schema: ${schema}`);
    }
  }

  const array = scalar('array', undefined, options);
  const element = any(schema[0], undefined, options);
  const name = 'list';
  const type = `[${element.type}]`;
  const validate = (value = resolveDefaults(defaults$$1)) => {
    const [error, result] = array.validate(value);

    if (error) {
      error.type = type;
      return [error];
    }

    value = result;
    const errors = [];
    const ret = [];

    for (let i = 0; i < value.length; i++) {
      const v = value[i];
      const [e, r] = element.validate(v);

      if (e) {
        const allE = e.errors || [e];
        allE.forEach(singleE => {
          singleE.path = [i].concat(singleE.path);
          singleE.data = value;
          errors.push(singleE);
        });
        continue;
      }

      ret[i] = r;
    }

    if (errors.length) {
      const first = errors[0];
      first.errors = errors;
      return [first];
    }

    return [undefined, ret];
  };

  return new Kind(name, type, validate);
}

/**
 * Literal.
 *
 * @param {Array} schema
 * @param {Any} defaults
 * @param {Object} options
 */

function literal(schema, defaults$$1, options) {
  const name = 'literal';
  const type = `literal: ${JSON.stringify(schema)}`;
  const validate = (value = resolveDefaults(defaults$$1)) => {
    return value === schema ? [undefined, value] : [{ data: value, path: [], value, type }];
  };

  return new Kind(name, type, validate);
}

/**
 * Object.
 *
 * @param {Object} schema
 * @param {Object} defaults
 * @param {Object} options
 */

function object(schema, defaults$$1, options) {
  if (kindOf(schema) !== 'object') {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(`Object structs must be defined as an object, but you passed: ${schema}`);
    } else {
      throw new Error(`Invalid schema: ${schema}`);
    }
  }

  const obj = scalar('object', undefined, options);
  const ks = [];
  const properties = {};

  for (const key in schema) {
    ks.push(key);
    const s = schema[key];
    const kind = any(s, undefined, options);
    properties[key] = kind;
  }

  const name = 'object';
  const type = `{${ks.join()}}`;
  const validate = (value = resolveDefaults(defaults$$1)) => {
    const [error] = obj.validate(value);

    if (error) {
      error.type = type;
      return [error];
    }

    const errors = [];
    const ret = {};
    const valueKeys = Object.keys(value);
    const propertiesKeys = Object.keys(properties);
    const keys = new Set(valueKeys.concat(propertiesKeys));

    keys.forEach(key => {
      let v = value[key];
      const kind = properties[key];

      if (v === undefined) {
        const d = defaults$$1 && defaults$$1[key];
        v = resolveDefaults(d, value);
      }

      if (!kind) {
        const e = { data: value, path: [key], value: v };
        errors.push(e);
        return;
      }

      const [e, r] = kind.validate(v, value);

      if (e) {
        const allE = e.errors || [e];
        allE.forEach(singleE => {
          singleE.path = [key].concat(singleE.path);
          singleE.data = value;
          errors.push(singleE);
        });
        return;
      }

      if (key in value || r !== undefined) {
        ret[key] = r;
      }
    });

    if (errors.length) {
      const first = errors[0];
      first.errors = errors;
      return [first];
    }

    return [undefined, ret];
  };

  return new Kind(name, type, validate);
}

/**
 * Optional.
 *
 * @param {Any} schema
 * @param {Any} defaults
 * @param {Object} options
 */

function optional(schema, defaults$$1, options) {
  return union([schema, 'undefined'], defaults$$1, options);
}

/**
 * Partial.
 *
 * @param {Object} schema
 * @param {Object} defaults
 * @param {Object} options
 */

function partial(schema, defaults$$1, options) {
  if (kindOf(schema) !== 'object') {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(`Partial structs must be defined as an object, but you passed: ${schema}`);
    } else {
      throw new Error(`Invalid schema: ${schema}`);
    }
  }

  const obj = scalar('object', undefined, options);
  const ks = [];
  const properties = {};

  for (const key in schema) {
    ks.push(key);
    const s = schema[key];
    const kind = any(s, undefined, options);
    properties[key] = kind;
  }

  const name = 'partial';
  const type = `{${ks.join()},...}`;
  const validate = (value = resolveDefaults(defaults$$1)) => {
    const [error] = obj.validate(value);

    if (error) {
      error.type = type;
      return [error];
    }

    const errors = [];
    const ret = {};

    for (const key in properties) {
      let v = value[key];
      const kind = properties[key];

      if (v === undefined) {
        const d = defaults$$1 && defaults$$1[key];
        v = resolveDefaults(d, value);
      }

      const [e, r] = kind.validate(v, value);

      if (e) {
        const allE = e.errors || [e];
        allE.forEach(singleE => {
          singleE.path = [key].concat(singleE.path);
          singleE.data = value;
          errors.push(singleE);
        });
        continue;
      }

      if (key in value || r !== undefined) {
        ret[key] = r;
      }
    }

    if (errors.length) {
      const first = errors[0];
      first.errors = errors;
      return [first];
    }

    return [undefined, ret];
  };

  return new Kind(name, type, validate);
}

/**
 * Scalar.
 *
 * @param {String} schema
 * @param {Any} defaults
 * @param {Object} options
 */

function scalar(schema, defaults$$1, options) {
  if (kindOf(schema) !== 'string') {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(`Scalar structs must be defined as a string, but you passed: ${schema}`);
    } else {
      throw new Error(`Invalid schema: ${schema}`);
    }
  }

  const { types } = options;
  const fn = types[schema];

  if (kindOf(fn) !== 'function') {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(`No struct validator function found for type "${schema}".`);
    } else {
      throw new Error(`Invalid type: ${schema}`);
    }
  }

  const kind = func(fn, defaults$$1, options);
  const name = 'scalar';
  const type = schema;
  const validate = value => {
    const [error, result] = kind.validate(value);

    if (error) {
      error.type = type;
      return [error];
    }

    return [undefined, result];
  };

  return new Kind(name, type, validate);
}

/**
 * Tuple.
 *
 * @param {Array} schema
 * @param {Array} defaults
 * @param {Object} options
 */

function tuple(schema, defaults$$1, options) {
  if (kindOf(schema) !== 'array') {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(`Tuple structs must be defined as an array, but you passed: ${schema}`);
    } else {
      throw new Error(`Invalid schema: ${schema}`);
    }
  }

  const kinds = schema.map(s => any(s, undefined, options));
  const array = scalar('array', undefined, options);
  const name = 'tuple';
  const type = `[${kinds.map(k => k.type).join()}]`;
  const validate = (value = resolveDefaults(defaults$$1)) => {
    const [error] = array.validate(value);

    if (error) {
      error.type = type;
      return [error];
    }

    const ret = [];
    const errors = [];
    const length = Math.max(value.length, kinds.length);

    for (let i = 0; i < length; i++) {
      const kind = kinds[i];
      const v = value[i];

      if (!kind) {
        const e = { data: value, path: [i], value: v };
        errors.push(e);
        continue;
      }

      const [e, r] = kind.validate(v);

      if (e) {
        const allE = e.errors || [e];
        allE.forEach(singleE => {
          singleE.path = [i].concat(singleE.path);
          singleE.data = value;
          errors.push(singleE);
        });
        continue;
      }

      ret[i] = r;
    }

    if (errors.length) {
      const first = errors[0];
      first.errors = errors;
      return [first];
    }

    return [undefined, ret];
  };

  return new Kind(name, type, validate);
}

/**
 * Union.
 *
 * @param {Array} schema
 * @param {Any} defaults
 * @param {Object} options
 */

function union(schema, defaults$$1, options) {
  if (kindOf(schema) !== 'array') {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(`Union structs must be defined as an array, but you passed: ${schema}`);
    } else {
      throw new Error(`Invalid schema: ${schema}`);
    }
  }

  const kinds = schema.map(s => any(s, undefined, options));
  const name = 'union';
  const type = kinds.map(k => k.type).join(' | ');
  const validate = (value = resolveDefaults(defaults$$1)) => {
    const errors = [];

    for (const k of kinds) {
      const [e, r] = k.validate(value);

      if (!e) {
        return [undefined, r];
      }

      errors.push(e);
    }
    errors[0].type = type;
    return errors;
  };

  return new Kind(name, type, validate);
}

/**
 * Intersection.
 *
 * @param {Array} schema
 * @param {Any} defaults
 * @param {Object} options
 */

function intersection(schema, defaults$$1, options) {
  if (kindOf(schema) !== 'array') {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(`Intersection structs must be defined as an array, but you passed: ${schema}`);
    } else {
      throw new Error(`Invalid schema: ${schema}`);
    }
  }

  const types = schema.map(s => any(s, undefined, options));
  const name = 'intersection';
  const type = types.map(t => t.type).join(' & ');
  const validate = (value = resolveDefaults(defaults$$1)) => {
    let v = value;

    for (const t of types) {
      const [e, r] = t.validate(v);

      if (e) {
        e.type = type;
        return [e];
      }

      v = r;
    }

    return [undefined, v];
  };

  return new Kind(name, type, validate);
}

/**
 * Kinds.
 *
 * @type {Object}
 */

const Kinds = {
  any,
  dict,
  enum: en,
  enums,
  function: func,
  instance,
  interface: inter,
  lazy,
  list,
  literal,
  object,
  optional,
  partial,
  scalar,
  tuple,
  union,
  intersection

  /**
   * Export.
   *
   * @type {Object}
   */

};

/**
 * The types that `kind-of` supports.
 *
 * @type {Array}
 */

const TYPES = ['arguments', 'array', 'boolean', 'buffer', 'error', 'float32array', 'float64array', 'function', 'generatorfunction', 'int16array', 'int32array', 'int8array', 'map', 'null', 'number', 'object', 'promise', 'regexp', 'set', 'string', 'symbol', 'uint16array', 'uint32array', 'uint8array', 'uint8clampedarray', 'undefined', 'weakmap', 'weakset'];

/**
 * The default types that Superstruct ships with.
 *
 * @type {Object}
 */

const Types = {
  any: value => value !== undefined
};

TYPES.forEach(type => {
  Types[type] = value => kindOf(value) === type;
});

/**
 * Handle the 'date' case specially, to throw out invalid `Date` objects.
 *
 * @param {Mixed} value
 * @return {Boolean}
 */

Types.date = value => kindOf(value) === 'date' && !isNaN(value);

/**
 * Create a struct factory with a `config`.
 *
 * @param {Object} config
 * @return {Function}
 */

function superstruct(config = {}) {
  const types = _extends({}, Types, config.types || {});

  /**
   * Create a `kind` struct with `schema`, `defaults` and `options`.
   *
   * @param {Any} schema
   * @param {Any} defaults
   * @param {Object} options
   * @return {Function}
   */

  function struct(schema, defaults$$1, options = {}) {
    if (isStruct(schema)) {
      schema = schema.schema;
    }

    const kind = Kinds.any(schema, defaults$$1, _extends({}, options, { types }));

    function Struct(data) {
      if (this instanceof Struct) {
        if (process.env.NODE_ENV !== 'production') {
          throw new Error('The `Struct` creation function should not be used with the `new` keyword.');
        } else {
          throw new Error('Invalid `new` keyword!');
        }
      }

      return Struct.assert(data);
    }

    Object.defineProperty(Struct, IS_STRUCT, { value: true });
    Object.defineProperty(Struct, KIND, { value: kind });

    Struct.kind = kind.name;
    Struct.type = kind.type;
    Struct.schema = schema;
    Struct.defaults = defaults$$1;
    Struct.options = options;

    Struct.assert = value => {
      const [error, result] = kind.validate(value);

      if (error) {
        throw new StructError(error);
      }

      return result;
    };

    Struct.test = value => {
      const [error] = kind.validate(value);
      return !error;
    };

    Struct.validate = value => {
      const [error, result] = kind.validate(value);

      if (error) {
        return [new StructError(error)];
      }

      return [undefined, result];
    };

    return Struct;
  }

  /**
   * Mix in a factory for each specific kind of struct.
   */

  Object.keys(Kinds).forEach(name => {
    const kind = Kinds[name];

    struct[name] = (schema, defaults$$1, options) => {
      const type = kind(schema, defaults$$1, _extends({}, options, { types }));
      const s = struct(type, defaults$$1, options);
      return s;
    };
  });

  /**
   * Return the struct factory.
   */

  return struct;
}

/**
 * Create a convenience `struct` factory for the default types.
 *
 * @type {Function}
 */

const struct = superstruct();

const cardConfigStruct = superstruct({
    type: "string",
    name: "string?",
    show_error: "boolean?",
    show_warning: "boolean?"
});
let BoilerplateCardEditor = class BoilerplateCardEditor extends LitElement {
    constructor() {
        super(...arguments);
        this._fireEvent = (node, type, detail, options) => {
            options = options || {};
            detail = detail === null || detail === undefined ? {} : detail;
            const event = new Event(type, {
                bubbles: options.bubbles === undefined ? true : options.bubbles,
                cancelable: Boolean(options.cancelable),
                composed: options.composed === undefined ? true : options.composed
            });
            event.detail = detail;
            node.dispatchEvent(event);
            return event;
        };
    }
    setConfig(config) {
        config = cardConfigStruct(config);
        this._config = config;
    }
    get _name() {
        return this._config.name || "";
    }
    get _show_error() {
        return this._config.show_error || false;
    }
    get _show_warning() {
        return this._config.show_warning || false;
    }
    render() {
        if (!this.hass) {
            return html ``;
        }
        return html `
      <mwc-switch>sentiment_very_satisfied</mwc-switch>
    `;
        // return html`
        //   <div class="card-config">
        //     <paper-input
        //       label="Name (Optional)"
        //       .value="${this._name}"
        //       .configValue="${' name'}"
        //       @value-changed="${this._valueChanged}"
        //     ></paper-input>
        //     <div class="side-by-side">
        //       <paper-toggle-button
        //         ?checked="${this._show_error !== false}"
        //         .configValue="${'show_error'}"
        //         @change="${this._valueChanged}"
        //         >Show Error?</paper-toggle-button
        //       >
        //       <paper-toggle-button
        //         ?checked="${this._show_warning !== false}"
        //         .configValue="${'show_warning'}"
        //         @change="${this._valueChanged}"
        //         >Show Warning?</paper-toggle-button
        //       >
        //     </div>
        //   </div>
        // `;
    }
    static get styles() {
        return css `
      paper-toggle-button {
        padding-top: 16px;
      }
      .side-by-side {
        display: flex;
      }
      .side-by-side > * {
        flex: 1;
        padding-right: 4px;
      }
    `;
    }
    _valueChanged(ev) {
        if (!this._config || !this.hass) {
            return;
        }
        const target = ev.target;
        if (this[`_${target.configValue}`] === target.value ||
            this[`_${target.configValue}`] === target.config) {
            return;
        }
        if (target.configValue) {
            if (target.value === "") {
                delete this._config[target.configValue];
            }
            else {
                this._config = Object.assign({}, this._config, { [target.configValue]: target.checked !== undefined ? target.checked : target.value });
            }
        }
        this._fireEvent(this, "config-changed", { config: this._config }, undefined);
    }
};
__decorate([
    property()
], BoilerplateCardEditor.prototype, "hass", void 0);
__decorate([
    property()
], BoilerplateCardEditor.prototype, "_config", void 0);
BoilerplateCardEditor = __decorate([
    customElement("boilerplate-card-editor")
], BoilerplateCardEditor);

export { BoilerplateCardEditor };
