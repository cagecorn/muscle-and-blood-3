import assert from 'assert';
import { debugCommanderActionManager } from '../src/game/debug/DebugCommanderActionManager.js';

debugCommanderActionManager; // ensure import is used

const logs = [];
const originalLog = console.log;
const originalGroupCollapsed = console.groupCollapsed;
const originalGroupEnd = console.groupEnd;

console.log = (...args) => { logs.push(args.join(' ')); };
console.groupCollapsed = (...args) => { logs.push(args.join(' ')); };
console.groupEnd = () => {};

debugCommanderActionManager.logSkillUse(
    { id: 'commander', instanceName: 'Cmd', gridX: 0, gridY: 0 },
    { instanceName: 'Target', gridX: 2, gridY: 3 },
    { name: 'TestSkill' }
);

console.log = originalLog;
console.groupCollapsed = originalGroupCollapsed;
console.groupEnd = originalGroupEnd;

assert(logs.some(line => line.includes('거리: 5')));
console.log('✅ DebugCommanderActionManager distance calculation');
