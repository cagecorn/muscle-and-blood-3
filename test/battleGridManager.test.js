const test = require('node:test');
const assert = require('assert');

// GridEngine 스텁
class StubGridEngine {
    drawGrid = test.mock.fn();
}

// CameraEngine 스텁
class StubCameraEngine {}

// MeasurementEngine 스텁
class StubMeasurementEngine {
    getPixelSize(val) { return val; }
}

// ResolutionEngine 스텁
class StubResolutionEngine {
    getInternalResolution() { return { width: 1920, height: 1080 }; }
    getGLContext() { return { id: 'mockGL' }; }
}

// js/managers/battleGridManager.js 파일의 전체 내용 (테스트를 위해 직접 복사)
class BattleGridManager {
    constructor(gridEngine, cameraEngine, measurementEngine, resolutionEngine) {
        if (!gridEngine || !cameraEngine || !measurementEngine || !resolutionEngine) {
            console.error('GridEngine, CameraEngine, MeasurementEngine, and ResolutionEngine instances are required for BattleGridManager.');
            return;
        }
        this.gridEngine = gridEngine;
        this.camera = cameraEngine;
        this.measure = measurementEngine;
        this.res = resolutionEngine;
        this.gl = this.res.getGLContext();

        this.gridRows = 15;
        this.gridCols = 15;

        this.horizontalPaddingRatio = 0.1;
        this.verticalPaddingRatio = 0.15;

        this.gridRect = this._calculateGridRect();

        console.log('BattleGridManager initialized.');
    }

    _calculateGridRect() {
        const internalWidth = this.res.getInternalResolution().width;
        const internalHeight = this.res.getInternalResolution().height;

        const padX = internalWidth * this.horizontalPaddingRatio;
        const padY = internalHeight * this.verticalPaddingRatio;

        const gridX = padX;
        const gridY = padY;
        const gridWidth = internalWidth - padX * 2;
        const gridHeight = internalHeight - padY * 2;

        return { x: gridX, y: gridY, width: gridWidth, height: gridHeight };
    }

    render(deltaTime) {
        if (!this.gl) {
            console.warn('BattleGridManager: WebGL context not available for rendering grid.');
            return;
        }
        this.gridRect = this._calculateGridRect();

        this.gridEngine.drawGrid(this.gl, {
            x: this.gridRect.x,
            y: this.gridRect.y,
            width: this.gridRect.width,
            height: this.gridRect.height,
            rows: this.gridRows,
            cols: this.gridCols,
            lineColor: [0.7, 0.7, 0.7, 0.5],
            lineWidth: 2.0,
            camera: this.camera
        });
    }

    getGridCellWorldPosition(row, col) {
        const cellWidth = this.gridRect.width / this.gridCols;
        const cellHeight = this.gridRect.height / this.gridRows;

        const worldX = this.gridRect.x + col * cellWidth;
        const worldY = this.gridRect.y + row * cellHeight;

        return { x: worldX, y: worldY, width: cellWidth, height: cellHeight };
    }
}


test('BattleGridManager Tests', async (t) => {
    let battleGridManager;
    let mockGridEngine;
    let mockCameraEngine;
    let mockMeasureEngine;
    let mockResolutionEngine;

    t.beforeEach(() => {
        mockGridEngine = new StubGridEngine();
        mockCameraEngine = new StubCameraEngine();
        mockMeasureEngine = new StubMeasurementEngine();
        mockResolutionEngine = new StubResolutionEngine();
        battleGridManager = new BattleGridManager(mockGridEngine, mockCameraEngine, mockMeasureEngine, mockResolutionEngine);

        mockGridEngine.drawGrid.mock.resetCalls();
    });

    await t.test('Constructor initializes correctly with all required engines', () => {
        assert.ok(battleGridManager.gridEngine, 'GridEngine should be set');
        assert.ok(battleGridManager.camera, 'CameraEngine should be set');
        assert.ok(battleGridManager.measure, 'MeasurementEngine should be set');
        assert.ok(battleGridManager.res, 'ResolutionEngine should be set');
        assert.ok(battleGridManager.gl, 'GL context should be obtained');

        assert.strictEqual(battleGridManager.gridRows, 15, 'Default gridRows should be 15');
        assert.strictEqual(battleGridManager.gridCols, 15, 'Default gridCols should be 15');
        assert.strictEqual(battleGridManager.horizontalPaddingRatio, 0.1, 'Horizontal padding ratio set');
        assert.strictEqual(battleGridManager.verticalPaddingRatio, 0.15, 'Vertical padding ratio set');

        assert.ok(battleGridManager.gridRect, 'gridRect should be calculated on init');
    });

    await t.test('Constructor logs error if any required engine is missing', () => {
        const originalError = console.error;
        const errorMock = t.mock.fn();
        console.error = errorMock;

        new BattleGridManager(null, mockCameraEngine, mockMeasureEngine, mockResolutionEngine);
        assert.strictEqual(errorMock.mock.callCount(), 1, 'console.error should be called');
        errorMock.mock.resetCalls();

        new BattleGridManager(mockGridEngine, null, mockMeasureEngine, mockResolutionEngine);
        assert.strictEqual(errorMock.mock.callCount(), 1, 'console.error should be called again');

        console.error = originalError;
    });

    await t.test('_calculateGridRect correctly calculates grid dimensions', () => {
        const expectedGridRect = {
            x: 192,
            y: 162,
            width: 1536,
            height: 756
        };
        const calculatedGridRect = battleGridManager._calculateGridRect();
        assert.deepStrictEqual(calculatedGridRect, expectedGridRect, 'Calculated gridRect should be correct');
    });

    await t.test('render calls gridEngine.drawGrid with correct parameters', () => {
        const deltaTime = 16.67;
        battleGridManager.render(deltaTime);

        assert.strictEqual(mockGridEngine.drawGrid.mock.callCount(), 1, 'gridEngine.drawGrid should be called once');
        const [gl, options] = mockGridEngine.drawGrid.mock.calls[0].arguments;

        assert.deepStrictEqual(gl, mockResolutionEngine.getGLContext(), 'GL context should be passed');
        assert.strictEqual(options.x, battleGridManager.gridRect.x, 'Grid X position correct');
        assert.strictEqual(options.y, battleGridManager.gridRect.y, 'Grid Y position correct');
        assert.strictEqual(options.width, battleGridManager.gridRect.width, 'Grid width correct');
        assert.strictEqual(options.height, battleGridManager.gridRect.height, 'Grid height correct');
        assert.strictEqual(options.rows, battleGridManager.gridRows, 'Grid rows correct');
        assert.strictEqual(options.cols, battleGridManager.gridCols, 'Grid columns correct');
        assert.deepStrictEqual(options.lineColor, [0.7, 0.7, 0.7, 0.5], 'Default line color correct');
        assert.strictEqual(options.lineWidth, 2.0, 'Default line width correct (scaled by measure)');
        assert.strictEqual(options.camera, mockCameraEngine, 'CameraEngine instance should be passed');
    });

    await t.test('render logs warning if WebGL context is not available', () => {
        const originalWarn = console.warn;
        const warnMock = t.mock.fn();
        console.warn = warnMock;

        battleGridManager.gl = null;
        battleGridManager.render(10);

        assert.strictEqual(mockGridEngine.drawGrid.mock.callCount(), 0, 'drawGrid should not be called');
        assert.strictEqual(warnMock.mock.callCount(), 1, 'console.warn should be called');
        assert.ok(warnMock.mock.calls[0].arguments[0].includes('WebGL context not available for rendering grid.'), 'Warning message correct');

        console.warn = originalWarn;
    });

    await t.test('getGridCellWorldPosition calculates correct world coordinates for a cell', () => {
        const cellWidth = 1536 / 15;
        const cellHeight = 756 / 15;

        let cellPos = battleGridManager.getGridCellWorldPosition(0, 0);
        assert.deepStrictEqual(cellPos.x, 192, 'Cell (0,0) X should be gridRect.x');
        assert.deepStrictEqual(cellPos.y, 162, 'Cell (0,0) Y should be gridRect.y');
        assert.deepStrictEqual(cellPos.width, cellWidth, 'Cell width should be correct');
        assert.deepStrictEqual(cellPos.height, cellHeight, 'Cell height should be correct');

        cellPos = battleGridManager.getGridCellWorldPosition(1, 1);
        assert.deepStrictEqual(cellPos.x, 192 + cellWidth, 'Cell (1,1) X correct');
        assert.deepStrictEqual(cellPos.y, 162 + cellHeight, 'Cell (1,1) Y correct');

        cellPos = battleGridManager.getGridCellWorldPosition(14, 14);
        assert.deepStrictEqual(cellPos.x, 192 + 14 * cellWidth, 'Cell (14,14) X correct');
        assert.deepStrictEqual(cellPos.y, 162 + 14 * cellHeight, 'Cell (14,14) Y correct');
    });
});
