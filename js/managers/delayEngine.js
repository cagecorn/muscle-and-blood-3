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

