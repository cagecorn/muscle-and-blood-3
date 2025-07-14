const test = require('node:test');
const assert = require('assert');

// js/managers/panelEngine.js 파일의 전체 내용 (테스트를 위해 직접 복사)
class PanelEngine {
    constructor(measurementEngine, renderer) {
        if (!measurementEngine || !renderer) {
            console.error("MeasurementEngine and Renderer instances are required for PanelEngine.");
            return;
        }
        this.measure = measurementEngine;
        this.renderer = renderer;
        this.panels = new Map();
        console.log('PanelEngine initialized.');
    }

    registerPanel(panelId, options = {}, requiresGL = true) {
        const canvas = global.document.getElementById(panelId);
        if (!canvas) {
            console.error(`PanelEngine: Canvas with ID '${panelId}' not found.`);
            return null;
        }
        let glContext = null;
        if (requiresGL) {
            glContext = canvas.getContext('webgl', { alpha: true, antialias: true });
            if (!glContext) {
                console.warn(`PanelEngine: Failed to get WebGL context for panel '${panelId}'. It will be rendered without WebGL.`);
                requiresGL = false;
            } else {
                this.renderer.addPanelContext(panelId, glContext, canvas);
            }
        }

        const panel = {
            id: panelId,
            canvas: canvas,
            gl: glContext,
            options: {
                isVisible: options.isVisible !== undefined ? options.isVisible : true,
                width: options.width || this.measure.getPanelWidth(),
                height: options.height || this.measure.getPanelHeight(),
                x: options.x || 0,
                y: options.y || 0,
                ...options
            },
            render: (gl, deltaTime) => {},
            update: (deltaTime) => {}
        };

        this.panels.set(panelId, panel);
        this._applyPanelStyle(panel);
        console.log(`Panel '${panelId}' registered. Requires GL: ${requiresGL}.`);
        return panel;
    }

    _applyPanelStyle(panel) {
        const measuredWidth = this.measure.getPixelX(panel.options.width);
        const measuredHeight = this.measure.getPixelY(panel.options.height);
        const measuredX = this.measure.getPixelX(panel.options.x);
        const measuredY = this.measure.getPixelY(panel.options.y);
        panel.canvas.style.width = `${measuredWidth}px`;
        panel.canvas.style.height = `${measuredHeight}px`;
        panel.canvas.style.left = `${measuredX}px`;
        panel.canvas.style.top = `${measuredY}px`;
        panel.canvas.style.display = panel.options.isVisible ? 'block' : 'none';
        if (panel.gl) {
            panel.canvas.width = measuredWidth * (global.window.devicePixelRatio || 1);
            panel.canvas.height = measuredHeight * (global.window.devicePixelRatio || 1);
            panel.gl.viewport(0, 0, panel.gl.drawingBufferWidth, panel.gl.drawingBufferHeight);
        }
        console.log(`Panel '${panel.id}' resized to ${measuredWidth}x${measuredHeight}`);
    }

    getPanel(panelId) {
        return this.panels.get(panelId);
    }

    setPanelVisibility(panelId, isVisible) {
        const panel = this.panels.get(panelId);
        if (panel) {
            panel.options.isVisible = isVisible;
            panel.canvas.style.display = isVisible ? 'block' : 'none';
            console.log(`Panel '${panelId}' visibility set to ${isVisible}.`);
        } else {
            console.warn(`Panel '${panelId}' not found.`);
        }
    }

    update(deltaTime) {
        this.panels.forEach(panel => {
            if (panel.options.isVisible && panel.update) {
                panel.update(deltaTime);
            }
        });
    }

    render(deltaTime) {
        this.panels.forEach(panel => {
            if (panel.options.isVisible && panel.gl && panel.render) {
                panel.gl.clearColor(0.0, 0.0, 0.0, 0.0);
                panel.gl.clear(panel.gl.COLOR_BUFFER_BIT);
                panel.render(panel.gl, deltaTime);
            }
        });
    }
}

class StubMeasurementEngine {
    constructor() {
        this._internalWidth = 1920;
        this._internalHeight = 1080;
    }
    getPixelX(val) { return val; }
    getPixelY(val) { return val; }
    getPanelWidth() { return this._internalWidth * 0.8; }
    getPanelHeight() { return this._internalHeight * 0.7; }
}

class StubRenderer {
    constructor() {
        this.addPanelContext = null;
    }
}

const mockGLContext = {
    viewport: () => {},
    clearColor: () => {},
    clear: () => {},
    drawingBufferWidth: 0,
    drawingBufferHeight: 0,
    COLOR_BUFFER_BIT: 0x00004000
};

test('PanelEngine Tests', async (t) => {
    let panelEngine;
    let mockMeasure;
    let mockRenderer;
    let mockCanvasMap;

    t.beforeEach(() => {
        mockMeasure = new StubMeasurementEngine();
        mockRenderer = { addPanelContext: t.mock.fn() };
        panelEngine = new PanelEngine(mockMeasure, mockRenderer);

        mockCanvasMap = new Map();
        global.document = {
            getElementById: (id) => {
                if (!mockCanvasMap.has(id)) {
                    const mockCanvas = {
                        id: id,
                        style: {},
                        getContext: (type) => {
                            if (type === 'webgl') {
                                return mockGLContext;
                            }
                            return {};
                        },
                        width: 0,
                        height: 0
                    };
                    mockCanvasMap.set(id, mockCanvas);
                }
                return mockCanvasMap.get(id);
            }
        };
        global.window = { devicePixelRatio: 1 };
        mockGLContext.viewport = t.mock.fn();
        mockGLContext.clearColor = t.mock.fn();
        mockGLContext.clear = t.mock.fn();
        mockGLContext.viewport.mock.resetCalls();
        mockGLContext.clearColor.mock.resetCalls();
        mockGLContext.clear.mock.resetCalls();
        mockRenderer.addPanelContext.mock.resetCalls();
    });

    t.afterEach(() => {
        delete global.document;
        delete global.window;
    });

    await t.test('Constructor initializes correctly with MeasurementEngine and Renderer', () => {
        assert.ok(panelEngine.measure, 'MeasurementEngine should be set');
        assert.ok(panelEngine.renderer, 'Renderer should be set');
        assert.strictEqual(panelEngine.panels.size, 0, 'Panels map should be empty');
    });

    await t.test('Constructor logs error if MeasurementEngine or Renderer is missing', () => {
        const originalError = console.error;
        const errorMock = t.mock.fn();
        console.error = errorMock;

        new PanelEngine(null, mockRenderer);
        assert.strictEqual(errorMock.mock.callCount(), 1, 'console.error should be called');
        errorMock.mock.resetCalls();

        new PanelEngine(mockMeasure, null);
        assert.strictEqual(errorMock.mock.callCount(), 1, 'console.error should be called again');

        console.error = originalError;
    });

    await t.test('registerPanel creates and registers a panel', () => {
        const panelId = 'testPanel';
        const options = { width: 500, height: 300, x: 10, y: 20, isVisible: true };
        const panel = panelEngine.registerPanel(panelId, options);

        assert.ok(panel, 'Panel object should be returned');
        assert.ok(panelEngine.panels.has(panelId), 'Panel should be registered in the map');
        assert.strictEqual(panel.id, panelId, 'Panel ID should be correct');
        assert.deepStrictEqual(panel.options, { isVisible: true, width: 500, height: 300, x: 10, y: 20 }, 'Panel options should be set correctly');
        assert.ok(panel.gl, 'Panel should have a GL context');
        assert.strictEqual(mockRenderer.addPanelContext.mock.callCount(), 1, 'Renderer.addPanelContext should be called');
        assert.deepStrictEqual(mockRenderer.addPanelContext.mock.calls[0].arguments[0], panelId, 'addPanelContext called with correct ID');
    });

    await t.test('registerPanel uses default options if not provided', () => {
        const panelId = 'defaultPanel';
        const panel = panelEngine.registerPanel(panelId);

        assert.ok(panel, 'Panel should be created');
        assert.strictEqual(panel.options.isVisible, true, 'Default isVisible should be true');
        assert.strictEqual(panel.options.width, mockMeasure.getPanelWidth(), 'Default width should come from MeasurementEngine');
        assert.strictEqual(panel.options.height, mockMeasure.getPanelHeight(), 'Default height should come from MeasurementEngine');
        assert.strictEqual(panel.options.x, 0, 'Default x should be 0');
        assert.strictEqual(panel.options.y, 0, 'Default y should be 0');
    });

    await t.test('registerPanel handles missing canvas', () => {
        const originalError = console.error;
        const errorMock = t.mock.fn();
        console.error = errorMock;

        global.document.getElementById = () => null;
        const panel = panelEngine.registerPanel('nonExistentCanvas');

        assert.strictEqual(panel, null, 'Should return null if canvas not found');
        assert.strictEqual(panelEngine.panels.size, 0, 'No panel should be registered');
        assert.strictEqual(errorMock.mock.callCount(), 1, 'console.error should be called');

        console.error = originalError;
    });

    await t.test('_applyPanelStyle correctly sets canvas CSS and logical dimensions', () => {
        const panelId = 'styledPanel';
        mockGLContext.drawingBufferWidth = 100;
        mockGLContext.drawingBufferHeight = 50;
        const panel = panelEngine.registerPanel(panelId, { width: 100, height: 50, x: 10, y: 20 });
        const mockCanvas = mockCanvasMap.get(panelId);

        assert.strictEqual(mockCanvas.style.width, '100px', 'Canvas CSS width should be set');
        assert.strictEqual(mockCanvas.style.height, '50px', 'Canvas CSS height should be set');
        assert.strictEqual(mockCanvas.style.left, '10px', 'Canvas CSS left should be set');
        assert.strictEqual(mockCanvas.style.top, '20px', 'Canvas CSS top should be set');
        assert.strictEqual(mockCanvas.style.display, 'block', 'Canvas display should be block for visible panel');
        assert.strictEqual(mockCanvas.width, 100, 'Canvas logical width should be set (without devicePixelRatio here)');
        assert.strictEqual(mockCanvas.height, 50, 'Canvas logical height should be set (without devicePixelRatio here)');
        assert.strictEqual(mockGLContext.viewport.mock.callCount(), 1, 'GL viewport should be set');
        assert.deepStrictEqual(mockGLContext.viewport.mock.calls[0].arguments, [0, 0, 100, 50], 'Viewport dimensions should match panel size');
    });

    await t.test('setPanelVisibility changes display style', () => {
        const panelId = 'visibilityPanel';
        const panel = panelEngine.registerPanel(panelId);
        const mockCanvas = mockCanvasMap.get(panelId);

        panelEngine.setPanelVisibility(panelId, false);
        assert.strictEqual(panel.options.isVisible, false, 'isVisible option should be false');
        assert.strictEqual(mockCanvas.style.display, 'none', 'Canvas display should be none');

        panelEngine.setPanelVisibility(panelId, true);
        assert.strictEqual(panel.options.isVisible, true, 'isVisible option should be true');
        assert.strictEqual(mockCanvas.style.display, 'block', 'Canvas display should be block');
    });

    await t.test('setPanelVisibility warns if panel not found', () => {
        const originalWarn = console.warn;
        const warnMock = t.mock.fn();
        console.warn = warnMock;

        panelEngine.setPanelVisibility('nonExistentPanel', true);
        assert.strictEqual(warnMock.mock.callCount(), 1, 'console.warn should be called');
        assert.ok(warnMock.mock.calls[0].arguments[0].includes("Panel 'nonExistentPanel' not found."), 'Warning message should be correct');

        console.warn = originalWarn;
    });

    await t.test('update calls update on visible panels', () => {
        const panel1Id = 'panelUpdate1';
        const panel2Id = 'panelUpdate2';
        const mockUpdate1 = t.mock.fn();
        const mockUpdate2 = t.mock.fn();

        const panel1 = panelEngine.registerPanel(panel1Id, { isVisible: true });
        panel1.update = mockUpdate1;

        const panel2 = panelEngine.registerPanel(panel2Id, { isVisible: false });
        panel2.update = mockUpdate2;

        const deltaTime = 16.67;
        panelEngine.update(deltaTime);

        assert.strictEqual(mockUpdate1.mock.callCount(), 1, 'Visible panel update should be called');
        assert.strictEqual(mockUpdate1.mock.calls[0].arguments[0], deltaTime, 'Update should receive deltaTime');
        assert.strictEqual(mockUpdate2.mock.callCount(), 0, 'Hidden panel update should not be called');
    });

    await t.test('render calls render on visible panels with GL context', () => {
        const panel1Id = 'panelRender1';
        const panel2Id = 'panelRender2';
        const mockRender1 = t.mock.fn();
        const mockRender2 = t.mock.fn();

        const panel1 = panelEngine.registerPanel(panel1Id, { isVisible: true });
        panel1.render = mockRender1;

        const panel2 = panelEngine.registerPanel(panel2Id, { isVisible: false });
        panel2.render = mockRender2;

        const deltaTime = 16.67;
        panelEngine.render(deltaTime);

        assert.strictEqual(mockGLContext.clearColor.mock.callCount(), 1, 'GL clearColor should be called for panel1');
        assert.strictEqual(mockGLContext.clear.mock.callCount(), 1, 'GL clear should be called for panel1');
        assert.strictEqual(mockRender1.mock.callCount(), 1, 'Visible panel render should be called');
        assert.strictEqual(mockRender1.mock.calls[0].arguments[0], mockGLContext, 'Render should receive GL context');
        assert.strictEqual(mockRender1.mock.calls[0].arguments[1], deltaTime, 'Render should receive deltaTime');
        assert.strictEqual(mockRender2.mock.callCount(), 0, 'Hidden panel render should not be called');
    });

    await t.test('render does not call render for panels without GL context (even if visible)', () => {
        const panelId = 'noGlPanel';
        const panel = panelEngine.registerPanel(panelId, { isVisible: true }, false);
        const mockRender = t.mock.fn();
        panel.render = mockRender;
        panel.gl = null;

        panelEngine.render(10);
        assert.strictEqual(mockRender.mock.callCount(), 0, 'Render should not be called for panel without GL context');
    });
});
