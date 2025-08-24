import assert from 'assert';
import './setup-indexeddb.js';
import SkillEffectProcessor from '../src/game/utils/SkillEffectProcessor.js';
import Blackboard from '../src/ai/Blackboard.js';
import { formationEngine } from '../src/game/utils/FormationEngine.js';
import { pathfinderEngine } from '../src/game/utils/PathfinderEngine.js';

const animationEngine = { moveTo: async (sprite, x, y) => { sprite.x = x; sprite.y = y; } };
const skillEffectProcessor = new SkillEffectProcessor({ animationEngine, delayEngine: { hold: async () => {} } });

formationEngine.grid = {
  getCell(col, row) {
    return { col, row, x: col * 10, y: row * 10, isOccupied: false };
  },
};
pathfinderEngine.formationEngine = formationEngine;
pathfinderEngine.findPath = async (_unit, start, end) => {
  const path = [];
  let c = start.col, r = start.row;
  while (c !== end.col || r !== end.row) {
    if (c < end.col) c++;
    else if (c > end.col) c--;
    else if (r < end.row) r++;
    else r--;
    path.push({ col: c, row: r });
  }
  return path;
};

const unit = { uniqueId: 1, gridX: 0, gridY: 0, sprite: {}, instanceName: '유닛' };
const blackboard = new Blackboard();
blackboard.set('shadowStepDestination', { col: 2, row: 1 });

await skillEffectProcessor._processShadowStep(unit, { id: 'shadowStep', range: 3 }, blackboard);

assert.strictEqual(unit.gridX, 2);
assert.strictEqual(unit.gridY, 1);

console.log('Shadow Step moves unit to destination');
