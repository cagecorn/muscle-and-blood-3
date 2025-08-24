import assert from 'assert';
import { mercenaryData } from '../src/game/data/mercenaries.js';
import { mercenaryEngine } from '../src/game/utils/MercenaryEngine.js';
import { partyEngine } from '../src/game/utils/PartyEngine.js';

// reset state
mercenaryEngine.alliedMercenaries.clear();
partyEngine.partyMembers = new Array(partyEngine.maxPartySize).fill(undefined);

for (let i = 0; i < 4; i++) {
    mercenaryEngine.hireMercenary(mercenaryData.warrior, 'ally');
}

const allies = mercenaryEngine.getAllAlliedMercenaries();
allies.forEach(unit => {
    assert.strictEqual(unit.synergies.fate, 'vanguard');
    assert.strictEqual(unit.finalStats.hp, Math.round(unit.baseStats.hp * 1.05));
});

console.log('Vanguard synergy test passed.');
