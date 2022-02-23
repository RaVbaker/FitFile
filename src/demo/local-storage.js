import { exists } from '../functions.js';

function LocalStorage(args = {}) {

    function restore(key, defaultValue = '') {
        const value = read(key);

        if(exists(value)) {
            return value;
        } else {
            write(defaultValue);
            return defaultValue;
        }
    }

    function read(key, defaultValue = '') {
        const value = window.localStorage.getItem(`${key}`);

        if(exists(value)) {
            return value;
        } else {
            console.warn(`Trying to get non-existing value from Local Storage at key ${key}!`);
            return defaultValue;
        }
    }

    function write(key, value) {
        window.localStorage.setItem(`${key}`, value);
    }

    function remove(key) {
        window.localStorage.removeItem(`${key}`);
    }

    return Object.freeze({ restore, read, write, remove });
}

const localStorage = LocalStorage();

export { localStorage }
