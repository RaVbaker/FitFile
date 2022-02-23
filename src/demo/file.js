class FileHandler {
    constructor(args) {}
    async readBinaryFile(file) {
        const self = this;
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);

        return new Promise((resolve, reject) => {
            reader.onload = function(event) {
                return resolve(reader.result);
            };
            reader.onerror = function(event) {
                return reject(reader.error);
            };
        });
    }
    readJSONFile(file) {
        console.log('json upload');

        const self = this;
        const reader = new FileReader();
        reader.readAsText(file);

        return new Promise((resolve, reject) => {
            reader.onload = function(event) {
                return resolve(reader.result);
            };
            reader.onerror = function(event) {
                return reject(reader.error);
            };
        });
    }
    unsupporedFormat() {
        console.warn(`Only .fit files are supported!`);
    }
    read(file) {
        const self = this;
        let ext = file.name.split('.').pop();
        switch(ext) {
            case 'fit':  return self.readBinaryFile(file); break;
            case 'json': return self.readJSONFile(file); break;
            default:     return self.unsupportedFormat();  break;
        }
    }
    save() {
        const self = this;
        let a = document.createElement('a');
        document.body.appendChild(a);
        a.style = 'display: none';
        return function (blob, name) {
            let url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = name;
            a.click();
            window.URL.revokeObjectURL(url);
        };
    };
    saveJson(activity, fileName) {
        const json = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activity));
        var downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute('href', json);
        downloadAnchorNode.setAttribute('download', `${fileName}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }
}

const fileHandler = new FileHandler();

export { fileHandler };
