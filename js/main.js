// main.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded: Starting game initialization...");

    // 1. 해상도 엔진 초기화
    // 게임의 내부 가상 해상도를 1920x1080으로 설정 (Full HD, 512x512 타일 배치에 적합)
    const resolutionEngine = new ResolutionEngine('gameCanvas', 1920, 1080);
    const gl = resolutionEngine.getGLContext();

    // 새롭게 추가된 오버레이 캔버스들에 대한 WebGL 컨텍스트 초기화
    const mercenaryPanelCanvas = document.getElementById('mercenaryPanelCanvas');
    const mercenaryPanelGl = mercenaryPanelCanvas ?
        mercenaryPanelCanvas.getContext('webgl', { alpha: true, antialias: true }) : null;

    const combatLogCanvas = document.getElementById('combatLogCanvas');
    const combatLogGl = combatLogCanvas ?
        combatLogCanvas.getContext('webgl', { alpha: true, antialias: true }) : null;

    if (!gl) {
        console.error("Failed to get main WebGL context. Game cannot run.");
        return;
    }
    if (!mercenaryPanelGl) {
        console.warn("Failed to get mercenary panel WebGL context.");
    }
    if (!combatLogGl) {
        console.warn("Failed to get combat log WebGL context.");
    }

    // 2. 측량 엔진 초기화
    const measurementEngine = new MeasurementEngine(resolutionEngine);

    // 3. 게임 엔진 초기화
    const gameEngine = new GameEngine(measurementEngine);

    // 4. 렌더러 초기화
    const renderer = new Renderer(resolutionEngine, measurementEngine);
    // 추가 패널 컨텍스트를 렌더러에 등록하여 관리할 수 있도록 함
    renderer.addPanelContext('mercenary', mercenaryPanelGl, mercenaryPanelCanvas);
    renderer.addPanelContext('combatLog', combatLogGl, combatLogCanvas);

    // 5. 게임 루프 초기화
    const gameLoop = new GameLoop(gameEngine, renderer);

    // 게임 초기 설정 (예: 초기 맵 로드, 플레이어 생성 등)
    gameEngine.initializeGame();

    // 게임 루프 시작!
    gameLoop.start();

    console.log("Game initialized and running!");
});
