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
        this._applyTurnBasedEffects(this.activeUnit);
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

