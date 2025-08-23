import './setup-indexeddb.js';
import assert from 'assert';
import { mbtiRevengeEngine } from '../src/game/utils/MBTIRevengeEngine.js';
import { aspirationEngine } from '../src/game/utils/AspirationEngine.js';
import { combatCalculationEngine } from '../src/game/utils/CombatCalculationEngine.js';
import { mbtiFromString } from '../src/game/data/classMbtiMap.js';

console.log('--- MBTI Revenge Engine Test ---');

// Create units
const defender = {
  uniqueId: 1,
  team: 'ally',
  mbti: mbtiFromString('INTJ'),
  finalStats: { hp: 100, physicalDefense: 0 },
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

const attacker = {
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
  turnQueue: [defender, ally, attacker],
  skillEffectProcessor: {
    _applyDamage(target, damage) {
      target.currentHp -= damage;
    }
  }
};

mbtiRevengeEngine.setBattleSimulator(battleSimulator);
combatCalculationEngine.setBattleSimulator(battleSimulator);
aspirationEngine.setBattleSimulator(battleSimulator);
aspirationEngine.initializeUnits([defender, ally, attacker]);

const beforeAsp = aspirationEngine.getAspirationData(ally.uniqueId).aspiration;
mbtiRevengeEngine.handleAttack(attacker, defender, { type: 'ACTIVE' });
const afterAsp = aspirationEngine.getAspirationData(ally.uniqueId).aspiration;

assert.strictEqual(afterAsp, beforeAsp - 10, 'Aspiration should decrease by 10');
assert(attacker.currentHp < 100, 'Attacker should take damage');

console.log('MBTI Revenge Engine test passed');
