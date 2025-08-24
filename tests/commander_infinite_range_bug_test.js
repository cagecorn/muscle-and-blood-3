import assert from 'assert';
import './setup-indexeddb.js';
import IsSkillInRangeNode from '../src/ai/nodes/IsSkillInRangeNode.js';
import Blackboard from '../src/ai/Blackboard.js';
import { skillEngine } from '../src/game/utils/SkillEngine.js';
import { tokenEngine } from '../src/game/utils/TokenEngine.js';

// Commander and enemy units placed 6 tiles apart
const commander = {
    uniqueId: 1,
    id: 'commander',
    instanceName: 'Commander',
    team: 'ally',
    gridX: 0,
    gridY: 0,
    finalStats: { attackRange: 2 }
};

const enemy = {
    uniqueId: 2,
    id: 'enemy',
    instanceName: 'Enemy',
    team: 'enemy',
    gridX: 0,
    gridY: 6,
    finalStats: {}
};

// Initialize token system
// Both units are stationary and cannot move; only tokens matter
// Commander receives default 3 tokens at turn start
// so skillEngine will allow use if range is not checked

tokenEngine.initializeUnits([commander, enemy]);
tokenEngine.addTokensForNewTurn();

// Skill with range 2 (same as commander attack range)
const skill = {
    id: 'testSkill',
    name: 'Test Skill',
    type: 'ACTIVE',
    cost: 1,
    cooldown: 0,
    range: 2
};

// Verify target is out of range via AI node
const rangeNode = new IsSkillInRangeNode();
const bb = new Blackboard();
bb.set('skillTarget', enemy);
bb.set('currentSkillData', skill);
const rangeResult = await rangeNode.evaluate(commander, bb);
assert.strictEqual(rangeResult, 'FAILURE', 'Target should be out of range');

// Attempt to use skill regardless of range
const tokensBefore = tokenEngine.getTokens(commander.uniqueId);
skillEngine.recordSkillUse(commander, skill, enemy);
const tokensAfter = tokenEngine.getTokens(commander.uniqueId);

// Expected correct behavior: tokens should not change because skill is out of range
// Current bug: tokens decrease, meaning skillEngine allows infinite-range usage
assert.strictEqual(tokensAfter, tokensBefore, 'Tokens should not be spent when target is out of range');

console.log('✅ Commander range check enforced');
