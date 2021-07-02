import { nthBit, getUint16, getUint32 } from '../src/functions.js';
import { app_types } from '../src/fit/profiles.js';
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
                fileType: '.FIT',
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
            fileType: '.FIT',
            crc: false});
    });
});

describe('encodes fit file header', () => {

    let header = fit.fileHeader.encode({fileLength: 116});

    test('default header', () => {
        expect(Array.from(header)).toStrictEqual([14, 32, 92, 8, 100, 0, 0, 0, 46, 70, 73, 84, 63, 224]);
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
    //  res = new Uint8Array([64, 0, 0, 0,0, 5,  4,4,134  , 1,2,132  , 2,2,132  , 5,2,132  , 0,1,0]);

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

describe('encodes Footer', () => {
    const summary = {
        power: 292,
        cadence: 84,
        speed: 9258,
        heartRate: 150,
        distance: 2941,
        timeStart: 965747728,
        timeEnd: 965747731,
        elapsed: 3,
    };

    // 965747728 -> 16,36,144,57,
    // 965747729 -> 17,36,144,57,
    // 965747730 -> 18,36,144,57,
    // 965747731 -> 19,36,144,57,

    describe('encodes event message', () => {
        const eventDefinition = {
            type: 'definition',
            message: 'event',
            local_number: 3,
            length: 6+12,
            data_msg_length: 1+22,
            fields: [
                {field: 'timestamp',   number: 253, size: 4, base_type: 134},
                {field: 'event',       number:   0, size: 1, base_type: 0},
                {field: 'event_type',  number:   1, size: 1, base_type: 0},
                {field: 'event_group', number:  26, size: 1, base_type: 2},
            ]
        };

        const values = {
            timestamp:   summary.timeEnd,
            event:       app_types.event.values.timer, // 0
            event_type:  app_types.event_type.values.stop_all,  // 4
            event_group: 0,
        };

        let event = fit.data.encode(eventDefinition, values);

        let res = [3,  19,36,144,57,  0, 4, 0];
        let view = new DataView(event.buffer);

        test('event message', () => {
            expect(Array.from(event)).toStrictEqual(res);
            expect(view.getUint32(1, true)).toBe(965747731);
            expect(view.getUint8(5, true)).toBe(0);
            expect(view.getUint8(6, true)).toBe(4);
            expect(view.getUint8(7, true)).toBe(0);
        });
    });

    describe('encodes lap message', () => {
        const lapDefinition = {
            type: 'definition',
            message: 'lap',
            local_number: 4,
            length: 6+28,
            data_msg_length: 1+22,
            fields: [
                {field: 'timestamp',          number: 253, size: 4, base_type: 134},
                {field: 'start_time',         number:   2, size: 4, base_type: 134},
                {field: 'total_elapsed_time', number:   7, size: 4, base_type: 134},
                {field: 'total_timer_time',   number:   8, size: 4, base_type: 134},
                {field: 'message_index',      number: 254, size: 2, base_type: 132},
                {field: 'event',              number:   0, size: 1, base_type: 0},
                {field: 'event_type',         number:   1, size: 1, base_type: 0},
                {field: 'event_group',        number:  26, size: 1, base_type: 2},
                {field: 'lap_trigger',        number:  24, size: 1, base_type: 2},
            ]
        };

        const values = {
            timestamp:          summary.timeEnd,
            start_time:         summary.timeStart,
            total_elapsed_time: summary.elapsed,
            total_timer_time:   summary.elapsed,
            message_index:      0,
            event:              app_types.event.values.lap, // 9
            event_type:         app_types.event_type.values.stop,  // 1
            event_group:        0,
            lap_trigger:        app_types.lap_trigger.values.manual, // 0
        };

        let lap = fit.data.encode(lapDefinition, values);

        let res = [4,  19,36,144,57,  16,36,144,57,  3,0,0,0,  3,0,0,0,  0,0, 9, 1, 0, 0];
        let view = new DataView(lap.buffer);

        test('lap message', () => {
            expect(Array.from(lap)).toStrictEqual(res);
            expect(view.getUint32(1, true)).toBe(965747731);
            expect(view.getUint32(5, true)).toBe(965747728);
            expect(view.getUint32(9, true)).toBe(3);
            expect(view.getUint32(13, true)).toBe(3);
            expect(view.getUint16(17, true)).toBe(0);
            expect(view.getUint8(19, true)).toBe(9);
            expect(view.getUint8(20, true)).toBe(1);
            expect(view.getUint8(21, true)).toBe(0);
            expect(view.getUint8(22, true)).toBe(0);
        });
    });

    describe('encodes session message', () => {
        const sessionDefinition = {
            type: 'definition',
            message: 'session',
            local_number: 5,
            length: 6+12,
            data_msg_length: 1+16,
            fields: [
                {field: 'timestamp',          number: 253, size: 4, base_type: 134},
                {field: 'start_time',         number:   2, size: 4, base_type: 134},
                {field: 'total_elapsed_time', number:   7, size: 4, base_type: 134},
                {field: 'total_timer_time',   number:   8, size: 4, base_type: 134},
            ]
        };

        const values = {
            timestamp:          summary.timeEnd,
            start_time:         summary.timeStart,
            total_elapsed_time: summary.elapsed,
            total_timer_time:   summary.elapsed,
        };

        let session = fit.data.encode(sessionDefinition, values);

        let res = [5,  19,36,144,57,  16,36,144,57,  3,0,0,0,  3,0,0,0];
        let view = new DataView(session.buffer);

        test('session message', () => {
            expect(Array.from(session)).toStrictEqual(res);

            expect(view.getUint32(1, true)).toBe(965747731);
            expect(view.getUint32(5, true)).toBe(965747728);
            expect(view.getUint32(9, true)).toBe(3);
            expect(view.getUint32(13, true)).toBe(3);

            // expect(view.getUint8(_, true)).toBe(0);
        });
    });
});

describe('reads Minimal FIT file', () => {
    const records = [
        // header
        [14, 32, 92, 8, 52, 0, 0, 0, 46, 70, 73, 84, 123, 197],
        // definition file id
        [64, 0, 0, 0,0, 5,  4,4,134  , 1,2,132  , 2,2,132  , 5,2,132  , 0,1,0],
        // data file id
        [0, 138,26,40,59,  4,1,  0,0,  0,0,  4],
        // definition record
        [65, 0, 0, 20,0, 2,  253,4,134, 7,2,132],
        // data record
        [1, 138,26,40,59,  44,1],
        // crc
        [242, 7]
    ];
    let recordsLength = records.flat().length;

    let buffer = new Uint8Array([...records.flat()]).buffer;
    let view   = new DataView(buffer);

    let activity = fit.activity.read(view);

    describe('correct input', () => {
        test('length', () => {
            expect(view.byteLength).toBe(68);
        });
    });

    describe('activity length', () => {
        test('length', () => {
            expect(activity.length).toBe(6);
        });
    });

    describe('reads minimal activity', () => {
        test('header', () => {
            expect(activity[0]).toEqual({
                type: 'header',
                length: 14,
                protocolVersion: '2.0',
                profileVersion: '21.40',
                dataRecordsLength: 52,
                fileType: '.FIT',
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
        test('crc', () => {
            expect(activity[5]).toEqual({type: 'crc', value: 2034});
        });
    });
});


describe('makes summary', () => {
    const activity = [
    {type: "header", protocolVersion: "1.0", profileVersion: "1.00", dataRecordsLength: 161521, length: 12, crc: false},
    {type: "definition", message: "file_id", local_number: 0, length: 24, data_msg_length: 16, fields: []},
    {type: "data", message: "file_id", local_number: 0, fields: {}},
    {type: "definition", message: "device_info", local_number: 1, length: 39, data_msg_length: 25, fields: []},
    {type: "data", message: "device_info", local_number: 1, fields: {}},
    {type: "definition", message: "record", local_number: 3, length: 51, data_msg_length: 37, fields: []},
    {type: "definition", message: "event", local_number: 2, length: 24, data_msg_length: 14, fields: []},
    {type: "data", message: "event", local_number: 2, fields: {}},
    {type: "data", message: "record", local_number: 3, fields: {
        timestamp: 965747728, power: 287, cadence: 83, speed: 8908, heart_rate: 150, distance: 103, altitude: 2565,
        position_lat: -138807946, position_long: 1992069714, compressed_speed_distance: 255, cycle_length: 255,
        grade: 32767, resistance: 255, temperature: 127, time_from_course: 2147483647}},

    {type: "data", message: "record", local_number: 3, fields: {
        timestamp: 965747729, power: 291, cadence: 85, speed: 9159, heart_rate: 150, distance: 1094, altitude: 2565,
        position_lat: -138808926, position_long: 1992070093, compressed_speed_distance: 255, cycle_length: 255,
        grade: 32767, resistance: 255, temperature: 127, time_from_course: 2147483647}},

    {type: "data", message: "record", local_number: 3, fields: {
        timestamp: 965747730, power: 290, cadence: 85, speed: 9379, heart_rate: 150, distance: 2014, altitude: 2565,
        position_lat: -138809856, position_long:  1992070426, compressed_speed_distance: 255, cycle_length: 255,
        grade: 32767, resistance: 255, temperature: 127, time_from_course: 2147483647}},

    {type: "data", message: "record", local_number: 3, fields: {
        timestamp: 965747731, power: 300, cadence: 86, speed: 9589, heart_rate: 150, distance: 2941, altitude: 2565,
        position_lat: -138810762, position_long: 1992070836, compressed_speed_distance: 255, cycle_length: 255,
        grade: 32767, resistance: 255, temperature: 127, time_from_course: 2147483647}},
    ];


    test('is data records', () => {
        expect(fit.summary.isDataRecord({})).toBe(false);
        expect(fit.summary.isDataRecord([])).toBe(false);
        expect(fit.summary.isDataRecord({type: 'definition', message: 'record'})).toBe(false);
        expect(fit.summary.isDataRecord({type: 'data', message: 'event'})).toBe(false);
        expect(fit.summary.isDataRecord({type: 'data', message: 'record'})).toBe(true);
    });

    test('filters data records', () => {
        expect(fit.summary.getDataRecords(activity).length).toBe(4);
    });

    test('calculates avarage values', () => {
        let dataRecords = fit.summary.getDataRecords(activity);
        let res = {power: 292, cadence: 84, speed: 9258, heartRate: 150};
        expect(fit.summary.average(dataRecords)).toEqual(res);
    });

    test('summary object', () => {
        let res = {
            power: 292,
            cadence: 84,
            speed: 9258,
            heartRate: 150,
            distance: 2941,
            timeStart: 965747728,
            timeEnd: 965747731,
            elapsed: 3000,
        };
        expect(fit.summary.calculate(activity)).toEqual(res);
    });
});

describe('fixes minimal broken FIT file', () => {
    const records = [
        // header
        [12, 16, 100, 0, 0, 0, 0, 0, 46, 70, 73, 84],
        // definition file id
        [64, 0, 0, 0,0, 5,  4,4,134,  1,2,132,  2,2,132,  5,2,132,  0,1,0],
        // data file id
        [0, 138, 26, 40, 59, 4, 1, 0, 0, 0, 0, 4],
        // definition record
        //                   timestamp,  power, cadence, speed,   hr,   distance
        [65, 0, 0, 20,0, 6,  253,4,134, 7,2,132, 4,1,2, 6,2,132, 3,1,2, 5,4,134],
        // data record
        [1, 138,26,40,59, 44,1, 80, 204,34, 150, 103,0,0,0],
        [1, 139,26,40,59, 45,1, 81, 199,35, 150, 70,4,0,0],
        [1, 140,26,40,59, 44,1, 83, 163,36, 150, 222,7,0,0],
        [1, 141,26,40,59, 48,1, 80, 117,37, 150, 125,11,0,0],
    ];
    let recordsLength = records.flat().length;

    let buffer = new Uint8Array([...records.flat()]).buffer;
    let view   = new DataView(buffer);

    let activity = fit.activity.read(view);
    let summary  = fit.summary.calculate(activity);
    let fixed = fit.fixer.fix(view, activity, summary);

    describe('correct input', () => {
        test('length', () => {
            expect(view.byteLength).toBe(129);
        });
    });

    test('data records length in header', () => {
        expect(fixed.getUint32(4, true)).toBe(129 - 12);
    });

    test('crc at end', () => {
        expect(fixed.getUint16(fixed.byteLength - 2, true)).toBe(35281);
    });
});
