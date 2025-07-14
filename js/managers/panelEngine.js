class PanelEngine {
    constructor(measurementEngine, renderer) {
        if (!measurementEngine || !renderer) {
            console.error("MeasurementEngine and Renderer instances are required for PanelEngine.");
            return;
        }
        this.measure = measurementEngine;
        this.renderer = renderer;
        this.panels = new Map();
        console.log('PanelEngine initialized.');
    }

    registerPanel(panelId, options = {}, requiresGL = true) {
        const canvas = document.getElementById(panelId);
        if (!canvas) {
            console.error(`PanelEngine: Canvas with ID '${panelId}' not found.`);
            return null;
        }
        let glContext = null;
        if (requiresGL) {
            glContext = canvas.getContext('webgl', { alpha: true, antialias: true });
            if (!glContext) {
                console.warn(`PanelEngine: Failed to get WebGL context for panel '${panelId}'. It will be rendered without WebGL.`);
                requiresGL = false;
            } else {
                this.renderer.addPanelContext(panelId, glContext, canvas);
            }
        }

        const panel = {
            id: panelId,
            canvas: canvas,
            gl: glContext,
            options: {
                isVisible: options.isVisible !== undefined ? options.isVisible : true,
                width: options.width || this.measure.getPanelWidth(),
                height: options.height || this.measure.getPanelHeight(),
                x: options.x || 0,
                y: options.y || 0,
                ...options
            },
            render: (gl, deltaTime) => {},
            update: (deltaTime) => {}
        };

        this.panels.set(panelId, panel);
        this._applyPanelStyle(panel);
        console.log(`Panel '${panelId}' registered. Requires GL: ${requiresGL}.`);
        return panel;
    }

    _applyPanelStyle(panel) {
        const measuredWidth = this.measure.getPixelX(panel.options.width);
        const measuredHeight = this.measure.getPixelY(panel.options.height);
        const measuredX = this.measure.getPixelX(panel.options.x);
        const measuredY = this.measure.getPixelY(panel.options.y);
        panel.canvas.style.width = `${measuredWidth}px`;
        panel.canvas.style.height = `${measuredHeight}px`;
        panel.canvas.style.left = `${measuredX}px`;
        panel.canvas.style.top = `${measuredY}px`;
        panel.canvas.style.display = panel.options.isVisible ? 'block' : 'none';
        if (panel.gl) {
            panel.canvas.width = measuredWidth * window.devicePixelRatio;
            panel.canvas.height = measuredHeight * window.devicePixelRatio;
            panel.gl.viewport(0, 0, panel.gl.drawingBufferWidth, panel.gl.drawingBufferHeight);
        }
        console.log(`Panel '${panel.id}' resized to ${measuredWidth}x${measuredHeight}`);
    }

    getPanel(panelId) {
        return this.panels.get(panelId);
    }

    setPanelVisibility(panelId, isVisible) {
        const panel = this.panels.get(panelId);
        if (panel) {
            panel.options.isVisible = isVisible;
            panel.canvas.style.display = isVisible ? 'block' : 'none';
            console.log(`Panel '${panelId}' visibility set to ${isVisible}.`);
        } else {
            console.warn(`Panel '${panelId}' not found.`);
        }
    }

    update(deltaTime) {
        this.panels.forEach(panel => {
            if (panel.options.isVisible && panel.update) {
                panel.update(deltaTime);
            }
        });
    }

    render(deltaTime) {
        this.panels.forEach(panel => {
            if (panel.options.isVisible && panel.gl && panel.render) {
                panel.gl.clearColor(0.0, 0.0, 0.0, 0.0);
                panel.gl.clear(panel.gl.COLOR_BUFFER_BIT);
                panel.render(panel.gl, deltaTime);
            }
        });
    }
}

