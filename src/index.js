import { fileHandler } from './file.js';
import { fix } from './fit/encode.js';
import { decode } from './fit/decode.js';



let fileBtn = document.getElementById('file-upload-btn');
let downloadBtn = document.getElementById('file-download-btn');
let idleIcon = document.getElementById('icon-state-idle');
let successIcon = document.getElementById('icon-state-success');
let pendingIcon = document.getElementById('icon-state-pending');
let errorIcon = document.getElementById('icon-state-error');

fileBtn.addEventListener('change', onUpload);
downloadBtn.addEventListener('pointerup', onDownload);

let fixedFile = false;
let fileName = '';


async function onUpload(e) {
    idleIcon.style.display = 'none';
    pendingIcon.style.display = 'block';

    let blob = e.target.files[0];
    fileName = blob.name;
    console.log(blob.name);
    let file = await fileHandler.read(blob);

    let records = decode(file);
    console.log(records);
    fixedFile = fix(file, records);

    console.log(fixedFile);

    pendingIcon.style.display = 'none';

    successIcon.style.display = 'block';
    downloadBtn.classList.remove('disabled');
}

async function onDownload(e) {
    if(!fixedFile) return;

    const blob = new Blob([fixedFile], {type: 'application/octet-stream'});
    fileHandler.save()(blob, `fixed-${fileName}`);
}
