const test = require('node:test');
const assert = require('assert');

// js/assetLoader.js 파일의 전체 내용 (테스트를 위해 직접 복사)
class AssetLoader {
    constructor(gl) {
        if (!gl) {
            console.error("WebGL context (gl) is required for AssetLoader.");
            return;
        }
        this.gl = gl;
        this.assets = {};
        this.loadedCount = 0;
        this.totalCount = 0;
        this.isLoading = false;

        console.log("AssetLoader initialized.");
    }

    load(assetList, onProgress, onComplete) {
        this.assets = {};
        this.loadedCount = 0;
        this.totalCount = assetList.length;
        this.isLoading = true;

        if (this.totalCount === 0) {
            this.isLoading = false;
            onComplete();
            return;
        }

        assetList.forEach(asset => {
            if (asset.type === 'image') {
                this._loadImage(asset, onProgress, onComplete);
            } else if (asset.type === 'audio') {
                this._loadAudio(asset, onProgress, onComplete);
            } else if (asset.type === 'json') {
                this._loadJson(asset, onProgress, onComplete);
            } else {
                console.warn(`Unsupported asset type: ${asset.type}`);
                this._assetLoaded(onProgress, onComplete);
            }
        });
    }

    _assetLoaded(onProgress, onComplete) {
        this.loadedCount++;
        onProgress(this.loadedCount, this.totalCount);
        if (this.loadedCount === this.totalCount) {
            this.isLoading = false;
            onComplete();
            console.log("All assets loaded!");
        }
    }

    _loadImage(asset, onProgress, onComplete) {
        const img = new (global.Image || class MockImage {
            set onload(cb) { this._onload = cb; }
            set onerror(cb) { this._onerror = cb; }
            set src(s) { setTimeout(() => {
                if (s.includes('error')) {
                    this._onerror(new Error('Mock load error'));
                } else {
                    this.width = 100; this.height = 100;
                    this._onload();
                }
            }, 10); }
        })();
        img.onload = () => {
            const texture = this.gl.createTexture();
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            this.gl.bindTexture(this.gl.TEXTURE_2D, null);

            this.assets[asset.name] = {
                image: img,
                texture: texture,
                width: img.width,
                height: img.height
            };
            this._assetLoaded(onProgress, onComplete);
        };
        img.onerror = (e) => {
            console.error(`Failed to load image: ${asset.url}`, e);
            this._assetLoaded(onProgress, onComplete);
        };
        img.src = asset.url;
    }

    _loadAudio(asset, onProgress, onComplete) {
        const audio = new (global.Audio || class MockAudio {
            set oncanplaythrough(cb) { this._oncanplaythrough = cb; }
            set onerror(cb) { this._onerror = cb; }
            set src(s) { setTimeout(() => {
                if (s.includes('error')) {
                    this._onerror(new Error('Mock load error'));
                } else {
                    this._oncanplaythrough();
                }
            }, 10); }
        })();
        audio.oncanplaythrough = () => {
            this.assets[asset.name] = audio;
            this._assetLoaded(onProgress, onComplete);
        };
        audio.onerror = (e) => {
            console.error(`Failed to load audio: ${asset.url}`, e);
            this._assetLoaded(onProgress, onComplete);
        };
        audio.src = asset.url;
    }

    _loadJson(asset, onProgress, onComplete) {
        const mockFetch = (url) => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (url.includes('error')) {
                        reject(new Error('Mock fetch error'));
                    } else {
                        resolve({
                            json: () => Promise.resolve({ data: `${url}-data` })
                        });
                    }
                }, 10);
            });
        };
        (global.fetch || mockFetch)(asset.url)
            .then(response => response.json())
            .then(data => {
                this.assets[asset.name] = data;
                this._assetLoaded(onProgress, onComplete);
            })
            .catch(error => {
                console.error(`Failed to load JSON: ${asset.url}`, error);
                this._assetLoaded(onProgress, onComplete);
            });
    }

    getAsset(name) {
        return this.assets[name];
    }
}

// WebGL 컨텍스트 모의 객체
const baseGL = {
    createTexture: () => ({}),
    bindTexture: () => {},
    texImage2D: () => {},
    texParameteri: () => {},
    getShaderParameter: () => {},
    getShaderInfoLog: () => {},
    createShader: () => {},
    shaderSource: () => {},
    compileShader: () => {},
    createProgram: () => {},
    attachShader: () => {},
    linkProgram: () => {},
    getProgramParameter: () => {},
    getProgramInfoLog: () => {},
    getAttribLocation: () => {},
    getUniformLocation: () => {},
    activeTexture: () => {},
    bindBuffer: () => {},
    bufferData: () => {},
    vertexAttribPointer: () => {},
    enableVertexAttribArray: () => {},
    drawArrays: () => {},
    disableVertexAttribArray: () => {},
    deleteBuffer: () => {},
    uniformMatrix4fv: () => {},
    uniform4fv: () => {},
    uniform1i: () => {},
    lineWidth: () => {},
    LINEAR: 9729,
    CLAMP_TO_EDGE: 33071,
    TEXTURE_2D: 3553,
    TEXTURE_MIN_FILTER: 10241,
    TEXTURE_MAG_FILTER: 10240,
    TEXTURE_WRAP_S: 10242,
    TEXTURE_WRAP_T: 10243,
    RGBA: 6408,
    UNSIGNED_BYTE: 5121,
    ARRAY_BUFFER: 34962,
    STATIC_DRAW: 35044,
    FLOAT: 5126,
};


test('AssetLoader Tests', async (t) => {
    let assetLoader;
    let onProgressMock;
    let onCompleteMock;
    let mockGL;

    t.beforeEach((t) => {
        mockGL = {};
        for (const key in baseGL) {
            const val = baseGL[key];
            mockGL[key] = typeof val === "function" ? t.mock.fn(val) : val;
        }
        assetLoader = new AssetLoader(mockGL);
        onProgressMock = t.mock.fn();
        onCompleteMock = t.mock.fn();
    });
    await t.test('should load an image asset correctly', async () => {
        const assets = [{ name: 'testImage', type: 'image', url: 'assets/images/test.png' }];

        const promise = new Promise(resolve => {
            onCompleteMock = t.mock.fn(resolve);
            assetLoader.load(assets, onProgressMock, onCompleteMock);
        });
        await promise;

        assert.strictEqual(onProgressMock.mock.callCount(), 1, 'onProgress should be called once');
        assert.deepStrictEqual(onProgressMock.mock.calls[0].arguments, [1, 1], 'onProgress should report 1/1');
        assert.strictEqual(onCompleteMock.mock.callCount(), 1, 'onComplete should be called once');

        const loadedAsset = assetLoader.getAsset('testImage');
        assert.ok(loadedAsset, 'Image asset should be loaded');
        assert.ok(loadedAsset.image, 'Loaded asset should have an image object');
        assert.ok(loadedAsset.texture, 'Loaded asset should have a WebGL texture');
        assert.strictEqual(loadedAsset.width, 100, 'Image width should be correct');
        assert.strictEqual(loadedAsset.height, 100, 'Image height should be correct');

        assert.strictEqual(mockGL.createTexture.mock.callCount(), 1, 'gl.createTexture should be called');
        assert.strictEqual(mockGL.bindTexture.mock.callCount(), 2, 'gl.bindTexture should be called twice (bind and unbind)');
        assert.strictEqual(mockGL.texImage2D.mock.callCount(), 1, 'gl.texImage2D should be called');
        assert.strictEqual(mockGL.texParameteri.mock.callCount(), 4, 'gl.texParameteri should be called 4 times for filtering/wrapping');
    });

    await t.test('should load an audio asset correctly', async () => {
        const assets = [{ name: 'testAudio', type: 'audio', url: 'assets/audio/test.mp3' }];

        const promise = new Promise(resolve => {
            onCompleteMock = t.mock.fn(resolve);
            assetLoader.load(assets, onProgressMock, onCompleteMock);
        });
        await promise;

        assert.strictEqual(onProgressMock.mock.callCount(), 1);
        assert.strictEqual(onCompleteMock.mock.callCount(), 1);

        const loadedAsset = assetLoader.getAsset('testAudio');
        assert.ok(loadedAsset, 'Audio asset should be loaded');
        assert.ok(loadedAsset && typeof loadedAsset === "object", 'Loaded asset should be an audio object');
    });
    await t.test('should load a JSON asset correctly', async () => {
        const assets = [{ name: 'testJson', type: 'json', url: 'assets/data/test.json' }];

        const originalFetch = global.fetch;
        global.fetch = t.mock.fn(() => Promise.resolve({
            json: () => Promise.resolve({ key: 'value' })
        }));

        const promise = new Promise(resolve => {
            onCompleteMock = t.mock.fn(resolve);
            assetLoader.load(assets, onProgressMock, onCompleteMock);
        });
        await promise;

        assert.strictEqual(global.fetch.mock.callCount(), 1, 'fetch should be called');
        assert.strictEqual(onProgressMock.mock.callCount(), 1);
        assert.strictEqual(onCompleteMock.mock.callCount(), 1);

        const loadedAsset = assetLoader.getAsset('testJson');
        assert.ok(loadedAsset, 'JSON asset should be loaded');
        assert.deepStrictEqual(loadedAsset, { key: 'value' }, 'Loaded JSON should match mock data');

        global.fetch = originalFetch;
    });

    await t.test('should call onComplete immediately if no assets to load', async () => {
        await new Promise(resolve => {
            onCompleteMock = t.mock.fn(resolve);
            assetLoader.load([], onProgressMock, onCompleteMock);
        });
        assert.strictEqual(onProgressMock.mock.callCount(), 0, 'onProgress should not be called');
        assert.strictEqual(onCompleteMock.mock.callCount(), 1, 'onComplete should be called immediately');
    });

    await t.test('should continue loading even if one asset fails (image error)', async () => {
        const assets = [
            { name: 'goodImage', type: 'image', url: 'assets/images/good.png' },
            { name: 'badImage', type: 'image', url: 'assets/images/error.png' }
        ];

        const promise = new Promise(resolve => {
            onCompleteMock = t.mock.fn(resolve);
            assetLoader.load(assets, onProgressMock, onCompleteMock);
        });
        await promise;

        assert.strictEqual(onProgressMock.mock.callCount(), 2, 'onProgress should be called for both assets');
        assert.strictEqual(onCompleteMock.mock.callCount(), 1, 'onComplete should be called after all attempts');
        assert.ok(assetLoader.getAsset('goodImage'), 'Good image should be loaded');
        assert.ok(!assetLoader.getAsset('badImage'), 'Bad image should not be loaded');
    });
});
