class GridEngine {
    constructor(measurementEngine) {
        if (!measurementEngine) {
            console.error("MeasurementEngine instance is required for GridEngine.");
            return;
        }
        this.measure = measurementEngine;
        console.log('GridEngine initialized.');
    }

    /**
     * Draw grid lines on the given WebGL context.
     * @param {WebGLRenderingContext} gl
     * @param {Object} options
     */
    drawGrid(gl, options) {
        const {
            x, y, width, height, rows, cols,
            lineColor = [0.5, 0.5, 0.5, 1.0],
            lineWidth = 1.0,
            camera = null
        } = options;

        if (!gl) {
            console.warn('GridEngine: No WebGL context provided for drawing grid.');
            return;
        }

        const startX = this.measure.getPixelX(x);
        const startY = this.measure.getPixelY(y);
        const gridWidth = this.measure.getPixelX(width);
        const gridHeight = this.measure.getPixelY(height);
        const pixelLineWidth = this.measure.getPixelSize(lineWidth);

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

        const shaderProgram = gl.getParameter(gl.CURRENT_PROGRAM);
        if (!shaderProgram) {
            console.error('GridEngine: No active WebGL shader program found. Cannot draw grid lines.');
            return;
        }
        gl.useProgram(shaderProgram);

        const projectionMatrixLocation = gl.getUniformLocation(shaderProgram, 'u_projectionMatrix');
        const viewMatrixLocation = gl.getUniformLocation(shaderProgram, 'u_viewMatrix');
        const modelMatrixLocation = gl.getUniformLocation(shaderProgram, 'u_modelMatrix');
        const colorLocation = gl.getUniformLocation(shaderProgram, 'u_color');
        const positionAttributeLocation = gl.getAttribLocation(shaderProgram, 'a_position');

        let projectionMatrix, viewMatrix;
        if (camera) {
            projectionMatrix = camera.getProjectionMatrix();
            viewMatrix = camera.getViewMatrix();
        } else {
            projectionMatrix = this._createOrthographicMatrix(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);
            viewMatrix = mat4.identity();
        }

        gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
        gl.uniformMatrix4fv(viewMatrixLocation, false, viewMatrix);
        gl.uniform4fv(colorLocation, lineColor);

        gl.lineWidth(pixelLineWidth);

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

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        const modelMatrix = mat4.identity();
        gl.uniformMatrix4fv(modelMatrixLocation, false, modelMatrix);

        gl.drawArrays(gl.LINES, 0, positions.length / 2);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.lineWidth(1.0);
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
