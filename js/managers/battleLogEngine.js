class BattleLogEngine {
    constructor(panelEngine, measurementEngine) {
        if (!panelEngine || !measurementEngine) {
            console.error('PanelEngine and MeasurementEngine instances are required for BattleLogEngine.');
            return;
        }
        this.panelEngine = panelEngine;
        this.measure = measurementEngine;
        this.logMessages = [];
        this.maxMessages = 10;
        this.logCanvasId = 'combatLogCanvas';

        this.logPanel = this.panelEngine.registerPanel(this.logCanvasId, {}, false);

        if (this.logPanel) {
            this.ctx = this.logPanel.canvas.getContext('2d');
            this.logPanel.render = this.render.bind(this);
            this.logPanel.update = this.update.bind(this);
        } else {
            console.error(`BattleLogEngine: Failed to register or get panel '${this.logCanvasId}'.`);
        }

        console.log('BattleLogEngine initialized.');
    }

    addLog(message, color = '#eee') {
        const timestamp = Date.now();
        this.logMessages.push({ message, color, timestamp });
        if (this.logMessages.length > this.maxMessages) {
            this.logMessages.shift();
        }
        console.log(`[BATTLE LOG] ${message}`);
    }

    update(deltaTime) {
        // Future fade out logic can be placed here
    }

    render(glOrCtx, deltaTime) {
        const ctx = this.ctx;
        if (!ctx || !this.logPanel || !this.logPanel.options.isVisible) return;

        const panelWidth = ctx.canvas.width;
        const panelHeight = ctx.canvas.height;

        ctx.clearRect(0, 0, panelWidth, panelHeight);

        ctx.font = `${this.measure.getFontSizeSmall()}px Arial`;
        ctx.textBaseline = 'bottom';

        const padding = this.measure.getPadding('y');
        let currentY = panelHeight - padding;

        for (let i = this.logMessages.length - 1; i >= 0; i--) {
            const log = this.logMessages[i];
            ctx.fillStyle = log.color;
            ctx.fillText(log.message, this.measure.getPadding('x'), currentY);
            currentY -= this.measure.getFontSizeSmall() + padding / 2;
            if (currentY < padding) break;
        }
    }
}
