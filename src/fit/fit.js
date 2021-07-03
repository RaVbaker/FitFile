import { exists, map, first, last, nthBitToBool, toUint8Array } from '../functions.js';
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
    const defaultSize = 14;
    const legacySize  = 12;
    const crcLength   = 2;

    function crcIndex(length) {
        return length - crcLength;
    }
    function readProtocolVersion(code) {
        if(code === 32) return '2.0';
        if(code === 16) return '1.0';
        return '';
    }
    function readProfileVersion(code) {
        return (code / 100).toFixed(2);
    }
    function readFileType(view) {
        const charCodes = [
            view.getUint8( 8, true),
            view.getUint8( 9, true),
            view.getUint8(10, true),
            view.getUint8(11, true)];

        return charCodes.reduce((acc, n) => acc+String.fromCharCode(n), '');
    }

    function read(view) {
        const type                = 'header';
        const length              = view.getUint8( 0, true);
        const protocolVersionCode = view.getUint8( 1, true);
        const profileVersionCode  = view.getUint16(2, true);
        const dataRecordsLength   = view.getInt32( 4, true);
        const fileType            = readFileType(view);
        const crc                 = (length === defaultSize) ? view.getUint16(crcIndex(length), true) : false;

        const protocolVersion = readProtocolVersion(protocolVersionCode);
        const profileVersion  = readProfileVersion(profileVersionCode);

        return {
            type,
            protocolVersion,
            profileVersion,
            dataRecordsLength,
            fileType,
            crc,
            length
        };
    };

    function encode(args) {
        const length            = defaultSize;
        const dataRecordsLength = args.fileLength - length - crcLength; // without header and crc
        const protocolVersion   = 32;               // 16 v1, 32 v2
        const profileVersion    = 2140;             // v21.40
        const dataTypeByte      = [46, 70, 73, 84]; // ASCII values for ".FIT"
        let crc                 = 0x0000;           // default value for optional crc of the header of bytes 0-11

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

        crc = calculateCRC(new Uint8Array(view.buffer), 0, crcIndex(length));

        view.setUint16(crcIndex(length), crc, true);

        return new Uint8Array(buffer);
    };

    return Object.freeze({ read, encode });
}

function Header() {

    function getLocalNumber(header) {
        return header & 0b00001111;
    }
    function setLocalNumber(header, number) {
        return header + number;
    }
    function isDefinition(header) {
        return (header.type === 'definition');
    }
    function isData(header) {
        return (header.type === 'data');
    }

    function encode(args) {
        let header = setLocalNumber(0b00000000, args.local_number);
        if(args.type === 'definition') header |= 0b01000000;
        if(args.type === 'data')       header |= 0b00000000;
        return header;
    }

    function read(byte) {
        const header_type  = nthBitToBool(byte, 7) ? 'timestamp' : 'normal';
        const type         = nthBitToBool(byte, 6) ? 'definition' : 'data';
        const local_number = getLocalNumber(byte); // bits 0-3, value 0-15

        return { type, header_type, local_number };
    }

    return Object.freeze({ read, encode, isDefinition, isData });
}

function Definition(args = {}) {
    const headerLength       = 1;
    const fixedContentLength = 6;
    const fieldLength        = 3;
    const architecture       = 0;
    const type               = 'definition';

    function numberToMessage(number) {
        let res = Object.entries(messages)
                        .filter(x => x[1].global_number === number)[0];
        if(res === undefined) console.error(`message global number ${number} not found`);
        return res;
    }
    function messageToNumber(message) {
        let res = messages[message].global_number;
        if(res === undefined) console.error(`message name ${message} not found`);
        return res;
    }
    function getLength(numberOfFields) {
        return fixedContentLength + (numberOfFields * fieldLength);
    }
    function getDataMsgLength(fields) {
        return headerLength + fields.reduce((acc, x) => acc + x.size, 0);
    }

    function read(view, start = 0) {
        const header         = view.getUint8(start, true);
        const local_number   = header & 0b00001111;
        const architecture   = view.getUint8(start+2, true);
        const messageNumber  = view.getUint16(start+3, true);
        const message        = numberToMessage(messageNumber)[0];
        const numberOfFields = view.getUint8(start+5, true);
        const length         = getLength(numberOfFields);

        let fields = [];
        let i = start + fixedContentLength;

        for(let f=0; f < numberOfFields; f++) {
            let fieldView = new DataView(view.buffer.slice(i, i + fieldLength));
            fields.push(fit.fieldDefinition.read(fieldView, message));
            i += fieldLength;
        }

        const data_msg_length = getDataMsgLength(fields);

        return { type, message, local_number, fields, length, data_msg_length };
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
    return Object.freeze({ read, encode, numberToMessage, messageToNumber });
}

function FieldDefinition(args = {}) {

    function numberToField(message, number) {
        const messageFields = messages[message].fields;
        let res = Object.entries(messageFields)
                        .filter(x => x[1].number === number)[0];
        if(res === undefined) console.error(`field number ${number} on message ${message} not found`);
        return res;
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

    return Object.freeze({ read, encode, numberToField });
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

    function read(definition, view, start = 0) {
        const header       = view.getUint8(start, true);
        const local_number = header & 0b00001111;
        const message      = definition.message;

        let index = start + headerLength;
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

function CRC() {

    function read(view, i = 0) {
        let value = view.getUint16(i, true);
        return {type: 'crc', value: value};
    }

    return Object.freeze({ read });
}

function Activity() {
    const headerLength = 1;
    const fileHeaderLength = 14;
    const fileHeaderLegacyLength = 12;
    const crcLength = 2;

    function encode(definitions, values) {
    }

    function read(view) {
        const fitFileHeader = fit.fileHeader.read(view);
        const fileLength    = view.byteLength;

        let i              = fitFileHeader.length;
        let records        = [fitFileHeader];
        let dataMsg        = {};
        let definitions = {};
        let definition  = {};

        function isLastMessage(definition, i) {
            return (i > (fileLength - definition.data_msg_length));
        }
        function isCRC(i) {
            return (fileLength - i) === crcLength;
        }

        while(i < fileLength) {
            try {
                let currentByte = view.getUint8(i, true);
                let header = fit.header.read(currentByte);

                if(isLastMessage(definition, i)) {
                    if(isCRC(i)) {
                        records.push(fit.crc.read(view, i));
                    } else {
                        console.warn(`break: ${i}/${fileLength}`);
                    }
                    break;
                }
                if(fit.header.isDefinition(header)) {
                    definition = fit.definition.read(view, i);
                    definitions[definition.local_number] = definition;
                    records.push(definition);
                    i += definition.length;
                }
                if(fit.header.isData(header)) {
                    definition = definitions[header.local_number];
                    dataMsg = fit.data.read(definition, view, i);
                    records.push(dataMsg);
                    i += definition.data_msg_length;
                }
            } catch(e) {
                console.error(`error ${i}/${fileLength}`, e);
                break;
            }
        }

        return records;
    }

    return Object.freeze({ read, encode });
}

function Summary() {

    function getDataRecords(records) {
        return records.filter(isDataRecord);
    }
    function isDataRecord(record) {
        if(exists(record.type) && exists(record.message)) {
            return (record.type === 'data') && (record.message === 'record');
        }
        return false;
    }
    function accumulate(acc, record) {
        acc.power     += record.fields.power;
        acc.cadence   += record.fields.cadence;
        acc.speed     += record.fields.speed;
        acc.heartRate += record.fields.heart_rate;
        return acc;
    }
    function devideByCount(coll) {
        return function(acc) {
            return Math.floor(acc / coll.length);
        };
    }
    function average(dataRecords) {
        let avgs = {power: 0, cadence: 0, speed: 0, heartRate: 0};
        return map(dataRecords.reduce(accumulate, avgs), devideByCount(dataRecords));
    }
    function calculate(activity) {
        const dataRecords = getDataRecords(activity);

        let res       = average(dataRecords);
        res.distance  = last(dataRecords).fields.distance;
        res.timeStart = first(dataRecords).fields.timestamp;
        res.timeEnd   = last(dataRecords).fields.timestamp;
        res.elapsed   = (res.timeEnd - res.timeStart); // maybe * 1000;

        return res;
    }

    return { calculate, average, getDataRecords, isDataRecord };
}

function Fixer() {
    function getRecordsLength(activity) {
    }

    function fix(view, activity, summary) {
        let buffer     = new ArrayBuffer(view.byteLength + 2);
        let fixedUint8 = new Uint8Array(buffer);
        let fixedView  = new DataView(buffer);

        view.setInt32(4, view.byteLength - activity[0].length, true);

        fixedUint8.set(new Uint8Array(view.buffer), 0);

        let crc = calculateCRC(fixedUint8, 0, fixedUint8.byteLength - 2);

        fixedView.setUint16(fixedView.byteLength - 2, crc, true);

        return fixedView;
    }

    return Object.freeze({ fix });
}

const fit = {
    fileHeader: FileHeader(),
    crc: CRC(),
    header: Header(),
    definition: Definition(),
    fieldDefinition: FieldDefinition(),
    data: Data(),
    summary: Summary(),
    activity: Activity(),
    fixer: Fixer(),
};

const _ = { typeToAccessor };

export { _ , fit };


