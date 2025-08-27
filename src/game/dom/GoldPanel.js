import { goldManager } from '../utils/GoldManager.js';

export function createGoldPanel() {
    let panel = document.getElementById('gold-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'gold-panel';
        Object.assign(panel.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            padding: '10px 20px',
            backgroundColor: 'rgba(0,0,0,0.6)',
            color: 'white',
            fontSize: '20px',
            zIndex: '20',
            pointerEvents: 'none'
        });
        document.getElementById('app').appendChild(panel);
    }
    updateGoldPanel();
}

export function updateGoldPanel() {
    const panel = document.getElementById('gold-panel');
    if (panel) {
        panel.innerText = `Gold: ${goldManager.get()}`;
    }
}

export function destroyGoldPanel() {
    const panel = document.getElementById('gold-panel');
    if (panel) {
        panel.remove();
    }
}
