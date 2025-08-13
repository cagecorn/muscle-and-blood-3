import { debugLogEngine } from './DebugLogEngine.js';

/**
 * 유닛의 행동을 수집하고 이니셔티브에 따라 처리 순서를 정하는 매니저
 */
class TurnOrderManager {
    constructor() {
        this.actionQueue = [];
        this.unitRegistry = new Map();
        this.gaugeFilledListeners = new Set();
        debugLogEngine.log('TurnOrderManager', '턴 순서 매니저가 초기화되었습니다.');
    }

    /**
     * 외부에서 전달된 콜백으로 각 유닛의 행동을 수집해 전역 큐에 저장합니다.
     * @param {Array<object>} units - 행동을 수집할 유닛 목록
     * @param {(unit:object)=>{action:string,initiative:number}} [resolver]
     *        - 유닛별 행동과 이니셔티브를 반환하는 콜백
     * @returns {Array<object>} 수집된 액션 큐
     */
    collectActions(units, resolver = (u) => ({ action: 'wait', initiative: u.finalStats?.turnValue ?? 0 })) {
        this.actionQueue = [];
        this.unitRegistry.clear();

        units.forEach(unit => {
            this.unitRegistry.set(unit.uniqueId, unit);
            const result = resolver(unit);
            if (result && result.action !== undefined) {
                this.actionQueue.push({
                    unitId: unit.uniqueId,
                    action: result.action,
                    initiative: result.initiative ?? 0
                });
            }
        });

        return this.actionQueue;
    }

    /**
     * 수집된 액션 큐를 이니셔티브 순서대로 정렬합니다.
     * @returns {Array<object>} - 정렬된 액션 큐
     */
    createTurnQueue() {
        const sorted = [...this.actionQueue].sort((a, b) => {
            if (b.initiative === a.initiative) {
                return this.resolveInitiativeConflict(a, b);
            }
            return b.initiative - a.initiative;
        });

        const orderNames = sorted
            .map(e => `${this.unitRegistry.get(e.unitId)?.instanceName}(i:${e.initiative})`)
            .join(' -> ');
        debugLogEngine.log('TurnOrderManager', `액션 순서 결정: ${orderNames}`);

        this.actionQueue = sorted;
        return this.actionQueue;
    }

    /**
     * 정렬된 액션 큐를 순서대로 실행합니다.
     * 실제 행동 적용 로직은 추후 구현됩니다.
     */
    async resolve(onResolved) {
        for (const entry of this.actionQueue) {
            const unit = this.getUnit(entry.unitId);
            const name = unit?.instanceName ?? 'Unknown';

            if (typeof entry.action === 'function') {
                debugLogEngine.log('TurnOrderManager', `${name}가 계획된 행동을 실행합니다.`);
                await entry.action();
            } else {
                debugLogEngine.log('TurnOrderManager', `${name}가 '${entry.action}'를 실행합니다.`);
            }

            if (onResolved) {
                onResolved(entry.unitId);
            }
        }
        this.actionQueue = [];
        this.unitRegistry.clear();
    }

    /**
     * 동일한 이니셔티브가 충돌했을 때 호출되는 훅
     * 기본 동작은 무작위로 우선 순위를 정합니다.
     * @param {object} a
     * @param {object} b
     * @returns {number} 정렬용 비교 값
     */
    resolveInitiativeConflict(a, b) {
        return Math.random() < 0.5 ? -1 : 1;
    }

    /**
     * 특정 유닛의 다음 행동을 액션 큐의 뒤로 보냅니다.
     * @param {Array<object>} queue - 현재 액션 큐
     * @param {object} targetUnit - 이동 대상 유닛
     * @returns {Array<object>} 변경된 액션 큐
     */
    pushToBack(queue, targetUnit) {
        const isActionQueue = queue[0] && queue[0].unitId !== undefined;
        const index = queue.findIndex(entry =>
            isActionQueue ? entry.unitId === targetUnit.uniqueId : entry.uniqueId === targetUnit.uniqueId
        );
        if (index > -1) {
            const [entry] = queue.splice(index, 1);
            queue.push(entry);
            debugLogEngine.log('TurnOrderManager', `'${targetUnit.instanceName}'의 순서가 마지막으로 변경되었습니다.`);
        }
        return queue;
    }

    /**
     * 저장된 유닛 레지스트리에서 ID로 유닛을 조회합니다.
     * @param {string|number} id
     * @returns {object|undefined}
     */
    getUnit(id) {
        return this.unitRegistry.get(id);
    }

    onGaugeFilled(listener) {
        if (typeof listener === 'function') {
            this.gaugeFilledListeners.add(listener);
        }
    }

    emitGaugeFilled(unit) {
        this.gaugeFilledListeners.forEach(cb => cb(unit));
    }
}

export const turnOrderManager = new TurnOrderManager();
