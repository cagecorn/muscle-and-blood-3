import { turnOrderManager } from '../utils/TurnOrderManager.js';
import { tokenEngine } from '../utils/TokenEngine.js';

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

        // 실제 항목을 담을 리스트를 미리 만들어둔다.
        this.listElem = document.createElement('div');
        this.listElem.className = 'turn-order-list';
        this.container.appendChild(this.listElem);

        this.container.style.display = 'none';
    }

    /**
     * 턴 순서 UI를 표시하고 초기화합니다.
     * @param {Array<object>} initialQueue - 최초 액션 큐
     */
    show(initialQueue) {
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
        this.listElem.innerHTML = '';

        newQueue.forEach(entry => {
            const unit = entry.unitId ? turnOrderManager.getUnit(entry.unitId) : entry;
            if (!unit || unit.currentHp <= 0) return;

            const unitEntry = document.createElement('div');
            unitEntry.className = 'turn-order-entry';

            const portrait = document.createElement('div');
            portrait.className = 'turn-order-portrait';
            const imageUrl = unit.uiImage || `assets/images/unit/${unit.battleSprite}.png`;
            portrait.style.backgroundImage = `url(${imageUrl})`;

            const nameLabel = document.createElement('span');
            nameLabel.className = 'turn-order-name';
            nameLabel.innerText = unit.instanceName;

            const actionLabel = document.createElement('span');
            actionLabel.className = 'turn-order-action';
            actionLabel.innerText = entry.action || '대기';

            const tokenContainer = document.createElement('div');
            tokenContainer.className = 'turn-order-token-container';
            const tokens = tokenEngine.getTokens(unit.uniqueId);
            for (let i = 0; i < tokens; i++) {
                const tokenImg = document.createElement('img');
                tokenImg.src = 'assets/images/battle/token.png';
                tokenImg.className = 'turn-order-token-icon';
                tokenContainer.appendChild(tokenImg);
            }

            unitEntry.appendChild(portrait);
            unitEntry.appendChild(nameLabel);
            unitEntry.appendChild(actionLabel);
            unitEntry.appendChild(tokenContainer);
            this.listElem.appendChild(unitEntry);
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
