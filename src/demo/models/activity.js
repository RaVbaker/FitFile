import { fileHandler } from '../file.js';
import { fit } from '../../fit/fit.js';
import { fixer } from '../../fit/fixer.js';
import { xf, isString, isObject } from '../../functions.js';

function Activity() {
    let file = false;
    let fileName = '';
    let fixedFile = false;
    let activity = [];
    let summary = {};
    let fixedActivity = [];
    let dataRecords = [];

    xf.sub('ui:file-download', function (e) {
        download();
    });

    xf.sub('ui:json-export', function (e) {
        jsonExport();
    });

    async function read(blob) {
        let res = await fileHandler.read(blob);

        file = res;
        fileName = blob.name.replace(/.fit|.json/g,'');;

        console.log(blob);

        if(isString(file)) {
            openJSON(res);
        }

        if(isObject(file)) {
            openFIT(res);
        }

        return res;
    }

    function openJSON(file) {
        xf.dispatch('file:start');
        console.log(`${file.length} bytes`, file);

        try {
            const activity = JSON.parse(file);
            const check = fixer.check(activity);

            console.log('uploaded json activity ---->');
            console.log(activity);
            console.log('end uploaded json activity');

            fixedFile = fit.activity.encode(activity);

            xf.dispatch('file:success');
        } catch(e) {
            xf.dispatch('file:error');
            console.log(e);
        } finally {
            xf.dispatch('file:done');
        }
    }

    function openFIT(file) {
        xf.dispatch('file:start');

        console.log(`${file.byteLength} bytes`, file);

        let view = new DataView(file);

        try {
            activity = fit.activity.read(view);
            summary = fit.summary.calculate(activity);
            dataRecords = fit.summary.getDataRecords(activity);

            const check = fixer.check(activity);

            console.log('original activity ---->');
            console.log(activity);
            console.log('end original activity');

            if(fixer.allPass(check)) {
                fixedFile = view;
                fixedActivity = activity;
            } else {
                fixedActivity = fixer.fix(view, activity, summary, check);
                fixedFile = fit.activity.encode(activity);

                console.log('fixed activity ---->');
                console.log(fixedActivity);
                console.log('end fixed activity');
            }

            xf.dispatch('file:success');
        } catch(e) {
            xf.dispatch('file:error');
            console.log(e);
        } finally {
            xf.dispatch('file:done');
        }
    }

    function download() {
        if(!fixedFile) return;
        const blob = new Blob([fixedFile], {type: 'application/octet-stream'});
        fileHandler.save()(blob, `fixed-${fileName}.fit`);
    }

    function jsonExport() {
        fileHandler.saveJson(activity, `json-${fileName}.json`);
    }

    return Object.freeze({ read, open, download });
}

const activity = Activity();

export { activity };
