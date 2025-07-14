// renderer.js

class Renderer {
    constructor(resolutionEngine, measurementEngine, cameraEngine, layerEngine, panelEngine, uiEngine) {
        if (!resolutionEngine || !measurementEngine || !cameraEngine || !layerEngine || !panelEngine || !uiEngine) {
            console.error("All engine instances are required for Renderer.");
            return;
        }
        this.res = resolutionEngine;
        this.measure = measurementEngine;
        this.camera = cameraEngine; // 카메라 엔진 추가
        this.layers = layerEngine; // 레이어 엔진 추가
        this.panels = panelEngine; // 패널 엔진 추가
        this.ui = uiEngine; // UI 엔진 추가

        this.gl = this.res.getGLContext();
        this.internalRes = this.res.getInternalResolution();

        this.panelContexts = {}; // 오버레이 패널들의 GL 컨텍스트 보관

        this.shaderPrograms = {}; // 여러 셰이더 프로그램 관리
        this.currentProgram = null; // 현재 사용 중인 셰이더 프로그램

        this.initWebGL(); // 메인 캔버스 초기화

        // 텍스처 렌더링을 위한 공통 버퍼 (재사용)
        this.rectPositionBuffer = this.gl.createBuffer();
        this.texCoordBuffer = this.gl.createBuffer();
        this._setupRectBuffers(); // 사각형 및 텍스처 좌표 버퍼 초기화

        console.log("Renderer initialized.");
    }

    // 다른 캔버스(패널)의 GL 컨텍스트를 추가합니다.
    addPanelContext(name, glContext, canvasElement) {
        this.panelContexts[name] = {
            gl: glContext,
            canvas: canvasElement
        };
        console.log(`Added panel context: ${name}`);
    }

    initWebGL() {
        // 기본 색상 그리기용 셰이더 프로그램
        this.shaderPrograms.colorShader = this._createShaderSet(
            // Vertex Shader
            `
            attribute vec2 a_position; // 로컬 좌표 (0~1)
            uniform mat4 u_projectionMatrix; // 투영 행렬
            uniform mat4 u_viewMatrix;       // 뷰 행렬 (카메라)
            uniform mat4 u_modelMatrix;      // 모델 행렬 (객체 위치/크기/회전)
            void main() {
                gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * vec4(a_position, 0.0, 1.0);
            }
            `,
            // Fragment Shader
            `
            precision mediump float;
            uniform vec4 u_color; // 유니폼으로 색상 받기
            void main() {
                gl_FragColor = u_color;
            }
            `,
            ['a_position'],
            ['u_projectionMatrix', 'u_viewMatrix', 'u_modelMatrix', 'u_color']
        );

        // 텍스처 그리기용 셰이더 프로그램
        this.shaderPrograms.textureShader = this._createShaderSet(
            // Vertex Shader
            `
            attribute vec2 a_position; // 로컬 좌표 (0~1)
            attribute vec2 a_texCoord; // 텍스처 좌표 (0~1)
            uniform mat4 u_projectionMatrix;
            uniform mat4 u_viewMatrix;
            uniform mat4 u_modelMatrix;
            varying vec2 v_texCoord; // 프래그먼트 셰이더로 전달
            void main() {
                gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * vec4(a_position, 0.0, 1.0);
                v_texCoord = a_texCoord;
            }
            `,
            // Fragment Shader
            `
            precision mediump float;
            varying vec2 v_texCoord;
            uniform sampler2D u_sampler; // 텍스처 샘플러
            void main() {
                gl_FragColor = texture2D(u_sampler, v_texCoord); // 텍스처에서 색상 샘플링
            }
            `,
            ['a_position', 'a_texCoord'],
            ['u_projectionMatrix', 'u_viewMatrix', 'u_modelMatrix', 'u_sampler']
        );

        // 라인 그리기용 셰이더 프로그램 (그리드 엔진에서 사용)
        this.shaderPrograms.lineShader = this._createShaderSet(
            // Vertex Shader
            `
            attribute vec2 a_position;
            uniform mat4 u_projectionMatrix;
            uniform mat4 u_viewMatrix;
            uniform mat4 u_modelMatrix; // 라인 자체의 모델 변환 (보통 identity)
            void main() {
                gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * vec4(a_position, 0.0, 1.0);
            }
            `,
            // Fragment Shader
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


        // WebGL 초기 설정
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0); // 검은색 배경 (불투명)
        this.gl.enable(this.gl.BLEND); // 투명도 활성화
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA); // 알파 블렌딩 설정

        console.log("Main WebGL initialized with color, texture, and line shaders.");
    }

    // 셰이더 세트 생성 유틸리티
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

    // 현재 사용 중인 셰이더 프로그램 설정
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

    // 사각형 꼭짓점 및 텍스처 좌표 버퍼 설정 (WebGL 좌표계 0~1)
    _setupRectBuffers() {
        const positions = [
            0, 1, // top-left
            0, 0, // bottom-left
            1, 1, // top-right
            1, 0  // bottom-right
        ];
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.rectPositionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

        const texCoords = [
            0, 1, // top-left
            0, 0, // bottom-left
            1, 1, // top-right
            1, 0  // bottom-right
        ];
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(texCoords), this.gl.STATIC_DRAW);
    }

    /**
     * 색상으로 채워진 사각형을 그립니다.
     * @param {WebGLRenderingContext} gl 렌더링 컨텍스트
     * @param {number} x 내부 해상도 X
     * @param {number} y 내부 해상도 Y
     * @param {number} width 내부 해상도 너비
     * @param {number} height 내부 해상도 높이
     * @param {Array<number>} color RGBA 색상 배열 (0-1)
     * @param {CameraEngine} camera 카메라 엔진 (선택 사항)
     */
    drawColorRect(gl, x, y, width, height, color, camera = null) {
        this.useProgram(this.shaderPrograms.colorShader.program);
        const { attribLocations, uniformLocations } = this.shaderPrograms.colorShader;

        let projectionMatrix, viewMatrix;
        if (camera) {
            projectionMatrix = camera.getProjectionMatrix();
            viewMatrix = camera.getViewMatrix();
        } else {
            // 2D UI용 (픽셀 좌표 기반)
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
        gl.disableVertexAttribArray(attribLocations['a_position']); // 사용 후 비활성화
    }

    /**
     * 텍스처가 적용된 사각형을 그립니다.
     * @param {WebGLRenderingContext} gl 렌더링 컨텍스트
     * @param {WebGLTexture} texture 그릴 텍스처
     * @param {number} x 내부 해상도 X
     * @param {number} y 내부 해상도 Y
     * @param {number} width 내부 해상도 너비
     * @param {number} height 내부 해상도 높이
     * @param {CameraEngine} camera 카메라 엔진 (선택 사항)
     */
    drawTextureRect(gl, texture, x, y, width, height, camera = null) {
        this.useProgram(this.shaderPrograms.textureShader.program);
        const { attribLocations, uniformLocations } = this.shaderPrograms.textureShader;

        let projectionMatrix, viewMatrix;
        if (camera) {
            projectionMatrix = camera.getProjectionMatrix();
            viewMatrix = camera.getViewMatrix();
        } else {
            // 2D UI용 (픽셀 좌표 기반)
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
        gl.bindTexture(gl.TEXTURE_2D, null); // 텍스처 바인딩 해제
    }

    /**
     * 라인들을 그립니다 (그리드 엔진에서 사용).
     * @param {WebGLRenderingContext} gl 렌더링 컨텍스트
     * @param {Float32Array} positions 라인 꼭짓점 배열
     * @param {Array<number>} color RGBA 색상 배열 (0-1)
     * @param {number} lineWidth 선 두께
     * @param {CameraEngine} camera 카메라 엔진 (선택 사항)
     * @param {number} drawMode GL.LINES 또는 GL.LINE_STRIP
     */
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
        gl.uniformMatrix4fv(uniformLocations['u_modelMatrix'], false, mat4.identity()); // 라인 자체의 모델 행렬은 단위 행렬
        gl.uniform4fv(uniformLocations['u_color'], color);

        gl.lineWidth(lineWidth);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        gl.vertexAttribPointer(attribLocations['a_position'], 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attribLocations['a_position']);

        gl.drawArrays(drawMode, 0, positions.length / 2);

        gl.disableVertexAttribArray(attribLocations['a_position']);
        gl.deleteBuffer(positionBuffer); // 사용 후 버퍼 삭제
        gl.lineWidth(1.0); // 기본값으로 복원
    }

    // 2D 직교 투영 행렬 생성 (UI용)
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


    // 게임 상태를 화면에 그리기
    render(gameState, deltaTime) {
        // 메인 게임 캔버스 렌더링 시작
        this.res.beginFrame();
        this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT); // 매 프레임 버퍼 지우기

        // 1. 배경 렌더링 (가장 아래 레이어)
        // main.js에서 battleStageManagerInstance를 전역 변수로 설정했다고 가정
        const battleStageManager = window.battleStageManagerInstance;
        if (battleStageManager && battleStageManager.isLoaded) {
            const backgroundAsset = battleStageManager.assetLoader.getAsset(battleStageManager.backgroundAssetId);
            if (backgroundAsset && backgroundAsset.texture) {
                 this.drawTextureRect(
                     this.gl,
                     backgroundAsset.texture,
                     0, 0, // 월드 좌표 0,0
                     this.internalRes.width, this.internalRes.height, // 내부 해상도 전체 크기
                     this.camera // 카메라 엔진 적용
                 );
            }
        }

        // 2. 월드 그리드 렌더링 (배경 위)
        const battleGridManager = window.battleGridManagerInstance;
        if (battleGridManager) {
            // BattleGridManager는 GridEngine의 drawGrid를 호출하고, GridEngine은 Renderer의 drawLines를 호출합니다.
            // 따라서 여기서는 BattleGridManager의 render를 호출하면 됩니다.
            battleGridManager.render(deltaTime);
        }

        // 3. 엔티티 (캐릭터, 몬스터 등) 렌더링
        const entities = this.layers.getEntitiesInLayer('entities'); // 레이어 엔진에서 엔티티 가져오기
        if (entities) {
            entities.forEach(entity => {
                // 각 엔티티의 render 메서드 호출 또는 Renderer에서 직접 그리기
                // 예시: 간단한 색상 사각형 엔티티 그리기
                this.drawColorRect(
                    this.gl,
                    entity.x || 100, entity.y || 100, // 엔티티의 월드 좌표
                    entity.width || 50, entity.height || 50, // 엔티티의 크기
                    entity.color || [0, 0.7, 0, 1], // 초록색
                    this.camera // 카메라 엔진 적용
                );
            });
        }
        
        // 4. UI 렌더링 (메인 캔버스에 직접 그려지는 UI 요소)
        // UIEngine의 render 함수는 내부적으로 MeasurementEngine을 사용하여 픽셀 크기를 계산합니다.
        // UIEngine이 자체적으로 그리기 로직을 포함하므로, 여기서는 Renderer의 drawColorRect/drawTextureRect를 호출하도록 구현할 수 있습니다.
        // 현재 UIEngine의 render 메서드는 콘솔 로그만 하므로, UI 요소를 실제로 그리려면 UIEngine에서 이 Renderer의 그리기 함수를 호출하도록 변경해야 합니다.
        // 예시:
        // this.ui.render(this.gl, deltaTime); // UIEngine 내부에서 Renderer의 함수를 호출하도록 연결

        // 임시로 UI 버튼 사각형 그리기 (UIEngine의 역할)
        const startButton = this.ui.getUIElement('startButton');
        if (startButton && startButton.options.isVisible) {
             const px = this.measure.getPixelX(startButton.options.x);
             const py = this.measure.getPixelY(startButton.options.y);
             const pw = this.measure.getPixelX(startButton.options.width);
             const ph = this.measure.getPixelY(startButton.options.height);
             
             // UI는 카메라 영향을 받지 않고 화면에 고정되어야 하므로 camera: null
             this.drawColorRect(this.gl, px, py, pw, ph, [0.1, 0.5, 0.8, 1.0], null); // 파란색
             // TODO: 텍스트 렌더링 추가
        }


        this.res.endFrame(); // 메인 게임 캔버스 렌더링 종료

        // 각 오버레이 패널 캔버스 렌더링
        // PanelEngine의 render 메서드가 각 패널의 자체 컨텍스트에 그리는 것을 관리합니다.
        // MercenaryPanelGridManager와 BattleLogEngine은 이 패널 렌더링에 통합됩니다.
        this.panels.render(deltaTime);
    }
}

// 행렬 연산을 위한 간단한 유틸리티 (gl-matrix 라이브러리 대체)
// 실제 프로젝트에서는 gl-matrix 같은 라이브러리 사용을 강력히 권장합니다.
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
