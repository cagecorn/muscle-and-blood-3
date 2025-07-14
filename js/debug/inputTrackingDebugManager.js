// js/debug/inputTrackingDebugManager.js
class InputTrackingDebugManager {
    constructor(inputManager, debugManager) {
        this.inputManager = inputManager;
        this.debugManager = debugManager;
        this.isEnabled = false; // 기본적으로 비활성화
        this.lastClickCoords = null;

        // InputManager의 클릭 이벤트를 구독
        this.inputManager.addClickListener(this.handleMouseClick.bind(this));

        console.log("InputTrackingDebugManager initialized.");
    }

    // 클릭 이벤트 핸들러
    handleMouseClick(event) {
        if (this.isEnabled) {
            const rect = this.inputManager.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            this.lastClickCoords = { x: x, y: y };
            console.log(`[DEBUG] 클릭 좌표: x=${x}, y=${y}`);
            if (this.debugManager.isEnabled) {
                this.debugManager.addDebugMessage(`클릭: (${x.toFixed(0)}, ${y.toFixed(0)})`);
            }
        }
    }

    // 활성화/비활성화 토글
    toggleEnabled() {
        this.isEnabled = !this.isEnabled;
        console.log(`InputTrackingDebugManager ${this.isEnabled ? '활성화됨' : '비활성화됨'}.`);
        if (this.debugManager.isEnabled) {
            this.debugManager.addDebugMessage(`Input Tracking: ${this.isEnabled ? 'ON' : 'OFF'}`);
        }
    }

    // 디버그 정보 업데이트 (필요시)
    update(deltaTime) {
        // 현재는 특별히 업데이트할 내용 없음
    }
}
