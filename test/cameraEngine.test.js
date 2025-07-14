const test = require('node:test');
const assert = require('assert');

// mat4 유틸리티 함수 (renderer.js에서 복사)
const mat4 = {
    identity: function() {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    },
    translate: function(out, a, v) {
        const x = v[0], y = v[1], z = v[2];
        let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
        out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
        out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
        out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;
        out[12] = a00 * x + a10 * y + a20 * z + a30;
        out[13] = a01 * x + a11 * y + a21 * z + a31;
        out[14] = a02 * x + a12 * y + a22 * z + a32;
        out[15] = a03 * x + a13 * y + a23 * z + a33;
        return out;
    },
    scale: function(out, a, v) {
        const x = v[0], y = v[1], z = v[2];
        out[0] = a[0] * x; out[1] = a[1] * x; out[2] = a[2] * x; out[3] = a[3] * x;
        out[4] = a[4] * y; out[5] = a[5] * y; out[6] = a[6] * y; out[7] = a[7] * y;
        out[8] = a[8] * z; out[9] = a[9] * z; out[10] = a[10] * z; out[11] = a[11] * z;
        out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15];
        return out;
    },
};

// ResolutionEngine 스텁
class StubResolutionEngine {
    constructor(internalWidth = 1920, internalHeight = 1080) {
        this.internalWidth = internalWidth;
        this.internalHeight = internalHeight;
        this.canvas = {
            getBoundingClientRect: () => ({ left: 0, top: 0, width: 1920, height: 1080 }),
            width: 1920,
            height: 1080,
            getContext: () => ({})
        };
        this.gl = this.canvas.getContext('webgl');
        this.resizeListener = null;
        global.window = {
            addEventListener: (event, callback) => {
                if (event === 'resize') {
                    this.resizeListener = callback;
                }
            },
            removeEventListener: () => {}
        };
    }
    getGLContext() { return this.gl; }
    getInternalResolution() { return { width: this.internalWidth, height: this.internalHeight }; }
}

// js/managers/cameraEngine.js 파일의 전체 내용 (테스트를 위해 직접 복사)
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


test('CameraEngine Tests', async (t) => {
    let cameraEngine;
    let mockResolutionEngine;
    const INTERNAL_W = 1920;
    const INTERNAL_H = 1080;

    t.beforeEach(() => {
        mockResolutionEngine = new StubResolutionEngine(INTERNAL_W, INTERNAL_H);
        cameraEngine = new CameraEngine(mockResolutionEngine);
    });

    await t.test('Constructor initializes correctly with ResolutionEngine', () => {
        assert.ok(cameraEngine.res, 'ResolutionEngine should be set');
        assert.ok(cameraEngine.gl, 'WebGL context should be obtained');
        assert.deepStrictEqual(cameraEngine.position, { x: 0, y: 0 }, 'Initial position should be (0,0)');
        assert.strictEqual(cameraEngine.zoom, 1.0, 'Initial zoom should be 1.0');
        assert.strictEqual(cameraEngine.rotation, 0, 'Initial rotation should be 0');
        assert.ok(cameraEngine.projectionMatrix, 'Projection matrix should be created');
        assert.ok(cameraEngine.viewMatrix, 'View matrix should be created');
    });

    await t.test('Constructor logs error if ResolutionEngine is missing', () => {
        const originalError = console.error;
        const errorMock = t.mock.fn();
        console.error = errorMock;

        new CameraEngine(null);
        assert.strictEqual(errorMock.mock.callCount(), 1, 'console.error should be called');
        assert.ok(errorMock.mock.calls[0].arguments[0].includes("ResolutionEngine instance is required for CameraEngine."), 'Error message should be correct');

        console.error = originalError;
    });

    await t.test('setPosition updates camera position and view matrix', () => {
        cameraEngine.setPosition(100, 200);
        assert.deepStrictEqual(cameraEngine.position, { x: 100, y: 200 }, 'Position should be updated');
        const expectedViewMatrix = mat4.identity();
        mat4.scale(expectedViewMatrix, expectedViewMatrix, [1.0, 1.0, 1]);
        mat4.translate(expectedViewMatrix, expectedViewMatrix, [-100, -200, 0]);
        assert.deepStrictEqual(cameraEngine.viewMatrix, expectedViewMatrix, 'View matrix should reflect new position');
    });

    await t.test('move updates camera position incrementally', () => {
        cameraEngine.setPosition(50, 50);
        cameraEngine.move(10, 20);
        assert.deepStrictEqual(cameraEngine.position, { x: 60, y: 70 }, 'Position should be moved incrementally');
    });

    await t.test('setZoom updates zoom level and view matrix', () => {
        cameraEngine.setZoom(2.0);
        assert.strictEqual(cameraEngine.zoom, 2.0, 'Zoom level should be updated');
        const expectedViewMatrix = mat4.identity();
        mat4.scale(expectedViewMatrix, expectedViewMatrix, [2.0, 2.0, 1]);
        mat4.translate(expectedViewMatrix, expectedViewMatrix, [0, 0, 0]);
        assert.deepStrictEqual(cameraEngine.viewMatrix, expectedViewMatrix, 'View matrix should reflect new zoom');

        cameraEngine.setZoom(0.05);
        assert.strictEqual(cameraEngine.zoom, 0.1, 'Zoom should not go below 0.1');
    });

    await t.test('updateProjectionMatrix updates projection matrix on resize event', () => {
        mockResolutionEngine.internalWidth = 800;
        mockResolutionEngine.internalHeight = 600;

        const originalProjectionMatrix = cameraEngine.getProjectionMatrix();
        mockResolutionEngine.resizeListener();

        const newProjectionMatrix = cameraEngine.getProjectionMatrix();
        assert.notDeepStrictEqual(newProjectionMatrix, originalProjectionMatrix, 'Projection matrix should change after resize');

        const expectedProjectionMatrix = cameraEngine.createOrthographicMatrix(0, 800, 600, 0, -1, 1);
        assert.deepStrictEqual(newProjectionMatrix, expectedProjectionMatrix, 'New projection matrix should match expected for new resolution');
    });

    await t.test('screenToWorld converts screen coordinates to world coordinates', () => {
        let worldPos = cameraEngine.screenToWorld(0, 0);
        assert.deepStrictEqual(worldPos, { x: 0, y: 0 }, 'Screen (0,0) should map to world (0,0) at default camera');

        worldPos = cameraEngine.screenToWorld(960, 540);
        assert.deepStrictEqual(worldPos, { x: 960, y: 540 }, 'Screen center should map to internal center at default camera');

        cameraEngine.setPosition(100, 50);
        worldPos = cameraEngine.screenToWorld(0, 0);
        assert.deepStrictEqual(worldPos, { x: 100, y: 50 }, 'Screen (0,0) should map to world (100,50) when camera at (100,50)');

        cameraEngine.setPosition(0, 0);
        cameraEngine.setZoom(2.0);
        worldPos = cameraEngine.screenToWorld(960, 540);
        assert.deepStrictEqual(worldPos, { x: 480, y: 270 }, 'Screen center should map to world (480,270) with 2x zoom');

        cameraEngine.setPosition(100, 50);
        cameraEngine.setZoom(2.0);
        worldPos = cameraEngine.screenToWorld(960, 540);
        assert.deepStrictEqual(worldPos, { x: 580, y: 320 }, 'Screen center should map correctly with zoom and position');

        mockResolutionEngine.canvas.width = 960;
        mockResolutionEngine.canvas.height = 540;
        mockResolutionEngine.canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 960, height: 540 });
        mockResolutionEngine.internalWidth = 1920;
        mockResolutionEngine.internalHeight = 1080;
        cameraEngine = new CameraEngine(mockResolutionEngine);
        cameraEngine.setPosition(0, 0);
        cameraEngine.setZoom(1.0);

        worldPos = cameraEngine.screenToWorld(480, 270);
        assert.deepStrictEqual(worldPos, { x: 960, y: 540 }, 'Screen to world conversion should handle canvas/internal resolution mismatch');
    });

    await t.test('setRotation updates rotation (though matrix logic is simplified in test)', () => {
        cameraEngine.setRotation(Math.PI / 2);
        assert.strictEqual(cameraEngine.rotation, Math.PI / 2, 'Rotation should be updated');
    });
});
