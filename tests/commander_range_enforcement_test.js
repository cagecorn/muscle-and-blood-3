import assert from 'assert';
import './setup-indexeddb.js';
import AttackTargetNode from '../src/ai/nodes/AttackTargetNode.js';
import Blackboard from '../src/ai/Blackboard.js';
import { NodeState } from '../src/ai/nodes/Node.js';
import { skillEngine } from '../src/game/utils/SkillEngine.js';
import { statusEffectManager } from '../src/game/utils/StatusEffectManager.js';
import { debugLogEngine } from '../src/game/utils/DebugLogEngine.js';

// Stub engines required by AttackTargetNode but unused in this test
const stubEngines = {
  combatCalculationEngine: { calculateDamage: () => ({ damage: 0, hitType: '정상', comboCount: 0 }) },
  vfxManager: {
    showSkillName() {},
    updateHealthBar() {},
    showComboCount() {},
    createBloodSplatter() {},
    createDamageNumber() {}
  },
  animationEngine: { attack: async () => {} },
  delayEngine: { hold: async () => {} },
  terminationManager: { handleUnitDeath() {} }
};

// Commander and enemy setup
const commander = {
  uniqueId: 1,
  id: 'commander',
  instanceName: 'Commander',
  team: 'ally',
  gridX: 0,
  gridY: 0,
  finalStats: { attackRange: 1 }
};

const enemy = {
  uniqueId: 2,
  id: 'enemy',
  instanceName: 'Enemy',
  team: 'enemy',
  gridX: 0,
  gridY: 2, // beyond attack range
  finalStats: { hp: 10 },
  currentHp: 10
};

statusEffectManager.activeEffects.clear();
skillEngine.resetTurnActions();
debugLogEngine.startRecording();

const node = new AttackTargetNode(stubEngines);
const bb = new Blackboard();
bb.set('currentTargetUnit', enemy);

const result = await node.evaluate(commander, bb);
assert.strictEqual(result, NodeState.FAILURE, 'Attack should fail when target is out of range');

// HP should remain unchanged
assert.strictEqual(enemy.currentHp, 10, 'Enemy HP should remain unchanged');

// No skill usage or effects should be recorded
assert.strictEqual(skillEngine.usedSkillsThisTurn.size, 0, 'Skill use should not be recorded');
assert.strictEqual(statusEffectManager.activeEffects.size, 0, 'No status effects should be applied');

const history = debugLogEngine.getHistory();
assert(history.some(h => h.source === 'SkillEngine' && h.message.some(m => m.includes('out of range'))), 'Out-of-range attempt should be logged');
assert(!history.some(h => h.source === 'SkillEngine' && h.message.some(m => m.includes('스킬') && m.includes('사용'))), 'Skill use should not be logged');

console.log('✅ Commander range enforcement works: out-of-range attacks do nothing');
