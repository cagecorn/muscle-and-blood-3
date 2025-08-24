import { debugLogEngine } from '../utils/DebugLogEngine.js';

/**
 * 커맨더 클래스 유닛의 전투 행동을 추적하여 로그로 남기는 디버그 매니저
 */
class DebugCommanderActionManager {
    constructor() {
        this.name = 'DebugCommander';
        debugLogEngine.register(this);
    }

    /**
     * 일반 행동을 로그로 출력합니다.
     * @param {object} unit - 행동을 수행한 유닛
     * @param {string} action - 수행한 행동 설명
     * @param {string} [detail] - 추가 정보
     */
    logAction(unit, action, detail = '') {
        if (unit.id !== 'commander') return;
        const message = detail ? `${action} - ${detail}` : action;
        debugLogEngine.log(this.name, `${unit.instanceName} 행동: ${message}`);
    }

    /**
     * 스킬 사용 시 유닛과 타겟 간의 거리 정보를 포함한 로그를 출력합니다.
     * @param {object} attacker - 스킬을 사용한 커맨더 유닛
     * @param {object} target - 스킬 대상 유닛
     * @param {object} skillData - 사용한 스킬 데이터
     */
    logSkillUse(attacker, target, skillData) {
        if (attacker.id !== 'commander') return;

        const atkName = attacker.instanceName || attacker.name || 'unknown';
        const targetName = target?.instanceName || target?.name || 'unknown';

        let distance = 'N/A';
        if (
            target &&
            typeof attacker.gridX === 'number' && typeof attacker.gridY === 'number' &&
            typeof target.gridX === 'number' && typeof target.gridY === 'number'
        ) {
            distance = Math.abs(attacker.gridX - target.gridX) + Math.abs(attacker.gridY - target.gridY);
        }

        console.groupCollapsed(
            `%c[${this.name}]`, `color: #6366f1; font-weight: bold;`,
            `${atkName} -> ${targetName} 스킬 사용: ${skillData.name}`
        );
        debugLogEngine.log(this.name, `유닛 위치: (${attacker.gridX}, ${attacker.gridY})`);
        debugLogEngine.log(this.name, `대상 위치: (${target?.gridX}, ${target?.gridY})`);
        debugLogEngine.log(this.name, `거리: ${distance}`);
        console.groupEnd();
    }
}

export const debugCommanderActionManager = new DebugCommanderActionManager();
