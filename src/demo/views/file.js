import { xf } from '../../functions.js';

// Input Button Upload
let fileBtn       = document.getElementById('file-upload-btn');
let idleIcon      = document.getElementById('icon-state-idle');
let successIcon   = document.getElementById('icon-state-success');
let pendingIcon   = document.getElementById('icon-state-pending');
let errorIcon     = document.getElementById('icon-state-error');
let dropArea      = document.getElementById('upload');
let downloadBtn   = document.getElementById('file-download-btn');
let JSONExportBtn = document.getElementById('json-export-btn');

fileBtn.addEventListener('change', onInputChange, false);
dropArea.addEventListener('dragenter', onDragEnterUpload, false);
dropArea.addEventListener('dragleave', onDragLeaveUpload, false);
dropArea.addEventListener('dragover', onDragOverUpload, false);
dropArea.addEventListener('drop', onDropUpload, false);
downloadBtn.addEventListener('pointerup', onDownload, false);
JSONExportBtn.addEventListener('pointerup', onJSONExport, false);

xf.sub('file:start', onStart);
xf.sub('file:success', onSuccess);
xf.sub('file:error', onError);
xf.sub('file:done', onDone);

// File Input Upload
function onInputChange(e) {
    let file = e.target.files[0];
    onUpload(file);
}
// Drag and Drop Upload
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
async function onUpload(blob) {
    xf.dispatch('file-set', blob);
}

// Status
function onStart() {
    errorIcon.style.display   = 'none';
    idleIcon.style.display    = 'none';
    pendingIcon.style.display = 'block';
    downloadBtn.classList.add('disabled');
    JSONExportBtn.classList.add('disabled');
}
function onSuccess() {
    successIcon.style.display = 'block';
    downloadBtn.classList.remove('disabled');
    JSONExportBtn.classList.remove('disabled');
}
function onError() {
    successIcon.style.display = 'none';
    errorIcon.style.display = 'block';
}
function onDone() {
    pendingIcon.style.display = 'none';
}

// Download
function onDownload(e) {
    xf.dispatch('ui:file-download');
}

// JSON Export
function onJSONExport(e) {
    xf.dispatch('ui:json-export');
}
