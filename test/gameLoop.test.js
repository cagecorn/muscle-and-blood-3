const test = require('node:test');
const assert = require('assert');

// GameEngine 스텁
class StubGameEngine {
    constructor() {
        this.update = () => {};
    }
    update() {}
    getGameState() { return {}; }
}

// Renderer 스텁
class StubRenderer {
    constructor() {
        this.render = () => {};
    }
    render() {}
}

// PanelEngine 스텁
class StubPanelEngine { update() {} }

// UIEngine 스텁
class StubUIEngine { update() {} }

// DelayEngine 스텁
class StubDelayEngine { update() {} }

// requestAnimationFrame 및 performance.now 모의
let rafCallback = null;
let mockPerformanceNow = 0;

global.requestAnimationFrame = () => {};

global.cancelAnimationFrame = () => {};

global.performance = { now: () => mockPerformanceNow };

// js/gameLoop.js 파일의 전체 내용 (테스트를 위해 직접 복사)
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
        this.animationFrameId = null; // Store animation frame ID for cancellation

        console.log("GameLoop initialized.");
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = global.performance.now(); // Initial time setting
        this.animationFrameId = global.requestAnimationFrame(this.loop.bind(this));
        console.log("GameLoop started.");
    }

    stop() {
        if (!this.isRunning) return;
        this.isRunning = false;
        if (this.animationFrameId) {
            global.cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        console.log("GameLoop stopped.");
    }

    loop(currentTime) {
        if (!this.isRunning) return;

        const deltaTime = currentTime - this.lastTime; // Time difference from previous frame
        this.lastTime = currentTime;

        // 1. Game Logic Update
        this.gameEngine.update(deltaTime);
        if (this.panelEngine) this.panelEngine.update(deltaTime);
        if (this.uiEngine) this.uiEngine.update(deltaTime);
        if (this.delayEngine) this.delayEngine.update(deltaTime);

        // 2. Game State Rendering
        this.renderer.render(this.gameEngine.getGameState(), deltaTime);

        // Request next frame
        this.animationFrameId = global.requestAnimationFrame(this.loop.bind(this));
    }
}


test('GameLoop Tests', async (t) => {
    let gameLoop;
    let mockGameEngine;
    let mockRenderer;
    let mockPanelEngine;
    let mockUIEngine;
    let mockDelayEngine;

    t.beforeEach(() => {
        // Reset mocks for each test
        mockGameEngine = new StubGameEngine();
        mockGameEngine.update = t.mock.fn();
        mockRenderer = new StubRenderer();
        mockRenderer.render = t.mock.fn();
        mockPanelEngine = new StubPanelEngine();
        mockPanelEngine.update = t.mock.fn();
        mockUIEngine = new StubUIEngine();
        mockUIEngine.update = t.mock.fn();
        mockDelayEngine = new StubDelayEngine();
        mockDelayEngine.update = t.mock.fn();

        // Reset global mocks
        global.requestAnimationFrame = t.mock.fn((cb) => {
            rafCallback = cb; // Save the callback
            return 1; // Return a dummy request ID
        });
        global.cancelAnimationFrame = t.mock.fn(() => {});
        global.performance.now = t.mock.fn(() => mockPerformanceNow);
        mockPerformanceNow = 0; // Reset time to 0 for each test

        gameLoop = new GameLoop(mockGameEngine, mockRenderer, mockPanelEngine, mockUIEngine, mockDelayEngine);
        rafCallback = null; // Clear saved callback
    });

    await t.test('Constructor initializes correctly with required engines', () => {
        assert.ok(gameLoop.gameEngine, 'GameEngine should be set');
        assert.ok(gameLoop.renderer, 'Renderer should be set');
        assert.ok(gameLoop.panelEngine, 'PanelEngine should be set');
        assert.ok(gameLoop.uiEngine, 'UIEngine should be set');
        assert.ok(gameLoop.delayEngine, 'DelayEngine should be set');
        assert.strictEqual(gameLoop.isRunning, false, 'isRunning should be false initially');
        assert.strictEqual(gameLoop.lastTime, 0, 'lastTime should be 0 initially');
    });

    await t.test('Constructor logs error if required engines are missing', () => {
        const originalError = console.error;
        const errorMock = t.mock.fn();
        console.error = errorMock;

        new GameLoop(null, mockRenderer);
        assert.strictEqual(errorMock.mock.callCount(), 1, 'console.error should be called for missing GameEngine');
        errorMock.mock.resetCalls();

        new GameLoop(mockGameEngine, null);
        assert.strictEqual(errorMock.mock.callCount(), 1, 'console.error should be called for missing Renderer');

        console.error = originalError;
    });

    await t.test('start initiates the game loop', () => {
        mockPerformanceNow = 100; // Simulate initial performance.now() value
        gameLoop.start();

        assert.strictEqual(gameLoop.isRunning, true, 'isRunning should be true after start');
        assert.strictEqual(gameLoop.lastTime, 100, 'lastTime should be set to initial performance.now()');
        assert.strictEqual(global.requestAnimationFrame.mock.callCount(), 1, 'requestAnimationFrame should be called once');
        assert.ok(rafCallback, 'requestAnimationFrame callback should be set');
    });

    await t.test('start does nothing if loop is already running', () => {
        gameLoop.isRunning = true;
        gameLoop.start();
        assert.strictEqual(global.requestAnimationFrame.mock.callCount(), 0, 'requestAnimationFrame should not be called again');
    });

    await t.test('stop halts the game loop', () => {
        gameLoop.start(); // Start the loop first
        gameLoop.stop();

        assert.strictEqual(gameLoop.isRunning, false, 'isRunning should be false after stop');
        assert.strictEqual(global.cancelAnimationFrame.mock.callCount(), 1, 'cancelAnimationFrame should be called once');
    });

    await t.test('stop does nothing if loop is not running', () => {
        gameLoop.isRunning = false;
        gameLoop.stop();
        assert.strictEqual(global.cancelAnimationFrame.mock.callCount(), 0, 'cancelAnimationFrame should not be called');
    });

    await t.test('loop calculates deltaTime and updates/renders engines', () => {
        gameLoop.start(); // This sets lastTime to 0

        mockPerformanceNow = 16.67; // Simulate time for first frame
        rafCallback(mockPerformanceNow); // Manually run the first frame

        assert.strictEqual(gameLoop.lastTime, 16.67, 'lastTime should update to current time');

        // Verify update calls with deltaTime
        assert.strictEqual(mockGameEngine.update.mock.callCount(), 1, 'GameEngine update should be called');
        assert.strictEqual(mockGameEngine.update.mock.calls[0].arguments[0], 16.67, 'GameEngine update should receive correct deltaTime');
        assert.strictEqual(mockPanelEngine.update.mock.callCount(), 1, 'PanelEngine update should be called');
        assert.strictEqual(mockPanelEngine.update.mock.calls[0].arguments[0], 16.67, 'PanelEngine update should receive correct deltaTime');
        assert.strictEqual(mockUIEngine.update.mock.callCount(), 1, 'UIEngine update should be called');
        assert.strictEqual(mockUIEngine.update.mock.calls[0].arguments[0], 16.67, 'UIEngine update should receive correct deltaTime');
        assert.strictEqual(mockDelayEngine.update.mock.callCount(), 1, 'DelayEngine update should be called');
        assert.strictEqual(mockDelayEngine.update.mock.calls[0].arguments[0], 16.67, 'DelayEngine update should receive correct deltaTime');

        // Verify render call
        assert.strictEqual(mockRenderer.render.mock.callCount(), 1, 'Renderer render should be called');
        assert.deepStrictEqual(mockRenderer.render.mock.calls[0].arguments[0], {}, 'Renderer render should receive game state'); // Stub returns empty object
        assert.strictEqual(mockRenderer.render.mock.calls[0].arguments[1], 16.67, 'Renderer render should receive correct deltaTime');

        // Verify next requestAnimationFrame is called
        assert.strictEqual(global.requestAnimationFrame.mock.callCount(), 2, 'requestAnimationFrame should be called again for next frame');
    });

    await t.test('loop does nothing if isRunning is false', () => {
        gameLoop.isRunning = false;
        rafCallback = null; // Clear any existing callback

        gameLoop.loop(100); // Call loop manually

        assert.strictEqual(mockGameEngine.update.mock.callCount(), 0, 'GameEngine update should not be called');
        assert.strictEqual(mockRenderer.render.mock.callCount(), 0, 'Renderer render should not be called');
        assert.strictEqual(global.requestAnimationFrame.mock.callCount(), 0, 'requestAnimationFrame should not be called');
    });
});

