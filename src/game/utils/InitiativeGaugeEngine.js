import { debugLogEngine } from './DebugLogEngine.js';

/**
 * 이니셔티브 게이지를 관리하는 엔진
 */
class InitiativeGaugeEngine {
    constructor() {
        this.registry = new Map(); // unitId -> { gauge, speed }
        debugLogEngine.log('InitiativeGaugeEngine', '이니셔티브 게이지 엔진이 초기화되었습니다.');
    }

    /**
     * 유닛의 속도를 설정합니다. 기존 게이지는 유지됩니다.
     * @param {string|number} unitId
     * @param {number} speed
     */
    setSpeed(unitId, speed) {
        const entry = this.registry.get(unitId) || { gauge: 0, speed: 0 };
        entry.speed = speed;
        this.registry.set(unitId, entry);
    }

    /**
     * 모든 유닛의 게이지를 갱신하고 100을 넘는 유닛을 반환합니다.
     * @param {number} deltaMs
     * @returns {Array<string|number>} 행동 가능한 유닛 ID 목록
     */
    tick(deltaMs) {
        const ready = [];
        for (const [unitId, data] of this.registry.entries()) {
            data.gauge += data.speed * deltaMs;
            if (data.gauge >= 100) {
                ready.push(unitId);
            }
        }
        return ready;
    }

    /**
     * 행동을 마친 유닛의 게이지를 100만큼 감소시킵니다.
     * @param {string|number} unitId
     */
    resetGauge(unitId) {
        const data = this.registry.get(unitId);
        if (data) {
            data.gauge -= 100;
        }
    }
}

export { InitiativeGaugeEngine };
export const initiativeGaugeEngine = new InitiativeGaugeEngine();

