import './setup-indexeddb.js';
import assert from 'assert';
import { statusEffectManager } from '../src/game/utils/StatusEffectManager.js';
import { mbtiChainAttackEngine } from '../src/game/utils/MBTIChainAttackEngine.js';
import { mbtiRevengeEngine } from '../src/game/utils/MBTIRevengeEngine.js';
import { aspirationEngine } from '../src/game/utils/AspirationEngine.js';
import { mbtiFromString } from '../src/game/data/classMbtiMap.js';
import { EFFECT_TYPES } from '../src/game/utils/EffectTypes.js';

console.log('--- MBTI Status Effect Trigger Test ---');

const attacker = {
  uniqueId: 1,
  team: 'ally',
  mbti: mbtiFromString('INTJ'),
  finalStats: { hp: 100, physicalAttack: 30, attackRange: 1 },
  currentHp: 100,
  currentBarrier: 0,
  gridX: 0,
  gridY: 0,
  sprite: { x: 0, y: 0 }
};

const chainAlly = {
  uniqueId: 2,
  team: 'ally',
  mbti: mbtiFromString('INTJ'),
  finalStats: { hp: 100, attackRange: 1, physicalAttack: 30 },
  currentHp: 100,
  currentBarrier: 0,
  gridX: 1,
  gridY: 0,
  sprite: { x: 1, y: 0 }
};

const defender = {
  uniqueId: 3,
  team: 'enemy',
  mbti: mbtiFromString('ENTP'),
  finalStats: { hp: 100, physicalDefense: 0 },
  currentHp: 100,
  currentBarrier: 0,
  gridX: 1,
  gridY: 1,
  sprite: { x: 1, y: 1 }
};

const revengeAlly = {
  uniqueId: 4,
  team: 'enemy',
  mbti: mbtiFromString('ENTP'),
  finalStats: { hp: 100, attackRange: 1, physicalAttack: 30 },
  currentHp: 100,
  currentBarrier: 0,
  gridX: 0,
  gridY: 1,
  sprite: { x: 0, y: 1 }
};

let chainTriggered = false;
let revengeTriggered = false;

const battleSimulator = {
  turnQueue: [attacker, chainAlly, defender, revengeAlly],
  animationEngine: {
    attack(attackSprite) {
      if (attackSprite === chainAlly.sprite) chainTriggered = true;
      if (attackSprite === revengeAlly.sprite) revengeTriggered = true;
    }
  },
  skillEffectProcessor: {
    _applyDamage(target, damage) { target.currentHp -= damage; },
    applyStatusEffectDamage(attacker, target, damage) {
      this._applyDamage(target, damage);
    }
  },
  terminationManager: { handleUnitDeath() {} },
  vfxManager: { createDamageNumber() {}, showEffectName() {} },
  noticeUI: { show() {} }
};

statusEffectManager.setBattleSimulator(battleSimulator);
mbtiChainAttackEngine.setBattleSimulator(battleSimulator);
mbtiRevengeEngine.setBattleSimulator(battleSimulator);
aspirationEngine.setBattleSimulator(battleSimulator);
aspirationEngine.initializeUnits(battleSimulator.turnQueue);

aspirationEngine.addAspiration(chainAlly.uniqueId, 20, 'init');
aspirationEngine.addAspiration(revengeAlly.uniqueId, 20, 'init');

const beforeChainAsp = aspirationEngine.getAspirationData(chainAlly.uniqueId).aspiration;
const beforeRevengeAsp = aspirationEngine.getAspirationData(revengeAlly.uniqueId).aspiration;

statusEffectManager.addEffect(defender, { name: 'Burn', effect: { id: 'burn', type: EFFECT_TYPES.DEBUFF, duration: 1 } }, attacker);

statusEffectManager.onTurnEnd(battleSimulator.turnQueue);

const chainAsp = aspirationEngine.getAspirationData(chainAlly.uniqueId).aspiration;
const revengeAsp = aspirationEngine.getAspirationData(revengeAlly.uniqueId).aspiration;

assert.strictEqual(chainTriggered, false, 'Chain attack should not trigger from status effect damage');
assert.strictEqual(revengeTriggered, false, 'Revenge attack should not trigger from status effect damage');
assert.strictEqual(chainAsp, beforeChainAsp, 'Chain ally aspiration should remain unchanged');
assert.strictEqual(revengeAsp, beforeRevengeAsp, 'Revenge ally aspiration should remain unchanged');

console.log('MBTI status effect trigger test passed');
