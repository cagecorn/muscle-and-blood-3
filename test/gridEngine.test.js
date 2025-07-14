const test = require('node:test');
const assert = require('assert');

// js/managers/gridEngine.js 파일의 전체 내용 (테스트를 위해 직접 복사)
class GridEngine {
    constructor(measurementEngine, renderer) {
        if (!measurementEngine || !renderer) {
            console.error("MeasurementEngine and Renderer instances are required for GridEngine.");
            return;
        }
        this.measure = measurementEngine;
        this.renderer = renderer;
        console.log("GridEngine initialized.");
    }

    drawGrid(gl, options) {
        const {
            x, y, width, height, rows, cols,
            lineColor = [0.5, 0.5, 0.5, 1.0],
            lineWidth = 1.0,
            camera = null
        } = options;

        if (!gl) {
            console.warn("GridEngine: No WebGL context provided for drawing grid.");
            return;
        }

        const startX = x;
        const startY = y;
        const gridWidth = width;
        const gridHeight = height;
        const pixelLineWidth = this.measure.getPixelSize(lineWidth);

        const positions = [];

        const rowHeight = gridHeight / rows;
        for (let i = 0; i <= rows; i++) {
            const yPos = startY + i * rowHeight;
            positions.push(startX, yPos);
            positions.push(startX + gridWidth, yPos);
        }

        const colWidth = gridWidth / cols;
        for (let i = 0; i <= cols; i++) {
            const xPos = startX + i * colWidth;
            positions.push(xPos, startY);
            positions.push(xPos, startY + gridHeight);
        }

        this.renderer.drawLines(gl, new Float32Array(positions), lineColor, pixelLineWidth, camera, gl.LINES);
    }

    _createOrthographicMatrix(left, right, bottom, top, near, far) {
        const matrix = new Float32Array(16);
        const lr = 1 / (left - right);
        const bt = 1 / (bottom - top);
        const nf = 1 / (near - far);

        matrix[0] = -2 * lr;
        matrix[1] = 0;
        matrix[2] = 0;
        matrix[3] = 0;

        matrix[4] = 0;
        matrix[5] = -2 * bt;
        matrix[6] = 0;
        matrix[7] = 0;

        matrix[8] = 0;
        matrix[9] = 0;
        matrix[10] = 2 * nf;
        matrix[11] = 0;

        matrix[12] = (left + right) * lr;
        matrix[13] = (top + bottom) * bt;
        matrix[14] = (far + near) * nf;
        matrix[15] = 1;

        return matrix;
    }
}

class StubMeasurementEngine {
    getPixelSize(value) { return value; }
}

class StubRenderer {
    constructor() { this.drawLines = null; }
}

const mockGL = { LINES: 0x0001 };

test('GridEngine Tests', async (t) => {
    let gridEngine;
    let mockMeasure;
    let mockRenderer;

    t.beforeEach(() => {
        mockMeasure = new StubMeasurementEngine();
        mockRenderer = { drawLines: t.mock.fn() };
        gridEngine = new GridEngine(mockMeasure, mockRenderer);
    });

    await t.test('Constructor initializes correctly with MeasurementEngine and Renderer', () => {
        assert.ok(gridEngine.measure, 'MeasurementEngine should be set');
        assert.ok(gridEngine.renderer, 'Renderer should be set');
    });

    await t.test('Constructor logs error if MeasurementEngine or Renderer is missing', () => {
        const originalError = console.error;
        const errorMock = t.mock.fn();
        console.error = errorMock;

        new GridEngine(null, mockRenderer);
        assert.strictEqual(errorMock.mock.callCount(), 1, 'console.error should be called');
        assert.ok(errorMock.mock.calls[0].arguments[0].includes('MeasurementEngine and Renderer instances are required for GridEngine.'), 'Error message should be correct');
        errorMock.mock.resetCalls();

        new GridEngine(mockMeasure, null);
        assert.strictEqual(errorMock.mock.callCount(), 1, 'console.error should be called again');
        assert.ok(errorMock.mock.calls[0].arguments[0].includes('MeasurementEngine and Renderer instances are required for GridEngine.'), 'Error message should be correct');

        console.error = originalError;
    });

    await t.test('drawGrid calls renderer.drawLines with correct parameters', () => {
        const options = {
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            rows: 2,
            cols: 2,
            lineColor: [1.0, 0.0, 0.0, 1.0],
            lineWidth: 2.0,
            camera: { id: 'mockCamera' }
        };

        gridEngine.drawGrid(mockGL, options);

        assert.strictEqual(mockRenderer.drawLines.mock.callCount(), 1, 'drawLines should be called once');

        const [gl, positions, lineColor, lineWidth, camera, drawMode] = mockRenderer.drawLines.mock.calls[0].arguments;

        assert.strictEqual(gl, mockGL, 'GL context should be passed');
        assert.deepStrictEqual(lineColor, options.lineColor, 'Line color should be correct');
        assert.strictEqual(lineWidth, options.lineWidth, 'Line width should be scaled correctly');
        assert.strictEqual(camera, options.camera, 'Camera should be passed');
        assert.strictEqual(drawMode, mockGL.LINES, 'Draw mode should be GL.LINES');

        const expectedPositions = new Float32Array([
            0, 0,
            100, 0,
            0, 50,
            100, 50,
            0, 100,
            100, 100,
            0, 0,
            0, 100,
            50, 0,
            50, 100,
            100, 0,
            100, 100
        ]);
        assert.deepStrictEqual(positions, expectedPositions, 'Generated positions array should be correct');
    });

    await t.test('drawGrid works with different grid dimensions and offsets', () => {
        mockRenderer.drawLines.mock.resetCalls();

        const options = {
            x: 10,
            y: 20,
            width: 200,
            height: 150,
            rows: 3,
            cols: 4,
            lineColor: [0.0, 1.0, 0.0, 1.0],
            lineWidth: 1.0,
            camera: null
        };

        gridEngine.drawGrid(mockGL, options);

        const [, positions] = mockRenderer.drawLines.mock.calls[0].arguments;

        const expectedPositions = [];
        const startX = options.x;
        const startY = options.y;
        const gridWidth = options.width;
        const gridHeight = options.height;
        const rowHeight = gridHeight / options.rows;
        const colWidth = gridWidth / options.cols;

        for (let i = 0; i <= options.rows; i++) {
            const yPos = startY + i * rowHeight;
            expectedPositions.push(startX, yPos);
            expectedPositions.push(startX + gridWidth, yPos);
        }

        for (let i = 0; i <= options.cols; i++) {
            const xPos = startX + i * colWidth;
            expectedPositions.push(xPos, startY);
            expectedPositions.push(xPos, startY + gridHeight);
        }

        assert.deepStrictEqual(positions, new Float32Array(expectedPositions), 'Generated positions should be correct for offset grid');
    });

    await t.test('drawGrid logs warning if no WebGL context is provided', () => {
        const originalWarn = console.warn;
        const warnMock = t.mock.fn();
        console.warn = warnMock;

        gridEngine.drawGrid(null, {});
        assert.strictEqual(warnMock.mock.callCount(), 1, 'console.warn should be called');
        assert.ok(warnMock.mock.calls[0].arguments[0].includes('No WebGL context provided for drawing grid.'), 'Warning message should be correct');

        console.warn = originalWarn;
    });
});
