import { empty, getUint16, getUint32 } from '../src/functions.js';
import { data } from './data.js';
import { fit } from '../src/fit/fit.js';
import { fixer } from '../src/fit/fixer.js';



describe('fixes minimal broken FIT file', () => {

    let buffer = new Uint8Array(data.brokenMinimal).buffer;
    let view   = new DataView(buffer);

    let activity      = fit.activity.read(view);
    let summary       = fit.summary.calculate(activity);
    let check         = fixer.check(activity);
    let fixedActivity = fixer.fix(view, activity, summary, check);
    let fixed         = fit.activity.encode(fixedActivity);

    let fixedView = new DataView(fixed.buffer);

    describe('correct input', () => {
        test('length', () => {
            expect(view.byteLength).toBe(12+155);
        });
    });

    test('fixed file length', () => {
        expect(fixed.byteLength).toBe(12+155+213+2);
    });

    test('data records length in header', () => {
        expect(fixedView.getUint32(4, true)).toBe(155+213);
    });

    test('crc at end', () => {
        expect(fixedView.getUint16(fixed.byteLength - 2, true)).toBe(17634); // 33392
    });

    test('fixed file', () => {
        expect(Array.from(fixed)).toStrictEqual(data.fixedMinimal);
    });
});

describe('check activity for errors', () => {

    let brokenBuffer = new Uint8Array(data.brokenMinimal).buffer;
    let brokenView   = new DataView(brokenBuffer);

    let broken      = fit.activity.read(brokenView);
    let checkBroken = fixer.check(broken);

    let fixedBuffer = new Uint8Array(data.fixedMinimal).buffer;
    let fixedView   = new DataView(fixedBuffer);

    let fixed      = fit.activity.read(fixedView);
    let checkFixed = fixer.check(fixed);

    describe('check structure', () => {
        test('structure of broken fit file', () => {
            const structure = {
                fileHeader: true,
                crc: false,
                definitions: { fileId: true,
                               event: true,
                               record: true,
                               lap: false,
                               session: false,
                               activity: false },
                data: {
                    fileId: true,
                    event: { start: true, stop: false },
                    lap: false,
                    session: false,
                    activity:false
                }
            };

            expect(checkBroken).toEqual(structure);
        });
        test('structure of correct fit file', () => {
            const structure = {
                fileHeader: true,
                crc: true,
                definitions: { fileId: true,
                               event: true,
                               record: true,
                               lap: true,
                               session: true,
                               activity: true },
                data: {
                    fileId: true,
                    event: { start: true, stop: true },
                    lap: true,
                    session: true,
                    activity: true
                }
            };

            expect(checkFixed).toEqual(structure);
        });
    });
});

