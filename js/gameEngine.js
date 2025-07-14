// gameEngine.js

class GameEngine {
    constructor(measurementEngine) {
        if (!measurementEngine) {
            console.error("MeasurementEngine instance is required for GameEngine.");
            return;
        }
        this.measure = measurementEngine;
        this.entities = []; // 게임 내 모든 오브젝트(용병, 몬스터, 아이템 등)를 담을 배열
        this.gameState = {
            currentMap: null,
            player: null,
            activeCombat: null,
            // 기타 게임 상태 변수들
        };

        console.log("GameEngine initialized.");
    }

    // 게임 상태 업데이트
    update(deltaTime) {
        // 여기에 게임 로직 업데이트 코드가 들어갑니다.
        // 예를 들어:
        // - 용병들의 AI 업데이트
        // - 전투 진행
        // - 월드맵 이동 처리
        // - 이벤트 발생 여부 체크

        this.entities.forEach(entity => {
            if (entity.update) {
                entity.update(deltaTime);
            }
        });

        // 예시: 간단한 콘솔 로그
        // console.log(`GameEngine updating... DeltaTime: ${deltaTime.toFixed(2)}ms`);
    }

    // 게임 오브젝트 추가
    addEntity(entity) {
        this.entities.push(entity);
    }

    // 게임 오브젝트 제거
    removeEntity(entity) {
        this.entities = this.entities.filter(e => e !== entity);
    }

    // 게임 상태 가져오기
    getGameState() {
        return this.gameState;
    }

    // 게임 시작 시 초기화
    initializeGame() {
        // 초기 맵 로드, 플레이어 생성, 초기 용병 설정 등
        console.log("Game initialized and ready to start!");
    }

    // 측량 엔진 인스턴스를 외부에 노출 (필요시)
    getMeasurementEngine() {
        return this.measure;
    }
}
