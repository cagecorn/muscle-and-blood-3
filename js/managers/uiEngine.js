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
                textAlign: options.textAlign || 'left',
                textBaseline: options.textBaseline || 'top',
                ...options
            },
            onClick: onClick
        };
        this.uiElements.set(id, element);
        console.log(`UI Element '${id}' (${type}) registered.`);
        return element;
    }

    // 새로 추가된 메서드: UI 요소 등록 해제
    unregisterUIElement(id) {
        if (this.uiElements.has(id)) {
            const element = this.uiElements.get(id);
            element.options.isVisible = false;
            this.uiElements.delete(id);
            console.log(`UI Element '${id}' unregistered.`);
            return true;
        }
        console.warn(`UI Element '${id}' not found for unregistration.`);
        return false;
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
            if (!element.options.isVisible) return;

            if (element.onClick && element.type === 'button') {
                const mousePos = this.input.getMousePosition();
                const isLeftButtonPressed = this.input.isMouseButtonPressed(0);
                const pixelX = this.measure.getPixelX(element.options.x);
                const pixelY = this.measure.getPixelY(element.options.y);
                const pixelWidth = this.measure.getPixelX(element.options.width);
                const pixelHeight = this.measure.getPixelY(element.options.height);

                const isHovering = mousePos.x >= pixelX && mousePos.x <= pixelX + pixelWidth &&
                                   mousePos.y >= pixelY && mousePos.y <= pixelY + pixelHeight;

                if (isHovering && isLeftButtonPressed) {
                    element.onClick();
                }
            }
        });
    }

    render(gl, deltaTime) {
        this.uiElements.forEach(element => {
            if (!element.options.isVisible) return;

            const pixelX = this.measure.getPixelX(element.options.x);
            const pixelY = this.measure.getPixelY(element.options.y);
            const pixelWidth = this.measure.getPixelX(element.options.width);
            const pixelHeight = this.measure.getPixelY(element.options.height);

            if (element.type === 'button') {
                gl.renderer.drawColorRect(gl, pixelX, pixelY, pixelWidth, pixelHeight,
                    this._hexToRgbA(element.options.color), null);
            } else if (element.type === 'text') {
                const ctx = gl.canvas.getContext('2d');
                if (ctx) {
                    ctx.font = `${element.options.fontSize}px Arial`;
                    ctx.fillStyle = element.options.color;
                    ctx.textAlign = element.options.textAlign;
                    ctx.textBaseline = element.options.textBaseline;

                    let textX = pixelX;
                    let textY = pixelY;

                    if (element.options.textAlign === 'center') textX += pixelWidth / 2;
                    else if (element.options.textAlign === 'right') textX += pixelWidth;

                    if (element.options.textBaseline === 'middle') textY += pixelHeight / 2;
                    else if (element.options.textBaseline === 'bottom') textY += pixelHeight;

                    ctx.fillText(element.options.text, textX, textY);
                }
            }
        });
    }

    // 헬퍼 함수: 헥스 색상을 RGBA 배열로 변환
    _hexToRgbA(hex) {
        let c;
        if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
            c= hex.substring(1).split('');
            if(c.length===3){
                c= [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c= '0x'+c.join('');
            return [(c>>16)&255, (c>>8)&255, c&255, 1].map(x=>x/255);
        }
        return [1,1,1,1];
    }
}

