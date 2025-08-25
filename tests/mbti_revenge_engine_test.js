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
  sprite: { x: 0, y: 0 },
};

const ally = {
  uniqueId: 2,
  team: 'ally',
  mbti: mbtiFromString('INTJ'),
  finalStats: {
    hp: 100,
    physicalAttack: 10,
    rangedAttack: 40,
    magicAttack: 20,
    physicalDefense: 0,
    magicDefense: 0,
    attackRange: 1,
    accuracy: 1,
  },
  currentHp: 100,
  currentBarrier: 0,
  gridX: 1,
  gridY: 0,
  sprite: { x: 1, y: 0 },
};

const attacker = {
  uniqueId: 3,
  team: 'enemy',
  mbti: mbtiFromString('ENTP'),
  finalStats: { hp: 100, physicalDefense: 0, magicDefense: 0 },
  currentHp: 100,
  currentBarrier: 0,
  gridX: 1,
  gridY: 1,
  sprite: { x: 1, y: 1 },
};

// Battle simulator stub
let animationCalled = false;
const battleSimulator = {
  turnQueue: [defender, ally, attacker],
  animationEngine: {
    attack() {
      animationCalled = true;
    }
  },
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
const originalRandom = Math.random;
Math.random = () => 0.99;
mbtiRevengeEngine.handleAttack(attacker, defender, { type: 'ACTIVE' });
Math.random = originalRandom;
const afterAsp = aspirationEngine.getAspirationData(ally.uniqueId).aspiration;

assert.strictEqual(afterAsp, beforeAsp - 10, 'Aspiration should decrease by 10');
assert.strictEqual(attacker.currentHp, 80, 'Attacker should take damage based on highest stat');
assert(animationCalled, 'Animation should trigger');

console.log('MBTI Revenge Engine test passed');
