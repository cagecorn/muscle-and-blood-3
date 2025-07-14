// debugManager.js

class DebugManager {
    constructor(gameCanvasId, isEnabled = true) {
        this.isEnabled = isEnabled;
        if (!this.isEnabled) {
            console.log("DebugManager is disabled.");
            return;
        }

        this.canvas = document.getElementById(gameCanvasId);
        if (!this.canvas) {
            console.warn("Game canvas not found for DebugManager. HUD will not be displayed.");
            this.isEnabled = false; // 캔버스가 없으면 비활성화
            return;
        }

        this.debugDiv = document.createElement('div');
        this.debugDiv.id = 'debug-hud';
        this.debugDiv.style.position = 'absolute';
        this.debugDiv.style.top = '10px';
        this.debugDiv.style.left = '10px';
        this.debugDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.debugDiv.style.color = '#0f0'; /* 녹색 글씨 */
        this.debugDiv.style.padding = '8px';
        this.debugDiv.style.fontFamily = 'monospace';
        this.debugDiv.style.fontSize = '14px';
        this.debugDiv.style.zIndex = '10000'; // 다른 요소 위에 표시
        this.debugDiv.style.pointerEvents = 'none'; // 마우스 이벤트 무시
        document.body.appendChild(this.debugDiv);

        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdateTime = 0;
        this.lastPerformanceCheckTime = 0;

        // 기타 디버그 정보
        this.debugInfo = {
            memory: 'N/A',
            mousePos: 'N/A',
            touchPos: 'N/A',
            gameTime: '0s',
            // 추가적인 디버그 정보 (예: 특정 오브젝트 위치, 상태 등)
            custom: {},
            // 일반 메시지 표시용 배열
            messages: []
        };

        console.log("DebugManager initialized.");
    }

    update(deltaTime, gameTime, inputManager) {
        if (!this.isEnabled) return;

        this.frameCount++;
        const currentTime = performance.now();

        // FPS 계산 (1초마다 업데이트)
        if (currentTime - this.lastFpsUpdateTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdateTime = currentTime;
        }

        // 메모리 정보 (크롬 전용 API)
        if (window.performance && window.performance.memory) {
            const memory = window.performance.memory;
            this.debugInfo.memory = `JS Heap: ${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB / ${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`;
        }

        // 마우스 및 터치 위치
        if (inputManager) {
            const mouse = inputManager.getMousePosition();
            this.debugInfo.mousePos = `Mouse: (${mouse.x.toFixed(0)}, ${mouse.y.toFixed(0)})`;
            const touches = inputManager.getTouchPositions();
            if (touches.length > 0) {
                this.debugInfo.touchPos = `Touch: (${touches[0].x.toFixed(0)}, ${touches[0].y.toFixed(0)})`;
            } else {
                this.debugInfo.touchPos = 'Touch: N/A';
            }
        }

        this.debugInfo.gameTime = `${(gameTime / 1000).toFixed(1)}s`;

        this._renderHUD();
    }

    _renderHUD() {
        if (!this.isEnabled) return;

        let hudContent = `
            FPS: ${this.fps}<br>
            Time: ${this.debugInfo.gameTime}<br>
            ${this.debugInfo.memory}<br>
            ${this.debugInfo.mousePos}<br>
            ${this.debugInfo.touchPos}<br>
            --- Custom ---<br>
        `;

        for (const key in this.debugInfo.custom) {
            hudContent += `${key}: ${this.debugInfo.custom[key]}<br>`;
        }

        if (this.debugInfo.messages.length > 0) {
            hudContent += `--- Messages ---<br>`;
            this.debugInfo.messages.slice(-5).forEach(msg => {
                hudContent += `${msg}<br>`;
            });
        }

        this.debugDiv.innerHTML = hudContent;
    }

    // 커스텀 디버그 정보 설정
    setCustomDebugInfo(key, value) {
        if (!this.isEnabled) return;
        this.debugInfo.custom[key] = value;
    }

    // 새로 추가된 메서드: 일반 디버그 메시지 추가
    addDebugMessage(message) {
        if (!this.isEnabled) return;
        this.debugInfo.messages.push(message);
        if (this.debugInfo.messages.length > 10) {
            this.debugInfo.messages.shift();
        }
    }

    // 디버거 활성화/비활성화
    toggleEnabled() {
        this.isEnabled = !this.isEnabled;
        this.debugDiv.style.display = this.isEnabled ? 'block' : 'none';
        console.log(`DebugManager ${this.isEnabled ? 'enabled' : 'disabled'}.`);
        this.addDebugMessage(`DebugManager: ${this.isEnabled ? 'ON' : 'OFF'}`);
    }
}
