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

        this.battleGridManager = null;
        this.battleStageManager = null;

        this.gl = this.res.getGLContext();
        this.internalRes = this.res.getInternalResolution();

        this.panelContexts = {};

        this.shaderPrograms = {};
        this.currentProgram = null;

        this.initWebGL();

        this.rectPositionBuffer = this.gl.createBuffer();
        this.texCoordBuffer = this.gl.createBuffer();
        this._setupRectBuffer();

        console.log('Renderer initialized.');
    }

    setBattleGridManager(manager) {
        this.battleGridManager = manager;
    }

    setBattleStageManager(manager) {
        this.battleStageManager = manager;
    }

    addPanelContext(name, glContext, canvasElement) {
        this.panelContexts[name] = { gl: glContext, canvas: canvasElement };
        console.log(`Added panel context: ${name}`);
    }

    initWebGL() {
        this.shaderPrograms.colorShader = this.createShaderSet(
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
            ['a_position'], ['u_projectionMatrix', 'u_viewMatrix', 'u_modelMatrix', 'u_color']
        );

        this.shaderPrograms.textureShader = this.createShaderSet(
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
            ['a_position', 'a_texCoord'], ['u_projectionMatrix', 'u_viewMatrix', 'u_modelMatrix', 'u_sampler']
        );

        this.useProgram(this.shaderPrograms.colorShader.program);

        console.log('Main WebGL initialized with basic color and texture shaders.');
    }

    createShaderSet(vsSource, fsSource, attributes, uniforms) {
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fsSource);
        const program = this.createProgram(vertexShader, fragmentShader);

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

    _setupRectBuffer() {
        const positions = [0, 1, 0, 0, 1, 1, 1, 0];
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.rectPositionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

        const texCoords = [0, 1, 0, 0, 1, 1, 1, 0];
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

    render(gameState, deltaTime) {
        this.res.beginFrame();
        this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);

        if (this.battleStageManager) {
            this.battleStageManager.render(deltaTime);
        }

        if (this.battleGridManager) {
            this.battleGridManager.render(deltaTime);
        }

        const entityShader = this.shaderPrograms.colorShader;
        this.useProgram(entityShader.program);
        this.gl.uniformMatrix4fv(entityShader.uniformLocations['u_projectionMatrix'], false, this.camera.getProjectionMatrix());
        this.gl.uniformMatrix4fv(entityShader.uniformLocations['u_viewMatrix'], false, this.camera.getViewMatrix());

        const entities = this.layers.getEntitiesInLayer('entities');
        if (entities) {
            entities.forEach(entity => {
                if (entity.render) {
                    this.drawColorRect(this.gl,
                        entity.x || 0, entity.y || 0,
                        entity.width || 50, entity.height || 50,
                        entity.color || [1, 1, 0, 1],
                        this.camera);
                }
            });
        }

        this.ui.render(this.gl, deltaTime);

        this.res.endFrame();

        this.panels.render(deltaTime);
    }
}
