// renderer.js

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

        this.initWebGL();
        console.log('Renderer initialized.');
    }

    addPanelContext(name, glContext, canvasElement) {
        this.panelContexts[name] = {
            gl: glContext,
            canvas: canvasElement
        };
        console.log(`Added panel context: ${name}`);
    }

    initWebGL() {
        const vsSource = `
            attribute vec2 a_position;
            uniform mat4 u_projectionMatrix;
            uniform mat4 u_viewMatrix;
            uniform mat4 u_modelMatrix;
            void main() {
                gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * vec4(a_position, 0.0, 1.0);
            }
        `;

        const fsSource = `
            precision mediump float;
            uniform vec4 u_color;
            void main() {
                gl_FragColor = u_color;
            }
        `;

        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fsSource);
        this.shaderProgram = this.createProgram(vertexShader, fragmentShader);
        this.gl.useProgram(this.shaderProgram);

        this.projectionMatrixLocation = this.gl.getUniformLocation(this.shaderProgram, 'u_projectionMatrix');
        this.viewMatrixLocation = this.gl.getUniformLocation(this.shaderProgram, 'u_viewMatrix');
        this.modelMatrixLocation = this.gl.getUniformLocation(this.shaderProgram, 'u_modelMatrix');
        this.colorLocation = this.gl.getUniformLocation(this.shaderProgram, 'u_color');

        this.positionAttributeLocation = this.gl.getAttribLocation(this.shaderProgram, 'a_position');
        this.gl.enableVertexAttribArray(this.positionAttributeLocation);

        console.log('Main WebGL initialized with basic shaders and uniforms.');
    }

    createShader(type, source) {
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

    createProgram(vertexShader, fragmentShader) {
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

    render(gameState, deltaTime) {
        this.res.beginFrame();
        this.gl.useProgram(this.shaderProgram);
        this.gl.uniformMatrix4fv(this.projectionMatrixLocation, false, this.camera.getProjectionMatrix());
        this.gl.uniformMatrix4fv(this.viewMatrixLocation, false, this.camera.getViewMatrix());

        const worldEntities = this.layers.getEntitiesInLayer('world');
        if (worldEntities) {
            worldEntities.forEach(entity => {
                const modelMatrix = mat4.identity();
                this.gl.uniformMatrix4fv(this.modelMatrixLocation, false, modelMatrix);
                this.gl.uniform4fv(this.colorLocation, [1, 0, 0, 1]);

                const positionBuffer = this.gl.createBuffer();
                this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
                const positions = [-0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5, -0.5];
                this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
                this.gl.vertexAttribPointer(this.positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
                this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
                this.gl.deleteBuffer(positionBuffer);
            });
        }

        this.ui.render(this.gl, deltaTime);
        this.res.endFrame();

        this.panels.render(deltaTime);
    }
}

