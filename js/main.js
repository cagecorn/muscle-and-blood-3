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
    if (!mercenaryPanelGl) { console.warn("Failed to get mercenary panel WebGL context."); }
    if (!combatLogGl) { console.warn("Failed to get combat log WebGL context."); }

    // 2. 측량 엔진 초기화
    const measurementEngine = new MeasurementEngine(resolutionEngine);

    // 3. 인풋 매니저 초기화
    const inputManager = new InputManager(resolutionEngine.canvas);

    // 4. 에셋 로더 초기화
    const assetLoader = new AssetLoader(gl);

    // 5. 게임 엔진 초기화
    const gameEngine = new GameEngine(measurementEngine);

    // 6. 렌더러 초기화
    const cameraEngine = new CameraEngine(resolutionEngine);
    const layerEngine = new LayerEngine();
    const tempRenderer = {}; // placeholder for circular dependency
    const panelEngine = new PanelEngine(measurementEngine, tempRenderer);
    const uiEngine = new UIEngine(measurementEngine, inputManager);
    const renderer = new Renderer(resolutionEngine, measurementEngine, cameraEngine, layerEngine, panelEngine, uiEngine);
    if (mercenaryPanelGl) renderer.addPanelContext('mercenaryPanelCanvas', mercenaryPanelGl, mercenaryPanelCanvas);
    if (combatLogGl) renderer.addPanelContext('combatLogCanvas', combatLogGl, combatLogCanvas);
    panelEngine.renderer = renderer;
    renderer.setBattleGridManager(battleGridManager);
    renderer.setBattleStageManager(battleStageManager);
    battleStageManager.renderer = renderer;

    // 7. 디버그 매니저 초기화
    const debugManager = new DebugManager('gameCanvas', true);

    // 8. 추가 엔진들
    const turnEngine = new TurnEngine(gameEngine);
    const delayEngine = new DelayEngine();

    const gridEngine = new GridEngine(measurementEngine);
    const battleLogEngine = new BattleLogEngine(panelEngine, measurementEngine);
    const battleGridManager = new BattleGridManager(gridEngine, cameraEngine, measurementEngine, resolutionEngine);
    const mercenaryPanelGridManager = new MercenaryPanelGridManager(gridEngine, panelEngine, measurementEngine);
    const battleStageManager = new BattleStageManager(assetLoader, null, cameraEngine, resolutionEngine);

    // 9. 게임 루프 초기화
    const gameLoop = new GameLoop(gameEngine, renderer, panelEngine, uiEngine, delayEngine);

    // 게임 초기 설정
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
        { name: 'bg_music', type: 'audio', url: 'assets/audio/bg_music.mp3' },
        { name: 'merc_data', type: 'json', url: 'assets/data/mercenaries.json' },
        { name: battleStageManager.backgroundAssetId, type: 'image', url: battleStageManager.backgroundUrl }
    ];

    assetLoader.load(
        assetsToLoad,
        (loaded, total) => {
            console.log(`Loading assets: ${loaded}/${total}`);
        },
        () => {
            console.log("All assets loaded. Starting game loop.");
            gameLoop.start();
            battleStageManager.onAssetsLoaded();

            panelEngine.registerPanel('mercenaryPanelCanvas', {
                width: measurementEngine.internalResolution.width,
                height: 100,
                x: 0, y: 0
            }, true);
            panelEngine.registerPanel('combatLogCanvas', {
                width: measurementEngine.internalResolution.width,
                height: 150,
                x: 0, y: measurementEngine.internalResolution.height - 150
            }, false);

            uiEngine.registerUIElement('startButton', 'button', {
                x: measurementEngine.internalResolution.width / 2 - 100,
                y: measurementEngine.internalResolution.height / 2 - 30,
                width: 200, height: 60,
                text: '게임 시작',
                fontSize: measurementEngine.getFontSizeLarge(),
                color: '#00FF00'
            }, () => {
                console.log('Start Button Clicked!');
                battleLogEngine.addLog('게임이 시작되었습니다!', 'cyan');
            });

            delayEngine.addDelay(() => {
                console.log('5초 후 메시지: 딜레이 엔진 작동 완료!');
                battleLogEngine.addLog('5초 딜레이가 종료되었습니다.', 'orange');
            }, 5000, 'introDelay');
        }
    );

    // (선택 사항) 디버그 정보 업데이트를 게임 루프에서 처리
    let totalGameTime = 0;
    function mainGameLoopTick(currentTime) {
        const deltaTime = currentTime - (mainGameLoopTick.lastTime || currentTime);
        mainGameLoopTick.lastTime = currentTime;
        totalGameTime += deltaTime;

        if (debugManager.isEnabled) {
            debugManager.update(deltaTime, totalGameTime, inputManager);
        }

        panelEngine.update(deltaTime);
        uiEngine.update(deltaTime);
        delayEngine.update(deltaTime);
    }

    window.addEventListener('keydown', (event) => {
        if (event.key === 'F12' && debugManager.isEnabled !== undefined) {
            event.preventDefault();
            debugManager.toggleEnabled();
        }
    });

    console.log('Game initialization script finished.');
});

