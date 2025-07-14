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
        combatLogCanvas.getContext('2d', { alpha: true }) : null; // WebGL이 아닌 2D 컨텍스트로 변경

    if (!gl) {
        console.error("Failed to get main WebGL context. Game cannot run.");
        return;
    }
    if (!mercenaryPanelGl) { console.warn("Failed to get mercenary panel WebGL context."); }
    // combatLogCanvas는 2D 컨텍스트를 사용하므로 WebGL 경고는 필요 없습니다.

    // 2. 측량 엔진 초기화
    const measurementEngine = new MeasurementEngine(resolutionEngine);

    // 3. 인풋 매니저 초기화
    const inputManager = new InputManager(resolutionEngine.canvas);

    // 4. 에셋 로더 초기화
    const assetLoader = new AssetLoader(gl);

    // 5. 게임 엔진 초기화
    const gameEngine = new GameEngine(measurementEngine);

    // 6. 매니저 엔진들 초기화
    // CameraEngine을 가장 먼저 생성하여 Renderer에서 바로 사용할 수 있도록 합니다.
    const cameraEngine = new CameraEngine(resolutionEngine);
    const layerEngine = new LayerEngine();
    const tempRenderer = {}; // 순환 의존성 방지용 임시 객체
    const panelEngine = new PanelEngine(measurementEngine, tempRenderer);
    const uiEngine = new UIEngine(measurementEngine, inputManager);
    const turnEngine = new TurnEngine(gameEngine);
    const delayEngine = new DelayEngine();

    // Renderer는 GridEngine보다 먼저 생성되어야 합니다.
    const renderer = new Renderer(resolutionEngine, measurementEngine, cameraEngine, layerEngine, panelEngine, uiEngine);
    if (mercenaryPanelGl) renderer.addPanelContext('mercenaryPanelCanvas', mercenaryPanelGl, mercenaryPanelCanvas);
    if (combatLogGl) renderer.addPanelContext('combatLogCanvas', combatLogGl, combatLogCanvas);
    panelEngine.renderer = renderer;

    // ✨ 패널 등록을 MercenaryPanelGridManager 초기화보다 먼저 수행
    // assetLoader.load가 완료될 때까지 기다릴 필요 없이 즉시 등록합니다.
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

    // 7. 디버그 매니저 초기화
    const debugManager = new DebugManager('gameCanvas', true);

    // 8. 추가 엔진들
    const gridEngine = new GridEngine(measurementEngine, renderer);
    const battleLogEngine = new BattleLogEngine(panelEngine, measurementEngine);
    const battleStageManager = new BattleStageManager(assetLoader, renderer, cameraEngine, resolutionEngine);
    const battleGridManager = new BattleGridManager(gridEngine, cameraEngine, measurementEngine, resolutionEngine);
    const mercenaryPanelGridManager = new MercenaryPanelGridManager(gridEngine, panelEngine, measurementEngine);

    // ✨ 새로운 엔진들 초기화
    const sceneEngine = new SceneEngine(renderer, uiEngine, panelEngine, battleLogEngine, cameraEngine, resolutionEngine);
    const territoryEngine = new TerritoryEngine(gameEngine, sceneEngine, uiEngine, battleLogEngine, measurementEngine);

    // ✨ 인풋 트래킹 디버그 매니저 초기화
    const inputTrackingDebugManager = new InputTrackingDebugManager(inputManager, debugManager);

    // 전역 노출 (개발 편의용)
    window.battleStageManagerInstance = battleStageManager;
    window.battleGridManagerInstance = battleGridManager;
    window.mercenaryPanelGridManagerInstance = mercenaryPanelGridManager;
    window.sceneEngineInstance = sceneEngine; // 씬 엔진 전역 노출
    window.territoryEngineInstance = territoryEngine; // 영지 엔진 전역 노출
    window.inputTrackingDebugManagerInstance = inputTrackingDebugManager; // 인풋 트래킹 디버그 매니저 전역 노출

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

            // ✨ 씬 등록: 'territory' 씬과 'battle' 씬 정의
            sceneEngine.registerScene('territory', {
                activate: () => territoryEngine.activate(),
                deactivate: () => territoryEngine.deactivate(),
                update: (dt) => territoryEngine.update(dt),
                draw: (renderer) => territoryEngine.draw(renderer)
            });

            sceneEngine.registerScene('battle', {
                activate: () => {
                    console.log("SceneEngine: Activating Battle Scene.");
                    battleLogEngine.addLog("전투 씬에 진입했습니다.", "red");
                    battleStageManager.onAssetsLoaded();
                    uiEngine.unregisterUIElement('startButton');
                },
                deactivate: () => {
                    console.log("SceneEngine: Deactivating Battle Scene.");
                },
                update: (dt) => {
                    battleGridManager.update(dt);
                },
                draw: (renderer) => {
                    renderer.setClearColor(0.0, 0.0, 0.0, 1.0);
                    renderer.clear();
                    battleStageManager.draw(renderer);
                    battleGridManager.draw(renderer);
                }
            });

            // ✨ 게임 시작 시 'territory' 씬 로드
            sceneEngine.loadScene('territory');

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
        inputTrackingDebugManager.update(deltaTime);

        panelEngine.update(deltaTime);
        uiEngine.update(deltaTime);
        delayEngine.update(deltaTime);

        sceneEngine.update(deltaTime);
        sceneEngine.draw(renderer);
    }

    // ✨ 게임 루프의 requestAnimationFrame 콜백을 mainGameLoopTick으로 변경
    gameLoop.setGameLoopCallback(mainGameLoopTick);

    window.addEventListener('keydown', (event) => {
        if (event.key === 'F12' && debugManager.isEnabled !== undefined) {
            event.preventDefault();
            debugManager.toggleEnabled();
        }
        // ✨ F11 키로 InputTrackingDebugManager 토글
        if (event.key === 'F11') {
            event.preventDefault();
            inputTrackingDebugManager.toggleEnabled();
        }
    });

    console.log('Game initialization script finished.');
});

