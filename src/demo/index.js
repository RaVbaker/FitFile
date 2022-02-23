import { xf } from '../functions.js';
import { activity } from './models/activity.js';
import './views/views.js';

let initDB = {
    file: false,
};

xf.create(initDB);

xf.reg('file-set', async function (blob, db) {
    db.file = activity.read(blob);
});

