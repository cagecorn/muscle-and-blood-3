// resolutionEngine.js 파일로 저장할 수 있습니다.

class ResolutionEngine {
    constructor(canvasId, internalWidth, internalHeight) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error("Canvas element not found!");
            return;
        }
        // WebGL 컨텍스트 가져오기
        // alpha: 투명 배경을 허용할지 (기본 true)
        // antialias: 안티앨리어싱 (가장자리 부드럽게 처리, 성능 영향 있음)
        // preserveDrawingBuffer: 드로잉 버퍼 유지 (스크린샷 등에 필요, 성능 영향 있음)
        this.gl = this.canvas.getContext('webgl', { alpha: false, antialias: true }); // 안티앨리어싱 활성화로 고화질 느낌 강화
        if (!this.gl) {
            console.error("WebGL not supported in your browser!");
            return;
        }

        this.internalWidth = internalWidth; // 게임이 내부적으로 작동할 해상도 너비 (예: 1920)
        this.internalHeight = internalHeight; // 게임이 내부적으로 작동할 해상도 높이 (예: 1080)

        this.aspectRatio = internalWidth / internalHeight;

        // 고해상도 에셋의 선명도를 위한 텍스처 필터링 설정은
        // AssetLoader가 텍스처를 로드할 때 처리하므로 여기서는 설정하지 않습니다.


        // 화면 크기 변경 감지 및 캔버스 리사이징
        window.addEventListener('resize', this.resizeCanvas.bind(this));
        this.resizeCanvas(); // 초기 로드 시 캔버스 크기 설정
    }

    resizeCanvas() {
        // 현재 브라우저 창의 너비와 높이
        let displayWidth = window.innerWidth;
        let displayHeight = window.innerHeight;

        let newWidth = displayWidth;
        let newHeight = displayHeight;

        // 화면 비율을 유지하면서 캔버스 크기 조정
        // 내부 해상도의 비율(aspectRatio)을 기준으로 화면에 꽉 차게 조절합니다.
        // 검은색 여백이 생기더라도 화면 비율을 유지하는 'contain' 방식
        if (displayWidth / displayHeight > this.aspectRatio) {
            // 화면이 가로로 더 길 때 (화면 폭 > 게임 폭)
            newHeight = displayHeight;
            newWidth = newHeight * this.aspectRatio;
        } else {
            // 화면이 세로로 더 길거나 같을 때
            newWidth = displayWidth;
            newHeight = newWidth / this.aspectRatio;
        }

        // 캔버스 엘리먼트의 크기 설정
        // CSS를 사용하여 캔버스가 항상 중앙에 오도록 처리할 수 있습니다.
        this.canvas.style.width = `${newWidth}px`;
        this.canvas.style.height = `${newHeight}px`;

        // 캔버스 엘리먼트의 논리적 크기 (Webgl 렌더링 버퍼 크기)
        // 물리적 픽셀 수에 맞추어 해상도 높임 (초초초초고화질의 기반)
        this.canvas.width = newWidth * window.devicePixelRatio;
        this.canvas.height = newHeight * window.devicePixelRatio;

        // WebGL 뷰포트 설정 (실제로 그릴 영역)
        this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);

        // 배경색 설정 (예시: 검은색)
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // 여기에 카메라나 투영 행렬 업데이트 로직이 필요할 수 있습니다.
        // 이는 게임의 3D/2D 프로젝션 방식에 따라 달라집니다.
    }

    // WebGL 컨텍스트 반환
    getGLContext() {
        return this.gl;
    }

    // 내부 해상도 반환 (다른 시스템에서 사용)
    getInternalResolution() {
        return { width: this.internalWidth, height: this.internalHeight };
    }

    // 프레임 시작 시 호출하여 렌더링 준비
    beginFrame() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT); // 매 프레임 버퍼 지우기
        // 기타 프레임 시작 준비 작업 (예: 셰이더 활성화 등)
    }

    // 모든 렌더링이 끝난 후 호출 (필요시)
    endFrame() {
        // 추가적인 작업 (예: swap buffers, 성능 측정 등)
    }
}

