import { turnOrderManager } from './TurnOrderManager.js';
import { aiManager } from '../../ai/AIManager.js';
import { initiativeGaugeEngine } from './InitiativeGaugeEngine.js';

/**
 * 전투 로직의 기반이 되는 엔진
 * 현재는 간단한 구조만 제공하며, 이후 전투 기능 구현 시 확장될 예정이다.
 */
class BattleEngine {
    constructor() {
        this.currentBattle = null;
    }

    /**
     * 전투를 초기화한다.
     * @param {Array<object>} allies - 아군 유닛 목록
     * @param {Array<object>} enemies - 적군 유닛 목록
     */
    startBattle(allies, enemies) {
        const allUnits = [...allies, ...enemies];

        this.currentBattle = {
            allies,
            enemies,
            turn: 1
        };

        aiManager.clear();
        allUnits.forEach(u => aiManager.registerUnit(u));
        initiativeGaugeEngine.registerUnits(allUnits);

        console.log('Battle started', this.currentBattle);
    }

    /**
     * 매 프레임 호출되어 전투를 진행한다.
     * initiativeGaugeEngine을 활용해 행동 준비가 된 유닛들의 차례를 동시에 처리한다.
     * @param {number} [deltaMs]
     */
    async update(deltaMs) {
        if (!this.currentBattle) return;

        const battle = this.currentBattle;
        const allUnits = [...battle.allies, ...battle.enemies].filter(u => u.currentHp > 0);
        const readyUnits = initiativeGaugeEngine.tick(allUnits);
        if (readyUnits.length === 0) {
            return;
        }

        turnOrderManager.collectActions(readyUnits, unit => aiManager.planAction(unit, allUnits));
        turnOrderManager.createTurnQueue();
        await turnOrderManager.resolve(unitId => {
            initiativeGaugeEngine.resetGauge(unitId);
            battle.turn += 1;
        });
    }

    /**
     * 전투를 종료한다.
     */
    endBattle() {
        if (this.currentBattle) {
            console.log('Battle ended');
            this.currentBattle = null;
            initiativeGaugeEngine.clear();
        }
    }
}

export const battleEngine = new BattleEngine();
