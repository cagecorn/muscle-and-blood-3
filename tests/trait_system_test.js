import assert from 'assert';
import { applyTraits } from '../src/game/data/traits.js';

function base() {
    return {
        hp: 100,
        physicalDefense: 100,
        criticalChance: 10,
        magicAttack: 100,
        physicalAttack: 100,
        rangedAttack: 100,
        magicDefense: 100,
        luck: 100
    };
}

let stats = base();
applyTraits(stats, ['sturdy']);
assert.strictEqual(Math.round(stats.physicalDefense), 105);

stats = base();
applyTraits(stats, ['healthy']);
assert.strictEqual(Math.round(stats.hp), 107);

stats = base();
applyTraits(stats, ['sharp']);
assert.strictEqual(Math.round(stats.criticalChance), 15);

stats = base();
applyTraits(stats, ['clever']);
assert.strictEqual(Math.round(stats.magicAttack), 105);

stats = base();
applyTraits(stats, ['mighty']);
assert.strictEqual(Math.round(stats.physicalAttack), 105);

stats = base();
applyTraits(stats, ['marksman']);
assert.strictEqual(Math.round(stats.rangedAttack), 105);

stats = base();
applyTraits(stats, ['devout']);
assert.strictEqual(Math.round(stats.magicDefense), 105);

stats = base();
applyTraits(stats, ['lucky']);
assert.strictEqual(Math.round(stats.luck), 103);

console.log('Trait system tests passed.');
