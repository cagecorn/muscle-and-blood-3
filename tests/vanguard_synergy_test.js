import assert from 'assert';
import { mercenaryData } from '../src/game/data/mercenaries.js';
import { mercenaryEngine } from '../src/game/utils/MercenaryEngine.js';
import { partyEngine } from '../src/game/utils/PartyEngine.js';
import { synergyEngine } from '../src/game/utils/SynergyEngine.js';

// reset state
mercenaryEngine.alliedMercenaries.clear();
partyEngine.partyMembers = new Array(partyEngine.maxPartySize).fill(undefined);

const created = [];
for (let i = 0; i < 4; i++) {
    const unit = mercenaryEngine.hireMercenary(mercenaryData.warrior, 'ally');
    unit.synergies.fate = 'vanguard';
    created.push(unit);
}
// 재계산
synergyEngine.updateAllies(created);

created.forEach(unit => {
    assert.strictEqual(unit.synergies.fate, 'vanguard');
    assert.strictEqual(unit.finalStats.hp, Math.round(unit.baseStats.hp * 1.05));
});

console.log('Vanguard synergy test passed.');
