const test = require('node:test');
const assert = require('assert');

// GameEngine 스텁
class StubGameEngine {
    constructor() {
        this.gameState = {};
    }
}

// js/managers/turnEngine.js 파일의 전체 내용 (테스트를 위해 직접 복사)
class TurnEngine {
    constructor(gameEngine) {
        if (!gameEngine) {
            console.error("GameEngine instance is required for TurnEngine.");
            return;
        }
        this.gameEngine = gameEngine;
        this.currentTurn = 0;
        this.currentRound = 0;
        this.activeUnit = null;
        this.turnOrder = [];
        this.isTurnInProgress = false;
        this.onTurnStartCallbacks = [];
        this.onTurnEndCallbacks = [];
        console.log('TurnEngine initialized.');
    }

    startNewRound(units) {
        this.currentRound++;
        this.currentTurn = 0;
        this.turnOrder = this._calculateTurnOrder(units);
        this.isTurnInProgress = true;
        this.nextTurn();
        console.log(`TurnEngine: Starting Round ${this.currentRound}.`);
    }

    _calculateTurnOrder(units) {
        const sortedUnits = [...units].sort((a, b) => {
            const aSpeed = a.baseStats ? a.baseStats.speed : 0;
            const bSpeed = b.baseStats ? b.baseStats.speed : 0;
            return bSpeed - aSpeed;
        });
        return sortedUnits;
    }

    nextTurn() {
        if (!this.isTurnInProgress) {
            console.warn('TurnEngine: Cannot advance turn, no turn in progress.');
            return;
        }
        this.currentTurn++;
        if (this.turnOrder.length > 0) {
            this.activeUnit = this.turnOrder.shift();
            this.turnOrder.push(this.activeUnit);
            console.log(`TurnEngine: Turn ${this.currentTurn} - ${this.activeUnit.name} (ID: ${this.activeUnit.id})'s turn.`);
            this._triggerTurnStart();
        } else {
            console.log('TurnEngine: No units in turn order. Ending round or combat.');
            this.endRound();
        }
    }

    endCurrentUnitTurn() {
        if (!this.activeUnit) return;
        console.log(`TurnEngine: ${this.activeUnit.name}'s turn ended.`);
        this._applyTurnBasedEffects(this.activeUnit); // Placeholder for actual effect logic
        this.activeUnit = null;
        this._triggerTurnEnd();
        this.nextTurn();
    }

    endRound() {
        this.isTurnInProgress = false;
        console.log(`TurnEngine: Round ${this.currentRound} ended.`);
    }

    onTurnStart(callback) {
        this.onTurnStartCallbacks.push(callback);
    }

    onTurnEnd(callback) {
        this.onTurnEndCallbacks.push(callback);
    }

    _triggerTurnStart() {
        this.onTurnStartCallbacks.forEach(callback => {
            try {
                callback(this.activeUnit, this.currentTurn, this.currentRound);
            } catch (e) {
                console.error('Error in onTurnStart callback:', e);
            }
        });
    }

    _triggerTurnEnd() {
        this.onTurnEndCallbacks.forEach(callback => {
            try {
                callback(this.activeUnit, this.currentTurn, this.currentRound);
            } catch (e) {
                console.error('Error in onTurnEnd callback:', e);
            }
        });
    }

    _applyTurnBasedEffects(unit) {
        // TODO: implement status effect logic
    }

    getTurnInfo() {
        return {
            currentTurn: this.currentTurn,
            currentRound: this.currentRound,
            activeUnit: this.activeUnit ? this.activeUnit.id : null,
            isTurnInProgress: this.isTurnInProgress
        };
    }
}


test('TurnEngine Tests', async (t) => {
    let turnEngine;
    let mockGameEngine;

    t.beforeEach(() => {
        mockGameEngine = new StubGameEngine();
        turnEngine = new TurnEngine(mockGameEngine);
    });

    await t.test('Constructor initializes correctly with GameEngine', () => {
        assert.ok(turnEngine.gameEngine, 'GameEngine should be set');
        assert.strictEqual(turnEngine.currentTurn, 0, 'currentTurn should be 0');
        assert.strictEqual(turnEngine.currentRound, 0, 'currentRound should be 0');
        assert.strictEqual(turnEngine.activeUnit, null, 'activeUnit should be null');
        assert.deepStrictEqual(turnEngine.turnOrder, [], 'turnOrder should be empty');
        assert.strictEqual(turnEngine.isTurnInProgress, false, 'isTurnInProgress should be false');
    });

    await t.test('Constructor logs error if GameEngine is missing', () => {
        const originalError = console.error;
        const errorMock = t.mock.fn();
        console.error = errorMock;

        new TurnEngine(null);
        assert.strictEqual(errorMock.mock.callCount(), 1, 'console.error should be called');
        assert.ok(errorMock.mock.calls[0].arguments[0].includes("GameEngine instance is required for TurnEngine."), 'Error message should be correct');

        console.error = originalError;
    });

    await t.test('_calculateTurnOrder sorts units by speed descending', () => {
        const units = [
            { id: 'u1', name: 'Fast Unit', baseStats: { speed: 10 } },
            { id: 'u2', name: 'Slow Unit', baseStats: { speed: 5 } },
            { id: 'u3', name: 'Medium Unit', baseStats: { speed: 7 } },
            { id: 'u4', name: 'No Speed Unit', baseStats: {} },
            { id: 'u5', name: 'Null Stats Unit', baseStats: null }
        ];
        const sorted = turnEngine._calculateTurnOrder(units);
        assert.deepStrictEqual(sorted.map(u => u.id), ['u1', 'u3', 'u2', 'u4', 'u5'], 'Units should be sorted by speed descending');
    });

    await t.test('startNewRound initializes round and turn order, then calls nextTurn', () => {
        const units = [{ id: 'u1', name: 'Unit 1', baseStats: { speed: 10 } }];
        const originalNextTurn = turnEngine.nextTurn;
        const nextTurnSpy = t.mock.fn();
        turnEngine.nextTurn = nextTurnSpy; // Temporarily replace without running original

        turnEngine.startNewRound(units);

        assert.strictEqual(turnEngine.currentRound, 1, 'currentRound should increment');
        assert.strictEqual(turnEngine.currentTurn, 0, 'currentTurn should reset to 0');
        assert.strictEqual(turnEngine.isTurnInProgress, true, 'isTurnInProgress should be true');
        assert.strictEqual(turnEngine.turnOrder.length, 1, 'Turn order should be set');
        assert.strictEqual(nextTurnSpy.mock.callCount(), 1, 'nextTurn should be called once');

        turnEngine.nextTurn = originalNextTurn; // Restore original
    });

    await t.test('nextTurn advances turn, sets activeUnit, and loops turnOrder', () => {
        const unit1 = { id: 'u1', name: 'Unit 1', baseStats: { speed: 10 } };
        const unit2 = { id: 'u2', name: 'Unit 2', baseStats: { speed: 5 } };
        turnEngine.turnOrder = [unit1, unit2];
        turnEngine.isTurnInProgress = true;
        const triggerTurnStartSpy = t.mock.fn(turnEngine._triggerTurnStart.bind(turnEngine));
        turnEngine._triggerTurnStart = triggerTurnStartSpy;

        turnEngine.nextTurn();
        assert.strictEqual(turnEngine.currentTurn, 1, 'currentTurn should be 1');
        assert.strictEqual(turnEngine.activeUnit, unit1, 'Unit 1 should be active');
        assert.deepStrictEqual(turnEngine.turnOrder.map(u => u.id), ['u2', 'u1'], 'Turn order should loop');
        assert.strictEqual(triggerTurnStartSpy.mock.callCount(), 1, '_triggerTurnStart should be called');

        triggerTurnStartSpy.mock.resetCalls();
        turnEngine.nextTurn();
        assert.strictEqual(turnEngine.currentTurn, 2, 'currentTurn should be 2');
        assert.strictEqual(turnEngine.activeUnit, unit2, 'Unit 2 should be active');
        assert.deepStrictEqual(turnEngine.turnOrder.map(u => u.id), ['u1', 'u2'], 'Turn order should loop again');
        assert.strictEqual(triggerTurnStartSpy.mock.callCount(), 1, '_triggerTurnStart should be called again');

        turnEngine._triggerTurnStart = triggerTurnStartSpy.mock.original; // Restore
    });

    await t.test('nextTurn ends round if no units in turn order', () => {
        turnEngine.turnOrder = [];
        turnEngine.isTurnInProgress = true;
        const endRoundSpy = t.mock.fn(turnEngine.endRound.bind(turnEngine));
        turnEngine.endRound = endRoundSpy;

        turnEngine.nextTurn();
        assert.strictEqual(endRoundSpy.mock.callCount(), 1, 'endRound should be called');
        assert.strictEqual(turnEngine.currentTurn, 1, 'currentTurn should increment even if no units');

        turnEngine.endRound = endRoundSpy.mock.original; // Restore
    });

    await t.test('endCurrentUnitTurn applies effects, clears activeUnit, triggers callbacks, and calls nextTurn', () => {
        const unit = { id: 'u1', name: 'Unit 1' };
        turnEngine.activeUnit = unit;
        turnEngine.currentTurn = 1; // Simulate an active turn
        turnEngine.isTurnInProgress = true;

        const applyEffectsSpy = t.mock.fn(turnEngine._applyTurnBasedEffects.bind(turnEngine));
        const triggerTurnEndSpy = t.mock.fn(turnEngine._triggerTurnEnd.bind(turnEngine));
        const nextTurnSpy = t.mock.fn(turnEngine.nextTurn.bind(turnEngine));

        turnEngine._applyTurnBasedEffects = applyEffectsSpy;
        turnEngine._triggerTurnEnd = triggerTurnEndSpy;
        turnEngine.nextTurn = nextTurnSpy;

        turnEngine.endCurrentUnitTurn();

        assert.strictEqual(applyEffectsSpy.mock.callCount(), 1, '_applyTurnBasedEffects should be called');
        assert.strictEqual(applyEffectsSpy.mock.calls[0].arguments[0], unit, 'Active unit passed to applyEffects');
        assert.strictEqual(turnEngine.activeUnit, null, 'activeUnit should be nullified');
        assert.strictEqual(triggerTurnEndSpy.mock.callCount(), 1, '_triggerTurnEnd should be called');
        assert.strictEqual(nextTurnSpy.mock.callCount(), 1, 'nextTurn should be called');

        turnEngine._applyTurnBasedEffects = applyEffectsSpy.mock.original; // Restore
        turnEngine._triggerTurnEnd = triggerTurnEndSpy.mock.original;
        turnEngine.nextTurn = nextTurnSpy.mock.original;
    });

    await t.test('endRound sets isTurnInProgress to false', () => {
        turnEngine.isTurnInProgress = true;
        turnEngine.endRound();
        assert.strictEqual(turnEngine.isTurnInProgress, false, 'isTurnInProgress should be false');
    });

    await t.test('onTurnStart and onTurnEnd register and trigger callbacks', () => {
        const startCallback1 = t.mock.fn();
        const startCallback2 = t.mock.fn();
        const endCallback = t.mock.fn();

        turnEngine.onTurnStart(startCallback1);
        turnEngine.onTurnStart(startCallback2);
        turnEngine.onTurnEnd(endCallback);

        assert.strictEqual(turnEngine.onTurnStartCallbacks.length, 2, 'Two start callbacks registered');
        assert.strictEqual(turnEngine.onTurnEndCallbacks.length, 1, 'One end callback registered');

        // Simulate a turn start
        turnEngine.activeUnit = { id: 'u1', name: 'TestUnit' };
        turnEngine.currentTurn = 1;
        turnEngine.currentRound = 1;
        turnEngine._triggerTurnStart();
        assert.strictEqual(startCallback1.mock.callCount(), 1, 'First start callback called');
        assert.deepStrictEqual(startCallback1.mock.calls[0].arguments, [{ id: 'u1', name: 'TestUnit' }, 1, 1], 'Start callback arguments correct');
        assert.strictEqual(startCallback2.mock.callCount(), 1, 'Second start callback called');

        // Simulate a turn end
        turnEngine._triggerTurnEnd();
        assert.strictEqual(endCallback.mock.callCount(), 1, 'End callback called');
        assert.deepStrictEqual(endCallback.mock.calls[0].arguments, [{ id: 'u1', name: 'TestUnit' }, 1, 1], 'End callback arguments correct');
    });

    await t.test('getTurnInfo returns current turn details', () => {
        turnEngine.currentTurn = 5;
        turnEngine.currentRound = 2;
        turnEngine.activeUnit = { id: 'active_u' };
        turnEngine.isTurnInProgress = true;

        const info = turnEngine.getTurnInfo();
        assert.deepStrictEqual(info, {
            currentTurn: 5,
            currentRound: 2,
            activeUnit: 'active_u',
            isTurnInProgress: true
        }, 'Turn info should be correct');

        turnEngine.activeUnit = null;
        const infoWithoutActive = turnEngine.getTurnInfo();
        assert.strictEqual(infoWithoutActive.activeUnit, null, 'activeUnit should be null if no unit is active');
    });
});
