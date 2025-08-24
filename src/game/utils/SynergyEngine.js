import { statEngine } from './StatEngine.js';
import { fateSynergies } from '../data/synergies.js';

class SynergyEngine {
    _applyFateSynergies(units) {
        const counts = {};
        units.forEach(u => {
            const fate = u.synergies?.fate;
            if (fate) {
                counts[fate] = (counts[fate] || 0) + 1;
            }
        });
        units.forEach(u => {
            const fate = u.synergies?.fate;
            if (!fate) return;
            const def = fateSynergies[fate];
            if (!def) return;
            const count = counts[fate] || 0;
            let effect = def.mode === 'add' ? 0 : 1;
            def.bonuses.forEach(b => {
                if (count >= b.count) effect = b.multiplier;
            });
            const stats = Array.isArray(def.stat) ? def.stat : [def.stat || 'hp'];
            stats.forEach(statKey => {
                const baseValue = u.finalStats[statKey] || 0;
                if (def.mode === 'add') {
                    u.finalStats[statKey] = baseValue + effect;
                } else {
                    u.finalStats[statKey] = Math.round(baseValue * effect);
                }
            });
            if (stats.includes('maxBarrier')) {
                u.finalStats.currentBarrier = u.finalStats.maxBarrier;
            }
        });
    }

    _recalcStats(units) {
        units.forEach(u => {
            u.finalStats = statEngine.calculateStats(u, u.baseStats, u.equippedItems || []);
        });
    }

    updateAllies(units) {
        this._recalcStats(units);
        this._applyFateSynergies(units);
    }

    updateEnemies(units) {
        this._recalcStats(units);
        this._applyFateSynergies(units);
    }

    getFateSynergySummary(units) {
        const counts = {};
        units.forEach(u => {
            const fate = u.synergies?.fate;
            if (fate) counts[fate] = (counts[fate] || 0) + 1;
        });
        return Object.entries(counts).map(([key, count]) => {
            const def = fateSynergies[key];
            let effect = def?.mode === 'add' ? 0 : 1;
            if (def) {
                def.bonuses.forEach(b => {
                    if (count >= b.count) effect = b.multiplier;
                });
            }
            return {
                key,
                name: def?.name || key,
                count,
                multiplier: effect,
                statName: def?.statName || 'HP',
                bonuses: def?.bonuses || [],
                mode: def?.mode || 'multiply'
            };
        });
    }
}

export const synergyEngine = new SynergyEngine();
