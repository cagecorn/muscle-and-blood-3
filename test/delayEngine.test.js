const test = require('node:test');
const assert = require('assert');

// js/managers/delayEngine.js 파일의 전체 내용 (테스트를 위해 직접 복사)
class DelayEngine {
    constructor() {
        this.activeDelays = new Map();
        this.nextDelayId = 0;
        this.isGlobalPaused = false;
        console.log('DelayEngine initialized.');
    }

    addDelay(callback, durationMs, id = null) {
        const delayId = id || `delay_${this.nextDelayId++}`;
        this.activeDelays.set(delayId, {
            callback: callback,
            remainingTime: durationMs,
            originalDuration: durationMs,
            isPaused: false
        });
        return delayId;
    }

    cancelDelay(id) {
        if (this.activeDelays.has(id)) {
            this.activeDelays.delete(id);
            return true;
        }
        console.warn(`Delay '${id}' not found for cancellation.`);
        return false;
    }

    update(deltaTime) {
        if (this.isGlobalPaused) {
            return;
        }
        const delaysToExecute = [];
        const delaysToRemove = [];
        this.activeDelays.forEach((delay, id) => {
            if (delay.isPaused) return;
            delay.remainingTime -= deltaTime;
            if (delay.remainingTime <= 0) {
                delaysToExecute.push(delay.callback);
                delaysToRemove.push(id);
            }
        });
        delaysToExecute.forEach(cb => {
            try {
                cb();
            } catch (e) {
                console.error('Error in delay callback:', e);
            }
        });
        delaysToRemove.forEach(id => {
            this.activeDelays.delete(id);
        });
    }

    setDelayPaused(id, pause) {
        const delay = this.activeDelays.get(id);
        if (delay) {
            delay.isPaused = pause;
            console.log(`Delay '${id}' ${pause ? 'paused' : 'resumed'}.`);
        } else {
            console.warn(`Delay '${id}' not found.`);
        }
    }

    setGlobalPaused(pause) {
        this.isGlobalPaused = pause;
        console.log(`DelayEngine: Global pause set to ${pause}.`);
    }

    get activeDelayCount() {
        return this.activeDelays.size;
    }
}


test('DelayEngine Tests', async (t) => {
    let delayEngine;

    t.beforeEach(() => {
        delayEngine = new DelayEngine();
    });

    await t.test('Constructor initializes correctly', () => {
        assert.strictEqual(delayEngine.activeDelays.size, 0, 'activeDelays map should be empty');
        assert.strictEqual(delayEngine.nextDelayId, 0, 'nextDelayId should be 0');
        assert.strictEqual(delayEngine.isGlobalPaused, false, 'isGlobalPaused should be false');
    });

    await t.test('addDelay adds a new delay', () => {
        const callback = () => {};
        const delayId = delayEngine.addDelay(callback, 1000, 'testDelay');
        assert.strictEqual(delayEngine.activeDelays.size, 1, 'Should have one active delay');
        assert.ok(delayEngine.activeDelays.has('testDelay'), 'Delay with ID should exist');
        const delay = delayEngine.activeDelays.get('testDelay');
        assert.strictEqual(delay.callback, callback, 'Callback should be stored');
        assert.strictEqual(delay.remainingTime, 1000, 'Remaining time should be set');
        assert.strictEqual(delay.originalDuration, 1000, 'Original duration should be set');
        assert.strictEqual(delay.isPaused, false, 'Delay should not be paused by default');
        assert.strictEqual(delayId, 'testDelay', 'addDelay should return the provided ID');

        const autoId = delayEngine.addDelay(callback, 500);
        assert.strictEqual(delayEngine.activeDelays.size, 2, 'Should have two active delays');
        assert.ok(delayEngine.activeDelays.has('delay_0'), 'Auto-generated ID should be correct');
        assert.strictEqual(autoId, 'delay_0', 'addDelay should return auto-generated ID');
    });

    await t.test('cancelDelay removes an existing delay', () => {
        const delayId = delayEngine.addDelay(() => {}, 1000, 'testDelay');
        assert.strictEqual(delayEngine.activeDelays.size, 1);

        const cancelled = delayEngine.cancelDelay(delayId);
        assert.strictEqual(cancelled, true, 'Should return true for successful cancellation');
        assert.strictEqual(delayEngine.activeDelays.size, 0, 'Delay should be removed');

        const notFound = delayEngine.cancelDelay('nonExistentDelay');
        assert.strictEqual(notFound, false, 'Should return false for non-existent delay');
    });

    await t.test('update executes callback and removes delay when time runs out', () => {
        const mockCallback = t.mock.fn();
        delayEngine.addDelay(mockCallback, 50);

        delayEngine.update(20); // Time not run out
        assert.strictEqual(mockCallback.mock.callCount(), 0, 'Callback should not be called yet');
        assert.strictEqual(delayEngine.activeDelays.size, 1);

        delayEngine.update(30); // Time runs out exactly
        assert.strictEqual(mockCallback.mock.callCount(), 1, 'Callback should be called once');
        assert.strictEqual(delayEngine.activeDelays.size, 0, 'Delay should be removed after execution');
    });

    await t.test('update handles multiple delays and overshooting time', () => {
        const mockCallback1 = t.mock.fn();
        const mockCallback2 = t.mock.fn();
        delayEngine.addDelay(mockCallback1, 50, 'd1');
        delayEngine.addDelay(mockCallback2, 100, 'd2');

        delayEngine.update(70); // d1 should execute, d2 should not
        assert.strictEqual(mockCallback1.mock.callCount(), 1, 'Callback 1 should be called');
        assert.strictEqual(mockCallback2.mock.callCount(), 0, 'Callback 2 should not be called');
        assert.strictEqual(delayEngine.activeDelays.size, 1, 'Only d2 should remain');
        assert.strictEqual(delayEngine.activeDelays.get('d2').remainingTime, 30, 'd2 remaining time should be 30');

        delayEngine.update(40); // d2 should execute
        assert.strictEqual(mockCallback2.mock.callCount(), 1, 'Callback 2 should be called');
        assert.strictEqual(delayEngine.activeDelays.size, 0, 'All delays should be removed');
    });

    await t.test('setDelayPaused pauses and resumes specific delays', () => {
        const mockCallback = t.mock.fn();
        const delayId = delayEngine.addDelay(mockCallback, 100, 'pDelay');

        delayEngine.setDelayPaused(delayId, true);
        delayEngine.update(60); // Should not update
        assert.strictEqual(mockCallback.mock.callCount(), 0, 'Callback should not be called when paused');
        assert.strictEqual(delayEngine.activeDelays.get(delayId).remainingTime, 100, 'Remaining time should not decrease when paused');

        delayEngine.setDelayPaused(delayId, false);
        delayEngine.update(60); // Should update
        assert.strictEqual(mockCallback.mock.callCount(), 0, 'Callback should still not be called (not enough time)');
        assert.strictEqual(delayEngine.activeDelays.get(delayId).remainingTime, 40, 'Remaining time should decrease when resumed');

        delayEngine.update(50); // Should execute
        assert.strictEqual(mockCallback.mock.callCount(), 1, 'Callback should be called after resuming and time runs out');
        assert.strictEqual(delayEngine.activeDelays.size, 0, 'Delay should be removed');
    });

    await t.test('setGlobalPaused pauses and resumes all delays', () => {
        const mockCallback1 = t.mock.fn();
        const mockCallback2 = t.mock.fn();
        delayEngine.addDelay(mockCallback1, 50, 'gd1');
        delayEngine.addDelay(mockCallback2, 100, 'gd2');

        delayEngine.setGlobalPaused(true);
        delayEngine.update(60);
        assert.strictEqual(mockCallback1.mock.callCount(), 0, 'Callback 1 should not be called when global paused');
        assert.strictEqual(mockCallback2.mock.callCount(), 0, 'Callback 2 should not be called when global paused');
        assert.strictEqual(delayEngine.activeDelays.get('gd1').remainingTime, 50, 'Remaining time should not decrease when global paused');

        delayEngine.setGlobalPaused(false);
        delayEngine.update(60);
        assert.strictEqual(mockCallback1.mock.callCount(), 1, 'Callback 1 should be called after global resume');
        assert.strictEqual(mockCallback2.mock.callCount(), 0, 'Callback 2 should not be called');
        assert.strictEqual(delayEngine.activeDelays.get('gd2').remainingTime, 40, 'Remaining time should decrease after global resume');
    });

    await t.test('activeDelayCount returns correct number of active delays', () => {
        assert.strictEqual(delayEngine.activeDelayCount, 0);
        delayEngine.addDelay(() => {}, 100);
        assert.strictEqual(delayEngine.activeDelayCount, 1);
        delayEngine.addDelay(() => {}, 200);
        assert.strictEqual(delayEngine.activeDelayCount, 2);
        delayEngine.cancelDelay('delay_0');
        assert.strictEqual(delayEngine.activeDelayCount, 1);
    });
});
