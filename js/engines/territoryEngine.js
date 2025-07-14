// js/engines/territoryEngine.js
class TerritoryEngine {
    constructor(gameEngine, sceneEngine, uiEngine, battleLogEngine, measurementEngine) {
        this.gameEngine = gameEngine;
        this.sceneEngine = sceneEngine;
        this.uiEngine = uiEngine;
        this.battleLogEngine = battleLogEngine;
        this.measurementEngine = measurementEngine;
        console.log("TerritoryEngine initialized.");
    }

    // 영지 화면을 활성화하고 UI 요소를 등록하는 메서드
    activate() {
        console.log("TerritoryEngine: Activating Territory Scene.");
        this.battleLogEngine.addLog("영지 화면에 진입했습니다.", "green");

        // UI 요소 등록: '영지 화면입니다.' 텍스트
        this.uiEngine.registerUIElement('territoryText', 'text', {
            x: this.measurementEngine.internalResolution.width / 2,
            y: this.measurementEngine.internalResolution.height / 2 - 50,
            text: '영지 화면입니다.',
            fontSize: this.measurementEngine.getFontSizeLarge() * 1.5,
            color: '#FFFFFF',
            textAlign: 'center',
            textBaseline: 'middle'
        });

        // UI 요소 등록: '전투 개시' 버튼
        this.uiEngine.registerUIElement('startCombatButton', 'button', {
            x: this.measurementEngine.internalResolution.width / 2 - 100,
            y: this.measurementEngine.internalResolution.height - 150,
            width: 200, height: 60,
            text: '전투 개시',
            fontSize: this.measurementEngine.getFontSizeMedium(),
            color: '#FFD700' // 금색 버튼
        }, () => {
            console.log('TerritoryEngine: 전투 개시 버튼 클릭됨!');
            this.battleLogEngine.addLog("전투를 시작합니다!", "red");
            this.sceneEngine.loadScene('battle'); // 전투 씬으로 전환
        });

        // 기존 시작 버튼이 있다면 비활성화 (main.js에서 처리할 수도 있음)
        // this.uiEngine.unregisterUIElement('startButton');
    }

    // 영지 화면 비활성화 (다른 씬으로 전환될 때 호출)
    deactivate() {
        console.log("TerritoryEngine: Deactivating Territory Scene.");
        this.uiEngine.unregisterUIElement('territoryText');
        this.uiEngine.unregisterUIElement('startCombatButton');
    }

    update(deltaTime) {
        // 영지 단계에서 필요한 업데이트 로직 (현재는 비어있음)
    }

    draw(renderer) {
        // 영지 화면의 배경을 초록색으로 그립니다.
        renderer.setClearColor(0.2, 0.5, 0.2, 1.0); // 초록색 배경
        renderer.clear();
        // 텍스트와 버튼은 UIEngine이 그립니다.
    }
}
