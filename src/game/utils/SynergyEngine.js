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
            let multiplier = 1;
            def.bonuses.forEach(b => {
                if (count >= b.count) multiplier = b.multiplier;
            });
            u.finalStats.hp = Math.round(u.baseStats.hp * multiplier);
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
            let multiplier = 1;
            if (def) {
                def.bonuses.forEach(b => {
                    if (count >= b.count) multiplier = b.multiplier;
                });
            }
            return {
                key,
                name: def?.name || key,
                count,
                multiplier,
                bonuses: def?.bonuses || []
            };
        });
    }
}

export const synergyEngine = new SynergyEngine();
