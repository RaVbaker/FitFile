import { exists, empty, isUndefined, isObject,
         map, first, last, traverse,
         nthBitToBool, toUint8Array,
         calculateCRC, typeToAccessor } from '../functions.js';
import { appTypes } from './profiles.js';
import { fit } from './fit.js';



function Fixer() {
    function isFileHeader(msg) {
        return msg.type === 'header';
    }

    function isCRC(msg) {
        return msg.type === 'crc';
    }

    function isDefinitionFor(msg, messageName) {
        return msg.type === 'definition' && msg.message === messageName;
    }

    function isDataFor(msg, messageName) {
        return msg.type === 'data' && msg.message === messageName;
    }

    function isEvent(msg, type) {
        if(msg.type === 'data' && msg.message === 'event') {
            return msg.fields.event_type === appTypes.event_type.values[type];
        };
        return false;
    }

    function check(activity) {
        let structure = {
            fileHeader: false,
            crc: false,
            definitions: { fileId: false,
                           event: false,
                           record: false,
                           lap: false,
                           session: false,
                           activity: false },
            data: {
                fileId: false,
                event: {
                    start: false,
                    stop: false
                },
                lap: false,
                session: false,
                activity:false
            }
        };

        return activity.reduce((acc, msg) => {
            if(isFileHeader(msg))                acc.fileHeader = true;
            if(isCRC(msg))                       acc.crc = true;

            if(isDefinitionFor(msg, 'file_id'))  acc.definitions.fileId = true;
            if(isDefinitionFor(msg, 'event'))    acc.definitions.event = true;
            if(isDefinitionFor(msg, 'record'))   acc.definitions.record = true;
            if(isDefinitionFor(msg, 'lap'))      acc.definitions.lap = true;
            if(isDefinitionFor(msg, 'session'))  acc.definitions.session = true;
            if(isDefinitionFor(msg, 'activity')) acc.definitions.activity = true;

            if(isDataFor(msg, 'file_id'))        acc.data.fileId = true;
            if(isEvent(msg, 'start'))            acc.data.event.start = true;
            if(isEvent(msg, 'stop_all'))         acc.data.event.stop = true;
            if(isDataFor(msg, 'lap'))            acc.data.lap = true;
            if(isDataFor(msg, 'session'))        acc.data.session = true;
            if(isDataFor(msg, 'activity'))       acc.data.activity = true;

            return acc;
        }, structure);
    }

    function allPass(check) {

        function accumulate(acc, k, v, obj) {
            acc.push(v);
            return acc;
        }

        return traverse(check, accumulate, []).every(value => value === true);
    }

    function fix(view, activity, summary = {}, check = {}) {
        let footer = fit.summary.toFooter(summary, check);

        // append footer
        footer.forEach((msg) => activity.push(msg));

        return activity;
    }

    return Object.freeze({ fix, check, allPass });
}

const fixer = Fixer();

export { fixer };
