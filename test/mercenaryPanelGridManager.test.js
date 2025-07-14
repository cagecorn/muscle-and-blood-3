const test = require('node:test');
const assert = require('assert');

// GridEngine 스텁
class StubGridEngine {
    constructor() {
        this.drawGrid = test.mock.fn();
    }
}

// PanelEngine 스텁
class StubPanelEngine {
    constructor() {
        this.panels = new Map();
        this.getPanel = test.mock.fn((id) => {
            if (this.panels.has(id)) {
                return this.panels.get(id);
            }
            const mockCanvas = {
                width: 800,
                height: 200,
                getContext: () => ({})
            };
            const mockPanel = {
                id: id,
                canvas: mockCanvas,
                options: {
                    isVisible: true,
                    width: 800,
                    height: 200
                },
                render: test.mock.fn()
            };
            this.panels.set(id, mockPanel);
            return mockPanel;
        });
    }
}

// MeasurementEngine 스텁
class StubMeasurementEngine {
    constructor() {
        this.getPixelSize = test.mock.fn((val) => val);
    }
}

// js/managers/mercenaryPanelGridManager.js 파일의 전체 내용 (테스트를 위해 직접 복사)
class MercenaryPanelGridManager {
    constructor(gridEngine, panelEngine, measurementEngine) {
        if (!gridEngine || !panelEngine || !measurementEngine) {
            console.error('GridEngine, PanelEngine, and MeasurementEngine instances are required for MercenaryPanelGridManager.');
            return;
        }
        this.gridEngine = gridEngine;
        this.panelEngine = panelEngine;
        this.measure = measurementEngine;

        this.panelId = 'mercenaryPanelCanvas';
        this.gridRows = 2;
        this.gridCols = 6;

        this.mercenaryPanel = this.panelEngine.getPanel(this.panelId);
        if (this.mercenaryPanel) {
            const originalRender = this.mercenaryPanel.render;
            this.mercenaryPanel.render = (glOrCtx, deltaTime) => {
                originalRender(glOrCtx, deltaTime);
                this.renderGrid(glOrCtx, deltaTime);
            };
        } else {
            console.error(`MercenaryPanelGridManager: Panel '${this.panelId}' not found.`);
        }

        console.log('MercenaryPanelGridManager initialized.');
    }

    renderGrid(gl, deltaTime) {
        if (!gl || !this.mercenaryPanel || !this.mercenaryPanel.options.isVisible) {
            return;
        }

        const panelWidth = this.mercenaryPanel.canvas.width;
        const panelHeight = this.mercenaryPanel.canvas.height;

        this.gridEngine.drawGrid(gl, {
            x: 0,
            y: 0,
            width: panelWidth,
            height: panelHeight,
            rows: this.gridRows,
            cols: this.gridCols,
            lineColor: [1.0, 1.0, 0.0, 0.7],
            lineWidth: 1.5,
            camera: null
        });
    }

    getGridCellPanelPosition(row, col) {
        if (!this.mercenaryPanel) return null;

        const panelInternalWidth = this.mercenaryPanel.options.width;
        const panelInternalHeight = this.mercenaryPanel.options.height;

        const cellWidth = panelInternalWidth / this.gridCols;
        const cellHeight = panelInternalHeight / this.gridRows;

        const x = col * cellWidth;
        const y = row * cellHeight;

        return { x, y, width: cellWidth, height: cellHeight };
    }
}


test('MercenaryPanelGridManager Tests', async (t) => {
    let manager;
    let mockGridEngine;
    let mockPanelEngine;
    let mockMeasurementEngine;
    let mockMercenaryPanel;
    let originalRender;

    t.beforeEach(() => {
        mockGridEngine = new StubGridEngine();
        mockPanelEngine = new StubPanelEngine();
        mockMeasurementEngine = new StubMeasurementEngine();

        mockMercenaryPanel = mockPanelEngine.getPanel('mercenaryPanelCanvas');
        originalRender = mockMercenaryPanel.render;
        originalRender.mock.resetCalls();

        manager = new MercenaryPanelGridManager(mockGridEngine, mockPanelEngine, mockMeasurementEngine);

        mockGridEngine.drawGrid.mock.resetCalls();
    });

    await t.test('Constructor initializes correctly with required engines', () => {
        assert.ok(manager.gridEngine, 'GridEngine should be set');
        assert.ok(manager.panelEngine, 'PanelEngine should be set');
        assert.ok(manager.measure, 'MeasurementEngine should be set');
        assert.strictEqual(manager.panelId, 'mercenaryPanelCanvas', 'Panel ID should be correct');
        assert.strictEqual(manager.gridRows, 2, 'Grid rows should be 2');
        assert.strictEqual(manager.gridCols, 6, 'Grid cols should be 6');
        assert.ok(manager.mercenaryPanel, 'Mercenary panel should be retrieved');
    });

    await t.test('Constructor logs error if any required engine is missing', () => {
        const originalError = console.error;
        const errorMock = t.mock.fn();
        console.error = errorMock;

        new MercenaryPanelGridManager(null, mockPanelEngine, mockMeasurementEngine);
        assert.strictEqual(errorMock.mock.callCount(), 1, 'console.error should be called');
        errorMock.mock.resetCalls();

        new MercenaryPanelGridManager(mockGridEngine, null, mockMeasurementEngine);
        assert.strictEqual(errorMock.mock.callCount(), 1, 'console.error should be called again');

        console.error = originalError;
    });

    await t.test('Constructor extends mercenaryPanel.render to call renderGrid', () => {
        const mockGL = { id: 'mockGLContext' };
        const deltaTime = 16.67;

        mockMercenaryPanel.render(mockGL, deltaTime);

        assert.strictEqual(originalRender.mock.callCount(), 1, 'Original panel render should be called once');
        assert.strictEqual(originalRender.mock.calls[0].arguments[0], mockGL, 'Original render called with correct GL');
        assert.strictEqual(originalRender.mock.calls[0].arguments[1], deltaTime, 'Original render called with correct deltaTime');

        assert.strictEqual(mockGridEngine.drawGrid.mock.callCount(), 1, 'gridEngine.drawGrid should be called once by renderGrid');
    });

    await t.test('renderGrid calls gridEngine.drawGrid with correct parameters', () => {
        const mockGL = { id: 'mockGLContext' };
        const deltaTime = 16.67;

        manager.renderGrid(mockGL, deltaTime);

        assert.strictEqual(mockGridEngine.drawGrid.mock.callCount(), 1, 'drawGrid should be called once');
        const [gl, options] = mockGridEngine.drawGrid.mock.calls[0].arguments;

        assert.strictEqual(gl, mockGL, 'GL context should be passed');
        assert.strictEqual(options.x, 0, 'Grid X position should be 0');
        assert.strictEqual(options.y, 0, 'Grid Y position should be 0');
        assert.strictEqual(options.width, mockMercenaryPanel.canvas.width, 'Grid width should match panel canvas width');
        assert.strictEqual(options.height, mockMercenaryPanel.canvas.height, 'Grid height should match panel canvas height');
        assert.strictEqual(options.rows, manager.gridRows, 'Grid rows correct');
        assert.strictEqual(options.cols, manager.gridCols, 'Grid columns correct');
        assert.deepStrictEqual(options.lineColor, [1.0, 1.0, 0.0, 0.7], 'Line color correct');
        assert.strictEqual(options.lineWidth, 1.5, 'Line width correct (scaled by measure)');
        assert.strictEqual(options.camera, null, 'Camera should be null');
    });

    await t.test('renderGrid does nothing if GL context is missing or panel not visible', () => {
        mockGridEngine.drawGrid.mock.resetCalls();

        manager.renderGrid(null, 10);
        assert.strictEqual(mockGridEngine.drawGrid.mock.callCount(), 0, 'drawGrid not called without GL context');

        manager.mercenaryPanel.options.isVisible = false;
        manager.renderGrid({ id: 'mockGL' }, 10);
        assert.strictEqual(mockGridEngine.drawGrid.mock.callCount(), 0, 'drawGrid not called when panel is not visible');
    });

    await t.test('getGridCellPanelPosition calculates correct position and dimensions for a cell', () => {
        const panelInternalWidth = 800;
        const panelInternalHeight = 200;
        const gridRows = 2;
        const gridCols = 6;

        const cellWidth = panelInternalWidth / gridCols;
        const cellHeight = panelInternalHeight / gridRows;

        let cellPos = manager.getGridCellPanelPosition(0, 0);
        assert.strictEqual(cellPos.x, 0, 'Cell (0,0) X should be 0');
        assert.strictEqual(cellPos.y, 0, 'Cell (0,0) Y should be 0');
        assert.ok(Math.abs(cellPos.width - cellWidth) < 0.001, 'Cell width should be correct');
        assert.ok(Math.abs(cellPos.height - cellHeight) < 0.001, 'Cell height should be correct');

        cellPos = manager.getGridCellPanelPosition(1, 3);
        assert.ok(Math.abs(cellPos.x - (3 * cellWidth)) < 0.001, 'Cell (1,3) X correct');
        assert.ok(Math.abs(cellPos.y - (1 * cellHeight)) < 0.001, 'Cell (1,3) Y correct');
        assert.ok(Math.abs(cellPos.width - cellWidth) < 0.001, 'Cell width should be correct');
        assert.ok(Math.abs(cellPos.height - cellHeight) < 0.001, 'Cell height should be correct');

        assert.strictEqual(cellPos.x, 400, 'Cell (1,3) X is precisely 400');
        assert.strictEqual(cellPos.y, 100, 'Cell (1,3) Y is precisely 100');
    });

    await t.test('getGridCellPanelPosition returns null if mercenaryPanel is not available', () => {
        manager.mercenaryPanel = null;
        const result = manager.getGridCellPanelPosition(0, 0);
        assert.strictEqual(result, null, 'Should return null if panel is not available');
    });
});

