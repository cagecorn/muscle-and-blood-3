import { fateSynergies } from '../data/synergies.js';

export class SynergyTooltipManager {
    static show(key, count, event) {
        this.hide();
        const def = fateSynergies[key];
        if (!def) return;
        const tooltip = document.createElement('div');
        tooltip.id = 'synergy-tooltip';
        tooltip.className = 'synergy-tooltip';
        let html = `<div class="synergy-tooltip-name">${def.name}</div>`;
        def.bonuses.forEach(b => {
            const active = count >= b.count ? 'active' : '';
            html += `<div class="synergy-tooltip-line ${active}">${b.count}명: ${def.statName || 'HP'} x${b.multiplier}</div>`;
        });
        tooltip.innerHTML = html;
        document.body.appendChild(tooltip);
        tooltip.style.left = `${event.pageX + 15}px`;
        tooltip.style.top = `${event.pageY + 15}px`;
    }

    static hide() {
        const existing = document.getElementById('synergy-tooltip');
        if (existing) existing.remove();
    }
}
