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
