import { getMbtiCompatibility } from '../data/mbtiCompatibility.js';
import { aspirationEngine } from './AspirationEngine.js';
import { combatCalculationEngine } from './CombatCalculationEngine.js';

class MBTIChainAttackEngine {
  constructor() {
    this.name = 'MBTIChainAttackEngine';
    this.battleSimulator = null;
  }

  setBattleSimulator(simulator) {
    this.battleSimulator = simulator;
  }

  _getMBTIString(unit) {
    const m = unit.mbti;
    if (!m) return null;
    return (m.E > m.I ? 'E' : 'I') +
           (m.S > m.N ? 'S' : 'N') +
           (m.T > m.F ? 'T' : 'F') +
           (m.J > m.P ? 'J' : 'P');
  }

  handleAttack(attacker, defender, skill) {
    if (!this.battleSimulator || !attacker || !defender) return;
    if (!skill || skill.type !== 'ACTIVE') return;
    const attackerType = this._getMBTIString(attacker);
    if (!attackerType) return;

    const allies = this.battleSimulator.turnQueue.filter(u => u.team === attacker.team && u.currentHp > 0);
    allies.forEach(ally => {
      if (ally === attacker) return;
      const allyType = this._getMBTIString(ally);
      if (!allyType) return;
      if (getMbtiCompatibility(allyType, attackerType) < 3) return;

      const distance = Math.abs(ally.gridX - defender.gridX) + Math.abs(ally.gridY - defender.gridY);
      const range = ally.finalStats?.attackRange || 1;
      const aspiration = aspirationEngine.getAspirationData(ally.uniqueId).aspiration;
      if (distance <= range && aspiration >= 10) {
        aspirationEngine.addAspiration(ally.uniqueId, -10, '체인 어택');
        const chainSkill = { id: 'mbtiChain', name: '체인 어택', type: 'ACTIVE', damageMultiplier: 1 };
        const { damage, hitType } = combatCalculationEngine.calculateDamage(ally, defender, chainSkill);
        this.battleSimulator.skillEffectProcessor._applyDamage(defender, damage, hitType);
      }
    });
  }
}

export const mbtiChainAttackEngine = new MBTIChainAttackEngine();
