import { getMbtiCompatibility } from '../data/mbtiCompatibility.js';
import { aspirationEngine } from './AspirationEngine.js';
import { combatCalculationEngine } from './CombatCalculationEngine.js';

class MBTIRevengeEngine {
  constructor() {
    this.name = 'MBTIRevengeEngine';
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
    const defenderType = this._getMBTIString(defender);
    if (!defenderType) return;

    const allies = this.battleSimulator.turnQueue.filter(u => u.team === defender.team && u.currentHp > 0);
    allies.forEach(ally => {
      if (ally === defender) return;
      const allyType = this._getMBTIString(ally);
      if (!allyType) return;
      if (getMbtiCompatibility(allyType, defenderType) < 3) return;

      const distance = Math.abs(ally.gridX - attacker.gridX) + Math.abs(ally.gridY - attacker.gridY);
      const range = ally.finalStats?.attackRange || 1;
      const aspiration = aspirationEngine.getAspirationData(ally.uniqueId).aspiration;
      if (distance <= range && aspiration >= 10) {
        aspirationEngine.addAspiration(ally.uniqueId, -10, '리벤지 어택');
        const revengeSkill = { id: 'mbtiRevenge', name: '리벤지 어택', type: 'ACTIVE', damageMultiplier: 1 };
        const { damage, hitType } = combatCalculationEngine.calculateDamage(ally, attacker, revengeSkill);
        this.battleSimulator.skillEffectProcessor._applyDamage(attacker, damage, hitType);
      }
    });
  }
}

export const mbtiRevengeEngine = new MBTIRevengeEngine();
