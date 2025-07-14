// main.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded: Starting game initialization...");

    // 1. 해상도 엔진 초기화
    const resolutionEngine = new ResolutionEngine('gameCanvas', 1920, 1080);
    const gl = resolutionEngine.getGLContext();

    // 새롭게 추가된 캔버스들의 WebGL 컨텍스트 초기화
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
    // 경고 메시지는 유지하되, 게임 진행에 필수적이지는 않음을 나타냄
    if (!mercenaryPanelGl) { console.warn("Failed to get mercenary panel WebGL context."); }
    if (!combatLogGl) { console.warn("Failed to get combat log WebGL context."); }

    // 2. 측량 엔진 초기화
    const measurementEngine = new MeasurementEngine(resolutionEngine);

    // 3. 인풋 매니저 초기화 (메인 게임 캔버스에 이벤트를 리스닝)
    const inputManager = new InputManager(resolutionEngine.canvas);

    // 4. 에셋 로더 초기화 (메인 GL 컨텍스트 전달)
    const assetLoader = new AssetLoader(gl);

    // 5. 게임 엔진 초기화
    const gameEngine = new GameEngine(measurementEngine);
    // (선택 사항) 게임 엔진에 InputManager를 전달하여 게임 로직에서 입력 상태를 확인하도록 할 수 있음
    // gameEngine.setInputManager(inputManager);

    // 6. 렌더러 초기화
    const renderer = new Renderer(resolutionEngine, measurementEngine);
    // 렌더러에 각 패널 캔버스의 GL 컨텍스트를 전달
    if (mercenaryPanelGl) renderer.addPanelContext('mercenaryPanel', mercenaryPanelGl, mercenaryPanelCanvas);
    if (combatLogGl) renderer.addPanelContext('combatLog', combatLogGl, combatLogCanvas);

    // 7. 디버그 매니저 초기화 (선택 사항)
    const debugManager = new DebugManager('gameCanvas', true); // true: 디버그 HUD 활성화

    // 8. 게임 루프 초기화
    const gameLoop = new GameLoop(gameEngine, renderer);

    // 게임 초기 설정 (예: 초기 맵 로드, 플레이어 생성 등)
    gameEngine.initializeGame();

    // ----------------------------------------------------
    // Web Worker 초기화
    // ----------------------------------------------------

    // 1. Battle Calculation Worker (Web Worker)
    let battleWorker;
    try {
        battleWorker = new Worker('js/workers/battleCalculationWorker.js');
        battleWorker.onmessage = (event) => {
            const { type, payload, originalRequestId } = event.data;
            if (type === 'COMBAT_STEP_RESULT') {
                console.log(`Main: Received combat result for request ${originalRequestId}:`, payload);
                // TODO: gameEngine.applyCombatResult(payload);
            } else if (type === 'CALCULATION_ERROR') {
                console.error(`Main: Combat calculation error for request ${originalRequestId}:`, payload);
            }
        };
        battleWorker.onerror = (error) => {
            console.error('BattleCalculationWorker error:', error);
        };
        console.log('BattleCalculationWorker initialized in main.js.');
    } catch (e) {
        console.error('Failed to create BattleCalculationWorker:', e);
    }

    // 2. Event Worker (Shared Worker)
    let eventWorkerPort;
    try {
        const sharedWorker = new SharedWorker('js/workers/eventWorker.js');
        eventWorkerPort = sharedWorker.port;
        eventWorkerPort.onmessage = (event) => {
            const { type, payload } = event.data;
            console.log('Main: Received message from EventWorker:', type, payload);
            if (type === 'WORKER_READY') {
                console.log('EventWorker is ready and connected to main script.');
                eventWorkerPort.postMessage({ type: 'MAIN_SCRIPT_CONNECTED', payload: { script: 'main.js' } });
            }
        };
        eventWorkerPort.onerror = (error) => {
            console.error('EventWorker error:', error);
        };
        eventWorkerPort.start();
        console.log('EventWorker initialized in main.js.');
    } catch (e) {
        console.error('Failed to create EventWorker:', e);
    }

    // ----------------------------------------------------
    // 게임 에셋 로딩 예시
    // ----------------------------------------------------
    const assetsToLoad = [
        // { name: 'tile_grass', type: 'image', url: 'assets/tiles/grass.png' },
        // { name: 'ui_button', type: 'image', url: 'assets/ui/button.png' },
        // { name: 'bg_music', type: 'audio', url: 'assets/audio/bg_music.mp3' },
        // { name: 'merc_data', type: 'json', url: 'assets/data/mercenaries.json' },
    ];

    assetLoader.load(
        assetsToLoad,
        (loaded, total) => {
            console.log(`Loading assets: ${loaded}/${total}`);
            // 여기에서 로딩 바 UI를 업데이트할 수 있습니다.
        },
        () => {
            console.log("All assets loaded. Starting game loop.");
            // 모든 에셋 로드 완료 후 게임 루프 시작
            gameLoop.start();
        }
    );

    // 게임 루프 시작을 에셋 로딩 완료 후로 이동시켰습니다.
    // 만약 로딩 UI가 필요 없다면 바로 gameLoop.start();를 호출해도 됩니다.


    // (선택 사항) 디버그 정보 업데이트를 게임 루프에서 처리
    let totalGameTime = 0;
    // 기존 gameLoop의 loop 함수를 직접 수정하거나, GameLoop 클래스에 콜백을 추가하는 방식 고려
    // 간단한 테스트를 위해 여기에 임시 루프를 추가합니다. 실제로는 GameLoop 내부에서 처리되어야 합니다.
    function mainGameLoopTick(currentTime) {
        const deltaTime = currentTime - (mainGameLoopTick.lastTime || currentTime);
        mainGameLoopTick.lastTime = currentTime;
        totalGameTime += deltaTime;

        // debugManager가 활성화되어 있다면 업데이트
        if (debugManager.isEnabled) {
             debugManager.update(deltaTime, totalGameTime, inputManager);
        }

        // 실제 gameLoop.js의 loop 함수에서 gameEngine.update()와 renderer.render()가 호출됩니다.
        // 현재는 assetLoader.load 콜백에서 gameLoop.start()를 호출하므로,
        // 여기의 mainGameLoopTick은 디버깅용 임시 루프입니다.
        // 실제 통합 시에는 gameLoop.js의 loop 함수에 debugManager.update 호출을 추가해야 합니다.
        // requestAnimationFrame(mainGameLoopTick); // 이 줄은 실제 gameLoop에서 호출됩니다.
    }
    // requestAnimationFrame(mainGameLoopTick); // 디버그 매니저를 위한 임시 루프 시작 (실제는 GameLoop 내부)

    // 디버그 HUD 토글을 위한 키 이벤트 (예: F12 키)
    window.addEventListener('keydown', (event) => {
        if (event.key === 'F12' && debugManager.isEnabled !== undefined) { // F12키를 눌렀을 때
            event.preventDefault(); // 브라우저 개발자 도구 열림 방지
            debugManager.toggleEnabled();
        }
    });

    console.log("Game initialization script finished.");
});
