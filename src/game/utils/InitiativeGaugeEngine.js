import { debugLogEngine } from './DebugLogEngine.js';

/**
 * 단순한 이니셔티브 게이지 관리 엔진
 */
class InitiativeGaugeEngine {
    constructor() {
        this.units = new Map();
        debugLogEngine.log('InitiativeGaugeEngine', '이니셔티브 게이지 엔진이 초기화되었습니다.');
    }

    /**
     * 게이지 관리를 위해 유닛을 등록합니다.
     * @param {object} unit
     */
    registerUnit(unit) {
        this.units.set(unit.uniqueId, unit);
    }

    /**
     * 지정된 유닛의 게이지를 0으로 초기화합니다.
     * @param {string|number} unitId
     */
    resetGauge(unitId) {
        const unit = this.units.get(unitId);
        if (unit?.finalStats) {
            unit.finalStats.initiativeGauge = 0;
            debugLogEngine.log('InitiativeGaugeEngine', `${unit.instanceName}의 이니셔티브 게이지가 리셋되었습니다.`);
        }
    }
}

export const initiativeGaugeEngine = new InitiativeGaugeEngine();
