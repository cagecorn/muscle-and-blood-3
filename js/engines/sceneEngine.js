// js/engines/sceneEngine.js
class SceneEngine {
    constructor(renderer, uiEngine, panelEngine, battleLogEngine, cameraEngine) {
        this.renderer = renderer;
        this.uiEngine = uiEngine;
        this.panelEngine = panelEngine;
        this.battleLogEngine = battleLogEngine;
        this.cameraEngine = cameraEngine;
        this.scenes = {}; // 씬들을 저장할 객체
        this.currentScene = null;
        console.log("SceneEngine initialized.");
    }

    // 씬을 등록하는 메서드
    registerScene(name, sceneObject) {
        this.scenes[name] = sceneObject;
        console.log(`SceneEngine: Scene '${name}' registered.`);
    }

    // 특정 씬을 로드하는 메서드
    loadScene(name) {
        if (this.currentScene && this.scenes[this.currentScene]) {
            this.scenes[this.currentScene].deactivate(); // 현재 씬 비활성화
        }

        const newScene = this.scenes[name];
        if (newScene) {
            this.currentScene = name;
            newScene.activate(); // 새 씬 활성화
            console.log(`SceneEngine: Scene '${name}' loaded.`);
            this.battleLogEngine.addLog(`'${name}' 씬으로 전환되었습니다.`, "blue");

            // 씬 전환 시 카메라 리셋 (필요하다면)
            this.cameraEngine.resetCamera && this.cameraEngine.resetCamera();

            // 패널들의 크기를 다시 계산하고 등록
            this.panelEngine.resizeAllPanels();
        } else {
            console.error(`SceneEngine: Scene '${name}' not found.`);
        }
    }

    // 현재 씬의 업데이트 메서드 호출
    update(deltaTime) {
        if (this.currentScene && this.scenes[this.currentScene]) {
            this.scenes[this.currentScene].update(deltaTime);
        }
    }

    // 현재 씬의 그리기 메서드 호출
    draw(renderer) {
        if (this.currentScene && this.scenes[this.currentScene]) {
            this.scenes[this.currentScene].draw(renderer);
        }
    }
}
