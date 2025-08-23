import { debugLogEngine } from '../utils/DebugLogEngine.js';

class DebugChainRevengeManager {
    constructor() {
        this.name = 'DebugChainRevenge';
        debugLogEngine.register(this);
    }

    logChainAttack(ally, attacker, defender, damage, hitType) {
        console.groupCollapsed(`%c[${this.name}]`, `color: #16a34a; font-weight: bold;`, '체인 어택 발동');
        debugLogEngine.log(
            this.name,
            `동료 ${ally.uniqueId}가 공격자 ${attacker.uniqueId}의 체인 어택을 지원하여 대상 ${defender.uniqueId}에게 ` +
            `${damage} 피해를 가했습니다. (히트: ${hitType})`
        );
        console.groupEnd();
    }

    logRevengeAttack(ally, attacker, defender, damage, hitType) {
        console.groupCollapsed(`%c[${this.name}]`, `color: #dc2626; font-weight: bold;`, '리벤지 어택 발동');
        debugLogEngine.log(
            this.name,
            `동료 ${ally.uniqueId}가 공격자 ${attacker.uniqueId}에게 복수하여 대상 ${defender.uniqueId}에게 ${damage} 피해를 가했습니다. (히트: ${hitType})`
        );
        console.groupEnd();
    }
}

export const debugChainRevengeManager = new DebugChainRevengeManager();
