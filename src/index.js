import { fileHandler } from './file.js';
import { fit } from './fit/fit.js';
import { localStorage } from './local-storage.js';



// Theme Switch
let theme = localStorage.restore('theme', 'dark');
if(theme === 'dark')  onThemeDarkSwitch();
if(theme === 'light') onThemeLightSwitch();

let themeLightSwitch = document.getElementById('theme-light-switch');
let themeDarkSwitch  = document.getElementById('theme-dark-switch');

themeLightSwitch.addEventListener('pointerup', onThemeLightSwitch);
themeDarkSwitch.addEventListener('pointerup', onThemeDarkSwitch);

function onThemeLightSwitch(e) {
    document.body.id = 'light';
    localStorage.write('theme', 'light');
}

function onThemeDarkSwitch(e) {
    document.body.id = 'dark';
    localStorage.write('theme', 'dark');
}



// Input Button Upload
let fileBtn     = document.getElementById('file-upload-btn');
let idleIcon    = document.getElementById('icon-state-idle');
let successIcon = document.getElementById('icon-state-success');
let pendingIcon = document.getElementById('icon-state-pending');
let errorIcon   = document.getElementById('icon-state-error');
let downloadBtn = document.getElementById('file-download-btn');
let dropArea    = document.getElementById('upload');

let fixedFile = false;
let fileName = '';

fileBtn.addEventListener('change', onInputChange);

function onInputChange(e) {
    let file = e.target.files[0];
    onUpload(file);
}



// Drag and Drop Upload

dropArea.addEventListener('dragenter', onDragEnterUpload, false);
dropArea.addEventListener('dragleave', onDragLeaveUpload, false);
dropArea.addEventListener('dragover',  onDragOverUpload, false);
dropArea.addEventListener('drop',      onDropUpload, false);

function onDragEnterUpload(e) {
    e.preventDefault();
    e.stopPropagation();
    dropArea.classList.add('active');
}
function onDragLeaveUpload(e) {
    e.preventDefault();
    e.stopPropagation();
    dropArea.classList.remove('active');
}
function onDragOverUpload(e) {
    e.preventDefault();
    e.stopPropagation();
}
function onDropUpload(e) {
    e.preventDefault();
    e.stopPropagation();
    dropArea.classList.remove('active');

    fileBtn.files = e.dataTransfer.files;
    onUpload(e.dataTransfer.files[0]);
}



// Upload
async function onUpload(blob) {
    idleIcon.style.display = 'none';
    pendingIcon.style.display = 'block';

    fileName = blob.name;
    let file = await fileHandler.read(blob);
    console.log(`${blob.name}, ${file.byteLength} bytes`);


    let view = new DataView(file);

    let activity = fit.activity.read(view);
    let summary = fit.summary.calculate(activity);
    // console.log(activity);
    // console.log(summary);

    fixedFile = fit.fixer.fix(view, activity, summary);

    // console.log(fixedFile.byteLength);
    // console.log(fixedFile);

    pendingIcon.style.display = 'none';

    successIcon.style.display = 'block';
    downloadBtn.classList.remove('disabled');
}



// Download
downloadBtn.addEventListener('pointerup', onDownload);

async function onDownload(e) {
    if(!fixedFile) return;

    const blob = new Blob([fixedFile], {type: 'application/octet-stream'});
    fileHandler.save()(blob, `fixed-${fileName}`);
}



// Start
function start() {
}

start();

