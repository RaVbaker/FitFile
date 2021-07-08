import { exists, empty, first, second, third, last, getIn, toUint8Array, typeToAccessor} from '../src/functions.js';

describe('existance check', () => {
    describe('does not exist', () => {
        test('with Null', () => {
            expect(exists(null)).toBe(false);
        });
        test('with Undefined', () => {
            expect(exists(undefined)).toBe(false);
        });
    });

    describe('exists', () => {
        test('with Collection', () => {
            expect(exists({})).toBe(true);
            expect(exists([])).toBe(true);
            expect(exists("")).toBe(true);
            expect(exists(new Uint8Array([]))).toBe(true);
        });
        test('with Number', () => {
            expect(exists(0)).toBe(true);
        });
        test('with Boolean', () => {
            expect(exists(true)).toBe(true);
            expect(exists(false)).toBe(true);
        });
    });
});

describe('empty check', () => {
    describe('is empty', () => {
        test('with empty Array', () => {
            expect(empty([])).toBe(true);
        });
        test('with empty Object', () => {
            expect(empty({})).toBe(true);
        });
        test('with empty String', () => {
            expect(empty("")).toBe(true);
        });
        test('with undefined', () => {
            expect(empty(undefined)).toBe(true);
        });
    });

    describe('is not empty', () => {
        test('with Array', () => {
            expect(empty([0])).toBe(false);
        });
        test('with Object', () => {
            expect(empty({a: 0})).toBe(false);
        });
        test('with String', () => {
            expect(empty("zero")).toBe(false);
        });
    });

    describe('throws error', () => {
        test('with null', () => {
            expect(() => empty(null)).toThrow();
        });
        test('with number', () => {
            expect(() => empty(0)).toThrow();
        });
    });
});

describe('first element of collection', () => {
    describe('takes first element', () => {
        test('of Array', () => {
            expect(first([0])).toBe(0);
        });
        test('of String', () => {
            expect(first("zero")).toBe("z");
        });
    });

    describe('empty is undefined', () => {
        test('of Array', () => {
            expect(first([])).toBe(undefined);
        });
        test('of String', () => {
            expect(first("")).toBe(undefined);
        });
    });

    describe('first of undefined is undefined', () => {
        test('with undefined', () => {
            expect(first(undefined)).toBe(undefined);
        });
    });

    describe('throws error', () => {
        test('with number', () => {
            expect(() => first(0)).toThrow();
        });
        test('with null', () => {
            expect(() => first(null)).toThrow();
        });
    });
});

describe('second element of collection', () => {
    describe('takes second element', () => {
        test('of Array', () => {
            expect(second([0,1])).toBe(1);
        });
        test('of String', () => {
            expect(second("zero")).toBe("e");
        });
    });

    describe('index out of bound is undefined', () => {
        test('of Array', () => {
            expect(second([])).toBe(undefined);
        });
        test('of String', () => {
            expect(second("")).toBe(undefined);
        });
    });

    describe('empty is undefined', () => {
        test('of Array', () => {
            expect(second([])).toBe(undefined);
        });
        test('of String', () => {
            expect(second("")).toBe(undefined);
        });
    });

    describe('second of undefined is undefined', () => {
        test('with undefined', () => {
            expect(second(undefined)).toBe(undefined);
        });
    });

    describe('throws error', () => {
        test('with number', () => {
            expect(() => second(0)).toThrow();
        });
        test('with null', () => {
            expect(() => second(null)).toThrow();
        });
    });
});


describe('last element of Collection or String', () => {
    describe('works non-empty Collection or String', () => {
        test('with Array', () => {
            expect(last([0])).toBe(0);
            expect(last([0,2])).toBe(2);
            expect(last([0,1,4])).toBe(4);
        });
        test('with String', () => {
            expect(last('a')).toBe('a');
            expect(last('ab')).toBe('b');
            expect(last('abcd')).toBe('d');
            expect(last('1')).toBe('1');
        });
    });

    describe('empty Collection or String is undefined', () => {
        test('with Array', () => {
            expect(last([])).toBe(undefined);
        });
        test('with String', () => {
            expect(last('')).toBe(undefined);
        });
    });

    describe('last of undefined is undefined', () => {
        test('with undefined', () => {
            expect(second(undefined)).toBe(undefined);
        });
    });

    describe('throws error', () => {
        test('with number', () => {
            expect(() => last(0)).toThrow();
        });
        test('with null', () => {
            expect(() => last(null)).toThrow();
        });
    });
});

describe('fit base type number to dataview accessor method', () => {
    test('setUint8', () => {
        expect(typeToAccessor(0)).toBe('setUint8');
        expect(typeToAccessor(2)).toBe('setUint8');
        expect(typeToAccessor(7)).toBe('setUint8');
        expect(typeToAccessor(10)).toBe('setUint8');
        expect(typeToAccessor(13)).toBe('setUint8');
        expect(typeToAccessor('enum')).toBe('setUint8');
        expect(typeToAccessor('uint8')).toBe('setUint8');
        expect(typeToAccessor('string')).toBe('setUint8');
        expect(typeToAccessor('byte')).toBe('setUint8');
    });

    test('setUint16', () => {
        expect(typeToAccessor(132)).toBe('setUint16');
        expect(typeToAccessor(139)).toBe('setUint16');
        expect(typeToAccessor('uint16')).toBe('setUint16');
        expect(typeToAccessor('uint16z')).toBe('setUint16');
    });

    test('setUint32', () => {
        expect(typeToAccessor(134)).toBe('setUint32');
        expect(typeToAccessor(140)).toBe('setUint32');
        expect(typeToAccessor('uint32')).toBe('setUint32');
        expect(typeToAccessor('uint32z')).toBe('setUint32');
    });

    test('setUint64', () => {
        expect(typeToAccessor(143)).toBe('setUint64');
        expect(typeToAccessor(144)).toBe('setUint64');
        expect(typeToAccessor('uint64')).toBe('setUint64');
        expect(typeToAccessor('uint64z')).toBe('setUint64');
    });

    test('setInt8', () => {
        expect(typeToAccessor(1)).toBe('setInt8');
        expect(typeToAccessor('sint8')).toBe('setInt8');
    });

    test('setInt16', () => {
        expect(typeToAccessor(131)).toBe('setInt16');
        expect(typeToAccessor('sint16')).toBe('setInt16');
    });

    test('setInt32', () => {
        expect(typeToAccessor(133)).toBe('setInt32');
        expect(typeToAccessor('sint32')).toBe('setInt32');
    });

    test('setInt64', () => {
        expect(typeToAccessor(142)).toBe('setInt64');
        expect(typeToAccessor('sint64')).toBe('setInt64');
    });

    test('setFloat32', () => {
        expect(typeToAccessor(136)).toBe('setFloat32');
        expect(typeToAccessor('float32')).toBe('setFloat32');
    });

    test('setFloat64', () => {
        expect(typeToAccessor(137)).toBe('setFloat64');
        expect(typeToAccessor('float64')).toBe('setFloat64');
    });

    test('getUint16', () => {
        expect(typeToAccessor(132, 'get')).toBe('getUint16');
        expect(typeToAccessor(139, 'get')).toBe('getUint16');
        expect(typeToAccessor('uint16', 'get')).toBe('getUint16');
        expect(typeToAccessor('uint16z', 'get')).toBe('getUint16');
    });
});



// getIn
// toUint8Array
