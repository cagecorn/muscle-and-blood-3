const test = require('node:test');
const assert = require('assert');

// js/inputManager.js 파일의 전체 내용 (테스트를 위해 직접 복사)
class InputManager {
    constructor(canvas) {
        if (!canvas) {
            console.error("Canvas element is required for InputManager.");
            return;
        }
        this.canvas = canvas;
        this.keys = new Set();
        this.mouse = { x: 0, y: 0, buttons: new Set() };
        this.touch = [];

        // 이벤트 리스너를 저장할 배열 (모의용)
        this.eventListeners = {
            window: { keydown: [], keyup: [] },
            canvas: { mousemove: [], mousedown: [], mouseup: [], contextmenu: [], touchstart: [], touchmove: [], touchend: [], touchcancel: [] }
        };

        // window.addEventListener 모의
        const originalWindowAddEventListener = global.window ? global.window.addEventListener : null;
        global.window = {
            addEventListener: (event, callback) => {
                if (this.eventListeners.window[event]) {
                    this.eventListeners.window[event].push(callback);
                } else if (originalWindowAddEventListener) {
                    originalWindowAddEventListener(event, callback);
                }
            },
            removeEventListener: () => {}
        };

        // canvas.addEventListener 모의
        this.canvas.addEventListener = (event, callback) => {
            if (this.eventListeners.canvas[event]) {
                this.eventListeners.canvas[event].push(callback);
            }
        };

        this.canvas.getBoundingClientRect = () => ({ left: 10, top: 20, width: 800, height: 600 }); // Mock for mouse position

        window.addEventListener('keydown', this._onKeyDown.bind(this));
        window.addEventListener('keyup', this._onKeyUp.bind(this));

        this.canvas.addEventListener('mousemove', this._onMouseMove.bind(this));
        this.canvas.addEventListener('mousedown', this._onMouseDown.bind(this));
        this.canvas.addEventListener('mouseup', this._onMouseUp.bind(this));
        this.canvas.addEventListener('contextmenu', this._onContextMenu.bind(this));

        this.canvas.addEventListener('touchstart', this._onTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this._onTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this._onTouchEnd.bind(this));
        this.canvas.addEventListener('touchcancel', this._onTouchCancel.bind(this));

        console.log("InputManager initialized.");
    }

    _onKeyDown(event) {
        this.keys.add(event.code);
    }

    _onKeyUp(event) {
        this.keys.delete(event.code);
    }

    _onMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = event.clientX - rect.left;
        this.mouse.y = event.clientY - rect.top;
    }

    _onMouseDown(event) {
        this.mouse.buttons.add(event.button);
    }

    _onMouseUp(event) {
        this.mouse.buttons.delete(event.button);
    }

    _onContextMenu(event) {
        event.preventDefault();
    }

    _onTouchStart(event) {
        event.preventDefault();
        this._updateTouches(event.touches);
    }

    _onTouchMove(event) {
        event.preventDefault();
        this._updateTouches(event.touches);
    }

    _onTouchEnd(event) {
        this._updateTouches(event.touches);
    }

    _onTouchCancel(event) {
        this._updateTouches(event.touches);
    }

    _updateTouches(touchList) {
        this.touch = [];
        for (let i = 0; i < touchList.length; i++) {
            const touch = touchList[i];
            const rect = this.canvas.getBoundingClientRect();
            this.touch.push({
                id: touch.identifier,
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            });
        }
    }

    isKeyPressed(keyCode) {
        return this.keys.has(keyCode);
    }

    isMouseButtonPressed(buttonCode) {
        return this.mouse.buttons.has(buttonCode);
    }

    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }

    getTouchPositions() {
        return this.touch;
    }

    resetInputState() {}
}


test('InputManager Tests', async (t) => {
    let inputManager;
    let mockCanvas;

    t.beforeEach(() => {
        mockCanvas = {}; // 빈 객체로 캔버스 모의
        inputManager = new InputManager(mockCanvas);
    });

    await t.test('isKeyPressed correctly tracks keydown and keyup events', () => {
        // keydown 이벤트 시뮬레이션
        const keydownEvent = { code: 'KeyW' };
        inputManager.eventListeners.window.keydown.forEach(cb => cb(keydownEvent));
        assert.ok(inputManager.isKeyPressed('KeyW'), 'KeyW should be pressed after keydown');
        assert.ok(!inputManager.isKeyPressed('KeyA'), 'KeyA should not be pressed');

        // keyup 이벤트 시뮬레이션
        const keyupEvent = { code: 'KeyW' };
        inputManager.eventListeners.window.keyup.forEach(cb => cb(keyupEvent));
        assert.ok(!inputManager.isKeyPressed('KeyW'), 'KeyW should not be pressed after keyup');
    });

    await t.test('isMouseButtonPressed correctly tracks mousedown and mouseup events', () => {
        // mousedown 이벤트 시뮬레이션 (좌클릭)
        const mousedownEvent = { button: 0 };
        inputManager.eventListeners.canvas.mousedown.forEach(cb => cb(mousedownEvent));
        assert.ok(inputManager.isMouseButtonPressed(0), 'Left mouse button should be pressed');
        assert.ok(!inputManager.isMouseButtonPressed(1), 'Middle mouse button should not be pressed');

        // mouseup 이벤트 시뮬레이션
        const mouseupEvent = { button: 0 };
        inputManager.eventListeners.canvas.mouseup.forEach(cb => cb(mouseupEvent));
        assert.ok(!inputManager.isMouseButtonPressed(0), 'Left mouse button should not be pressed after mouseup');
    });

    await t.test('getMousePosition correctly updates on mousemove', () => {
        const mousemoveEvent = { clientX: 110, clientY: 120 }; // canvas.getBoundingClientRect left:10, top:20
        inputManager.eventListeners.canvas.mousemove.forEach(cb => cb(mousemoveEvent));
        const mousePos = inputManager.getMousePosition();
        assert.deepStrictEqual(mousePos, { x: 100, y: 100 }, 'Mouse position should be relative to canvas');

        const anotherMoveEvent = { clientX: 510, clientY: 620 };
        inputManager.eventListeners.canvas.mousemove.forEach(cb => cb(anotherMoveEvent));
        const newMousePos = inputManager.getMousePosition();
        assert.deepStrictEqual(newMousePos, { x: 500, y: 600 }, 'Mouse position should update correctly');
    });

    await t.test('getTouchPositions correctly updates on touch events', () => {
        // touchstart 이벤트 시뮬레이션
        const touchStartEvent = {
            preventDefault: () => {},
            touches: [{ identifier: 1, clientX: 110, clientY: 120 }]
        };
        inputManager.eventListeners.canvas.touchstart.forEach(cb => cb(touchStartEvent));
        let touches = inputManager.getTouchPositions();
        assert.strictEqual(touches.length, 1, 'Should have one touch point');
        assert.deepStrictEqual(touches[0], { id: 1, x: 100, y: 100 }, 'Touch position should be relative to canvas');

        // touchmove (다중 터치)
        const touchMoveEvent = {
            preventDefault: () => {},
            touches: [
                { identifier: 1, clientX: 150, clientY: 160 },
                { identifier: 2, clientX: 210, clientY: 220 }
            ]
        };
        inputManager.eventListeners.canvas.touchmove.forEach(cb => cb(touchMoveEvent));
        touches = inputManager.getTouchPositions();
        assert.strictEqual(touches.length, 2, 'Should have two touch points after multi-touch move');
        assert.deepStrictEqual(touches[0], { id: 1, x: 140, y: 140 }, 'First touch position should update');
        assert.deepStrictEqual(touches[1], { id: 2, x: 200, y: 200 }, 'Second touch position should be correct');

        // touchend (하나의 터치 종료)
        const touchEndEvent = {
            touches: [{ identifier: 2, clientX: 210, clientY: 220 }] // 터치 1만 종료된 상황 (touches 배열에는 남은 터치만 포함)
        };
        inputManager.eventListeners.canvas.touchend.forEach(cb => cb(touchEndEvent));
        touches = inputManager.getTouchPositions();
        assert.strictEqual(touches.length, 1, 'Should have one touch point after one touch ends');
        assert.deepStrictEqual(touches[0], { id: 2, x: 200, y: 200 }, 'Remaining touch should be correct');

        // touchcancel (모든 터치 취소)
        const touchCancelEvent = { preventDefault: () => {}, touches: [] };
        inputManager.eventListeners.canvas.touchcancel.forEach(cb => cb(touchCancelEvent));
        touches = inputManager.getTouchPositions();
        assert.strictEqual(touches.length, 0, 'Should have zero touch points after touch cancel');
    });

    await t.test('onContextMenu calls preventDefault', (t) => {
        const mockPreventDefault = t.mock.fn();
        const contextMenuEvent = { preventDefault: mockPreventDefault };
        inputManager.eventListeners.canvas.contextmenu.forEach(cb => cb(contextMenuEvent));
        assert.strictEqual(mockPreventDefault.mock.callCount(), 1, 'preventDefault should be called for contextmenu');
    });

    await t.test('onTouchStart and onTouchMove call preventDefault', (t) => {
        const mockPreventDefault = t.mock.fn();
        const touchEvent = { preventDefault: mockPreventDefault, touches: [] };

        inputManager.eventListeners.canvas.touchstart.forEach(cb => cb(touchEvent));
        assert.strictEqual(mockPreventDefault.mock.callCount(), 1, 'preventDefault should be called for touchstart');

        inputManager.eventListeners.canvas.touchmove.forEach(cb => cb(touchEvent));
        assert.strictEqual(mockPreventDefault.mock.callCount(), 2, 'preventDefault should be called for touchmove');
    });
});
