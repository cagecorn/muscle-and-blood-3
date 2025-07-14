class CameraEngine {
    constructor(resolutionEngine) {
        if (!resolutionEngine) {
            console.error("ResolutionEngine instance is required for CameraEngine.");
            return;
        }
        this.res = resolutionEngine;
        this.gl = this.res.getGLContext();
        this.internalRes = this.res.getInternalResolution();

        this.position = { x: 0, y: 0 };
        this.zoom = 1.0;
        this.rotation = 0;

        this.projectionMatrix = this.createOrthographicMatrix(
            0,
            this.internalRes.width,
            this.internalRes.height,
            0,
            -1,
            1
        );

        this.viewMatrix = this.createViewMatrix();
        window.addEventListener('resize', this.updateProjectionMatrix.bind(this));
        console.log('CameraEngine initialized.');
    }

    createOrthographicMatrix(left, right, bottom, top, near, far) {
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

    createViewMatrix() {
        const matrix = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
        mat4.scale(matrix, matrix, [this.zoom, this.zoom, 1]);
        mat4.translate(matrix, matrix, [-this.position.x, -this.position.y, 0]);
        return matrix;
    }

    updateProjectionMatrix() {
        this.internalRes = this.res.getInternalResolution();
        this.projectionMatrix = this.createOrthographicMatrix(
            0,
            this.internalRes.width,
            this.internalRes.height,
            0,
            -1,
            1
        );
        console.log('CameraEngine: Projection matrix updated due to resize.');
    }

    setPosition(x, y) {
        this.position.x = x;
        this.position.y = y;
        this.viewMatrix = this.createViewMatrix();
    }

    move(dx, dy) {
        this.position.x += dx;
        this.position.y += dy;
        this.viewMatrix = this.createViewMatrix();
    }

    setZoom(zoomLevel) {
        this.zoom = Math.max(0.1, zoomLevel);
        this.viewMatrix = this.createViewMatrix();
    }

    setRotation(radians) {
        this.rotation = radians;
        this.viewMatrix = this.createViewMatrix();
    }

    getProjectionMatrix() {
        return this.projectionMatrix;
    }

    getViewMatrix() {
        return this.viewMatrix;
    }

    screenToWorld(screenX, screenY) {
        const canvasRect = this.res.canvas.getBoundingClientRect();
        const canvasX = (screenX - canvasRect.left) * (this.res.canvas.width / canvasRect.width);
        const canvasY = (screenY - canvasRect.top) * (this.res.canvas.height / canvasRect.height);
        const internalX = canvasX / (this.res.canvas.width / this.internalRes.width);
        const internalY = canvasY / (this.res.canvas.height / this.internalRes.height);
        const worldX = internalX / this.zoom + this.position.x;
        const worldY = internalY / this.zoom + this.position.y;
        return { x: worldX, y: worldY };
    }

    // 새로 추가된 메서드: 카메라 초기화
    resetCamera() {
        this.position = { x: 0, y: 0 };
        this.zoom = 1.0;
        this.rotation = 0;
        this.viewMatrix = this.createViewMatrix();
        this.updateProjectionMatrix();
        console.log("CameraEngine: Camera reset to default.");
    }
}


