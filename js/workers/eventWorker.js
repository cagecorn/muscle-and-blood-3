// workers/eventWorker.js

// 이 스크립트는 Shared Worker로 실행됩니다.
// 여러 클라이언트(예: 여러 탭, 또는 게임 내 여러 JS 모듈)가 이 워커에 연결할 수 있습니다.

// 연결된 모든 포트(클라이언트)를 저장할 배열
const connectedPorts = [];

// 새로운 클라이언트가 워커에 연결될 때마다 실행됩니다.
self.onconnect = function(event) {
    const port = event.ports[0]; // 연결된 클라이언트의 메시지 포트
    connectedPorts.push(port); // 포트 배열에 추가

    console.log(`EventWorker: New client connected. Total connections: ${connectedPorts.length}`);

    // 해당 포트를 통해 메시지를 받을 때
    port.onmessage = function(messageEvent) {
        const { type, payload } = messageEvent.data;
        console.log(`EventWorker: Received message from client (${port._portId || 'unknown'}):`, type, payload);

        // --- 이벤트 처리 및 다른 클라이언트로 브로드캐스팅 로직 구현 ---
        // 받은 이벤트를 모든 연결된 클라이언트에 브로드캐스팅합니다.
        connectedPorts.forEach(otherPort => {
            if (otherPort !== port) { // 메시지를 보낸 자신을 제외하고
                otherPort.postMessage({ type: type, payload: payload });
            } else {
                // 메시지를 보낸 클라이언트에게 응답이 필요한 경우 여기에 추가
                // 예: port.postMessage({ type: 'ACK', status: 'received' });
            }
        });

        // 특정 이벤트 타입에 따른 추가 로직
        if (type === 'GAME_STATE_CHANGE') {
            console.log(`EventWorker: Game state changed to: ${payload.state}`);
            // 필요하다면 여기서 게임 상태 변화를 기록하거나,
            // 특정 상태 변화에만 반응하는 다른 워커(예: 세이브 워커)에 메시지를 보낼 수 있습니다.
        } else if (type === 'UI_BUTTON_CLICKED') {
            console.log(`EventWorker: UI Button '${payload.buttonId}' clicked.`);
            // UI 상호작용 로깅 등
        }
        // 기타 이벤트 타입에 따른 처리...
    };

    // 워커가 클라이언트의 포트 연결을 끊을 때
    port.onclose = function() {
        // 배열에서 해당 포트 제거
        const index = connectedPorts.indexOf(port);
        if (index > -1) {
            connectedPorts.splice(index, 1);
        }
        console.log(`EventWorker: Client disconnected. Remaining connections: ${connectedPorts.length}`);
    };

    // (옵션) 클라이언트에게 초기 메시지 전송
    port.postMessage({ type: 'WORKER_READY', message: 'EventWorker is ready!' });
};

console.log('EventWorker initialized.');
