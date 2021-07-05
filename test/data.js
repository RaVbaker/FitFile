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

const data = {
    activity
};

export { data };
