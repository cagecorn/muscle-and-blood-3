const test = require('node:test');
const assert = require('assert');

// js/measurementEngine.js 파일의 전체 내용 (테스트를 위해 직접 복사)
class MeasurementEngine {
    constructor(resolutionEngine) {
        if (!resolutionEngine || !resolutionEngine.getInternalResolution) {
            console.error("ResolutionEngine instance is required for MeasurementEngine.");
            return;
        }
        this.resolutionEngine = resolutionEngine;
        this.internalResolution = this.resolutionEngine.getInternalResolution();

        this.basePadding = 20;
        this.baseMargin = 10;
        this.baseButtonHeight = 60;
        this.baseButtonWidth = 200;
        this.baseIconSize = 48;
        this.baseFontSizeSmall = 18;
        this.baseFontSizeMedium = 24;
        this.baseFontSizeLarge = 36;
        this.baseFontSizeHuge = 48;
        this.basePanelWidth = this.internalResolution.width * 0.8;
        this.basePanelHeight = this.internalResolution.height * 0.7;
        this.tilePixelSize = 512;
        this.uiUnitFromTile = this.tilePixelSize / 8;
        this.buttonHeightFromTile = this.tilePixelSize / 4;
        this.paddingFromTile = this.tilePixelSize / 16;

        this.scaleX = this.resolutionEngine.canvas.width / this.internalResolution.width;
        this.scaleY = this.resolutionEngine.canvas.height / this.internalResolution.height;

        if (typeof window !== 'undefined') {
            global.window = global.window || {};
            global.window.addEventListener = (event, callback) => {
                if (event === 'resize') {
                    this._resizeListener = callback;
                }
            };
            global.window.removeEventListener = () => {};
            window.addEventListener('resize', this._updateScaleFactors.bind(this));
        }
    }

    _updateScaleFactors() {
        this.scaleX = this.resolutionEngine.canvas.width / this.internalResolution.width;
        this.scaleY = this.resolutionEngine.canvas.height / this.internalResolution.height;
    }

    getPixelX(value) {
        return value * this.scaleX;
    }

    getPixelY(value) {
        return value * this.scaleY;
    }

    getPixelSize(value, axis = 'x') {
        if (axis === 'y') {
            return value * this.scaleY;
        }
        return value * this.scaleX;
    }

    getPadding(axis = 'x') {
        return this.getPixelSize(this.basePadding, axis);
    }

    getMargin(axis = 'x') {
        return this.getPixelSize(this.baseMargin, axis);
    }

    getButtonHeight(axis = 'y') {
        return this.getPixelSize(this.baseButtonHeight, axis);
    }

    getButtonWidth(axis = 'x') {
        return this.getPixelSize(this.baseButtonWidth, axis);
    }

    getIconSize(axis = 'x') {
        return this.getPixelSize(this.baseIconSize, axis);
    }

    getFontSizeSmall() {
        return this.getPixelSize(this.baseFontSizeSmall, 'y');
    }

    getFontSizeMedium() {
        return this.getPixelSize(this.baseFontSizeMedium, 'y');
    }

    getFontSizeLarge() {
        return this.getPixelSize(this.baseFontSizeLarge, 'y');
    }

    getFontSizeHuge() {
        return this.getPixelSize(this.baseFontSizeHuge, 'y');
    }

    getPanelWidth() {
        return this.getPixelX(this.basePanelWidth);
    }

    getPanelHeight() {
        return this.getPixelY(this.basePanelHeight);
    }

    getUiUnitFromTile(axis = 'x') {
        return this.getPixelSize(this.uiUnitFromTile, axis);
    }

    getButtonHeightFromTile(axis = 'y') {
        return this.getPixelSize(this.buttonHeightFromTile, axis);
    }

    getPaddingFromTile(axis = 'x') {
        return this.getPixelSize(this.paddingFromTile, axis);
    }

    getPixelPosition(internalX, internalY) {
        return {
            x: this.getPixelX(internalX),
            y: this.getPixelY(internalY)
        };
    }
}

class StubResolutionEngine {
    constructor(canvasWidth = 960, canvasHeight = 540, internalWidth = 1920, internalHeight = 1080) {
        this._internalWidth = internalWidth;
        this._internalHeight = internalHeight;
        this.canvas = { width: canvasWidth, height: canvasHeight };
        this._resizeListener = null;
    }
    getInternalResolution() {
        return { width: this._internalWidth, height: this._internalHeight };
    }
    addEventListener(event, callback) {
        if (event === 'resize') {
            this._resizeListener = callback;
        }
    }
}

test('MeasurementEngine Tests', async (t) => {
    let measure;
    let resEngineStub;

    t.beforeEach(() => {
        resEngineStub = new StubResolutionEngine(960, 540, 1920, 1080);
        measure = new MeasurementEngine(resEngineStub);
    });

    t.afterEach(() => {
        delete global.window;
    });

    await t.test('Constructor initializes correctly with ResolutionEngine', () => {
        assert.ok(measure.resolutionEngine, 'ResolutionEngine should be set');
        assert.deepStrictEqual(measure.internalResolution, { width: 1920, height: 1080 }, 'Internal resolution should be fetched');
        assert.strictEqual(measure.scaleX, 0.5, 'Initial scaleX should be 0.5');
        assert.strictEqual(measure.scaleY, 0.5, 'Initial scaleY should be 0.5');
    });

    await t.test('Constructor logs error if ResolutionEngine is missing', () => {
        const originalError = console.error;
        const errorMock = t.mock.fn();
        console.error = errorMock;

        new MeasurementEngine(null);
        assert.strictEqual(errorMock.mock.callCount(), 1, 'console.error should be called');
        assert.ok(errorMock.mock.calls[0].arguments[0].includes('ResolutionEngine instance is required for MeasurementEngine.'), 'Error message should be correct');

        console.error = originalError;
    });

    await t.test('getPixelX converts internal X to pixel X', () => {
        assert.strictEqual(measure.getPixelX(100), 50);
        assert.strictEqual(measure.getPixelX(1920), 960);
    });

    await t.test('getPixelY converts internal Y to pixel Y', () => {
        assert.strictEqual(measure.getPixelY(100), 50);
        assert.strictEqual(measure.getPixelY(1080), 540);
    });

    await t.test('getPixelSize converts general size based on axis', () => {
        assert.strictEqual(measure.getPixelSize(50), 25, 'Default (x-axis) conversion');
        assert.strictEqual(measure.getPixelSize(50, 'x'), 25, 'Explicit x-axis conversion');
        assert.strictEqual(measure.getPixelSize(50, 'y'), 25, 'Explicit y-axis conversion');
    });

    await t.test('_updateScaleFactors updates scales on canvas resize', () => {
        resEngineStub.canvas.width = 1920;
        resEngineStub.canvas.height = 1080;

        if (measure._resizeListener) {
            measure._resizeListener();
        } else {
            measure._updateScaleFactors();
        }

        assert.strictEqual(measure.scaleX, 1.0, 'scaleX should be 1.0 after resize');
        assert.strictEqual(measure.scaleY, 1.0, 'scaleY should be 1.0 after resize');
        assert.strictEqual(measure.getPixelX(100), 100, 'getPixelX should reflect new scale');
    });

    await t.test('UI specific measurement methods return scaled values', () => {
        const expectedScaleX = 0.5;
        const expectedScaleY = 0.5;

        assert.strictEqual(measure.getPadding(), measure.basePadding * expectedScaleX);
        assert.strictEqual(measure.getPadding('y'), measure.basePadding * expectedScaleY);
        assert.strictEqual(measure.getMargin(), measure.baseMargin * expectedScaleX);
        assert.strictEqual(measure.getButtonHeight(), measure.baseButtonHeight * expectedScaleY);
        assert.strictEqual(measure.getButtonWidth(), measure.baseButtonWidth * expectedScaleX);
        assert.strictEqual(measure.getIconSize(), measure.baseIconSize * expectedScaleX);

        assert.strictEqual(measure.getFontSizeSmall(), measure.baseFontSizeSmall * expectedScaleY);
        assert.strictEqual(measure.getFontSizeMedium(), measure.baseFontSizeMedium * expectedScaleY);
        assert.strictEqual(measure.getFontSizeLarge(), measure.baseFontSizeLarge * expectedScaleY);
        assert.strictEqual(measure.getFontSizeHuge(), measure.baseFontSizeHuge * expectedScaleY);

        assert.strictEqual(measure.getPanelWidth(), measure.basePanelWidth * expectedScaleX);
        assert.strictEqual(measure.getPanelHeight(), measure.basePanelHeight * expectedScaleY);
    });

    await t.test('Tile-based UI measurement methods return scaled values', () => {
        const expectedScaleX = 0.5;
        const expectedScaleY = 0.5;

        assert.strictEqual(measure.getUiUnitFromTile(), measure.uiUnitFromTile * expectedScaleX);
        assert.strictEqual(measure.getButtonHeightFromTile(), measure.buttonHeightFromTile * expectedScaleY);
        assert.strictEqual(measure.getPaddingFromTile(), measure.paddingFromTile * expectedScaleX);
    });

    await t.test('getPixelPosition converts internal coordinates to pixel coordinates', () => {
        const internalX = 500;
        const internalY = 300;
        const pixelPos = measure.getPixelPosition(internalX, internalY);
        assert.deepStrictEqual(pixelPos, { x: 250, y: 150 }, 'Pixel position should be correctly scaled');
    });
});
