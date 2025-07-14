// inputManager.js

class InputManager {
    constructor(canvas) {
        if (!canvas) {
            console.error("Canvas element is required for InputManager.");
            return;
        }
        this.canvas = canvas;
        this.keys = new Set(); // 현재 눌려진 키를 저장
        this.mouse = { x: 0, y: 0, buttons: new Set() }; // 마우스 위치 및 버튼 상태
        this.touch = []; // 터치 입력 정보 (다중 터치 지원)
        this.clickListeners = []; // 외부에서 클릭을 구독할 수 있도록

        // 키보드 이벤트 리스너
        window.addEventListener('keydown', this._onKeyDown.bind(this));
        window.addEventListener('keyup', this._onKeyUp.bind(this));

        // 마우스 이벤트 리스너
        this.canvas.addEventListener('mousemove', this._onMouseMove.bind(this));
        this.canvas.addEventListener('mousedown', this._onMouseDown.bind(this));
        this.canvas.addEventListener('mouseup', this._onMouseUp.bind(this));
        this.canvas.addEventListener('click', this._onClick.bind(this));
        this.canvas.addEventListener('contextmenu', this._onContextMenu.bind(this)); // 우클릭 메뉴 방지

        // 터치 이벤트 리스너 (모바일 기기용)
        this.canvas.addEventListener('touchstart', this._onTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this._onTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this._onTouchEnd.bind(this));
        this.canvas.addEventListener('touchcancel', this._onTouchCancel.bind(this));

        console.log("InputManager initialized.");
    }

    _onKeyDown(event) {
        this.keys.add(event.code); // 'KeyW', 'Space' 등
    }

    _onKeyUp(event) {
        this.keys.delete(event.code);
    }

    _onMouseMove(event) {
        // 캔버스 내에서의 상대적인 좌표 계산
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = event.clientX - rect.left;
        this.mouse.y = event.clientY - rect.top;
    }

    _onMouseDown(event) {
        this.mouse.buttons.add(event.button); // 0: 좌클릭, 1: 휠, 2: 우클릭
    }

    _onMouseUp(event) {
        this.mouse.buttons.delete(event.button);
    }

    _onClick(event) {
        for (const listener of this.clickListeners) {
            try {
                listener(event);
            } catch (e) {
                console.error('InputManager click listener error:', e);
            }
        }
    }

    _onContextMenu(event) {
        event.preventDefault(); // 우클릭 시 컨텍스트 메뉴 방지
    }

    _onTouchStart(event) {
        event.preventDefault(); // 기본 터치 동작(스크롤, 확대/축소) 방지
        this._updateTouches(event.touches);
    }

    _onTouchMove(event) {
        event.preventDefault();
        this._updateTouches(event.touches);
    }

    _onTouchEnd(event) {
        this._updateTouches(event.touches);
    }

    _onTouchCancel(event) {
        this._updateTouches(event.touches);
    }

    _updateTouches(touchList) {
        this.touch = [];
        for (let i = 0; i < touchList.length; i++) {
            const touch = touchList[i];
            const rect = this.canvas.getBoundingClientRect();
            this.touch.push({
                id: touch.identifier,
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            });
        }
    }

    // ----------------------------------------------------
    // 게임 로직에서 입력 상태를 확인하는 메서드
    // ----------------------------------------------------

    isKeyPressed(keyCode) {
        return this.keys.has(keyCode);
    }

    isMouseButtonPressed(buttonCode) {
        return this.mouse.buttons.has(buttonCode);
    }

    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }

    getTouchPositions() {
        return this.touch;
    }

    // 다음 프레임을 위한 입력 상태 리셋 (필요시)
    resetInputState() {
        // 예를 들어, 클릭/탭 한 번만 감지해야 하는 경우 여기에 리셋 로직 추가
    }

    addClickListener(listener) {
        if (typeof listener === 'function') {
            this.clickListeners.push(listener);
        }
    }
}
