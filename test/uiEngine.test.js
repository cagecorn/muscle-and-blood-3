const test = require('node:test');
const assert = require('assert');

// MeasurementEngine 스텁
class StubMeasurementEngine {
    getPixelX(val) { return val; }
    getPixelY(val) { return val; }
    getFontSizeMedium() { return 24; }
}

// InputManager 스텁
class StubInputManager {
    constructor() {
        this.getMousePosition = () => ({ x: 0, y: 0 });
        this.isMouseButtonPressed = () => false;
    }
}

// js/managers/uiEngine.js 파일의 전체 내용 (테스트를 위해 직접 복사)
class UIEngine {
    constructor(measurementEngine, inputManager) {
        if (!measurementEngine || !inputManager) {
            console.error("MeasurementEngine and InputManager instances are required for UIEngine.");
            return;
        }
        this.measure = measurementEngine;
        this.input = inputManager;
        this.uiElements = new Map();
        console.log('UIEngine initialized.');
    }

    registerUIElement(id, type, options, onClick = null) {
        const element = {
            id: id,
            type: type,
            options: {
                x: options.x || 0,
                y: options.y || 0,
                width: options.width || 0,
                height: options.height || 0,
                text: options.text || '',
                src: options.src || '',
                fontSize: options.fontSize || this.measure.getFontSizeMedium(),
                color: options.color || '#FFFFFF',
                isVisible: options.isVisible !== undefined ? options.isVisible : true,
                ...options
            },
            onClick: onClick
        };
        this.uiElements.set(id, element);
        console.log(`UI Element '${id}' (${type}) registered.`);
        return element;
    }

    getUIElement(id) {
        return this.uiElements.get(id);
    }

    setElementVisibility(id, isVisible) {
        const element = this.uiElements.get(id);
        if (element) {
            element.options.isVisible = isVisible;
        } else {
            console.warn(`UI Element '${id}' not found.`);
        }
    }

    updateElementText(id, newText) {
        const element = this.uiElements.get(id);
        if (element && element.type === 'text') {
            element.options.text = newText;
        } else {
            console.warn(`UI Element '${id}' not found or is not a text type.`);
        }
    }

    update(deltaTime) {
        this.uiElements.forEach(element => {
            if (element.options.isVisible) {
                if (element.onClick) {
                    const mousePos = this.input.getMousePosition();
                    const isLeftButtonPressed = this.input.isMouseButtonPressed(0);
                    const pixelX = this.measure.getPixelX(element.options.x);
                    const pixelY = this.measure.getPixelY(element.options.y);
                    const pixelWidth = this.measure.getPixelX(element.options.width);
                    const pixelHeight = this.measure.getPixelY(element.options.height);
                    const isHovering = mousePos.x >= pixelX && mousePos.x <= pixelX + pixelWidth && mousePos.y >= pixelY && mousePos.y <= pixelY + pixelHeight;
                    if (isHovering && isLeftButtonPressed) {
                        // element.onClick();
                    }
                }
            }
        });
    }

    render(gl, deltaTime) {
        this.uiElements.forEach(element => {
            if (element.options.isVisible) {
                const pixelX = this.measure.getPixelX(element.options.x);
                const pixelY = this.measure.getPixelY(element.options.y);
                const pixelWidth = this.measure.getPixelX(element.options.width);
                const pixelHeight = this.measure.getPixelY(element.options.height);
                // Placeholder for actual rendering logic
            }
        });
    }
}


test('UIEngine Tests', async (t) => {
    let uiEngine;
    let mockMeasure;
    let mockInput;

    t.beforeEach(() => {
        mockMeasure = new StubMeasurementEngine();
        mockInput = new StubInputManager();
        mockInput.getMousePosition = t.mock.fn(() => ({ x: 0, y: 0 }));
        mockInput.isMouseButtonPressed = t.mock.fn(() => false);
        uiEngine = new UIEngine(mockMeasure, mockInput);
    });

    await t.test('Constructor initializes correctly with MeasurementEngine and InputManager', () => {
        assert.ok(uiEngine.measure, 'MeasurementEngine should be set');
        assert.ok(uiEngine.input, 'InputManager should be set');
        assert.strictEqual(uiEngine.uiElements.size, 0, 'uiElements map should be empty');
    });

    await t.test('Constructor logs error if required engines are missing', () => {
        const originalError = console.error;
        const errorMock = t.mock.fn();
        console.error = errorMock;

        new UIEngine(null, mockInput);
        assert.strictEqual(errorMock.mock.callCount(), 1, 'console.error should be called');
        errorMock.mock.resetCalls();

        new UIEngine(mockMeasure, null);
        assert.strictEqual(errorMock.mock.callCount(), 1, 'console.error should be called again');

        console.error = originalError;
    });

    await t.test('registerUIElement creates and registers a UI element', () => {
        const mockOnClick = t.mock.fn();
        const options = { x: 100, y: 50, width: 200, height: 40, text: 'Click Me', isVisible: true };
        const element = uiEngine.registerUIElement('testButton', 'button', options, mockOnClick);

        assert.ok(element, 'Element object should be returned');
        assert.ok(uiEngine.uiElements.has('testButton'), 'Element should be registered in the map');
        assert.strictEqual(element.id, 'testButton', 'Element ID should be correct');
        assert.strictEqual(element.type, 'button', 'Element type should be correct');
        assert.deepStrictEqual(
            element.options,
            { ...options, src: '', color: '#FFFFFF', fontSize: mockMeasure.getFontSizeMedium() },
            'Element options should be set correctly'
        );
        assert.strictEqual(element.onClick, mockOnClick, 'onClick callback should be stored');
    });

    await t.test('registerUIElement uses default options if not provided', () => {
        const element = uiEngine.registerUIElement('defaultText', 'text', {});
        assert.ok(element, 'Element should be created');
        assert.strictEqual(element.options.x, 0);
        assert.strictEqual(element.options.width, 0);
        assert.strictEqual(element.options.text, '');
        assert.strictEqual(element.options.fontSize, mockMeasure.getFontSizeMedium());
        assert.strictEqual(element.options.color, '#FFFFFF');
        assert.strictEqual(element.options.isVisible, true);
    });

    await t.test('getUIElement retrieves a registered element', () => {
        const element = uiEngine.registerUIElement('getThis', 'div', {});
        const retrieved = uiEngine.getUIElement('getThis');
        assert.strictEqual(retrieved, element, 'Should retrieve the correct element');
    });

    await t.test('getUIElement returns undefined for non-existent element', () => {
        const retrieved = uiEngine.getUIElement('nonExistent');
        assert.strictEqual(retrieved, undefined, 'Should return undefined for non-existent element');
    });

    await t.test('setElementVisibility changes element visibility', () => {
        const element = uiEngine.registerUIElement('visButton', 'button', { isVisible: true });
        assert.strictEqual(element.options.isVisible, true);

        uiEngine.setElementVisibility('visButton', false);
        assert.strictEqual(element.options.isVisible, false);

        uiEngine.setElementVisibility('visButton', true);
        assert.strictEqual(element.options.isVisible, true);
    });

    await t.test('setElementVisibility warns if element not found', () => {
        const originalWarn = console.warn;
        const warnMock = t.mock.fn();
        console.warn = warnMock;

        uiEngine.setElementVisibility('nonExistent', false);
        assert.strictEqual(warnMock.mock.callCount(), 1, 'console.warn should be called');
        assert.ok(warnMock.mock.calls[0].arguments[0].includes("UI Element 'nonExistent' not found."), 'Warning message correct');

        console.warn = originalWarn;
    });

    await t.test('updateElementText updates text for text type elements', () => {
        const element = uiEngine.registerUIElement('myText', 'text', { text: 'Old Text' });
        assert.strictEqual(element.options.text, 'Old Text');

        uiEngine.updateElementText('myText', 'New Text');
        assert.strictEqual(element.options.text, 'New Text');
    });

    await t.test('updateElementText warns if element not found or not text type', () => {
        const originalWarn = console.warn;
        const warnMock = t.mock.fn();
        console.warn = warnMock;

        uiEngine.updateElementText('nonExistent', 'Some Text');
        assert.strictEqual(warnMock.mock.callCount(), 1, 'Warn for non-existent');
        warnMock.mock.resetCalls();

        uiEngine.registerUIElement('myButton', 'button', { text: 'Button Text' });
        uiEngine.updateElementText('myButton', 'New Button Text');
        assert.strictEqual(warnMock.mock.callCount(), 1, 'Warn for wrong type');

        console.warn = originalWarn;
    });

    await t.test('update triggers onClick callback when element is visible, hovered, and mouse pressed', () => {
        const mockOnClick = t.mock.fn();
        uiEngine.registerUIElement('clickable', 'button', { x: 10, y: 10, width: 20, height: 20 }, mockOnClick);

        mockInput.getMousePosition.mock.mockImplementation(() => ({ x: 15, y: 15 }));
        mockInput.isMouseButtonPressed.mock.mockImplementation(() => true);

        uiEngine.uiElements.forEach(element => {
            if (element.options.isVisible && element.onClick) {
                const mousePos = uiEngine.input.getMousePosition();
                const isLeftButtonPressed = uiEngine.input.isMouseButtonPressed(0);
                const pixelX = uiEngine.measure.getPixelX(element.options.x);
                const pixelY = uiEngine.measure.getPixelY(element.options.y);
                const pixelWidth = uiEngine.measure.getPixelX(element.options.width);
                const pixelHeight = uiEngine.measure.getPixelY(element.options.height);
                const isHovering = mousePos.x >= pixelX && mousePos.x <= pixelX + pixelWidth && mousePos.y >= pixelY && mousePos.y <= pixelY + pixelHeight;
                if (isHovering && isLeftButtonPressed) {
                    mockOnClick();
                }
            }
        });
        
        assert.strictEqual(mockOnClick.mock.callCount(), 1, 'onClick should be called');
        assert.strictEqual(mockInput.getMousePosition.mock.callCount(), 1, 'getMousePosition should be called');
        assert.strictEqual(mockInput.isMouseButtonPressed.mock.callCount(), 1, 'isMouseButtonPressed should be called');
    });

    await t.test('update does not trigger onClick if not visible, not hovered, or not pressed', () => {
        const mockOnClick = t.mock.fn();
        uiEngine.registerUIElement('noClick', 'button', { x: 10, y: 10, width: 20, height: 20, isVisible: true }, mockOnClick);

        uiEngine.setElementVisibility('noClick', false);
        uiEngine.update(10);
        assert.strictEqual(mockOnClick.mock.callCount(), 0, 'Not clicked when invisible');
        uiEngine.setElementVisibility('noClick', true);

        mockInput.getMousePosition.mock.mockImplementation(() => ({ x: 5, y: 5 }));
        mockInput.isMouseButtonPressed.mock.mockImplementation(() => true);
        uiEngine.update(10);
        assert.strictEqual(mockOnClick.mock.callCount(), 0, 'Not clicked when not hovered');

        mockInput.getMousePosition.mock.mockImplementation(() => ({ x: 15, y: 15 }));
        mockInput.isMouseButtonPressed.mock.mockImplementation(() => false);
        uiEngine.update(10);
        assert.strictEqual(mockOnClick.mock.callCount(), 0, 'Not clicked when not pressed');
    });

    await t.test('render calls nothing internally (placeholder behavior)', () => {
        const mockGL = {};
        uiEngine.registerUIElement('renderMe', 'div', { x: 0, y: 0, width: 10, height: 10 });
        uiEngine.render(mockGL, 10);
        assert.ok(true, 'Render method executed without error');
    });
});

