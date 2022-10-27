import { exists, empty, isUndefined, isObject,
         map, first, last, traverse,
         nthBitToBool, toUint8Array,
         calculateCRC, typeToAccessor } from '../functions.js';
import { appTypes } from './profiles.js';
import { fit } from './fit.js';
import { localMessageDefinitions } from './local-message-definitions.js';



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

    const ACTIVITY_TYPE = 4;

    function fix(view, activity, summary = {}, check = {}) {
        let duration = fit.summary.getDataRecords(activity).length
        let fixedActivity = activity.reduce((acc, msg) => {
            if(isDataFor(msg, 'file_id')) {
                msg.fields.type = ACTIVITY_TYPE
            }
            if(isDataFor(msg, 'user_profile')) {
                msg.fields.weight = 808
                msg.fields.height = 186
                msg.fields.gender = 1 // male
            }
            if(isDataFor(msg, 'record')) {
                msg.fields.timestamp -= duration--
                msg.fields.distance *= 100
                msg.fields.speed *= 1000
            }

            if(isDataFor(msg, 'lap') || isDataFor(msg, 'session')) {
                check.data[msg.message] = false
                return acc
            }

            if(isDefinitionFor(msg, 'lap') || isDefinitionFor(msg, 'session')) {
                check.definitions[msg.message] = false
                return acc
            }
            acc.push(msg);
            return acc;
        }, [])

        summary = fit.summary.calculate(fixedActivity)
        const footer = fit.summary.toFooter(summary, check);

        // append footer
        footer.forEach((msg) => fixedActivity.push(msg));

        return fixedActivity;
    }

    return Object.freeze({ fix, check, allPass });
}

const fixer = Fixer();

export { fixer };
