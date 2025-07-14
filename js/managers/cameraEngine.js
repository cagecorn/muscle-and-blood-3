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
}

const mat4 = {
    identity: function () {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    },
    translate: function (out, a, v) {
        const x = v[0], y = v[1], z = v[2];
        let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

        out[0] = a00;
        out[1] = a01;
        out[2] = a02;
        out[3] = a03;
        out[4] = a10;
        out[5] = a11;
        out[6] = a12;
        out[7] = a13;
        out[8] = a20;
        out[9] = a21;
        out[10] = a22;
        out[11] = a23;

        out[12] = a00 * x + a10 * y + a20 * z + a30;
        out[13] = a01 * x + a11 * y + a21 * z + a31;
        out[14] = a02 * x + a12 * y + a22 * z + a32;
        out[15] = a03 * x + a13 * y + a23 * z + a33;
        return out;
    },
    scale: function (out, a, v) {
        const x = v[0], y = v[1], z = v[2];
        out[0] = a[0] * x;
        out[1] = a[1] * x;
        out[2] = a[2] * x;
        out[3] = a[3] * x;
        out[4] = a[4] * y;
        out[5] = a[5] * y;
        out[6] = a[6] * y;
        out[7] = a[7] * y;
        out[8] = a[8] * z;
        out[9] = a[9] * z;
        out[10] = a[10] * z;
        out[11] = a[11] * z;
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
        return out;
    },
    rotateZ: function (out, a, rad) {
        let x = a[0], y = a[1], z = a[2], w = a[3];
        let x2 = a[4], y2 = a[5], z2 = a[6], w2 = a[7];
        let x3 = a[8], y3 = a[9], z3 = a[10], w3 = a[11];
        let x4 = a[12], y4 = a[13], z4 = a[14], w4 = a[15];
        let s = Math.sin(rad);
        let c = Math.cos(rad);
        out[0] = x * c + x2 * s;
        out[1] = y * c + y2 * s;
        out[2] = z * c + z2 * s;
        out[3] = w * c + w2 * s;
        out[4] = x2 * c - x * s;
        out[5] = y2 * c - y * s;
        out[6] = z2 * c - z * s;
        out[7] = w2 * c - w * s;
        out[8] = x3;
        out[9] = y3;
        out[10] = z3;
        out[11] = w3;
        out[12] = x4;
        out[13] = y4;
        out[14] = z4;
        out[15] = w4;
        return out;
    }
};

