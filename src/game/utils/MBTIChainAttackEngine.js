import { getMbtiCompatibility } from '../data/mbtiCompatibility.js';
import { aspirationEngine } from './AspirationEngine.js';
import { combatCalculationEngine } from './CombatCalculationEngine.js';
import { mbtiToString } from '../data/classMbtiMap.js';
import { spriteEngine } from './SpriteEngine.js';
import { debugChainRevengeManager } from '../debug/DebugChainRevengeManager.js';

class MBTIChainAttackEngine {
  constructor() {
    this.name = 'MBTIChainAttackEngine';
    this.battleSimulator = null;
  }

  setBattleSimulator(simulator) {
    this.battleSimulator = simulator;
  }

  handleAttack(attacker, defender, skill) {
    if (!this.battleSimulator || !attacker || !defender) return;
    if (!skill || skill.type !== 'ACTIVE') return;
    const attackerType = mbtiToString(attacker.mbti);
    if (!attackerType) return;

    const allies = this.battleSimulator.turnQueue.filter(u => u.team === attacker.team && u.currentHp > 0);
    allies.forEach(ally => {
      if (ally === attacker) return;
      const allyType = mbtiToString(ally.mbti);
      if (!allyType) return;
      if (getMbtiCompatibility(allyType, attackerType) < 3) return;

      const distance = Math.abs(ally.gridX - defender.gridX) + Math.abs(ally.gridY - defender.gridY);
      const range = ally.finalStats?.attackRange || 1;
      const aspirationData = aspirationEngine.getAspirationData(ally.uniqueId);
      const aspiration = aspirationData?.aspiration ?? 0;
      if (distance <= range && aspiration >= 10) {
        aspirationEngine.addAspiration(ally.uniqueId, -10, '체인 어택');
        const chainSkill = { id: 'mbtiChain', name: '체인 어택', type: 'ACTIVE', damageMultiplier: 0.5 };
        const { damage, hitType } = combatCalculationEngine.calculateDamage(ally, defender, chainSkill);

        if (ally.sprite && defender.sprite) {
          spriteEngine.changeSpriteForDuration(ally, 'attack', 600);
          this.battleSimulator.animationEngine?.attack(ally.sprite, defender.sprite);
        }

        this.battleSimulator.skillEffectProcessor._applyDamage(defender, damage, hitType);
        this.battleSimulator.noticeUI?.show('Chain Attack!');
        debugChainRevengeManager.logChainAttack(ally, attacker, defender, damage, hitType);
      }
    });
  }
}

export const mbtiChainAttackEngine = new MBTIChainAttackEngine();
