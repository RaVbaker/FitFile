import {
    repeat,
    nthBitToBool,
    toUint8Array,
    xor,
} from '../functions.js';
import { messages, basetypes } from './profiles.js';

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
    const uint8   = [0, 2, 7, 10, 13, 'enum', 'uint8', 'string', 'byte'];
    const uint16  = [132, 139, 'uint16', 'uint16z'];
    const uint32  = [134, 140, 'uint32', 'uint32z'];
    const uint64  = [143, 144, 'uint64', 'uint64z'];

    const int8    = [1, 'sint8'];
    const int16   = [131, 'sint16'];
    const int32   = [133, 'sint32'];
    const int64   = [142, 'sint64'];

    const float32 = [136, 'float32'];
    const float64 = [137, 'float64'];

    if(uint8.includes(basetype))   return `${method}Uint8`;
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

function FileHeader(args = {}) {
    const default_size = 14;
    const legacy_size  = 12;
    const crc_length   = 2;

    function crcIndex(length) {
        return length - crc_length;
    }
    function readProtocolVersion(code) {
        if(code === 32) return '2.0';
        if(code === 16) return '1.0';
        return '';
    }
    function readProfileVersion(code) {
        return (code / 100).toFixed(2);
    }
    function read(view) {
        const type                = 'header';
        const length              = view.getUint8(0, true);
        const protocolVersionCode = view.getUint8(1, true);
        const profileVersionCode  = view.getUint16(2, true);
        const dataRecordsLength   = view.getInt32(4, true);
        const crc                 = view.getUint16(crcIndex(length), true);

        const protocolVersion = readProtocolVersion(protocolVersionCode);
        const profileVersion  = readProfileVersion(profileVersionCode);

        return {
            type,
            protocolVersion,
            profileVersion,
            dataRecordsLength,
            crc,
            length
        };
    };
    function encode(args) {
        const length            = default_size;
        const dataRecordsLength = args.fileLength - length - crc_length; // without header and crc
        const protocolVersion   = 32;               // 16 v1, 32 v2
        const profileVersion    = 2140;             // v21.40
        const dataTypeByte      = [46, 70, 73, 84]; // ASCII values for ".FIT"
        const crc               = 0x0000;           // default value for optional crc of the header of bytes 0-11

        let buffer   = new ArrayBuffer(length);
        let view     = new DataView(buffer);

        view.setUint8( 0, length,            true);
        view.setUint8( 1, protocolVersion,   true);
        view.setUint16(2, profileVersion,    true);
        view.setInt32( 4, dataRecordsLength, true);
        view.setUint8( 8, dataTypeByte[0],   true);
        view.setUint8( 9, dataTypeByte[1],   true);
        view.setUint8(10, dataTypeByte[2],   true);
        view.setUint8(11, dataTypeByte[3],   true);

        crc = calculateCRC(view.buffer, 0, crcIndex(length));

        view.setUint16(crcIndex(length), crc, true);

        return new Uint8Array(buffer);
    };

    return Object.freeze({ read, encode });
}

function Definition(args = {}) {
    const headerLength       = 1;
    const fixedContentLength = 6;
    const fieldLength        = 3;
    const architecture       = 0;
    const type               = 'definition';

    function numberToMessage(number) {
        return Object.entries(messages)
                     .filter(x => x[1].global_number === number)[0];
    }
    function messageToNumber(message) {
        return messages[message].global_number;
    }

    function read(view) {
        const header         = view.getUint8(0, true);
        const local_number   = header & 0b00001111;
        const architecture   = view.getUint8(2, true);
        const messageNumber  = view.getUint16(3, true);
        const message        = numberToMessage(messageNumber)[0];
        const numberOfFields = view.getUint8(5, true);

        let fields = [];
        let i = fixedContentLength;

        for(let f=0; f < numberOfFields; f++) {
            let fieldView = new DataView(view.buffer.slice(i, i + fieldLength));
            fields.push(fieldDefinition.read(fieldView, message));
            i += fieldLength;
        }

        return { type, message, local_number, fields };
    }
    function encode(definition) {
        const header         = 64 + definition.local_number;
        const numberOfFields = definition.fields
                                         .reduce((acc, x) => acc+=1, 0);
        const globalNumber   = messageToNumber(definition.message);

        let length = fixedContentLength + (numberOfFields * fieldLength);
        let buffer = new ArrayBuffer(length);
        let view   = new DataView(buffer);

        view.setUint8( 0, header,         true);
        view.setUint8( 1, 0,              true);
        view.setUint8( 2, architecture,   true);
        view.setUint16(3, globalNumber,   true);
        view.setUint8( 5, numberOfFields, true);

        let i = fixedContentLength;
        definition.fields.forEach((field) => {
            view.setUint8(i,field.number,      true);
            view.setUint8(i+1,field.size,      true);
            view.setUint8(i+2,field.base_type, true);
            i += fieldLength;
        });

        return new Uint8Array(buffer);
    }
    return Object.freeze({ read, encode });
}

function FieldDefinition(args = {}) {

    function numberToField(message, number) {
        const messageFields = messages[message].fields;
        return Object.entries(messageFields)
                     .filter(x => x[1].number === number)[0];
    }

    function read(view, messageName) {
        let number    = view.getUint8(0, true);
        let size      = view.getUint8(1, true);
        let base_type = view.getUint8(2, true);
        let field     = numberToField(messageName, number)[0];

        return { field, number, size, base_type };
    }

    function encode(view, definition) {
        throw new Error('Not Implemented!');
    }

    return Object.freeze({ read, encode });
}

function Data() {
    const headerLength = 1;
    const type         = 'data';

    function fieldsToLength(definition) {
        return definition.fields.reduce((acc, field) => acc+field.size, 0);
    }

    function encode(definition, values) {
        const fieldsLength = fieldsToLength(definition);
        const length       = headerLength + fieldsLength;

        let buffer = new ArrayBuffer(length);
        let view   = new DataView(buffer);

        let index    = 0;
        const header = 0 + definition.local_number;

        view.setUint8(index, header, true);
        index += headerLength;

        definition.fields.forEach((field) => {
            view[typeToAccessor(field.base_type, 'set')](index, values[field.field], true);
            index += field.size;
        });

        return new Uint8Array(buffer);
    }
    function read(view, definition) {
        const header       = view.getUint8(0, true);
        const local_number = header & 0b00001111;
        const message      = definition.message;

        let index = headerLength;
        let fields = {};

        definition.fields.forEach((fieldDef) => {
            let value = view[typeToAccessor(fieldDef.base_type, 'get')](index, true);
            fields[fieldDef.field] = value;
            index += fieldDef.size;
        });

        return { type, message, local_number, fields };
    }

    return Object.freeze({ read, encode });
}

function Activity() {
    const headerLength = 1;
    const fileHeaderLength = 14;
    const fileHeaderLegacyLength = 12;
    const crcLength = 2;

    function encode(definitions, values) {
    }
    function read(view) {

    //     while(i < fileLength) {
    //         try {
    //             let currentByte = view.getUint8(i, true);
    //             let header = readHeader(currentByte);

    //             if(isDefinitionHeader(header)) {
    //                 definition = readDefinition(view, i);
    //                 definitions[definition.local_number] = definition;
    //                 records.push(definition);
    //                 i += definition.length;
    //             }
    //             if(isDataHeader(header)) {
    //                 if(i > (fileLength - definition.dataRecordLength)) {
    //                     break;
    //                 }
    //                 definition = definitions[readLocalMsgNumber(view.getUint8(i, true))];
    //                 data = readData(view, i, definition);
    //                 records.push(data);
    //                 i += data.length;
    //             }
    //         } catch(e) {
    //             break;
    //         }
    //     }

    }

    return Object.freeze({ read, encode });
}

function Header() {

    function encode() {
        return;
    }
    function read(byte) {
        const type = 'definition';
        const local_number = 0;

        return {type, local_number};
    }

    return Object.freeze({ read, encode });
}

const fileHeader = FileHeader();
const header = header();
const definition = Definition();
const fieldDefinition = FieldDefinition();
const data = Data();
const activity = Activity();

const fit = {
    fileHeader,
    header,
    definition,
    fieldDefinition,
    data,
    activity
};

const _ = { calculateCRC, typeToAccessor };

export { _ , fit };

