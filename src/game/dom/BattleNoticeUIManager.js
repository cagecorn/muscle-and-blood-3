/**
 * Displays brief combat notifications on the right side of the screen.
 */
export class BattleNoticeUIManager {
    constructor() {
        this.container = document.getElementById('battle-notice-container');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'battle-notice-container';
            document.getElementById('ui-container').appendChild(this.container);
        }
        this.noticeText = document.createElement('p');
        this.noticeText.className = 'battle-notice-text';
        this.container.appendChild(this.noticeText);
        this.container.style.display = 'none';
        this.timeoutId = null;
    }

    /**
     * Show a message briefly.
     * @param {string} message
     * @param {number} duration
     */
    show(message, duration = 1500) {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        this.noticeText.textContent = message;
        this.container.style.display = 'block';
        this.container.style.opacity = 1;
        this.timeoutId = setTimeout(() => {
            this.container.style.opacity = 0;
            setTimeout(() => {
                this.container.style.display = 'none';
            }, 500);
        }, duration);
    }

    hide() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        this.container.style.display = 'none';
    }

    destroy() {
        this.hide();
        this.container.remove();
        this.container = null;
    }
}
