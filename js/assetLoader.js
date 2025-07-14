// assetLoader.js

class AssetLoader {
    constructor(gl) {
        if (!gl) {
            console.error("WebGL context (gl) is required for AssetLoader.");
            return;
        }
        this.gl = gl;
        this.assets = {}; // 로드된 에셋을 저장할 객체
        this.loadedCount = 0;
        this.totalCount = 0;
        this.isLoading = false;

        console.log("AssetLoader initialized.");
    }

    /**
     * 에셋 로딩 시작.
     * @param {Array<Object>} assetList 로드할 에셋 목록. 각 객체는 { name: 'assetName', type: 'image', url: 'path/to/asset.png' } 형태.
     * @param {Function} onProgress 로딩 진행 상황을 업데이트할 콜백 (current, total).
     * @param {Function} onComplete 모든 에셋 로딩 완료 시 호출될 콜백.
     */
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
        const img = new Image();
        img.onload = () => {
            // WebGL 텍스처로 변환
            const texture = this.gl.createTexture();
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);

            // WebGL 해상도 엔진에서 설정한 필터링 사용 (LINEAR 또는 NEAREST)
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR); // LINEAR (고화질)
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR); // LINEAR (고화질)
            // (참고: 픽셀 아트는 NEAREST를 선호할 수 있지만, 512x512 타일은 LINEAR가 더 부드러울 수 있음)

            // 텍스처 반복 방지 (타일맵이 아닌 개별 스프라이트용)
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

            this.gl.bindTexture(this.gl.TEXTURE_2D, null); // 바인딩 해제

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
            this._assetLoaded(onProgress, onComplete); // 에러 발생해도 다음 에셋 로드 진행
        };
        img.src = asset.url;
    }

    _loadAudio(asset, onProgress, onComplete) {
        // HTMLAudioElement 또는 Web Audio API 사용
        const audio = new Audio();
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
        fetch(asset.url)
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

    /**
     * 로드된 에셋을 이름으로 가져옵니다.
     * @param {string} name 에셋 이름
     * @returns {any} 로드된 에셋 데이터 (이미지, 텍스처, 오디오 등)
     */
    getAsset(name) {
        return this.assets[name];
    }
}
