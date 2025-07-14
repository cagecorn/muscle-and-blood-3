// workers/battleCalculationWorker.js

// 이 스크립트는 Web Worker로 실행됩니다. (self는 워커 자신을 참조)
// 메인 스크립트로부터 메시지를 받아 전투 계산을 수행하고 결과를 다시 보냅니다.

self.onmessage = function(event) {
    const { type, payload } = event.data; // 메인 스레드로부터 받은 데이터

    if (type === 'CALCULATE_COMBAT_STEP') {
        console.log('BattleCalculationWorker: Calculating combat step...', payload);

        // --- 여기에 복잡한 전투 계산 로직 구현 ---
        // 예시: 데미지 계산, 스킬 발동 확률, 상태 이상 적용 등
        // payload에는 용병 스탯, 현재 체력, 적 스탯 등 필요한 모든 데이터가 포함될 수 있습니다.

        let result = {}; // 계산된 결과

        try {
            // 실제 전투 계산을 시뮬레이션 (시간이 오래 걸리는 작업 가정)
            // 예를 들어, 12vs12 자동 전투의 한 턴을 시뮬레이션
            // for (let i = 0; i < 1000000; i++) { /* 복잡한 계산 */ }

            result = performComplexBattleCalculations(payload); // 가상의 함수
            console.log('BattleCalculationWorker: Calculation complete.', result);

            // 계산 결과를 메인 스레드로 다시 보냅니다.
            self.postMessage({
                type: 'COMBAT_STEP_RESULT',
                payload: result,
                originalRequestId: payload.requestId // 요청 ID를 함께 보내 요청-응답 매칭
            });

        } catch (error) {
            console.error('BattleCalculationWorker: Error during calculation:', error);
            self.postMessage({
                type: 'CALCULATION_ERROR',
                message: error.message,
                originalRequestId: payload.requestId
            });
        }
    } else {
        console.warn('BattleCalculationWorker: Unknown message type received:', type);
    }
};

// 가상의 복잡한 전투 계산 함수 (실제 게임 로직으로 대체 필요)
function performComplexBattleCalculations(data) {
    // 예시: 간단한 더미 계산
    const { attacker, defender, skill } = data;
    let damage = 0;
    if (attacker && defender) {
        damage = attacker.attack - defender.defense + (skill ? skill.power : 0);
        if (damage < 0) damage = 0;
    }
    return {
        damageDealt: damage,
        defenderHealthRemaining: defender ? defender.health - damage : 0,
        // 기타 전투 결과 (로그, 상태 변화 등)
    };
}

console.log('BattleCalculationWorker initialized.');
