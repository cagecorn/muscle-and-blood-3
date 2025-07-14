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

// WebGL 컨텍스트 모의 객체
const mockGL = {
    createShader: () => ({}),
    shaderSource: () => {},
    compileShader: () => {
        mockGL.getShaderParameter.mock.mockImplementation(() => true);
        return true;
    },
    getShaderParameter: () => {},
    getShaderInfoLog: () => 'Shader Info Log',

    createProgram: () => ({}),
    attachShader: () => {},
    linkProgram: () => {
        mockGL.getProgramParameter.mock.mockImplementation(() => true);
        return true;
    },
    getProgramParameter: () => {},
    getProgramInfoLog: () => 'Program Info Log',

    getAttribLocation: (program, name) => name === 'a_position' ? 0 : (name === 'a_texCoord' ? 1 : -1),
    getUniformLocation: () => ({}),

    useProgram: () => {},
    clearColor: () => {},
    clear: () => {},
    enable: () => {},
    blendFunc: () => {},
    viewport: () => {},
    activeTexture: () => {},
    bindTexture: () => {},
    texImage2D: () => {},
    texParameteri: () => {},
    createBuffer: () => ({}),
    bindBuffer: () => {},
    bufferData: () => {},
    vertexAttribPointer: () => {},
    enableVertexAttribArray: () => {},
    disableVertexAttribArray: () => {},
    drawArrays: () => {},
    deleteBuffer: () => {},
    lineWidth: () => {},
    uniformMatrix4fv: () => {},
    uniform4fv: () => {},
    uniform1i: () => {},

    // WebGL constants
    VERTEX_SHADER: 35633,
    FRAGMENT_SHADER: 35632,
    COLOR_BUFFER_BIT: 0x00004000,
    BLEND: 3042,
    SRC_ALPHA: 770,
    ONE_MINUS_SRC_ALPHA: 771,
    TEXTURE0: 33984,
    TEXTURE_2D: 3553,
    RGBA: 6408,
    UNSIGNED_BYTE: 5121,
    TEXTURE_MIN_FILTER: 10241,
    TEXTURE_MAG_FILTER: 10240,
    CLAMP_TO_EDGE: 33071,
    LINES: 0x0001,
    TRIANGLE_STRIP: 0x0005,
    ARRAY_BUFFER: 34962,
    STATIC_DRAW: 35044,
    FLOAT: 5126,

    drawingBufferWidth: 1920,
    drawingBufferHeight: 1080,
    canvas: { width: 1920, height: 1080 }
};

// Stub Engines
class StubResolutionEngine {
    constructor() {
        this.gl = mockGL;
        this.internalWidth = 1920;
        this.internalHeight = 1080;
        this.canvas = { width: 1920, height: 1080, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1920, height: 1080 }) };
    }
    getGLContext() { return this.gl; }
    getInternalResolution() { return { width: this.internalWidth, height: this.internalHeight }; }
    beginFrame() {}
    endFrame() {}
}

class StubMeasurementEngine {
    getPixelX(val) { return val; }
    getPixelY(val) { return val; }
    getPixelSize(val) { return val; }
}

class StubCameraEngine {
    getProjectionMatrix() { return mat4.identity(); }
    getViewMatrix() { return mat4.identity(); }
}

class StubLayerEngine {
    getEntitiesInLayer() { return []; }
}

class StubPanelEngine {
    addPanelContext() {}
    render() {}
}

class StubUIEngine {
    registerUIElement() {}
    getUIElement(id) {
        if (id === 'startButton') return { options: { isVisible: true, x: 0, y: 0, width: 100, height: 50 } };
        return null;
    }
    update() {}
    render() {}
}

// Mock global battle stage and grid managers for renderer.render()
global.window = {
    battleStageManagerInstance: {
        isLoaded: true,
        assetLoader: {
            getAsset: (id) => ({ texture: 'mockTexture', width: 1920, height: 1080 })
        },
        backgroundAssetId: 'battle_stage_forest',
        backgroundUrl: 'assets/images/battle-stage-forest.png',
        onAssetsLoaded: () => {}
    },
    battleGridManagerInstance: {
        render: () => {}
    }
};

// js/renderer.js 파일의 전체 내용 (테스트를 위해 직접 복사)
class Renderer {
    constructor(resolutionEngine, measurementEngine, cameraEngine, layerEngine, panelEngine, uiEngine) {
        if (!resolutionEngine || !measurementEngine || !cameraEngine || !layerEngine || !panelEngine || !uiEngine) {
            console.error("All engine instances are required for Renderer.");
            return;
        }
        this.res = resolutionEngine;
        this.measure = measurementEngine;
        this.camera = cameraEngine;
        this.layers = layerEngine;
        this.panels = panelEngine;
        this.ui = uiEngine;

        this.gl = this.res.getGLContext();
        this.internalRes = this.res.getInternalResolution();

        this.panelContexts = {};

        this.shaderPrograms = {};
        this.currentProgram = null;

        this.initWebGL();

        this.rectPositionBuffer = this.gl.createBuffer();
        this.texCoordBuffer = this.gl.createBuffer();
        this._setupRectBuffers();

        console.log("Renderer initialized.");
    }

    addPanelContext(name, glContext, canvasElement) {
        this.panelContexts[name] = {
            gl: glContext,
            canvas: canvasElement
        };
        console.log(`Added panel context: ${name}`);
    }

    initWebGL() {
        this.shaderPrograms.colorShader = this._createShaderSet(
            `
            attribute vec2 a_position;
            uniform mat4 u_projectionMatrix;
            uniform mat4 u_viewMatrix;
            uniform mat4 u_modelMatrix;
            void main() {
                gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * vec4(a_position, 0.0, 1.0);
            }
            `,
            `
            precision mediump float;
            uniform vec4 u_color;
            void main() {
                gl_FragColor = u_color;
            }
            `,
            ['a_position'],
            ['u_projectionMatrix', 'u_viewMatrix', 'u_modelMatrix', 'u_color']
        );

        this.shaderPrograms.textureShader = this._createShaderSet(
            `
            attribute vec2 a_position;
            attribute vec2 a_texCoord;
            uniform mat4 u_projectionMatrix;
            uniform mat4 u_viewMatrix;
            uniform mat4 u_modelMatrix;
            varying vec2 v_texCoord;
            void main() {
                gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * vec4(a_position, 0.0, 1.0);
                v_texCoord = a_texCoord;
            }
            `,
            `
            precision mediump float;
            varying vec2 v_texCoord;
            uniform sampler2D u_sampler;
            void main() {
                gl_FragColor = texture2D(u_sampler, v_texCoord);
            }
            `,
            ['a_position', 'a_texCoord'],
            ['u_projectionMatrix', 'u_viewMatrix', 'u_modelMatrix', 'u_sampler']
        );

        this.shaderPrograms.lineShader = this._createShaderSet(
            `
            attribute vec2 a_position;
            uniform mat4 u_projectionMatrix;
            uniform mat4 u_viewMatrix;
            uniform mat4 u_modelMatrix;
            void main() {
                gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * vec4(a_position, 0.0, 1.0);
            }
            `,
            `
            precision mediump float;
            uniform vec4 u_color;
            void main() {
                gl_FragColor = u_color;
            }
            `,
            ['a_position'],
            ['u_projectionMatrix', 'u_viewMatrix', 'u_modelMatrix', 'u_color']
        );


        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        console.log("Main WebGL initialized with color, texture, and line shaders.");
    }

    _createShaderSet(vsSource, fsSource, attributes, uniforms) {
        const vertexShader = this._createShader(this.gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this._createShader(this.gl.FRAGMENT_SHADER, fsSource);
        const program = this._createProgram(vertexShader, fragmentShader);

        const attribLocations = {};
        attributes.forEach(attr => {
            attribLocations[attr] = this.gl.getAttribLocation(program, attr);
        });

        const uniformLocations = {};
        uniforms.forEach(uni => {
            uniformLocations[uni] = this.gl.getUniformLocation(program, uni);
        });

        return { program, attribLocations, uniformLocations };
    }

    useProgram(program) {
        if (this.currentProgram !== program) {
            this.gl.useProgram(program);
            this.currentProgram = program;
        }
    }

    _createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    _createProgram(vertexShader, fragmentShader) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + this.gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    }

    _setupRectBuffers() {
        const positions = [
            0, 1,
            0, 0,
            1, 1,
            1, 0
        ];
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.rectPositionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

        const texCoords = [
            0, 1,
            0, 0,
            1, 1,
            1, 0
        ];
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(texCoords), this.gl.STATIC_DRAW);
    }

    drawColorRect(gl, x, y, width, height, color, camera = null) {
        this.useProgram(this.shaderPrograms.colorShader.program);
        const { attribLocations, uniformLocations } = this.shaderPrograms.colorShader;

        let projectionMatrix, viewMatrix;
        if (camera) {
            projectionMatrix = camera.getProjectionMatrix();
            viewMatrix = camera.getViewMatrix();
        } else {
            projectionMatrix = this._createOrthographicMatrix(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);
            viewMatrix = mat4.identity();
        }

        gl.uniformMatrix4fv(uniformLocations['u_projectionMatrix'], false, projectionMatrix);
        gl.uniformMatrix4fv(uniformLocations['u_viewMatrix'], false, viewMatrix);
        gl.uniform4fv(uniformLocations['u_color'], color);

        const modelMatrix = mat4.identity();
        mat4.translate(modelMatrix, modelMatrix, [x, y, 0]);
        mat4.scale(modelMatrix, modelMatrix, [width, height, 1]);
        gl.uniformMatrix4fv(uniformLocations['u_modelMatrix'], false, modelMatrix);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.rectPositionBuffer);
        gl.vertexAttribPointer(attribLocations['a_position'], 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attribLocations['a_position']);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.disableVertexAttribArray(attribLocations['a_position']);
    }

    drawTextureRect(gl, texture, x, y, width, height, camera = null) {
        this.useProgram(this.shaderPrograms.textureShader.program);
        const { attribLocations, uniformLocations } = this.shaderPrograms.textureShader;

        let projectionMatrix, viewMatrix;
        if (camera) {
            projectionMatrix = camera.getProjectionMatrix();
            viewMatrix = camera.getViewMatrix();
        } else {
            projectionMatrix = this._createOrthographicMatrix(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);
            viewMatrix = mat4.identity();
        }

        gl.uniformMatrix4fv(uniformLocations['u_projectionMatrix'], false, projectionMatrix);
        gl.uniformMatrix4fv(uniformLocations['u_viewMatrix'], false, viewMatrix);

        const modelMatrix = mat4.identity();
        mat4.translate(modelMatrix, modelMatrix, [x, y, 0]);
        mat4.scale(modelMatrix, modelMatrix, [width, height, 1]);
        gl.uniformMatrix4fv(uniformLocations['u_modelMatrix'], false, modelMatrix);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(uniformLocations['u_sampler'], 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.rectPositionBuffer);
        gl.vertexAttribPointer(attribLocations['a_position'], 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attribLocations['a_position']);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.vertexAttribPointer(attribLocations['a_texCoord'], 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attribLocations['a_texCoord']);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        gl.disableVertexAttribArray(attribLocations['a_position']);
        gl.disableVertexAttribArray(attribLocations['a_texCoord']);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    drawLines(gl, positions, color, lineWidth, camera = null, drawMode = gl.LINES) {
        this.useProgram(this.shaderPrograms.lineShader.program);
        const { attribLocations, uniformLocations } = this.shaderPrograms.lineShader;

        let projectionMatrix, viewMatrix;
        if (camera) {
            projectionMatrix = camera.getProjectionMatrix();
            viewMatrix = camera.getViewMatrix();
        } else {
            projectionMatrix = this._createOrthographicMatrix(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);
            viewMatrix = mat4.identity();
        }

        gl.uniformMatrix4fv(uniformLocations['u_projectionMatrix'], false, projectionMatrix);
        gl.uniformMatrix4fv(uniformLocations['u_viewMatrix'], false, viewMatrix);
        gl.uniformMatrix4fv(uniformLocations['u_modelMatrix'], false, mat4.identity());
        gl.uniform4fv(uniformLocations['u_color'], color);

        gl.lineWidth(lineWidth);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        gl.vertexAttribPointer(attribLocations['a_position'], 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attribLocations['a_position']);

        gl.drawArrays(drawMode, 0, positions.length / 2);

        gl.disableVertexAttribArray(attribLocations['a_position']);
        gl.deleteBuffer(positionBuffer);
        gl.lineWidth(1.0);
    }

    _createOrthographicMatrix(left, right, bottom, top, near, far) {
        const matrix = new Float32Array(16);
        const lr = 1 / (left - right);
        const bt = 1 / (bottom - top);
        const nf = 1 / (near - far);

        matrix[0] = -2 * lr; matrix[1] = 0; matrix[2] = 0; matrix[3] = 0;
        matrix[4] = 0; matrix[5] = -2 * bt; matrix[6] = 0; matrix[7] = 0;
        matrix[8] = 0; matrix[9] = 0; matrix[10] = 2 * nf; matrix[11] = 0;
        matrix[12] = (left + right) * lr; matrix[13] = (top + bottom) * bt; matrix[14] = (far + near) * nf; matrix[15] = 1;
        return matrix;
    }

    setClearColor(r, g, b, a) {
        this.gl.clearColor(r, g, b, a);
    }

    clear() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }


    render(gameState, deltaTime) {
        this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        const battleStageManager = global.window.battleStageManagerInstance;
        if (battleStageManager && battleStageManager.isLoaded) {
            const backgroundAsset = battleStageManager.assetLoader.getAsset(battleStageManager.backgroundAssetId);
            if (backgroundAsset && backgroundAsset.texture) {
                 this.drawTextureRect(
                     this.gl,
                     backgroundAsset.texture,
                     0, 0,
                     this.internalRes.width, this.internalRes.height,
                     this.camera
                 );
            }
        }

        const battleGridManager = global.window.battleGridManagerInstance;
        if (battleGridManager) {
            battleGridManager.render(deltaTime);
        }

        const entities = this.layers.getEntitiesInLayer('entities');
        if (entities) {
            entities.forEach(entity => {
                this.drawColorRect(
                    this.gl,
                    entity.x || 100, entity.y || 100,
                    entity.width || 50, entity.height || 50,
                    entity.color || [0, 0.7, 0, 1],
                    this.camera
                );
            });
        }
        
        const startButton = this.ui.getUIElement('startButton');
        if (startButton && startButton.options.isVisible) {
             const px = this.measure.getPixelX(startButton.options.x);
             const py = this.measure.getPixelY(startButton.options.y);
             const pw = this.measure.getPixelX(startButton.options.width);
             const ph = this.measure.getPixelY(startButton.options.height);
             
             this.drawColorRect(this.gl, px, py, pw, ph, [0.1, 0.5, 0.8, 1.0], null);
        }


        this.panels.render(deltaTime);
    }
}


test('Renderer Tests', async (t) => {
    let renderer;
    let mockResEngine;
    let mockMeasureEngine;
    let mockCameraEngine;
    let mockLayerEngine;
    let mockPanelEngine;
    let mockUIEngine;

    t.beforeEach(() => {
        for (const key in mockGL) {
            if (typeof mockGL[key] === 'function') {
                mockGL[key] = t.mock.fn(mockGL[key]);
            }
        }

        mockResEngine = new StubResolutionEngine();
        mockResEngine.beginFrame = t.mock.fn();
        mockResEngine.endFrame = t.mock.fn();
        mockMeasureEngine = new StubMeasurementEngine();
        mockCameraEngine = new StubCameraEngine();
        mockCameraEngine.getProjectionMatrix = t.mock.fn(() => mat4.identity());
        mockCameraEngine.getViewMatrix = t.mock.fn(() => mat4.identity());
        mockLayerEngine = new StubLayerEngine();
        mockLayerEngine.getEntitiesInLayer = t.mock.fn(() => []);
        mockPanelEngine = new StubPanelEngine();
        mockPanelEngine.addPanelContext = t.mock.fn();
        mockPanelEngine.render = t.mock.fn();
        mockUIEngine = new StubUIEngine();
        mockUIEngine.registerUIElement = t.mock.fn();
        mockUIEngine.getUIElement = t.mock.fn(mockUIEngine.getUIElement.bind(mockUIEngine));
        mockUIEngine.update = t.mock.fn();
        mockUIEngine.render = t.mock.fn();

        renderer = new Renderer(mockResEngine, mockMeasureEngine, mockCameraEngine, mockLayerEngine, mockPanelEngine, mockUIEngine);

        for (const key in mockGL) {
            if (typeof mockGL[key] === 'function') {
                mockGL[key].mock.resetCalls();
            }
        }
    });

    await t.test('Constructor initializes correctly and calls initWebGL', () => {
        const localRenderer = new Renderer(mockResEngine, mockMeasureEngine, mockCameraEngine, mockLayerEngine, mockPanelEngine, mockUIEngine);

        assert.ok(localRenderer.gl, 'GL context should be set');
        assert.ok(localRenderer.shaderPrograms.colorShader, 'Color shader program should be initialized');
        assert.ok(localRenderer.shaderPrograms.textureShader, 'Texture shader program should be initialized');
        assert.ok(localRenderer.shaderPrograms.lineShader, 'Line shader program should be initialized');

        assert.strictEqual(mockGL.clearColor.mock.callCount(), 1, 'gl.clearColor should be called');
        assert.strictEqual(mockGL.enable.mock.callCount(), 1, 'gl.enable(BLEND) should be called');
        assert.strictEqual(mockGL.enable.mock.calls[0].arguments[0], mockGL.BLEND, 'gl.enable(BLEND) should be called');
        assert.strictEqual(mockGL.blendFunc.mock.callCount(), 1, 'gl.blendFunc should be called');
        assert.deepStrictEqual(mockGL.blendFunc.mock.calls[0].arguments, [mockGL.SRC_ALPHA, mockGL.ONE_MINUS_SRC_ALPHA], 'gl.blendFunc arguments correct');

        assert.strictEqual(mockGL.createBuffer.mock.callCount(), 2, 'Two buffers (rectPosition, texCoord) should be created');
        assert.strictEqual(mockGL.bindBuffer.mock.callCount(), 2, 'Buffers should be bound');
        assert.strictEqual(mockGL.bufferData.mock.callCount(), 2, 'Buffer data should be set');
    });

    await t.test('Constructor logs error if any required engine is missing', () => {
        const originalError = console.error;
        const errorMock = t.mock.fn();
        console.error = errorMock;

        new Renderer(null, mockMeasureEngine, mockCameraEngine, mockLayerEngine, mockPanelEngine, mockUIEngine);
        assert.strictEqual(errorMock.mock.callCount(), 1, 'console.error should be called');
        assert.ok(errorMock.mock.calls[0].arguments[0].includes("All engine instances are required for Renderer."), 'Error message correct');

        errorMock.mock.resetCalls();
        new Renderer(mockResEngine, null, mockCameraEngine, mockLayerEngine, mockPanelEngine, mockUIEngine);
        assert.strictEqual(errorMock.mock.callCount(), 1, 'console.error should be called again');

        console.error = originalError;
    });

    await t.test('addPanelContext adds a new panel GL context', () => {
        const panelId = 'testPanelGl';
        const panelGlContext = {};
        const panelCanvas = {};
        renderer.addPanelContext(panelId, panelGlContext, panelCanvas);

        assert.ok(renderer.panelContexts[panelId], 'Panel context should be added');
        assert.strictEqual(renderer.panelContexts[panelId].gl, panelGlContext, 'GL context should be stored');
        assert.strictEqual(renderer.panelContexts[panelId].canvas, panelCanvas, 'Canvas should be stored');
    });

    await t.test('useProgram switches GL shader program', () => {
        const programA = { id: 'programA' };
        const programB = { id: 'programB' };

        renderer.useProgram(programA);
        assert.strictEqual(mockGL.useProgram.mock.callCount(), 1, 'gl.useProgram called for programA');
        assert.strictEqual(mockGL.useProgram.mock.calls[0].arguments[0], programA, 'Correct program passed');
        assert.strictEqual(renderer.currentProgram, programA, 'currentProgram updated');

        mockGL.useProgram.mock.resetCalls();
        renderer.useProgram(programA);
        assert.strictEqual(mockGL.useProgram.mock.callCount(), 0, 'gl.useProgram not called if program is already current');

        renderer.useProgram(programB);
        assert.strictEqual(mockGL.useProgram.mock.callCount(), 1, 'gl.useProgram called for programB');
        assert.strictEqual(mockGL.useProgram.mock.calls[0].arguments[0], programB, 'Correct program passed');
        assert.strictEqual(renderer.currentProgram, programB, 'currentProgram updated');
    });

    await t.test('drawColorRect calls correct GL methods for drawing a rectangle', () => {
        const x = 10, y = 20, w = 50, h = 100;
        const color = [0.1, 0.2, 0.3, 1.0];
        const camera = mockCameraEngine;

        renderer.drawColorRect(mockGL, x, y, w, h, color, camera);

        assert.strictEqual(mockGL.useProgram.mock.callCount(), 1, 'useProgram called for colorShader');
        assert.strictEqual(mockGL.useProgram.mock.calls[0].arguments[0], renderer.shaderPrograms.colorShader.program, 'Color shader used');

        assert.strictEqual(mockCameraEngine.getProjectionMatrix.mock.callCount(), 1, 'Camera projection matrix requested');
        assert.strictEqual(mockCameraEngine.getViewMatrix.mock.callCount(), 1, 'Camera view matrix requested');
        assert.strictEqual(mockGL.uniformMatrix4fv.mock.callCount(), 3, 'Projection, View, Model matrices sent');

        assert.strictEqual(mockGL.uniform4fv.mock.callCount(), 1, 'Color uniform sent');
        assert.deepStrictEqual(mockGL.uniform4fv.mock.calls[0].arguments[1], color, 'Correct color sent');

        assert.strictEqual(mockGL.bindBuffer.mock.callCount(), 1, 'Position buffer bound');
        assert.strictEqual(mockGL.vertexAttribPointer.mock.callCount(), 1, 'Vertex attribute pointer set');
        assert.strictEqual(mockGL.enableVertexAttribArray.mock.callCount(), 1, 'Vertex attribute array enabled');
        assert.strictEqual(mockGL.drawArrays.mock.callCount(), 1, 'drawArrays called');
        assert.strictEqual(mockGL.drawArrays.mock.calls[0].arguments[0], mockGL.TRIANGLE_STRIP, 'Draw mode TRIANGLE_STRIP');
        assert.strictEqual(mockGL.drawArrays.mock.calls[0].arguments[2], 4, '4 vertices drawn');
        assert.strictEqual(mockGL.disableVertexAttribArray.mock.callCount(), 1, 'Vertex attribute array disabled');
    });

    await t.test('drawTextureRect calls correct GL methods for drawing a texture', () => {
        const texture = { id: 'mockTexture' };
        const x = 10, y = 20, w = 50, h = 100;
        const camera = mockCameraEngine;

        renderer.drawTextureRect(mockGL, texture, x, y, w, h, camera);

        assert.strictEqual(mockGL.useProgram.mock.callCount(), 1, 'useProgram called for textureShader');
        assert.strictEqual(mockGL.useProgram.mock.calls[0].arguments[0], renderer.shaderPrograms.textureShader.program, 'Texture shader used');

        assert.strictEqual(mockGL.activeTexture.mock.callCount(), 1, 'Active texture set');
        assert.strictEqual(mockGL.bindTexture.mock.callCount(), 2, 'Texture bound (activate and unbind)');
        assert.strictEqual(mockGL.bindTexture.mock.calls[0].arguments[1], texture, 'Correct texture bound');
        assert.strictEqual(mockGL.uniform1i.mock.callCount(), 1, 'Sampler uniform set');

        assert.strictEqual(mockGL.bindBuffer.mock.callCount(), 2, 'Both position and texCoord buffers bound');
        assert.strictEqual(mockGL.vertexAttribPointer.mock.callCount(), 2, 'Both attribute pointers set');
        assert.strictEqual(mockGL.enableVertexAttribArray.mock.callCount(), 2, 'Both attribute arrays enabled');
        assert.strictEqual(mockGL.drawArrays.mock.callCount(), 1, 'drawArrays called');
        assert.strictEqual(mockGL.disableVertexAttribArray.mock.callCount(), 2, 'Both attribute arrays disabled');
    });

    await t.test('drawLines calls correct GL methods for drawing lines', () => {
        const positions = new Float32Array([0,0,10,10,20,0]);
        const color = [0.5, 0.5, 0.5, 1.0];
        const lineWidth = 3.0;
        const camera = mockCameraEngine;

        renderer.drawLines(mockGL, positions, color, lineWidth, camera);

        assert.strictEqual(mockGL.useProgram.mock.callCount(), 1, 'useProgram called for lineShader');
        assert.strictEqual(mockGL.useProgram.mock.calls[0].arguments[0], renderer.shaderPrograms.lineShader.program, 'Line shader used');

        assert.strictEqual(mockGL.uniform4fv.mock.callCount(), 1, 'Color uniform sent');
        assert.deepStrictEqual(mockGL.uniform4fv.mock.calls[0].arguments[1], color, 'Correct color sent');
        assert.strictEqual(mockGL.lineWidth.mock.callCount(), 2, 'lineWidth set (and reset)');
        assert.strictEqual(mockGL.lineWidth.mock.calls[0].arguments[0], lineWidth, 'Correct line width set');

        assert.strictEqual(mockGL.createBuffer.mock.callCount(), 1, 'New buffer created for lines');
        assert.strictEqual(mockGL.bindBuffer.mock.callCount(), 1, 'Line position buffer bound');
        assert.strictEqual(mockGL.bufferData.mock.callCount(), 1, 'Line buffer data set');
        assert.strictEqual(mockGL.drawArrays.mock.callCount(), 1, 'drawArrays called for lines');
        assert.strictEqual(mockGL.drawArrays.mock.calls[0].arguments[0], mockGL.LINES, 'Draw mode GL.LINES');
        assert.strictEqual(mockGL.drawArrays.mock.calls[0].arguments[2], positions.length / 2, 'Correct number of vertices drawn');
        assert.strictEqual(mockGL.deleteBuffer.mock.callCount(), 1, 'Line buffer deleted');
    });

    await t.test('render orchestrates drawing calls for various game elements', () => {
        const gameState = {};
        const deltaTime = 16.67;

        mockLayerEngine.getEntitiesInLayer.mock.mockImplementation((layerName) => {
            if (layerName === 'entities') return [{ x: 100, y: 100, width: 50, height: 50, color: [0, 0, 1, 1] }];
            return [];
        });

        global.window.battleGridManagerInstance.render = t.mock.fn();

        renderer.render(gameState, deltaTime);

        assert.strictEqual(mockResEngine.beginFrame.mock.callCount(), 0, 'ResolutionEngine.beginFrame should not be called');
        assert.strictEqual(mockGL.viewport.mock.callCount(), 1, 'GL viewport set');
        assert.strictEqual(mockGL.clear.mock.callCount(), 1, 'GL clear called');

        assert.strictEqual(mockGL.useProgram.mock.calls[0].arguments[0], renderer.shaderPrograms.textureShader.program, 'Texture shader used for background');
        assert.strictEqual(mockGL.activeTexture.mock.callCount(), 1, 'Active texture set for background');
        assert.strictEqual(mockGL.bindTexture.mock.callCount(), 2, 'Texture bound for background');

        assert.strictEqual(global.window.battleGridManagerInstance.render.mock.callCount(), 1, 'BattleGridManager.render called');
        assert.strictEqual(global.window.battleGridManagerInstance.render.mock.calls[0].arguments[0], deltaTime, 'BattleGridManager.render receives deltaTime');

        assert.strictEqual(mockGL.useProgram.mock.calls[1].arguments[0], renderer.shaderPrograms.colorShader.program, 'Color shader used for entities');
        assert.deepStrictEqual(mockGL.uniform4fv.mock.calls[0].arguments[1], [0, 0, 1, 1], 'Correct color used for entity');

        assert.deepStrictEqual(mockGL.uniform4fv.mock.calls[1].arguments[1], [0.1, 0.5, 0.8, 1.0], 'Correct color used for UI button');
        assert.strictEqual(mockGL.useProgram.mock.callCount(), 2, 'useProgram should not be called again for same program');

        assert.strictEqual(mockPanelEngine.render.mock.callCount(), 1, 'PanelEngine.render called');
        assert.strictEqual(mockPanelEngine.render.mock.calls[0].arguments[0], deltaTime, 'PanelEngine.render receives deltaTime');

        assert.strictEqual(mockResEngine.endFrame.mock.callCount(), 0, 'ResolutionEngine.endFrame should not be called');
    });
});

