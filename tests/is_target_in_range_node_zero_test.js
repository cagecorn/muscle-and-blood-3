import assert from 'assert';
import './setup-indexeddb.js';
import IsTargetInRangeNode from '../src/ai/nodes/IsTargetInRangeNode.js';
import Blackboard from '../src/ai/Blackboard.js';

const node = new IsTargetInRangeNode();

const unit = { gridX: 0, gridY: 0, finalStats: { attackRange: 0 }, instanceName: 'unit' };
const target = { gridX: 0, gridY: 1, instanceName: 'target' };

const blackboard = new Blackboard();
blackboard.set('currentTargetUnit', target);

const result = await node.evaluate(unit, blackboard);
assert.strictEqual(result, 'FAILURE');
console.log('✅ IsTargetInRangeNode zero range test passed');
