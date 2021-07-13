import { fileHandler } from '../file.js';
import { fit } from '../fit/fit.js';
import { xf } from '../functions.js';

function Activity() {
    let file = false;
    let fileName = '';
    let fixedFile = false;
    let activity = [];
    let summary = {};

    xf.sub('ui:file-download', function (e) {
        download();
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

            if(fit.fixer.allPass(check)) {
                fixedFile = view;
                console.log(activity);
            } else {
                const fixedActivity = fit.fixer.fix(view, activity, summary, check);
                console.log(fixedActivity);
                fixedFile = fit.activity.encode(activity);
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

    return Object.freeze({ read, open, download });
}

const activity = Activity();

export { activity };
