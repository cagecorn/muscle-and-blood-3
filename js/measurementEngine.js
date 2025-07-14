// measurementEngine.js 파일로 저장할 수 있습니다.

class MeasurementEngine {
    constructor(resolutionEngine) {
        if (!resolutionEngine || !resolutionEngine.getInternalResolution) {
            console.error("ResolutionEngine instance is required for MeasurementEngine.");
            return;
        }
        this.resolutionEngine = resolutionEngine;
        this.internalResolution = this.resolutionEngine.getInternalResolution();

        // ----------------------------------------------------
        // 🎯 핵심: 게임의 기준이 되는 UI 크기 단위 정의
        // 이 값들은 ResolutionEngine의 internalResolution을 기준으로 합니다.
        // 예를 들어, internalResolution이 1920x1080일 때의 기준 단위입니다.
        // 나중에 internalResolution만 바꾸면, 이 모든 값들이 자동으로 스케일링됩니다.
        // ----------------------------------------------------

        // 기본적인 여백/패딩 단위 (내부 해상도 기준)
        this.basePadding = 20;
        this.baseMargin = 10;

        // 버튼/UI 컴포넌트의 기준 크기 (내부 해상도 기준)
        this.baseButtonHeight = 60;
        this.baseButtonWidth = 200;
        this.baseIconSize = 48; // 아이콘 크기

        // 텍스트 크기 (내부 해상도 기준)
        this.baseFontSizeSmall = 18;
        this.baseFontSizeMedium = 24;
        this.baseFontSizeLarge = 36;
        this.baseFontSizeHuge = 48;

        // UI 패널의 기준 너비/높이 (내부 해상도 기준)
        this.basePanelWidth = this.internalResolution.width * 0.8; // 전체 화면의 80%
        this.basePanelHeight = this.internalResolution.height * 0.7; // 전체 화면의 70%

        // 512x512 타일 크기에 기반한 UI 요소 비율 조정 (예시)
        // 512px 타일을 기준으로 UI 요소들의 크기를 상대적으로 정의할 수 있습니다.
        // 예: 타일 하나의 1/4 크기 버튼, 타일 하나의 1/10 크기 여백 등.
        this.tilePixelSize = 512; // 게임의 타일 기본 크기 (픽셀)

        // UI 요소들이 타일 크기에 비례하도록 정의하는 예시
        // 512x512 타일을 고려한 UI 요소 크기 설정
        this.uiUnitFromTile = this.tilePixelSize / 8; // 타일 1/8을 UI 기본 단위로 사용
        this.buttonHeightFromTile = this.tilePixelSize / 4; // 타일 1/4 높이의 버튼
        this.paddingFromTile = this.tilePixelSize / 16; // 타일 1/16 크기의 패딩

        // ----------------------------------------------------
        // 스케일링 비율을 미리 계산하여 성능 최적화
        // ----------------------------------------------------
        this.scaleX = this.resolutionEngine.canvas.width / this.internalResolution.width;
        this.scaleY = this.resolutionEngine.canvas.height / this.internalResolution.height;

        // 캔버스 크기가 변경될 때마다 스케일링 비율을 업데이트하도록 리스너 추가
        window.addEventListener('resize', this._updateScaleFactors.bind(this));
    }

    // 캔버스 크기 변경 시 스케일링 비율 업데이트
    _updateScaleFactors() {
        this.scaleX = this.resolutionEngine.canvas.width / this.internalResolution.width;
        this.scaleY = this.resolutionEngine.canvas.height / this.internalResolution.height;
    }

    // ----------------------------------------------------
    // 📊 각 수치를 실제 픽셀 단위로 변환하여 제공하는 메서드
    // ----------------------------------------------------

    /**
     * 내부 해상도 기준의 X축 수치를 실제 화면 픽셀로 변환합니다.
     * @param {number} value 내부 해상도 기준 X축 수치
     * @returns {number} 실제 화면 픽셀 수치
     */
    getPixelX(value) {
        return value * this.scaleX;
    }

    /**
     * 내부 해상도 기준의 Y축 수치를 실제 화면 픽셀로 변환합니다.
     * @param {number} value 내부 해상도 기준 Y축 수치
     * @returns {number} 실제 화면 픽셀 수치
     */
    getPixelY(value) {
        return value * this.scaleY;
    }

    /**
     * 내부 해상도 기준의 일반적인 크기 수치를 실제 화면 픽셀로 변환합니다.
     * 가로세로 비율에 따라 유연하게 조절될 수 있도록 평균 스케일을 사용하거나,
     * 특정 축 스케일을 강제할 수 있습니다.
     * 여기서는 X축 스케일을 기본으로 사용하고, 필요에 따라 Y축을 선택할 수 있도록 합니다.
     * @param {number} value 내부 해상도 기준 크기 수치
     * @param {string} [axis='x'] 'x' 또는 'y' 축 스케일을 기준으로 할지 선택 (기본 'x')
     * @returns {number} 실제 화면 픽셀 수치
     */
    getPixelSize(value, axis = 'x') {
        if (axis === 'y') {
            return value * this.scaleY;
        }
        return value * this.scaleX;
    }

    // ----------------------------------------------------
    // 📦 정의된 UI 크기 단위를 실제 픽셀로 반환하는 메서드
    // ----------------------------------------------------

    getPadding(axis = 'x') {
        return this.getPixelSize(this.basePadding, axis);
    }

    getMargin(axis = 'x') {
        return this.getPixelSize(this.baseMargin, axis);
    }

    getButtonHeight(axis = 'y') {
        return this.getPixelSize(this.baseButtonHeight, axis);
    }

    getButtonWidth(axis = 'x') {
        return this.getPixelSize(this.baseButtonWidth, axis);
    }

    getIconSize(axis = 'x') { // 아이콘은 보통 정사각형이므로 x축 스케일만
        return this.getPixelSize(this.baseIconSize, axis);
    }

    getFontSizeSmall() {
        // 폰트 크기는 일반적으로 Y축 스케일에 더 민감하게 반응하지만,
        // 가로 스케일에 따라 너비가 달라질 수 있으므로, 두 축의 평균 스케일을 사용할 수도 있습니다.
        // 여기서는 Y축 스케일을 기준으로 합니다.
        return this.getPixelSize(this.baseFontSizeSmall, 'y');
    }

    getFontSizeMedium() {
        return this.getPixelSize(this.baseFontSizeMedium, 'y');
    }

    getFontSizeLarge() {
        return this.getPixelSize(this.baseFontSizeLarge, 'y');
    }

    getFontSizeHuge() {
        return this.getPixelSize(this.baseFontSizeHuge, 'y');
    }

    getPanelWidth() {
        return this.getPixelX(this.basePanelWidth);
    }

    getPanelHeight() {
        return this.getPixelY(this.basePanelHeight);
    }

    // 타일 크기를 기반으로 한 UI 단위 가져오기
    getUiUnitFromTile(axis = 'x') {
        return this.getPixelSize(this.uiUnitFromTile, axis);
    }

    getButtonHeightFromTile(axis = 'y') {
        return this.getPixelSize(this.buttonHeightFromTile, axis);
    }

    getPaddingFromTile(axis = 'x') {
        return this.getPixelSize(this.paddingFromTile, axis);
    }

    // ----------------------------------------------------
    // 💡 기타 유틸리티 메서드
    // ----------------------------------------------------

    /**
     * 내부 해상도 기준의 좌표를 실제 화면 픽셀 좌표로 변환합니다.
     * (캔버스 왼쪽 상단 기준)
     * @param {number} internalX 내부 해상도 기준 X 좌표
     * @param {number} internalY 내부 해상도 기준 Y 좌표
     * @returns {{x: number, y: number}} 실제 화면 픽셀 좌표
     */
    getPixelPosition(internalX, internalY) {
        return {
            x: this.getPixelX(internalX),
            y: this.getPixelY(internalY)
        };
    }
}

// ----------------------------------------------------------------------
// 사용 예시 (main.js 또는 게임 시작 파일에서)
// ----------------------------------------------------------------------

/*
// 이 코드는 이전의 해상도 엔진 예시 코드와 함께 작동합니다.

// 1. HTML 파일에 gameCanvas가 있다고 가정 (이전 예시 참고)
// <canvas id="gameCanvas"></canvas>

// 2. resolutionEngine.js 파일을 먼저 로드
// <script src="resolutionEngine.js"></script>

// 3. measurementEngine.js 파일을 그 다음으로 로드
// <script src="measurementEngine.js"></script>

// 4. 메인 게임 스크립트 (예: main.js)
// const engine = new ResolutionEngine('gameCanvas', 1920, 1080); // 해상도 엔진 초기화
// const gl = engine.getGLContext();
// const internalRes = engine.getInternalResolution();

// const measure = new MeasurementEngine(engine); // 측량 엔진 초기화

// if (gl && measure) {
//     console.log("Measurement Engine initialized.");
//
//     // 예시: UI 패널의 실제 화면 크기를 얻기
//     const panelWidth = measure.getPanelWidth();
//     const panelHeight = measure.getPanelHeight();
//     console.log(`UI Panel Size (Actual Pixels): ${panelWidth}px x ${panelHeight}px`);
//
//     // 예시: 버튼의 실제 화면 크기를 얻기
//     const buttonHeight = measure.getButtonHeight();
//     const buttonWidth = measure.getButtonWidth();
//     console.log(`Button Size (Actual Pixels): ${buttonWidth}px x ${buttonHeight}px`);
//
//     // 예시: 작은 폰트의 실제 픽셀 크기
//     const smallFontSize = measure.getFontSizeSmall();
//     console.log(`Small Font Size (Actual Pixels): ${smallFontSize}px`);
//
//     // 게임 렌더링 루프 (이전과 동일)
//     function gameLoop() {
//         engine.beginFrame();
//
//         // 여기에 게임 그리기 로직을 구현합니다.
//         // UI를 그릴 때는 measure 객체를 통해 크기 수치를 호출하여 사용합니다.
//         // 예:
//         // UI_ELEMENT_WIDTH = measure.getButtonWidth();
//         // UI_ELEMENT_HEIGHT = measure.getButtonHeight();
//
//         engine.endFrame();
//         requestAnimationFrame(gameLoop);
//     }
//
//     requestAnimationFrame(gameLoop);
// }
*/
