import { fileHandler } from './file.js';
import { fit } from './fit/fit.js';



let fileBtn     = document.getElementById('file-upload-btn');
let downloadBtn = document.getElementById('file-download-btn');
let idleIcon    = document.getElementById('icon-state-idle');
let successIcon = document.getElementById('icon-state-success');
let pendingIcon = document.getElementById('icon-state-pending');
let errorIcon   = document.getElementById('icon-state-error');

fileBtn.addEventListener('change', onUpload);
downloadBtn.addEventListener('pointerup', onDownload);

let fixedFile = false;
let fileName = '';


async function onUpload(e) {
    idleIcon.style.display = 'none';
    pendingIcon.style.display = 'block';

    let blob = e.target.files[0];
    fileName = blob.name;
    let file = await fileHandler.read(blob);
    console.log(`${blob.name}, ${file.byteLength} bytes`);


    let view = new DataView(file);

    let activity = fit.activity.read(view);
    let summary = fit.summary.calculate(activity);
    console.log(activity);
    console.log(summary);

    fixedFile = fit.fixer.fix(view, activity, summary);

    pendingIcon.style.display = 'none';

    successIcon.style.display = 'block';
    downloadBtn.classList.remove('disabled');
}

async function onDownload(e) {
    if(!fixedFile) return;

    const blob = new Blob([fixedFile], {type: 'application/octet-stream'});
    fileHandler.save()(blob, `fixed-${fileName}`);
}
