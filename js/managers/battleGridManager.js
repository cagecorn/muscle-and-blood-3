class BattleGridManager {
    constructor(gridEngine, cameraEngine, measurementEngine, resolutionEngine) {
        if (!gridEngine || !cameraEngine || !measurementEngine || !resolutionEngine) {
            console.error('GridEngine, CameraEngine, MeasurementEngine, and ResolutionEngine instances are required for BattleGridManager.');
            return;
        }
        this.gridEngine = gridEngine;
        this.camera = cameraEngine;
        this.measure = measurementEngine;
        this.res = resolutionEngine;
        this.gl = this.res.getGLContext();

        this.gridRows = 15;
        this.gridCols = 15;

        this.horizontalPaddingRatio = 0.1;
        this.verticalPaddingRatio = 0.15;

        this.gridRect = this._calculateGridRect();

        console.log('BattleGridManager initialized.');
    }

    _calculateGridRect() {
        const internalWidth = this.res.getInternalResolution().width;
        const internalHeight = this.res.getInternalResolution().height;

        const padX = internalWidth * this.horizontalPaddingRatio;
        const padY = internalHeight * this.verticalPaddingRatio;

        const gridX = padX;
        const gridY = padY;
        const gridWidth = internalWidth - padX * 2;
        const gridHeight = internalHeight - padY * 2;

        return { x: gridX, y: gridY, width: gridWidth, height: gridHeight };
    }

    render(deltaTime) {
        if (!this.gl) {
            console.warn('BattleGridManager: WebGL context not available for rendering grid.');
            return;
        }
        this.gridRect = this._calculateGridRect();

        this.gridEngine.drawGrid(this.gl, {
            x: this.gridRect.x,
            y: this.gridRect.y,
            width: this.gridRect.width,
            height: this.gridRect.height,
            rows: this.gridRows,
            cols: this.gridCols,
            lineColor: [0.7, 0.7, 0.7, 0.5],
            lineWidth: 2.0,
            camera: this.camera
        });
    }

    getGridCellWorldPosition(row, col) {
        const cellWidth = this.gridRect.width / this.gridCols;
        const cellHeight = this.gridRect.height / this.gridRows;

        const worldX = this.gridRect.x + col * cellWidth;
        const worldY = this.gridRect.y + row * cellHeight;

        return { x: worldX, y: worldY, width: cellWidth, height: cellHeight };
    }
}
