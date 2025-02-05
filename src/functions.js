
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

function traverse(obj, fn = ((x) => x), acc = []) {

    function recur(fn, obj, keys, acc) {
        if(empty(keys)) {
            return acc;
        } else {
            let [k, ...ks] = keys;
            let v = obj[k];

            if(isObject(v)) {
                acc = recur(fn, v, Object.keys(v), acc);
                return recur(fn, obj, ks, acc);
            } else {
                acc = fn(acc, k, v, obj);
                return recur(fn, obj, ks, acc);
            }
        }
    }
    return recur(fn, obj, Object.keys(obj), acc);
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

function toFitSpeed(speed, unit = 'kph') {
    const scale = 1000;

    if(unit === 'kph') {
        return parseInt((speed / 3.6) * scale, 10);
    }
    return speed;
}

function toFitDistance(distance, unit = 'km') {
    const scale = 100;

    if(unit === 'km') {
        return parseInt((distance * 1000) * scale, 10);
    }
    return distance;
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

// FIT
function calculateCRC(uint8array, start, end) {
    const crcTable = [
        0x0000, 0xCC01, 0xD801, 0x1400, 0xF001, 0x3C00, 0x2800, 0xE401,
        0xA001, 0x6C00, 0x7800, 0xB401, 0x5000, 0x9C01, 0x8801, 0x4400,
    ];

    let crc = 0;
    for (let i = start; i < end; i++) {
        const byte = uint8array[i];
        let tmp = crcTable[crc & 0xF];
        crc = (crc >> 4) & 0x0FFF;
        crc = crc ^ tmp ^ crcTable[byte & 0xF];
        tmp = crcTable[crc & 0xF];
        crc = (crc >> 4) & 0x0FFF;
        crc = crc ^ tmp ^ crcTable[(byte >> 4) & 0xF];
    }

    return crc;
}

function typeToAccessor(basetype, method = 'set') {
    const uint8   = [0, 2, 10, 13, 'enum', 'uint8', 'uint8z', 'byte'];
    const uint16  = [132, 139, 'uint16', 'uint16z'];
    const uint32  = [134, 140, 'uint32', 'uint32z'];
    const uint64  = [143, 144, 'uint64', 'uint64z'];
    const strings   = [7, 'string'];
    
    const int8    = [1, 'sint8'];
    const int16   = [131, 'sint16'];
    const int32   = [133, 'sint32'];
    const int64   = [142, 'sint64'];

    const float32 = [136, 'float32'];
    const float64 = [137, 'float64'];

    if(uint8.includes(basetype))   return `${method}Uint8`;
    // if(strings.includes(basetype))   return `${method}String`;
    if(uint16.includes(basetype))  return `${method}Uint16`;
    if(uint32.includes(basetype))  return `${method}Uint32`;
    if(uint64.includes(basetype))  return `${method}Uint64`;
    if(int8.includes(basetype))    return `${method}Int8`;
    if(int16.includes(basetype))   return `${method}Int16`;
    if(int32.includes(basetype))   return `${method}Int32`;
    if(int64.includes(basetype))   return `${method}Int64`;
    if(float32.includes(basetype)) return `${method}Float32`;
    if(float64.includes(basetype)) return `${method}Float64`;

    return `${method}Uint8`;
}

function readString(buf, byteOffset, bytesToRead, terminator){
    var str = "";
    var byteLength = 0;
    byteOffset = byteOffset || 0;
    var nullTerm = false;
    if(typeof bytesToRead === "undefined"){
        nullTerm = true;
        bytesToRead = buf.byteLength - buf.byteOffset;
    }
    var charCode;
    for(var i = 0; i < bytesToRead; i++){
        charCode = buf.getUint8(i + byteOffset);
        byteLength++;
        if(nullTerm && charCode === terminator){
            break;
        }
        str += String.fromCharCode(charCode);
    }
    str = str.split('\u0000')[0]
    byteLength = str.length
    return {
        str: str, 
        byteLength: byteLength
    };
}

function writeString(buf, byteOffset, byteLength, value){
    let i, chr;
    for(i = 0; i < value.length && byteOffset + i < byteLength; i++){
        chr = value.charCodeAt(i);
        if(chr > 255){
            chr = "?".charCodeAt(0);
        }
        buf.setUint8(byteOffset + i, chr);
    }
    
    return i;
}

function powerToZone(value, ftp) {
    const zones = ['one', 'two', 'three', 'four', 'five', 'six', 'seven'];
    const zwiftPercentages = {'one': 0.60, 'two': 0.75, 'three': 0.89, 'four': 1.04, 'five': 1.18};

    let name = zones[0];
    if(value < (ftp * zwiftPercentages.one)) {
        name = zones[0];
    } else if(value < (ftp * zwiftPercentages.two)) {
        name = zones[1];
    } else if(value < (ftp * zwiftPercentages.three)) {
        name = zones[2];
    } else if(value < (ftp * zwiftPercentages.four)) {
        name = zones[3];
    } else if(value < (ftp * zwiftPercentages.five)) {
        name = zones[4];
    } else {
        name = zones[5];
    }
    return name;
}



function XF(args = {}) {
    let data = {};
    let name = args.name || 'db';

    function create(obj) {
        data = proxify(obj);
    }

    function proxify(obj) {
        let handler = {
            set: (target, key, value) => {
                target[key] = value;
                dispatch(`${name}:${key}`, target);
                return true;
            }
        };
        return new Proxy(obj, handler);
    }

    function dispatch(eventType, value) {
        document.dispatchEvent(evt(eventType)(value));
    }

    function sub(eventType, handler, element = false) {
        if(element) {
            element.addEventListener(eventType, handler, true);
            return handler;
        } else {
            function handlerWraper(e) {
                if(isStoreSource(eventType)) {
                    handler(e.detail.data[evtProp(eventType)]);
                } else {
                    handler(e.detail.data);
                }
            }

            document.addEventListener(eventType, handlerWraper, true);

            return handlerWraper;
        }
    }

    function reg(eventType, handler) {
        document.addEventListener(eventType, e => handler(e.detail.data, data));
    }

    function unsub(eventType, handler, element = false) {
        if(element) {
            element.removeEventListener(eventType, handler, true);
        } else {
            document.removeEventListener(eventType, handler, true);
        }
    }

    function isStoreSource(eventType) {
        return equals(evtSource(eventType), name);
    }

    function evt(eventType) {
        return function(value) {
            return new CustomEvent(eventType, {detail: {data: value}});
        };
    }

    function evtProp(eventType) {
        return second(eventType.split(':'));
    }

    function evtSource(eventType) {
        return first(eventType.split(':'));
    }

    return Object.freeze({ create, reg, sub, dispatch, unsub });
}

const xf = XF();

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
    traverse,
    repeat,

    // Util
    timestampDiff,
    toFitTimestamp,
    toJsTimestamp,
    now,
    toFitSpeed,
    toFitDistance,

    // Bits
    nthBit,
    nthBitToBool,
    toUint8Array,
    getUint16,
    getUint32,
    xor,

    // FIT
    calculateCRC,
    typeToAccessor,
    readString,
    writeString,

    // XF
    xf
}
