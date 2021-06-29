import { nthBit, getUint16, getUint32 } from '../src/functions.js';
import { _, fit } from '../src/fit/fit.js';



describe('fit base type number to dataview accessor method', () => {
    test('setUint8', () => {
        expect(_.typeToAccessor(0)).toBe('setUint8');
        expect(_.typeToAccessor(2)).toBe('setUint8');
        expect(_.typeToAccessor(7)).toBe('setUint8');
        expect(_.typeToAccessor(10)).toBe('setUint8');
        expect(_.typeToAccessor(13)).toBe('setUint8');
        expect(_.typeToAccessor('enum')).toBe('setUint8');
        expect(_.typeToAccessor('uint8')).toBe('setUint8');
        expect(_.typeToAccessor('string')).toBe('setUint8');
        expect(_.typeToAccessor('byte')).toBe('setUint8');
    });

    test('setUint16', () => {
        expect(_.typeToAccessor(132)).toBe('setUint16');
        expect(_.typeToAccessor(139)).toBe('setUint16');
        expect(_.typeToAccessor('uint16')).toBe('setUint16');
        expect(_.typeToAccessor('uint16z')).toBe('setUint16');
    });

    test('setUint32', () => {
        expect(_.typeToAccessor(134)).toBe('setUint32');
        expect(_.typeToAccessor(140)).toBe('setUint32');
        expect(_.typeToAccessor('uint32')).toBe('setUint32');
        expect(_.typeToAccessor('uint32z')).toBe('setUint32');
    });

    test('setUint64', () => {
        expect(_.typeToAccessor(143)).toBe('setUint64');
        expect(_.typeToAccessor(144)).toBe('setUint64');
        expect(_.typeToAccessor('uint64')).toBe('setUint64');
        expect(_.typeToAccessor('uint64z')).toBe('setUint64');
    });

    test('setInt8', () => {
        expect(_.typeToAccessor(1)).toBe('setInt8');
        expect(_.typeToAccessor('sint8')).toBe('setInt8');
    });

    test('setInt16', () => {
        expect(_.typeToAccessor(131)).toBe('setInt16');
        expect(_.typeToAccessor('sint16')).toBe('setInt16');
    });

    test('setInt32', () => {
        expect(_.typeToAccessor(133)).toBe('setInt32');
        expect(_.typeToAccessor('sint32')).toBe('setInt32');
    });

    test('setInt64', () => {
        expect(_.typeToAccessor(142)).toBe('setInt64');
        expect(_.typeToAccessor('sint64')).toBe('setInt64');
    });

    test('setFloat32', () => {
        expect(_.typeToAccessor(136)).toBe('setFloat32');
        expect(_.typeToAccessor('float32')).toBe('setFloat32');
    });

    test('setFloat64', () => {
        expect(_.typeToAccessor(137)).toBe('setFloat64');
        expect(_.typeToAccessor('float64')).toBe('setFloat64');
    });

    test('getUint16', () => {
        expect(_.typeToAccessor(132, 'get')).toBe('getUint16');
        expect(_.typeToAccessor(139, 'get')).toBe('getUint16');
        expect(_.typeToAccessor('uint16', 'get')).toBe('getUint16');
        expect(_.typeToAccessor('uint16z', 'get')).toBe('getUint16');
    });
});



describe('reads fit file header', () => {

    describe('default header', () => {
        let headerBuffer = new Uint8Array([14, 32, 92, 8, 39, 0, 0, 0, 46, 70, 73, 84, 123, 197]).buffer;
        let view         = new DataView(headerBuffer);

        let header = fit.fileHeader.read(view);
        //  header = {type: 'header', length: 14, protocolVersion: '2.0', profileVersion: '21.40', dataRecordsLength: 39}

        test('reads header', () => {
            expect(header).toEqual({
                type: 'header',
                length: 14,
                protocolVersion: '2.0',
                profileVersion: '21.40',
                dataRecordsLength: 39,
                crc: 50555}); // getUint16(new Uint8Array([123, 197]))

        });
    });

    describe('Zwift (legacy) header', () => {
        let headerBuffer = new Uint8Array([12,16,100, 0,241,118, 2, 0, 46, 70, 73, 84]).buffer;
        let view         = new DataView(headerBuffer);

        let header = fit.fileHeader.read(view);

        expect(header).toEqual({
            type: 'header',
            length: 12,
            protocolVersion: '1.0',
            profileVersion: '1.00',
            dataRecordsLength: 161521,
            crc: false});
    });
});

describe('reads message header', () => {

    describe('definition header', () => {
        let header  = fit.header.read(64); // 0b01000000
        let header1 = fit.header.read(65); // 0b01000001

        test('reads type', () => {
            expect(header).toEqual({type: 'definition', header_type: 'normal', local_number: 0});
        });

        test('reads local message number', () => {
            expect(header1).toEqual({type: 'definition', header_type: 'normal', local_number: 1});
        });
    });

    describe('data header', () => {
        let header  = fit.header.read(0); // 0b00000000
        let header1 = fit.header.read(1); // 0b00000001

        test('reads type', () => {
            expect(header).toEqual({type: 'data', header_type: 'normal', local_number: 0});
        });

        test('reads local message number', () => {
            expect(header1).toEqual({type: 'data', header_type: 'normal', local_number: 1});
        });
    });
});

describe('reads File Id definition message', () => {
    let buffer = new Uint8Array([64, 0, 0, 0,0, 5,  4,4,134  , 1,2,132  , 2,2,132  , 5,2,132  , 0,1,0]).buffer;
    let view = new DataView(buffer);

    let res = fit.definition.read(view);

    test('type', () => {
        expect(res.type).toBe('definition');
    });
    test('message', () => {
        expect(res.message).toBe('file_id');
    });
    test('local message number', () => {
        expect(res.local_number).toBe(0);
    });

    test('field time created', () => {
        expect(res.fields[0]).toEqual({field: 'time_created', number: 4, size: 4, base_type: 134});
    });
    test('field manufacturer', () => {
        expect(res.fields[1]).toEqual({field: 'manufacturer', number: 1, size: 2, base_type: 132});
    });
    test('field product', () => {
        expect(res.fields[2]).toEqual({field: 'product', number: 2, size: 2, base_type: 132});
    });
    test('field number', () => {
        expect(res.fields[3]).toEqual({field: 'number', number: 5, size: 2, base_type: 132});
    });
    test('field type', () => {
        expect(res.fields[4]).toEqual({field: 'type', number: 0, size: 1, base_type: 0});
    });

    test('reads File id', () => {
        expect(res).toEqual({
            type: 'definition',
            message: 'file_id',
            local_number: 0,
            length: 21,
            data_msg_length: 12,
            fields: [
                {field: 'time_created', number: 4, size: 4, base_type: 134},
                {field: 'manufacturer', number: 1, size: 2, base_type: 132},
                {field: 'product',      number: 2, size: 2, base_type: 132},
                {field: 'number',       number: 5, size: 2, base_type: 132},
                {field: 'type',         number: 0, size: 1, base_type: 0}
            ]
        });
    });

});

describe('encodes File Id definition message', () => {
    const fileIdDefinition = {
        type: 'definition',
        message: 'file_id',
        local_number: 0,
        length: 21,
        data_msg_length: 12,
        fields: [
            {field: 'time_created', number: 4, size: 4, base_type: 134},
            {field: 'manufacturer', number: 1, size: 2, base_type: 132},
            {field: 'product',      number: 2, size: 2, base_type: 132},
            {field: 'number',       number: 5, size: 2, base_type: 132},
            {field: 'type',         number: 0, size: 1, base_type: 0},
        ]
    };

    let res = fit.definition.encode(fileIdDefinition);

    // res = new Uint8Array([64, 0, 0, 0,0, 5,  4,4,134  , 1,2,132  , 2,2,132  , 5,2,132  , 0,1,0]);

    describe('definition messege header (byte 0)', () => {
        test('is normal header (bit 7 = 0)', () => {
            expect(nthBit(res[0], 7)).toBe(0);
        });
        test('is definition message header (bit 6 = 1)', () => {
            expect(nthBit(res[0], 6)).toBe(1);
        });
        test('local message number is 0 (bit 0-3 = 0)', () => {
            expect(res[0] & 0b00001111).toBe(0);
        });
    });

    test('reserved byte (byte 1)', () => {
        expect(res[1]).toBe(0);
    });
    test('architecture 0 (byte 2)', () => {
        expect(res[2]).toBe(0);
    });
    test('global message number (byte 3-5)', () => {
        expect(getUint16(res.slice(3, 5))).toBe(0);
    });
    test('number of fields (byte 5)', () => {
        expect(res[5]).toBe(5);
    });

    describe('field time created (byte 6-8)', () => {
        test('field definition number (byte 6)', () => {
            expect(res[6]).toBe(4);
        });
        test('field size (byte 7)', () => {
            expect(res[7]).toBe(4);
        });
        test('field base type (byte 8)', () => {
            expect(res[8]).toBe(134);
        });
    });

});


describe('encodes File Id data message', () => {
    const fileIdDefinition = {
        type: 'definition',
        message: 'file_id',
        local_number: 0,
        length: 21,
        data_msg_length: 12,
        fields: [
            {field: 'time_created', number: 4, size: 4, base_type: 134},
            {field: 'manufacturer', number: 1, size: 2, base_type: 132},
            {field: 'product',      number: 2, size: 2, base_type: 132},
            {field: 'number',       number: 5, size: 2, base_type: 132},
            {field: 'type',         number: 0, size: 1, base_type: 0},
        ]
    };

    const values = {
        time_created: 992483978,
        manufacturer: 260,
        product:      0,
        number:       0,
        type:         4
    };

    let res = fit.data.encode(fileIdDefinition, values);
    //  res = new Uint8Array([0, 138, 26, 40, 59, 4, 1, 0, 0, 0, 0, 4]);

    describe('data messege header (byte 0)', () => {
        test('is normal header (bit 7 = 0)', () => {
            expect(nthBit(res[0], 7)).toBe(0);
        });
        test('is data message header (bit 6 = 0)', () => {
            expect(nthBit(res[0], 6)).toBe(0);
        });
        test('local message number is 0 (bit 0-3 = 0)', () => {
            expect(res[0] & 0b00001111).toBe(0);
        });
    });

    describe('data record content', () => {
        test('time created (byte 1-4)', () => {
            expect(getUint32(res.slice(1,5))).toBe(values.time_created);
        });
        test('manufacturer (byte 5-6)', () => {
            expect(getUint16(res.slice(5,7))).toBe(values.manufacturer);
        });
        test('product (byte 7-8)', () => {
            expect(getUint16(res.slice(7,9))).toBe(values.product);
        });
        test('number (byte 9-10)', () => {
            expect(getUint16(res.slice(9,11))).toBe(values.number);
        });
        test('type (byte 11)', () => {
            expect(res[11]).toBe(values.type);
        });
    });

    test('correct length', () => {
        expect(res.byteLength).toBe(12);
    });
});

describe('reads File Id data message', () => {
    const fileIdDefinition = {
        type: 'definition',
        message: 'file_id',
        local_number: 0,
        length: 21,
        data_msg_length: 12,
        fields: [
            {field: 'time_created', number: 4, size: 4, base_type: 134},
            {field: 'manufacturer', number: 1, size: 2, base_type: 132},
            {field: 'product',      number: 2, size: 2, base_type: 132},
            {field: 'number',       number: 5, size: 2, base_type: 132},
            {field: 'type',         number: 0, size: 1, base_type: 0},
        ],
    };


    let uint8Array = new Uint8Array([0, 138, 26, 40, 59, 4, 1, 0, 0, 0, 0, 4]);
    let view = new DataView(uint8Array.buffer);

    let res = fit.data.read(fileIdDefinition, view);

    //  res = {
    //     type: 'data',
    //     message: 'file_id',
    //     local_number: 0,
    //     fields: {
    //         time_created: 992483978,
    //         manufacturer: 260,
    //         product:      0,
    //         number:       0,
    //         type:         4
    //     }
    // };

    describe('data messege result object', () => {
        test('type', () => {
            expect(res.type).toBe('data');
        });
        test('message', () => {
            expect(res.message).toBe('file_id');
        });
        test('local number', () => {
            expect(res.local_number).toBe(0);
        });
        test('field time created', () => {
            expect(res.fields.time_created).toBe(992483978);
        });
        test('field manufacturer', () => {
            expect(res.fields.manufacturer).toBe(260);
        });
        test('field product', () => {
            expect(res.fields.product).toBe(0);
        });
        test('field number', () => {
            expect(res.fields.number).toBe(0);
        });
        test('field type', () => {
            expect(res.fields.type).toBe(4);
        });
    });
});

describe('reads Minimal FIT file', () => {
    const records = [
        // header
        [14, 32, 92, 8, 39, 0, 0, 0, 46, 70, 73, 84, 123, 197],
        // definition file id
        [64, 0, 0, 0,0, 5,  4,4,134  , 1,2,132  , 2,2,132  , 5,2,132  , 0,1,0],
        // data file id
        [0, 138, 26, 40, 59, 4, 1, 0, 0, 0, 0, 4],
        // definition record
        [65, 0, 0, 20,0, 2,  253,4,134, 7,2,132],
        // data record
        [1, 138, 26, 40, 59, 44, 1],
        // crc
        [133, 21]
    ];
    let recordsLength = records.flat().length;

    let buffer = new Uint8Array([...records.flat()]).buffer;
    let view   = new DataView(buffer);

    let activity = fit.activity.read(view);
    // let crc = _.calculateCRC(new Uint8Array(view.buffer),14, recordsLength - 16);
    // view.setUint16(recordsLength - 2, crc, true);

    describe('correct input', () => {
        test('length', () => {
            expect(view.byteLength).toBe(68);
        });
    });

    describe('activity length', () => {
        test('length', () => {
            expect(activity.length).toBe(5);
        });
    });

    describe('reads minimal activity', () => {
        test('header', () => {
            expect(activity[0]).toEqual({
                type: 'header',
                length: 14,
                protocolVersion: '2.0',
                profileVersion: '21.40',
                dataRecordsLength: 39,
                crc: 50555});
        });
        test('definition file id', () => {
            expect(activity[1]).toEqual({
                type: 'definition', message: 'file_id', local_number: 0,
                length: 21, data_msg_length: 12, fields: [
                    {field: 'time_created', number: 4, size: 4, base_type: 134},
                    {field: 'manufacturer', number: 1, size: 2, base_type: 132},
                    {field: 'product',      number: 2, size: 2, base_type: 132},
                    {field: 'number',       number: 5, size: 2, base_type: 132},
                    {field: 'type',         number: 0, size: 1, base_type: 0},]});
        });

        test('data file id', () => {
            expect(activity[2]).toEqual({
                type: 'data', message: 'file_id', local_number: 0, fields: {
                    time_created: 992483978,
                    manufacturer: 260,
                    product:      0,
                    number:       0,
                    type:         4
                }});
        });
    });
});
