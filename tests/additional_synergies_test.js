import assert from 'assert';
import { mercenaryData } from '../src/game/data/mercenaries.js';
import { mercenaryEngine } from '../src/game/utils/MercenaryEngine.js';
import { partyEngine } from '../src/game/utils/PartyEngine.js';
import { synergyEngine } from '../src/game/utils/SynergyEngine.js';
import { statEngine } from '../src/game/utils/StatEngine.js';

function reset() {
    mercenaryEngine.alliedMercenaries.clear();
    partyEngine.partyMembers = new Array(partyEngine.maxPartySize).fill(undefined);
}

function hireWithSynergy(count, key, setupFn = () => {}) {
    const units = [];
    for (let i = 0; i < count; i++) {
        const unit = mercenaryEngine.hireMercenary(mercenaryData.warrior, 'ally');
        setupFn(unit);
        unit.synergies.fate = key;
        units.push(unit);
    }
    synergyEngine.updateAllies(units);
    return units;
}

// 타격대: 물리 공격력 증가
reset();
let units = hireWithSynergy(12, 'striker');
units.forEach(unit => {
    const base = statEngine.calculateStats(unit, unit.baseStats, unit.equippedItems).physicalAttack;
    assert.strictEqual(unit.finalStats.physicalAttack, Math.round(base * 1.8));
});
console.log('Striker synergy test passed.');

// 서약자: 용맹 배리어 수치 증가
reset();
units = hireWithSynergy(12, 'oathkeeper');
units.forEach(unit => {
    const base = statEngine.calculateStats(unit, unit.baseStats, unit.equippedItems).maxBarrier;
    assert.strictEqual(unit.finalStats.maxBarrier, Math.round(base * 1.6));
});
console.log('Oathkeeper synergy test passed.');

// 곡예사: 회피율 증가
reset();
units = hireWithSynergy(12, 'acrobat', u => { u.baseStats.physicalEvadeChance = 10; });
units.forEach(unit => {
    const base = statEngine.calculateStats(unit, unit.baseStats, unit.equippedItems).physicalEvadeChance;
    assert.strictEqual(unit.finalStats.physicalEvadeChance, Math.round(base * 1.3));
});
console.log('Acrobat synergy test passed.');

// 탐구자: 마법 공격력 증가
reset();
units = hireWithSynergy(12, 'seeker');
units.forEach(unit => {
    const base = statEngine.calculateStats(unit, unit.baseStats, unit.equippedItems).magicAttack;
    assert.strictEqual(unit.finalStats.magicAttack, Math.round(base * 1.8));
});
console.log('Seeker synergy test passed.');

// 조력자: 열망 회복 증가
reset();
units = hireWithSynergy(12, 'supporter');
units.forEach(unit => {
    assert.strictEqual(unit.finalStats.aspirationRegen, 15);
});
console.log('Supporter synergy test passed.');

// 수호자: 물리 방어력 증가
reset();
units = hireWithSynergy(12, 'guardian');
units.forEach(unit => {
    const base = statEngine.calculateStats(unit, unit.baseStats, unit.equippedItems).physicalDefense;
    assert.strictEqual(unit.finalStats.physicalDefense, Math.round(base * 1.6));
});
console.log('Guardian synergy test passed.');

// 정화자: 마법 방어력 증가
reset();
units = hireWithSynergy(12, 'purifier');
units.forEach(unit => {
    const base = statEngine.calculateStats(unit, unit.baseStats, unit.equippedItems).magicDefense;
    assert.strictEqual(unit.finalStats.magicDefense, Math.round(base * 1.6));
});
console.log('Purifier synergy test passed.');

