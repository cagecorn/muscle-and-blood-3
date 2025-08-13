import { debugLogEngine } from './DebugLogEngine.js';

/**
 * 단순한 이니셔티브 게이지 엔진.
 * 각 유닛은 속도에 따라 게이지가 증가하며, 임계치에 도달하면 행동할 준비가 됩니다.
 */
class InitiativeGaugeEngine {
    constructor(threshold = 100) {
        this.threshold = threshold;
        this.gauges = new Map(); // unitId -> gauge value
        debugLogEngine.log('InitiativeGaugeEngine', '이니셔티브 게이지 엔진이 초기화되었습니다.');
    }

    /**
     * 전투 시작 시 유닛들을 등록하여 게이지를 0으로 초기화합니다.
     * @param {Array<object>} units
     */
    registerUnits(units) {
        this.gauges.clear();
        units.forEach(u => this.gauges.set(u.uniqueId, 0));
        debugLogEngine.log('InitiativeGaugeEngine', `${units.length}명의 유닛이 등록되었습니다.`);
    }

    /**
     * 각 유닛의 게이지를 속도만큼 증가시킵니다.
     * @param {Array<object>} units
     * @returns {Array<object>} 행동 준비가 된 유닛 목록
     */
    tick(units = []) {
        const ready = [];
        for (const unit of units) {
            const id = unit.uniqueId;
            const current = this.gauges.get(id) ?? 0;
            const speed = unit.speed ?? 0;
            const updated = current + speed;
            this.gauges.set(id, updated);
            if (updated >= this.threshold) {
                ready.push(unit);
            }
        }
        return ready;
    }

    /**
     * 특정 유닛의 현재 게이지 값을 반환합니다.
     * @param {object} unit
     * @returns {number}
     */
    getGauge(unit) {
        return this.gauges.get(unit.uniqueId) ?? 0;
    }

    /**
     * 특정 유닛의 게이지를 0으로 초기화합니다.
     * @param {object|string|number} unitOrId
     */
    resetGauge(unitOrId) {
        const id = typeof unitOrId === 'object' ? unitOrId.uniqueId : unitOrId;
        if (this.gauges.has(id)) {
            this.gauges.set(id, 0);
        }
    }

    /**
     * 모든 게이지 정보를 제거합니다.
     */
    clear() {
        this.gauges.clear();
    }
}

export { InitiativeGaugeEngine };
export const initiativeGaugeEngine = new InitiativeGaugeEngine();
