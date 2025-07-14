class UIEngine {
    constructor(measurementEngine, inputManager) {
        if (!measurementEngine || !inputManager) {
            console.error("MeasurementEngine and InputManager instances are required for UIEngine.");
            return;
        }
        this.measure = measurementEngine;
        this.input = inputManager;
        this.uiElements = new Map();
        console.log('UIEngine initialized.');
    }

    registerUIElement(id, type, options, onClick = null) {
        const element = {
            id: id,
            type: type,
            options: {
                x: options.x || 0,
                y: options.y || 0,
                width: options.width || 0,
                height: options.height || 0,
                text: options.text || '',
                src: options.src || '',
                fontSize: options.fontSize || this.measure.getFontSizeMedium(),
                color: options.color || '#FFFFFF',
                isVisible: options.isVisible !== undefined ? options.isVisible : true,
                ...options
            },
            onClick: onClick
        };
        this.uiElements.set(id, element);
        console.log(`UI Element '${id}' (${type}) registered.`);
        return element;
    }

    getUIElement(id) {
        return this.uiElements.get(id);
    }

    setElementVisibility(id, isVisible) {
        const element = this.uiElements.get(id);
        if (element) {
            element.options.isVisible = isVisible;
        } else {
            console.warn(`UI Element '${id}' not found.`);
        }
    }

    updateElementText(id, newText) {
        const element = this.uiElements.get(id);
        if (element && element.type === 'text') {
            element.options.text = newText;
        } else {
            console.warn(`UI Element '${id}' not found or is not a text type.`);
        }
    }

    update(deltaTime) {
        this.uiElements.forEach(element => {
            if (element.options.isVisible) {
                if (element.onClick) {
                    const mousePos = this.input.getMousePosition();
                    const isLeftButtonPressed = this.input.isMouseButtonPressed(0);
                    const pixelX = this.measure.getPixelX(element.options.x);
                    const pixelY = this.measure.getPixelY(element.options.y);
                    const pixelWidth = this.measure.getPixelX(element.options.width);
                    const pixelHeight = this.measure.getPixelY(element.options.height);
                    const isHovering = mousePos.x >= pixelX && mousePos.x <= pixelX + pixelWidth && mousePos.y >= pixelY && mousePos.y <= pixelY + pixelHeight;
                    if (isHovering && isLeftButtonPressed) {
                        // element.onClick();
                    }
                }
            }
        });
    }

    render(gl, deltaTime) {
        this.uiElements.forEach(element => {
            if (element.options.isVisible) {
                const pixelX = this.measure.getPixelX(element.options.x);
                const pixelY = this.measure.getPixelY(element.options.y);
                const pixelWidth = this.measure.getPixelX(element.options.width);
                const pixelHeight = this.measure.getPixelY(element.options.height);
                // Placeholder for actual rendering logic
            }
        });
    }
}

