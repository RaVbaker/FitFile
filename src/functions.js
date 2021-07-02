
// Values
function equals(a, b) {
    return Object.is(a, b);
}

function exists(x) {
    if(equals(x, null) || equals(x, undefined)) { return false; }
    return true;
}

// Collections
function isArray(x) {
    return Array.isArray(x);
}

function isObject(x) {
    return equals(typeof x, 'object') && !(isArray(x));
}

function isCollection(x) {
    return isArray(x) || isObject(x);
}

function isString(x) {
    return equals(typeof x, 'string');
}

function isNull(x) {
    return Object.is(x, null);
}

function isUndefined(x) {
    return Object.is(x, undefined);
}

function empty(x) {
    if(isNull(x)) throw new Error(`empty called with null: ${x}`);
    if(!isCollection(x) && !isString(x) && !isUndefined(x)) {
        throw new Error(`empty takes a collection: ${x}`);
    }
    if(isUndefined(x)) return true;
    if(isArray(x))  {
        if(equals(x.length, 0)) return true;
    }
    if(isObject(x)) {
        if(equals(Object.keys(x).length, 0)) return true;
    }
    if(isString(x)) {
        if(equals(x, "")) return true;
    }
    return false;
};

function first(xs) {
    if(!isArray(xs) && !isString(xs) && !isUndefined(xs)) {
        throw new Error(`first takes ordered collection or a string: ${xs}`);
    }
    if(isUndefined(xs)) return undefined;
    if(empty(xs)) return undefined;
    return xs[0];
}

function second(xs) {
    if(!isArray(xs) && !isString(xs) && !isUndefined(xs)) {
        throw new Error(`second takes ordered collection or a string: ${xs}`);
    }
    if(isUndefined(xs)) return undefined;
    if(empty(xs)) return undefined;
    if(xs.length < 2) return undefined;
    return xs[1];
}

function third(xs) {
    if(!isArray(xs) && !isString(xs) && !isUndefined(xs)) {
        throw new Error(`third takes ordered collection or a string: ${xs}`);
    }
    if(isUndefined(xs)) return undefined;
    if(empty(xs)) return undefined;
    if(xs.length < 3) return undefined;
    return xs[2];
}

function last(xs) {
    if(!isArray(xs) && !isString(xs) && !isUndefined(xs)) {
        throw new Error(`last takes ordered collection or a string: ${xs}`);
    }
    if(isUndefined(xs)) return undefined;
    if(empty(xs)) return undefined;
    return xs[xs.length - 1];
}

function getIn(...args) {
    let [collection, ...path] = args;
    return path.reduce((acc, key) => {
        if(acc[key]) return acc[key];
        console.warn(`:getIn 'no such key' :key ${key}`);
        return undefined;
    }, collection);
}

function map(coll, fn) {
    if(isArray(coll)) return coll.map(fn);
    if(isObject(coll)) {
        return Object.fromEntries(
            Object.entries(coll).map(([k, v], i) => [k, (fn(v, k, i))]));
    }
    throw new Error(`map called with unkown collection `, coll);
}

const repeat = n => f => x => {
    if (n > 0)
        return repeat (n - 1) (f) (f (x));
    else
        return x;
};

// Util
function timestampDiff(timestamp1, timestamp2) {
    let difference = (timestamp1 / 1000) - (timestamp2 / 1000);
    return Math.round(Math.abs(difference));
};

const garmin_epoch = Date.parse('31 Dec 1989 00:00:00 GMT');

function toFitTimestamp(timestamp) {
    return Math.round((timestamp - garmin_epoch) / 1000);
}

function toJsTimestamp(fitTimestamp) {
    return (fitTimestamp * 1000) + garmin_epoch;
}

function now() {
    return toFitTimestamp(Date.now());
}

// Bits
function nthBit(field, bit) {
    return (field >> bit) & 1;
};
function bitToBool(bit) {
    return !!(bit);
};
function nthBitToBool(field, bit) {
    return bitToBool(nthBit(field, bit));
}
function xor(view) {
    let cs = 0;
    for (let i=0; i < view.byteLength; i++) {

        cs ^= view.getUint8(i);
    }
    return cs;
}

function getUint16(uint8array, index = 0, endianness = true) {
    let dataview = new DataView(uint8array.buffer);
    return dataview.getUint16(index, dataview, endianness);
}
function getUint32(uint8array, index = 0, endianness = true) {
    let dataview = new DataView(uint8array.buffer);
    return dataview.getUint32(index, dataview, endianness);
}

function fromUint16(n) {
    let buffer = new ArrayBuffer(2);
    let view = new DataView(buffer);
    view.setUint16(0, n, true);
    return view;
}

function fromUint32(n) {
    let buffer = new ArrayBuffer(4);
    let view = new DataView(buffer);
    view.setUint32(0, n, true);
    return view;
}

function toUint8Array(n, type) {
    if(type === 32) return fromUint32(n);
    if(type === 16) return fromUint16(n);
    return n;
}

export {
    // values
    equals,
    exists,

    // collections
    isNull,
    isUndefined,
    isArray,
    isObject,
    isString,
    isCollection,
    first,
    second,
    third,
    last,
    empty,
    getIn,
    map,
    repeat,

    // Util
    timestampDiff,
    toFitTimestamp,
    toJsTimestamp,
    now,

    // Bits
    nthBit,
    nthBitToBool,
    toUint8Array,
    getUint16,
    getUint32,
    xor
}
