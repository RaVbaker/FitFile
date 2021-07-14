import { fileHandler } from '../file.js';
import { fit } from '../fit/fit.js';
import { xf } from '../functions.js';

function Activity() {
    let file = false;
    let fileName = '';
    let fixedFile = false;
    let activity = [];
    let summary = {};
    let fixedActivity = [];

    xf.sub('ui:file-download', function (e) {
        download();
    });

    xf.sub('ui:json-export', function (e) {
        jsonExport();
    });

    async function read(blob) {
        let res = await fileHandler.read(blob);

        file = res;
        fileName = blob.name;

        open(res);

        return res;
    }

    function open(file) {
        xf.dispatch('file:start');

        console.log(`${file.byteLength} bytes`, file);

        let view = new DataView(file);

        try {
            activity = fit.activity.read(view);
            summary = fit.summary.calculate(activity);

            const check = fit.fixer.check(activity);

            console.log('original activity ---->');
            console.log(activity);
            console.log('end original activity');

            if(fit.fixer.allPass(check)) {
                fixedFile = view;
                fixedActivity = activity;
            } else {
                fixedActivity = fit.fixer.fix(view, activity, summary, check);
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
        fileHandler.save()(blob, `fixed-${fileName}`);
    }

    function jsonExport() {
        fileHandler.saveJson(activity, `json-${fileName}`);
    }

    return Object.freeze({ read, open, download });
}

const activity = Activity();

export { activity };
