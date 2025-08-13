import { turnOrderManager } from '../utils/TurnOrderManager.js';

/**
 * 전투 중 턴 순서 UI를 관리하는 DOM 매니저
 */
export class TurnOrderUIManager {
    constructor() {
        this.container = document.getElementById('turn-order-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'turn-order-container';
            document.getElementById('ui-container').appendChild(this.container);
        }
        this.container.style.display = 'none';
    }

    /**
     * 턴 순서 UI를 표시하고 초기화합니다.
     * @param {Array<object>} initialQueue - 최초 액션 큐
     */
    show(initialQueue) {
        this.container.innerHTML = '';
        this.update(initialQueue);
        this.container.style.display = 'block';
    }

    /**
     * 턴 순서 UI를 숨깁니다.
     */
    hide() {
        this.container.style.display = 'none';
    }

    /**
     * 새로운 턴 순서에 맞춰 UI를 다시 그립니다.
     * @param {Array<object>} newQueue - 갱신된 액션 큐
     */
    update(newQueue) {
        this.container.innerHTML = '';

        newQueue.forEach(entry => {
            const unit = entry.unitId ? turnOrderManager.getUnit(entry.unitId) : entry;
            if (!unit || unit.currentHp <= 0) return;

            const unitEntry = document.createElement('div');
            unitEntry.className = 'turn-order-entry';
            if (unit.isTurnActive) {
                unitEntry.classList.add('active-turn');
            }

            const portrait = document.createElement('div');
            portrait.className = 'turn-order-portrait';
            const imageUrl = unit.uiImage || `assets/images/unit/${unit.battleSprite}.png`;
            portrait.style.backgroundImage = `url(${imageUrl})`;

            const nameLabel = document.createElement('span');
            nameLabel.className = 'turn-order-name';
            nameLabel.innerText = unit.instanceName;

            unitEntry.appendChild(portrait);
            unitEntry.appendChild(nameLabel);
            this.container.appendChild(unitEntry);
        });
    }

    /**
     * UI와 관련된 모든 리소스를 정리합니다.
     */
    destroy() {
        this.hide();
        this.container.innerHTML = '';
    }
}
