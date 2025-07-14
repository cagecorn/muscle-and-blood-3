class MercenaryPanelGridManager {
    constructor(gridEngine, panelEngine, measurementEngine) {
        if (!gridEngine || !panelEngine || !measurementEngine) {
            console.error('GridEngine, PanelEngine, and MeasurementEngine instances are required for MercenaryPanelGridManager.');
            return;
        }
        this.gridEngine = gridEngine;
        this.panelEngine = panelEngine;
        this.measure = measurementEngine;

        this.panelId = 'mercenaryPanelCanvas';
        this.gridRows = 2;
        this.gridCols = 6;

        this.mercenaryPanel = this.panelEngine.getPanel(this.panelId);
        if (this.mercenaryPanel) {
            const originalRender = this.mercenaryPanel.render;
            this.mercenaryPanel.render = (glOrCtx, deltaTime) => {
                originalRender(glOrCtx, deltaTime);
                this.renderGrid(glOrCtx, deltaTime);
            };
        } else {
            console.error(`MercenaryPanelGridManager: Panel '${this.panelId}' not found.`);
        }

        console.log('MercenaryPanelGridManager initialized.');
    }

    renderGrid(gl, deltaTime) {
        if (!gl || !this.mercenaryPanel || !this.mercenaryPanel.options.isVisible) {
            return;
        }

        const panelWidth = this.mercenaryPanel.canvas.width;
        const panelHeight = this.mercenaryPanel.canvas.height;

        this.gridEngine.drawGrid(gl, {
            x: 0,
            y: 0,
            width: panelWidth,
            height: panelHeight,
            rows: this.gridRows,
            cols: this.gridCols,
            lineColor: [1.0, 1.0, 0.0, 0.7],
            lineWidth: 1.5,
            camera: null
        });
    }

    getGridCellPanelPosition(row, col) {
        if (!this.mercenaryPanel) return null;

        const panelInternalWidth = this.mercenaryPanel.options.width;
        const panelInternalHeight = this.mercenaryPanel.options.height;

        const cellWidth = panelInternalWidth / this.gridCols;
        const cellHeight = panelInternalHeight / this.gridRows;

        const x = col * cellWidth;
        const y = row * cellHeight;

        return { x, y, width: cellWidth, height: cellHeight };
    }
}
