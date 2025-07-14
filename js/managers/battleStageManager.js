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
