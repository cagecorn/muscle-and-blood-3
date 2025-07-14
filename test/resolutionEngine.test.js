const test = require('node:test');
const assert = require('assert');
const ResolutionEngine = require('../js/resolutionEngine.js');

// 테스트 스위트

test('ResolutionEngine Tests', async (t) => {
    let engine;
    const CANVAS_ID = 'gameCanvas';
    const INTERNAL_W = 1920;
    const INTERNAL_H = 1080;
    let canvas;

    t.beforeEach(() => {
        canvas = {
            getContext: (type) => {
                if (type === 'webgl') {
                    return {
                        viewport: () => {},
                        clearColor: () => {},
                        clear: () => {},
                        COLOR_BUFFER_BIT: 0x00004000,
                        drawingBufferWidth: 0,
                        drawingBufferHeight: 0,
                    };
                }
                return null;
            },
            getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
            style: {},
            width: 0,
            height: 0,
        };

        global.document = {
            getElementById: (id) => (id === CANVAS_ID ? canvas : null),
        };

        global.window = {
            innerWidth: 1920,
            innerHeight: 1080,
            devicePixelRatio: 1,
            addEventListener: (event, cb) => { if (event === 'resize') global.window.resizeListener = cb; },
            removeEventListener: () => {},
        };

        engine = new ResolutionEngine(CANVAS_ID, INTERNAL_W, INTERNAL_H);
    });

    t.afterEach(() => {
        delete global.window;
        delete global.document;
    });

    await t.test('Constructor initializes correctly with valid canvas', () => {
        assert.ok(engine.canvas, 'Canvas should be initialized');
        assert.ok(engine.gl, 'WebGL context should be initialized');
        assert.strictEqual(engine.internalWidth, INTERNAL_W, 'Internal width should be set');
        assert.strictEqual(engine.internalHeight, INTERNAL_H, 'Internal height should be set');
        assert.strictEqual(engine.aspectRatio, INTERNAL_W / INTERNAL_H, 'Aspect ratio should be calculated');
    });

    await t.test('getGLContext returns the WebGL context', () => {
        const glContext = engine.getGLContext();
        assert.strictEqual(glContext, engine.gl, 'Returned GL context should be the same as internal GL context');
    });

    await t.test('getInternalResolution returns correct dimensions', () => {
        const res = engine.getInternalResolution();
        assert.deepStrictEqual(res, { width: INTERNAL_W, height: INTERNAL_H }, 'Internal resolution should match constructor input');
    });

    await t.test('resizeCanvas adjusts canvas dimensions for widescreen (maintain aspect ratio)', () => {
        global.window.innerWidth = 1920;
        global.window.innerHeight = 900; // wider screen
        engine.resizeCanvas();

        assert.strictEqual(engine.canvas.style.width, '1600px', 'Canvas style width should be adjusted for widescreen');
        assert.strictEqual(engine.canvas.style.height, '900px', 'Canvas style height should match window height for widescreen');
        assert.strictEqual(engine.canvas.width, 1600, 'Canvas logical width should be adjusted');
        assert.strictEqual(engine.canvas.height, 900, 'Canvas logical height should be adjusted');
    });

    await t.test('resizeCanvas adjusts canvas dimensions for tallscreen (maintain aspect ratio)', () => {
        global.window.innerWidth = 800;
        global.window.innerHeight = 1200; // taller screen
        engine.resizeCanvas();

        assert.strictEqual(engine.canvas.style.width, '800px', 'Canvas style width should match window width for tallscreen');
        assert.strictEqual(engine.canvas.style.height, '450px', 'Canvas style height should be adjusted for tallscreen');
        assert.strictEqual(engine.canvas.width, 800, 'Canvas logical width should be adjusted');
        assert.strictEqual(engine.canvas.height, 450, 'Canvas logical height should be adjusted');
    });

    await t.test('resizeCanvas handles devicePixelRatio', () => {
        global.window.innerWidth = 1920;
        global.window.innerHeight = 1080;
        global.window.devicePixelRatio = 2;
        engine.resizeCanvas();

        assert.strictEqual(engine.canvas.width, 1920 * 2, 'Canvas logical width should be scaled by devicePixelRatio');
        assert.strictEqual(engine.canvas.height, 1080 * 2, 'Canvas logical height should be scaled by devicePixelRatio');
    });

    await t.test('beginFrame calls gl.clear', (t) => {
        const mockClear = t.mock.fn();
        engine.gl.clear = mockClear;
        engine.beginFrame();
        assert.strictEqual(mockClear.mock.callCount(), 1, 'gl.clear should be called once');
        assert.strictEqual(mockClear.mock.calls[0].arguments[0], engine.gl.COLOR_BUFFER_BIT, 'gl.clear should be called with COLOR_BUFFER_BIT');
    });
});
