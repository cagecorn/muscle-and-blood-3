import { getMbtiCompatibility } from '../data/mbtiCompatibility.js';
import { aspirationEngine } from './AspirationEngine.js';
import { combatCalculationEngine } from './CombatCalculationEngine.js';
import { mbtiToString } from '../data/classMbtiMap.js';
import { spriteEngine } from './SpriteEngine.js';
import { debugChainRevengeManager } from '../debug/DebugChainRevengeManager.js';
import { SKILL_TAGS } from './SkillTagManager.js';

class MBTIRevengeEngine {
  constructor() {
    this.name = 'MBTIRevengeEngine';
    this.battleSimulator = null;
  }

  setBattleSimulator(simulator) {
    this.battleSimulator = simulator;
  }

  handleAttack(attacker, defender, skill) {
    if (!this.battleSimulator || !attacker || !defender) return;
    if (!skill || skill.type !== 'ACTIVE') return;
    const defenderType = mbtiToString(defender.mbti);
    if (!defenderType) return;

    const allies = this.battleSimulator.turnQueue.filter(u => u.team === defender.team && u.currentHp > 0);
    allies.forEach(ally => {
      if (ally === defender) return;
      const allyType = mbtiToString(ally.mbti);
      if (!allyType) return;
      if (getMbtiCompatibility(allyType, defenderType) < 3) return;

      const distance = Math.abs(ally.gridX - attacker.gridX) + Math.abs(ally.gridY - attacker.gridY);
      const range = ally.finalStats?.attackRange ?? 1;
      const aspirationData = aspirationEngine.getAspirationData(ally.uniqueId);
      const aspiration = aspirationData?.aspiration ?? 0;
      if (distance <= range && aspiration >= 10) {
        aspirationEngine.addAspiration(ally.uniqueId, -10, '리벤지 어택');

        const stats = ally.finalStats || {};
        const pa = stats.physicalAttack || 0;
        const ra = stats.rangedAttack || 0;
        const ma = stats.magicAttack || 0;

        let attackStatKey = 'physicalAttack';
        const tags = [SKILL_TAGS.ACTIVE];
        if (ma >= pa && ma >= ra) {
          attackStatKey = 'magicAttack';
          tags.push(SKILL_TAGS.RANGED, SKILL_TAGS.MAGIC);
        } else if (ra >= pa && ra >= ma) {
          attackStatKey = 'rangedAttack';
          tags.push(SKILL_TAGS.RANGED, SKILL_TAGS.PHYSICAL);
        } else {
          tags.push(SKILL_TAGS.MELEE, SKILL_TAGS.PHYSICAL);
        }

        const revengeSkill = {
          id: 'mbtiRevenge',
          name: '리벤지 어택',
          type: 'ACTIVE',
          damageMultiplier: 0.5,
          attackStatKey,
          tags
        };
        const { damage, hitType } = combatCalculationEngine.calculateDamage(ally, attacker, revengeSkill);

        if (ally.sprite && attacker.sprite) {
          spriteEngine.changeSpriteForDuration(ally, 'attack', 600);
          this.battleSimulator.animationEngine?.attack(ally.sprite, attacker.sprite);
        }

        this.battleSimulator.skillEffectProcessor._applyDamage(attacker, damage, hitType);
        this.battleSimulator.noticeUI?.show('Revenge Attack!');
        debugChainRevengeManager.logRevengeAttack(ally, attacker, defender, damage, hitType);
      }
    });
  }
}

export const mbtiRevengeEngine = new MBTIRevengeEngine();
