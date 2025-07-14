// renderer.js

class Renderer {
    constructor(resolutionEngine, measurementEngine) {
        if (!resolutionEngine || !measurementEngine) {
            console.error("ResolutionEngine and MeasurementEngine instances are required for Renderer.");
            return;
        }
        this.res = resolutionEngine; // 해상도 엔진 인스턴스
        this.measure = measurementEngine; // 측량 엔진 인스턴스
        this.gl = this.res.getGLContext(); // WebGL 컨텍스트
        this.internalRes = this.res.getInternalResolution(); // 내부 해상도

        // WebGL 초기화 (셰이더 프로그램, 버퍼 등 설정)
        this.initWebGL();

        console.log("Renderer initialized.");
    }

    initWebGL() {
        // 여기에 WebGL 셰이더, 프로그램, 버퍼 등을 설정하는 코드가 들어갑니다.
        // 초초초초고해상도를 위한 텍스처 설정은 resolutionEngine에서 이미 처리했습니다.
        // 여기서는 기본적인 사각형을 그리는 셰이더 설정을 예시로 둡니다.

        // Vertex Shader (꼭짓점 셰이더) - 2D 위치 변환
        const vsSource = `
            attribute vec4 a_position;
            void main() {
                gl_Position = a_position;
            }
        `;

        // Fragment Shader (프래그먼트 셰이더) - 색상 설정
        const fsSource = `
            precision mediump float;
            void main() {
                gl_FragColor = vec4(1, 0, 0, 1); // 빨간색으로 그리기 (예시)
            }
        `;

        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fsSource);

        this.shaderProgram = this.createProgram(vertexShader, fragmentShader);
        this.gl.useProgram(this.shaderProgram);

        // 캔버스 중앙에 사각형을 그리기 위한 버퍼 설정 (정규화된 좌표)
        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);

        const positions = [
            -0.5,  0.5,  // Top-left
            -0.5, -0.5,  // Bottom-left
             0.5,  0.5,  // Top-right
             0.5, -0.5,  // Bottom-right
        ];

        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

        this.positionAttributeLocation = this.gl.getAttribLocation(this.shaderProgram, 'a_position');
        this.gl.enableVertexAttribArray(this.positionAttributeLocation);
        this.gl.vertexAttribPointer(this.positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);

        console.log("WebGL initialized with basic shaders.");
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

    // 게임 상태를 화면에 그리기
    render(gameState, deltaTime) {
        this.res.beginFrame(); // 해상도 엔진에게 렌더링 시작을 알림

        // 여기에 실제 게임 오브젝트(용병, 몬스터, UI 등)를 그리는 코드가 들어갑니다.
        // 모든 그리기 작업은 this.gl (WebGL 컨텍스트)을 사용하고,
        // 크기 및 위치는 this.measure (측량 엔진)에서 얻어야 합니다.

        // 예시: 캔버스 중앙에 작은 사각형 그리기
        // 이 예시 셰이더는 정규화된 좌표(-1.0 ~ 1.0)를 사용하므로,
        // 실제 internalRes 값을 기반으로 오브젝트 위치를 변환해야 합니다.
        // 복잡한 2D 렌더링을 위해서는 투영 행렬을 사용해야 합니다.

        // 현재 예시 셰이더는 고정된 사각형을 그림
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

        // 예시: UI 요소를 그리는 로직의 일부
        // const buttonWidth = this.measure.getButtonWidth();
        // const buttonHeight = this.measure.getButtonHeight();
        // const buttonX = this.measure.getPixelX(this.internalRes.width / 2 - this.measure.baseButtonWidth / 2);
        // const buttonY = this.measure.getPixelY(this.internalRes.height - this.measure.baseButtonHeight - this.measure.basePadding);

        // console.log(`Rendering... Button position: (${buttonX}, ${buttonY}), size: ${buttonWidth}x${buttonHeight}`);

        this.res.endFrame(); // 해상도 엔진에게 렌더링 종료를 알림
    }
}
