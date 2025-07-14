const test = require('node:test');
const assert = require('assert');

// js/debugManager.js 파일의 전체 내용 (테스트를 위해 직접 복사)
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
            this.isEnabled = false;
            return;
        }

        this.debugDiv = document.createElement('div');
        this.debugDiv.id = 'debug-hud';
        this.debugDiv.style.position = 'absolute';
        this.debugDiv.style.top = '10px';
        this.debugDiv.style.left = '10px';
        this.debugDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.debugDiv.style.color = '#0f0';
        this.debugDiv.style.padding = '8px';
        this.debugDiv.style.fontFamily = 'monospace';
        this.debugDiv.style.fontSize = '14px';
        this.debugDiv.style.zIndex = '10000';
        this.debugDiv.style.pointerEvents = 'none';
        document.body.appendChild(this.debugDiv);

        this.fps = 0;
        this.frameCount = 0;
        this.lastFpsUpdateTime = 0;
        this.lastPerformanceCheckTime = 0;

        this.debugInfo = {
            memory: 'N/A',
            mousePos: 'N/A',
            touchPos: 'N/A',
            gameTime: '0s',
            custom: {}
        };

        console.log("DebugManager initialized.");
    }

    update(deltaTime, gameTime, inputManager) {
        if (!this.isEnabled) return;

        this.frameCount++;
        const currentTime = global.window.performance.now();

        if (currentTime - this.lastFpsUpdateTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdateTime = currentTime;
        }

        if (global.window.performance && global.window.performance.memory) {
            const memory = global.window.performance.memory;
            this.debugInfo.memory = `JS Heap: ${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB / ${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`;
        }

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

        this.debugDiv.innerHTML = hudContent;
    }

    setCustomDebugInfo(key, value) {
        if (!this.isEnabled) return;
        this.debugInfo.custom[key] = value;
    }

    toggleEnabled() {
        this.isEnabled = !this.isEnabled;
        this.debugDiv.style.display = this.isEnabled ? 'block' : 'none';
        console.log(`DebugManager ${this.isEnabled ? 'enabled' : 'disabled'}.`);
    }
}


test('DebugManager Tests', async (t) => {
    let debugManager;
    const CANVAS_ID = 'gameCanvas';
    let originalLog;
    let originalWarn;
    let originalPerformanceNow;
    let originalMemory;

    class MockInputManager {
        getMousePosition() { return { x: 100, y: 200 }; }
        getTouchPositions() { return [{ x: 300, y: 400 }]; }
    }

    t.beforeEach(() => {
        global.document = {
            getElementById: (id) => {
                if (id === CANVAS_ID) {
                    return { width: 800, height: 600, style: {}, getContext: () => ({}) };
                }
                return null;
            },
            createElement: t.mock.fn((tag) => ({ id: '', style: {}, innerHTML: '', tagName: tag })),
            body: { appendChild: t.mock.fn() }
        };

        global.window = {
            performance: {
                now: t.mock.fn(() => 0),
                memory: {
                    usedJSHeapSize: 50 * 1024 * 1024,
                    totalJSHeapSize: 100 * 1024 * 1024
                }
            }
        };

        originalLog = console.log;
        originalWarn = console.warn;
        console.log = t.mock.fn();
        console.warn = t.mock.fn();

        originalPerformanceNow = global.window.performance.now;
        originalMemory = global.window.performance.memory;

        debugManager = new DebugManager(CANVAS_ID, true);
    });

    t.afterEach(() => {
        console.log = originalLog;
        console.warn = originalWarn;
        global.window.performance.now = originalPerformanceNow;
        global.window.performance.memory = originalMemory;
        delete global.document;
        delete global.window;
    });

    await t.test('Constructor initializes correctly when enabled and canvas found', () => {
        assert.ok(debugManager.isEnabled, 'DebugManager should be enabled');
        assert.ok(debugManager.canvas, 'Canvas should be found');
        assert.strictEqual(global.document.createElement.mock.callCount(), 1, 'debugDiv should be created');
        assert.strictEqual(global.document.body.appendChild.mock.callCount(), 1, 'debugDiv should be appended to body');
        assert.strictEqual(debugManager.debugDiv.id, 'debug-hud', 'debugDiv ID should be correct');
        assert.strictEqual(debugManager.debugDiv.style.position, 'absolute', 'debugDiv style should be set');
        assert.strictEqual(console.log.mock.callCount(), 1, 'Initialization message should be logged');
    });

    await t.test('Constructor logs warning and disables if canvas not found', () => {
        const debugManagerNoCanvas = new DebugManager('nonExistentCanvas', true);
        assert.ok(!debugManagerNoCanvas.isEnabled, 'DebugManager should be disabled');
        assert.strictEqual(console.warn.mock.callCount(), 1, 'Warning message should be logged');
        assert.ok(console.warn.mock.calls[0].arguments[0].includes('Game canvas not found for DebugManager.'), 'Warning message content');
    });

    await t.test('update calculates FPS correctly over time', () => {
        global.window.performance.now.mock.mockImplementation(() => 0);
        debugManager.update(0, 0, null);

        global.window.performance.now.mock.mockImplementation(() => 500);
        debugManager.update(500, 500, null);
        assert.strictEqual(debugManager.fps, 0, 'FPS should be 0 before 1 second mark');

        global.window.performance.now.mock.mockImplementation(() => 1000);
        debugManager.update(500, 1000, null);
        assert.strictEqual(debugManager.fps, 3, 'FPS should be 3 after 3 frames in 1 second');
        assert.strictEqual(debugManager.frameCount, 0, 'Frame count should reset');
        assert.strictEqual(debugManager.lastFpsUpdateTime, 1000, 'lastFpsUpdateTime should update');
    });

    await t.test('update populates debugInfo correctly', () => {
        const mockInputManager = new MockInputManager();
        const deltaTime = 16.67;
        const gameTime = 12345;

        debugManager.update(deltaTime, gameTime, mockInputManager);

        assert.ok(debugManager.debugInfo.memory.includes('50.00 MB / 100.00 MB'), 'Memory info should be correct');
        assert.strictEqual(debugManager.debugInfo.mousePos, 'Mouse: (100, 200)', 'Mouse position should be correct');
        assert.strictEqual(debugManager.debugInfo.touchPos, 'Touch: (300, 400)', 'Touch position should be correct');
        assert.strictEqual(debugManager.debugInfo.gameTime, '12.3s', 'Game time should be formatted correctly');

        const expectedHudContent = `
            FPS: 0<br>
            Time: 12.3s<br>
            JS Heap: 50.00 MB / 100.00 MB<br>
            Mouse: (100, 200)<br>
            Touch: (300, 400)<br>
            --- Custom ---<br>
        `;
        assert.strictEqual(debugManager.debugDiv.innerHTML.trim(), expectedHudContent.trim(), 'HUD content should be updated');
    });

    await t.test('setCustomDebugInfo adds custom information', () => {
        debugManager.setCustomDebugInfo('playerHealth', 100);
        debugManager.setCustomDebugInfo('level', 'Forest');
        debugManager._renderHUD();

        const expectedCustomContent = `
            FPS: 0<br>
            Time: 0s<br>
            N/A<br>
            N/A<br>
            N/A<br>
            --- Custom ---<br>
        playerHealth: 100<br>level: Forest<br>
        `;
        assert.strictEqual(debugManager.debugDiv.innerHTML.trim(), expectedCustomContent.trim(), 'Custom info should be in HUD');
    });

    await t.test('toggleEnabled changes enabled state and div display', () => {
        debugManager.toggleEnabled();
        assert.ok(!debugManager.isEnabled, 'DebugManager should be disabled');
        assert.strictEqual(debugManager.debugDiv.style.display, 'none', 'debugDiv should be hidden');
        assert.strictEqual(console.log.mock.callCount(), 2, 'Toggle message should be logged');

        debugManager.toggleEnabled();
        assert.ok(debugManager.isEnabled, 'DebugManager should be enabled');
        assert.strictEqual(debugManager.debugDiv.style.display, 'block', 'debugDiv should be visible');
        assert.strictEqual(console.log.mock.callCount(), 3, 'Toggle message should be logged again');
    });

    await t.test('update does nothing when DebugManager is disabled', () => {
        debugManager.isEnabled = false;
        const initialInnerHTML = debugManager.debugDiv.innerHTML;
        const mockInputManager = new MockInputManager();
        global.window.performance.now.mock.mockImplementation(() => 1000);

        debugManager.update(100, 1000, mockInputManager);

        assert.strictEqual(debugManager.frameCount, 0, 'Frame count should not increment');
        assert.strictEqual(debugManager.fps, 0, 'FPS should not change');
        assert.strictEqual(debugManager.debugDiv.innerHTML, initialInnerHTML, 'HUD content should not change');
    });
});
