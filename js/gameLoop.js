// gameLoop.js

class GameLoop {
    constructor(gameEngine, renderer, panelEngine = null, uiEngine = null, delayEngine = null) {
        if (!gameEngine || !renderer) {
            console.error("GameEngine and Renderer instances are required for GameLoop.");
            return;
        }
        this.gameEngine = gameEngine;
        this.renderer = renderer;
        this.panelEngine = panelEngine;
        this.uiEngine = uiEngine;
        this.delayEngine = delayEngine;
        this.lastTime = 0;
        this.isRunning = false;
        this.customCallback = null;

        console.log("GameLoop initialized.");
    }

    // 게임 루프 시작
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now(); // 초기 시간 설정
        requestAnimationFrame(this.loop.bind(this));
        console.log("GameLoop started.");
    }

    // 게임 루프 정지
    stop() {
        this.isRunning = false;
        console.log("GameLoop stopped.");
    }

    setGameLoopCallback(callback) {
        this.customCallback = typeof callback === 'function' ? callback : null;
    }

    // 실제 게임 루프 함수
    loop(currentTime) {
        if (!this.isRunning) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        if (this.customCallback) {
            this.customCallback(currentTime);
        } else {
            // 1. 게임 로직 업데이트
            this.gameEngine.update(deltaTime);
            if (this.panelEngine) this.panelEngine.update(deltaTime);
            if (this.uiEngine) this.uiEngine.update(deltaTime);
            if (this.delayEngine) this.delayEngine.update(deltaTime);

            // 2. 게임 상태 렌더링
            this.renderer.render(this.gameEngine.getGameState(), deltaTime);
        }

        // 다음 프레임 요청
        requestAnimationFrame(this.loop.bind(this));
    }
}
