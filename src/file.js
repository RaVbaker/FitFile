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
    unsupporedFormat() {
        console.warn(`Only .fit files are supported!`);
    }
    read(file) {
        const self = this;
        let ext = file.name.split('.').pop();
        switch(ext) {
            case 'fit': return self.readBinaryFile(file); break;
            default:    return self.unsupportedFormat();  break;
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
}

const fileHandler = new FileHandler();

export { fileHandler };
