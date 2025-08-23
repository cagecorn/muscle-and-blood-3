import './setup-indexeddb.js';
import assert from 'assert';
import { mbtiChainAttackEngine } from '../src/game/utils/MBTIChainAttackEngine.js';
import { aspirationEngine } from '../src/game/utils/AspirationEngine.js';
import { combatCalculationEngine } from '../src/game/utils/CombatCalculationEngine.js';
import { mbtiFromString } from '../src/game/data/classMbtiMap.js';

console.log('--- MBTI Chain Attack Engine Test ---');

// Create units
const attacker = {
  uniqueId: 1,
  team: 'ally',
  mbti: mbtiFromString('INTJ'),
  finalStats: { hp: 100, physicalAttack: 30, physicalDefense: 0 },
  currentHp: 100,
  currentBarrier: 0,
  gridX: 0,
  gridY: 0,
};

const ally = {
  uniqueId: 2,
  team: 'ally',
  mbti: mbtiFromString('INTJ'),
  finalStats: { hp: 100, physicalAttack: 30, physicalDefense: 0, attackRange: 1 },
  currentHp: 100,
  currentBarrier: 0,
  gridX: 1,
  gridY: 0,
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
};

// Battle simulator stub
const battleSimulator = {
  turnQueue: [attacker, ally, defender],
  skillEffectProcessor: {
    _applyDamage(target, damage) {
      target.currentHp -= damage;
    }
  }
};

mbtiChainAttackEngine.setBattleSimulator(battleSimulator);
combatCalculationEngine.setBattleSimulator(battleSimulator);
aspirationEngine.setBattleSimulator(battleSimulator);
aspirationEngine.initializeUnits([attacker, ally, defender]);

const beforeAsp = aspirationEngine.getAspirationData(ally.uniqueId).aspiration;
mbtiChainAttackEngine.handleAttack(attacker, defender, { type: 'ACTIVE' });
const afterAsp = aspirationEngine.getAspirationData(ally.uniqueId).aspiration;

assert.strictEqual(afterAsp, beforeAsp - 10, 'Aspiration should decrease by 10');
assert(defender.currentHp < 100, 'Defender should take damage');

console.log('MBTI Chain Attack Engine test passed');
