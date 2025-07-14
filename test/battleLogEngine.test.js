const test = require('node:test');
const assert = require('assert');

// PanelEngine 스텁
class StubPanelEngine {
    constructor() {
        this.registeredPanels = new Map();
    }
    registerPanel = test.mock.fn((id, options, requiresGL) => {
        const mockCanvas = {
            id: id,
            getContext: (type) => {
                if (type === '2d') {
                    return {
                        clearRect: test.mock.fn(),
                        fillText: test.mock.fn(),
                        measureText: test.mock.fn(() => ({ width: 10 })),
                        canvas: { width: 800, height: 150 }
                    };
                }
                return null;
            },
            width: 800,
            height: 150
        };
        const panel = {
            id: id,
            canvas: mockCanvas,
            options: { ...options, isVisible: options.isVisible !== undefined ? options.isVisible : true },
            render: null,
            update: null
        };
        this.registeredPanels.set(id, panel);
        return panel;
    });
    getPanel = test.mock.fn((id) => this.registeredPanels.get(id));
}

// MeasurementEngine 스텁
class StubMeasurementEngine {
    getFontSizeSmall() { return 16; }
    getPadding(axis = 'x') { return 10; }
}

// js/managers/battleLogEngine.js 파일의 전체 내용 (테스트를 위해 직접 복사)
class BattleLogEngine {
    constructor(panelEngine, measurementEngine) {
        if (!panelEngine || !measurementEngine) {
            console.error('PanelEngine and MeasurementEngine instances are required for BattleLogEngine.');
            return;
        }
        this.panelEngine = panelEngine;
        this.measure = measurementEngine;
        this.logMessages = [];
        this.maxMessages = 10;
        this.logCanvasId = 'combatLogCanvas';

        this.logPanel = this.panelEngine.registerPanel(this.logCanvasId, {}, false);

        if (this.logPanel) {
            this.ctx = this.logPanel.canvas.getContext('2d');
            this.logPanel.render = this.render.bind(this);
            this.logPanel.update = this.update.bind(this);
        } else {
            console.error(`BattleLogEngine: Failed to register or get panel '${this.logCanvasId}'.`);
        }

        console.log('BattleLogEngine initialized.');
    }

    addLog(message, color = '#eee') {
        const timestamp = Date.now();
        this.logMessages.push({ message, color, timestamp });
        if (this.logMessages.length > this.maxMessages) {
            this.logMessages.shift();
        }
        console.log(`[BATTLE LOG] ${message}`);
    }

    update(deltaTime) {
        // Future fade out logic can be placed here
    }

    render(glOrCtx, deltaTime) {
        const ctx = this.ctx;
        if (!ctx || !this.logPanel || !this.logPanel.options.isVisible) return;

        const panelWidth = ctx.canvas.width;
        const panelHeight = ctx.canvas.height;

        ctx.clearRect(0, 0, panelWidth, panelHeight);

        ctx.font = `${this.measure.getFontSizeSmall()}px Arial`;
        ctx.textBaseline = 'bottom';

        const padding = this.measure.getPadding('y');
        let currentY = panelHeight - padding;

        for (let i = this.logMessages.length - 1; i >= 0; i--) {
            const log = this.logMessages[i];
            ctx.fillStyle = log.color;
            ctx.fillText(log.message, this.measure.getPadding('x'), currentY);
            currentY -= (this.measure.getFontSizeSmall() + padding / 2);
            if (currentY < padding) break;
        }
    }
}


test('BattleLogEngine Tests', async (t) => {
    let battleLogEngine;
    let mockPanelEngine;
    let mockMeasureEngine;
    let mock2dContext;

    t.beforeEach(() => {
        mockPanelEngine = new StubPanelEngine();
        mockMeasureEngine = new StubMeasurementEngine();
        battleLogEngine = new BattleLogEngine(mockPanelEngine, mockMeasureEngine);
        mock2dContext = battleLogEngine.ctx;

        mock2dContext.clearRect.mock.resetCalls();
        mock2dContext.fillText.mock.resetCalls();
        mockPanelEngine.getPanel.mock.resetCalls();
    });

    await t.test('Constructor initializes correctly and registers panel', () => {
        assert.ok(battleLogEngine.panelEngine, 'PanelEngine should be set');
        assert.ok(battleLogEngine.measure, 'MeasurementEngine should be set');
        assert.ok(battleLogEngine.logPanel, 'Log panel should be registered');
        assert.ok(battleLogEngine.ctx, '2D context should be obtained');
        assert.strictEqual(battleLogEngine.logMessages.length, 0, 'Log messages array should be empty');
        assert.strictEqual(battleLogEngine.maxMessages, 10, 'Max messages should be 10');
        assert.strictEqual(mockPanelEngine.registerPanel.mock.callCount(), 1, 'registerPanel should be called once');
        assert.deepStrictEqual(mockPanelEngine.registerPanel.mock.calls[0].arguments, ['combatLogCanvas', {}, false], 'registerPanel called with correct arguments');
    });

    await t.test('Constructor logs error if PanelEngine or MeasurementEngine is missing', () => {
        const originalError = console.error;
        const errorMock = t.mock.fn();
        console.error = errorMock;

        new BattleLogEngine(null, mockMeasureEngine);
        assert.strictEqual(errorMock.mock.callCount(), 1, 'console.error should be called');
        errorMock.mock.resetCalls();

        new BattleLogEngine(mockPanelEngine, null);
        assert.strictEqual(errorMock.mock.callCount(), 1, 'console.error should be called again');

        console.error = originalError;
    });

    await t.test('addLog adds messages and limits maxMessages', () => {
        battleLogEngine.addLog('Message 1');
        assert.strictEqual(battleLogEngine.logMessages.length, 1, 'Should have 1 message');
        assert.strictEqual(battleLogEngine.logMessages[0].message, 'Message 1', 'Message content correct');
        assert.strictEqual(battleLogEngine.logMessages[0].color, '#eee', 'Default color correct');

        for (let i = 2; i <= 10; i++) {
            battleLogEngine.addLog(`Message ${i}`, `#${i}`);
        }
        assert.strictEqual(battleLogEngine.logMessages.length, 10, 'Should have 10 messages (max)');
        assert.strictEqual(battleLogEngine.logMessages[9].message, 'Message 10', 'Last message is Message 10');

        battleLogEngine.addLog('Message 11');
        assert.strictEqual(battleLogEngine.logMessages.length, 10, 'Should still have 10 messages after adding 11th');
        assert.strictEqual(battleLogEngine.logMessages[0].message, 'Message 2', 'First message should be Message 2');
        assert.strictEqual(battleLogEngine.logMessages[9].message, 'Message 11', 'Last message should be Message 11');
    });

    await t.test('render clears canvas and draws log messages', () => {
        battleLogEngine.addLog('First Log');
        battleLogEngine.addLog('Second Log', 'red');

        const deltaTime = 16.67;
        battleLogEngine.render(mock2dContext, deltaTime);

        const panelWidth = mock2dContext.canvas.width;
        const panelHeight = mock2dContext.canvas.height;
        const fontSize = mockMeasureEngine.getFontSizeSmall();
        const padding = mockMeasureEngine.getPadding('y');

        assert.strictEqual(mock2dContext.clearRect.mock.callCount(), 1, 'clearRect should be called once');
        assert.deepStrictEqual(mock2dContext.clearRect.mock.calls[0].arguments, [0, 0, panelWidth, panelHeight], 'clearRect covers whole canvas');

        assert.strictEqual(mock2dContext.font, `${fontSize}px Arial`, 'Font should be set');
        assert.strictEqual(mock2dContext.textBaseline, 'bottom', 'Text baseline should be bottom');

        assert.strictEqual(mock2dContext.fillText.mock.callCount(), 2, 'fillText should be called twice');

        assert.strictEqual(mock2dContext.fillText.mock.calls[0].arguments[0], 'Second Log', 'Second log message text correct');
        assert.strictEqual(mock2dContext.fillText.mock.calls[0].arguments[1], padding, 'Second log message x-position correct');
        assert.strictEqual(mock2dContext.fillText.mock.calls[0].arguments[2], panelHeight - padding, 'Second log message y-position correct');

        const expectedY1 = (panelHeight - padding) - (fontSize + padding / 2);
        assert.strictEqual(mock2dContext.fillText.mock.calls[1].arguments[0], 'First Log', 'First log message text correct');
        assert.strictEqual(mock2dContext.fillText.mock.calls[1].arguments[1], padding, 'First log message x-position correct');
        assert.strictEqual(mock2dContext.fillText.mock.calls[1].arguments[2], expectedY1, 'First log message y-position correct');
        assert.strictEqual(mock2dContext.fillStyle, '#eee', 'Final fill style should match last log color');
    });

    await t.test('render does nothing if panel is not visible', () => {
        battleLogEngine.logPanel.options.isVisible = false;
        battleLogEngine.addLog('Test');
        battleLogEngine.render(mock2dContext, 10);

        assert.strictEqual(mock2dContext.clearRect.mock.callCount(), 0, 'clearRect should not be called');
        assert.strictEqual(mock2dContext.fillText.mock.callCount(), 0, 'fillText should not be called');
    });

    await t.test('update method is a placeholder and does not perform actions', () => {
        const initialLogMessages = [...battleLogEngine.logMessages];
        battleLogEngine.update(100);
        assert.deepStrictEqual(battleLogEngine.logMessages, initialLogMessages, 'Log messages should not change');
    });
});
