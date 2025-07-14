// renderer.js

class Renderer {
    constructor(resolutionEngine, measurementEngine) {
        if (!resolutionEngine || !measurementEngine) {
            console.error("ResolutionEngine and MeasurementEngine instances are required for Renderer.");
            return;
        }
        this.res = resolutionEngine;
        this.measure = measurementEngine;
        this.gl = this.res.getGLContext();
        this.internalRes = this.res.getInternalResolution();

        this.panelContexts = {}; // 오버레이 패널들의 GL 컨텍스트 보관

        this.initWebGL(); // 메인 캔버스 초기화

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

        console.log("Main WebGL initialized with basic shaders.");
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
        // 메인 게임 캔버스 렌더링
        this.res.beginFrame();

        this.gl.useProgram(this.shaderProgram);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.gl.getBufferParameter(this.gl.ARRAY_BUFFER, this.gl.ARRAY_BUFFER_BINDING));
        this.gl.vertexAttribPointer(this.positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

        this.res.endFrame();

        // 각 오버레이 패널 캔버스 렌더링
        for (const name in this.panelContexts) {
            const panel = this.panelContexts[name];
            if (panel.gl) {
                panel.gl.viewport(0, 0, panel.gl.drawingBufferWidth, panel.gl.drawingBufferHeight);
                panel.gl.clearColor(0.0, 0.0, 0.0, 0.0); // 완전히 투명하게
                panel.gl.clear(panel.gl.COLOR_BUFFER_BIT);
                // 패널별 추가 렌더링 로직은 여기서 수행
            }
        }
    }
}
