import assert from 'assert';
import { InitiativeGaugeEngine } from '../src/game/utils/InitiativeGaugeEngine.js';
import { turnOrderManager } from '../src/game/utils/TurnOrderManager.js';

console.log('--- ⚖️ 이니셔티브 게이지 엔진 테스트 시작 ---');

const initiativeGaugeEngine = new InitiativeGaugeEngine();

const fastUnit = { uniqueId: 'fast', instanceName: '빠른 유닛', speed: 10 };
const slowUnit = { uniqueId: 'slow', instanceName: '느린 유닛', speed: 5 };

let fastCount = 0;
let slowCount = 0;
let fastFirstTick = null;
let slowFirstTick = null;

for (let tick = 1; tick <= 40; tick++) {
    const ready = initiativeGaugeEngine.tick([fastUnit, slowUnit]);
    if (ready.length) {
        turnOrderManager.collectActions(ready, u => ({ action: 'act', initiative: u.speed }));
        const queue = turnOrderManager.createTurnQueue();
        queue.forEach(entry => {
            const unit = entry.unitId === fastUnit.uniqueId ? fastUnit : slowUnit;
            if (entry.unitId === fastUnit.uniqueId) {
                fastCount++;
                if (fastFirstTick === null) fastFirstTick = tick;
            } else {
                slowCount++;
                if (slowFirstTick === null) slowFirstTick = tick;
            }
            initiativeGaugeEngine.resetGauge(unit);
            assert.strictEqual(
                initiativeGaugeEngine.getGauge(unit),
                0,
                `${unit.instanceName}의 게이지가 초기화되지 않았습니다.`
            );
        });
    }
}

assert(fastFirstTick < slowFirstTick, '빠른 유닛이 먼저 행동하지 않았습니다.');
assert(fastCount > slowCount, '빠른 유닛의 행동 횟수가 더 많아야 합니다.');

console.log('✅ 빠른 유닛이 먼저이자 더 자주 턴을 얻었습니다.');
console.log('✅ 행동 후 게이지가 0으로 초기화되었습니다.');

