const test = require('node:test');
const assert = require('assert');

// AssetLoader 스텁
class StubAssetLoader {
    constructor() {
        this.assets = new Map();
        this.assets.set('battle_stage_forest', {
            texture: { id: 'mockTexture' },
            width: 1920,
            height: 1080
        });
    }
    getAsset = test.mock.fn((id) => this.assets.get(id));
}

// Renderer 스텁
class StubRenderer {
    drawTextureRect = test.mock.fn();
}

// CameraEngine 스텁
class StubCameraEngine {}

// ResolutionEngine 스텁
class StubResolutionEngine {
    getGLContext() { return { id: 'mockGL' }; }
    getInternalResolution() { return { width: 1920, height: 1080 }; }
}

// js/managers/battleStageManager.js 파일의 전체 내용 (테스트를 위해 직접 복사)
class BattleStageManager {
    constructor(assetLoader, renderer, cameraEngine, resolutionEngine) {
        if (!assetLoader || !renderer || !cameraEngine || !resolutionEngine) {
            console.error('AssetLoader, Renderer, CameraEngine, and ResolutionEngine instances are required for BattleStageManager.');
            return;
        }
        this.assetLoader = assetLoader;
        this.renderer = renderer;
        this.camera = cameraEngine;
        this.res = resolutionEngine;
        this.gl = this.res.getGLContext();

        this.backgroundAssetId = 'battle_stage_forest';
        this.backgroundUrl = 'assets/images/battle-stage-forest.png';

        this.isLoaded = false;

        console.log('BattleStageManager initialized.');
    }

    onAssetsLoaded() {
        if (this.assetLoader.getAsset(this.backgroundAssetId)) {
            this.isLoaded = true;
            console.log(`BattleStageManager: Background image '${this.backgroundAssetId}' loaded.`);
        } else {
            console.error(`BattleStageManager: Background image '${this.backgroundAssetId}' not found after loading.`);
        }
    }

    render(deltaTime) {
        if (!this.gl || !this.isLoaded) {
            return;
        }

        const backgroundAsset = this.assetLoader.getAsset(this.backgroundAssetId);
        if (!backgroundAsset || !backgroundAsset.texture) {
            console.warn('BattleStageManager: Background texture not available.');
            return;
        }

        const internalWidth = this.res.getInternalResolution().width;
        const internalHeight = this.res.getInternalResolution().height;

        this.renderer.drawTextureRect(
            this.gl,
            backgroundAsset.texture,
            0,
            0,
            internalWidth,
            internalHeight,
            this.camera
        );
    }
}


test('BattleStageManager Tests', async (t) => {
    let battleStageManager;
    let mockAssetLoader;
    let mockRenderer;
    let mockCameraEngine;
    let mockResolutionEngine;

    t.beforeEach(() => {
        mockAssetLoader = new StubAssetLoader();
        mockRenderer = new StubRenderer();
        mockCameraEngine = new StubCameraEngine();
        mockResolutionEngine = new StubResolutionEngine();
        battleStageManager = new BattleStageManager(mockAssetLoader, mockRenderer, mockCameraEngine, mockResolutionEngine);

        mockRenderer.drawTextureRect.mock.resetCalls();
    });

    await t.test('Constructor initializes correctly with all required engines', () => {
        assert.ok(battleStageManager.assetLoader, 'AssetLoader should be set');
        assert.ok(battleStageManager.renderer, 'Renderer should be set');
        assert.ok(battleStageManager.camera, 'CameraEngine should be set');
        assert.ok(battleStageManager.res, 'ResolutionEngine should be set');
        assert.ok(battleStageManager.gl, 'GL context should be obtained');
        assert.strictEqual(battleStageManager.backgroundAssetId, 'battle_stage_forest', 'Background asset ID correct');
        assert.strictEqual(battleStageManager.isLoaded, false, 'isLoaded should be false initially');
    });

    await t.test('Constructor logs error if any required engine is missing', () => {
        const originalError = console.error;
        const errorMock = t.mock.fn();
        console.error = errorMock;

        new BattleStageManager(null, mockRenderer, mockCameraEngine, mockResolutionEngine);
        assert.strictEqual(errorMock.mock.callCount(), 1, 'console.error should be called');
        errorMock.mock.resetCalls();

        new BattleStageManager(mockAssetLoader, null, mockCameraEngine, mockResolutionEngine);
        assert.strictEqual(errorMock.mock.callCount(), 1, 'console.error should be called again');

        console.error = originalError;
    });

    await t.test('onAssetsLoaded sets isLoaded to true if background asset exists', () => {
        battleStageManager.onAssetsLoaded();
        assert.strictEqual(battleStageManager.isLoaded, true, 'isLoaded should be true');
        assert.strictEqual(mockAssetLoader.getAsset.mock.callCount(), 1, 'getAsset should be called');
        assert.deepStrictEqual(mockAssetLoader.getAsset.mock.calls[0].arguments[0], 'battle_stage_forest', 'getAsset called with correct ID');
    });

    await t.test('onAssetsLoaded logs error if background asset not found', () => {
        const originalError = console.error;
        const errorMock = t.mock.fn();
        console.error = errorMock;

        mockAssetLoader.assets.delete('battle_stage_forest');
        battleStageManager.onAssetsLoaded();
        assert.strictEqual(battleStageManager.isLoaded, false, 'isLoaded should remain false');
        assert.strictEqual(errorMock.mock.callCount(), 1, 'console.error should be called');
        assert.ok(errorMock.mock.calls[0].arguments[0].includes("Background image 'battle_stage_forest' not found after loading."), 'Error message correct');

        console.error = originalError;
    });

    await t.test('render calls renderer.drawTextureRect if loaded and GL context exists', () => {
        battleStageManager.onAssetsLoaded();
        assert.strictEqual(battleStageManager.isLoaded, true);

        const deltaTime = 16.67;
        battleStageManager.render(deltaTime);

        assert.strictEqual(mockRenderer.drawTextureRect.mock.callCount(), 1, 'drawTextureRect should be called once');
        const [gl, texture, x, y, width, height, camera] = mockRenderer.drawTextureRect.mock.calls[0].arguments;

        assert.deepStrictEqual(gl, mockResolutionEngine.getGLContext(), 'GL context should be passed');
        assert.deepStrictEqual(texture, { id: 'mockTexture' }, 'Texture should be the mocked texture');
        assert.strictEqual(x, 0, 'X position should be 0');
        assert.strictEqual(y, 0, 'Y position should be 0');
        assert.strictEqual(width, 1920, 'Width should be internal resolution width');
        assert.strictEqual(height, 1080, 'Height should be internal resolution height');
        assert.strictEqual(camera, mockCameraEngine, 'Camera should be passed');
    });

    await t.test('render does nothing if not loaded', () => {
        battleStageManager.isLoaded = false;
        battleStageManager.render(10);
        assert.strictEqual(mockRenderer.drawTextureRect.mock.callCount(), 0, 'drawTextureRect should not be called');
    });

    await t.test('render does nothing if GL context is missing', () => {
        battleStageManager.onAssetsLoaded();
        battleStageManager.gl = null;
        battleStageManager.render(10);
        assert.strictEqual(mockRenderer.drawTextureRect.mock.callCount(), 0, 'drawTextureRect should not be called');
    });

    await t.test('render warns if background texture is not available even if asset is found', () => {
        const originalWarn = console.warn;
        const warnMock = t.mock.fn();
        console.warn = warnMock;

        mockAssetLoader.assets.set('battle_stage_forest', { image: {}, width: 100, height: 100 });
        battleStageManager.onAssetsLoaded();
        assert.strictEqual(battleStageManager.isLoaded, true);

        battleStageManager.render(10);
        assert.strictEqual(mockRenderer.drawTextureRect.mock.callCount(), 0, 'drawTextureRect should not be called');
        assert.strictEqual(warnMock.mock.callCount(), 1, 'console.warn should be called');
        assert.ok(warnMock.mock.calls[0].arguments[0].includes('Background texture not available.'), 'Warning message correct');

        console.warn = originalWarn;
    });
});
