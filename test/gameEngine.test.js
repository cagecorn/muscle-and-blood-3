const test = require('node:test');
const assert = require('assert');

// MeasurementEngine 스텁
class StubMeasurementEngine {
    constructor() {
        this.internalResolution = { width: 1920, height: 1080 };
    }
    getInternalResolution() { return this.internalResolution; }
    getPixelX(val) { return val; }
    getPixelY(val) { return val; }
    getPixelSize(val) { return val; }
    getFontSizeMedium() { return 24; }
}

// js/gameEngine.js 파일의 전체 내용 (테스트를 위해 직접 복사)
class GameEngine {
    constructor(measurementEngine) {
        if (!measurementEngine) {
            console.error("MeasurementEngine instance is required for GameEngine.");
            return;
        }
        this.measure = measurementEngine;
        this.entities = [];
        this.gameState = {
            currentMap: null,
            player: null,
            activeCombat: null,
        };

        console.log("GameEngine initialized.");
    }

    update(deltaTime) {
        this.entities.forEach(entity => {
            if (entity.update) {
                entity.update(deltaTime);
            }
        });
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    removeEntity(entity) {
        this.entities = this.entities.filter(e => e !== entity);
    }

    getGameState() {
        return this.gameState;
    }

    initializeGame() {
        console.log("Game initialized and ready to start!");
    }

    getMeasurementEngine() {
        return this.measure;
    }
}


test('GameEngine Tests', async (t) => {
    let gameEngine;
    let mockMeasurementEngine;

    t.beforeEach(() => {
        mockMeasurementEngine = new StubMeasurementEngine();
        gameEngine = new GameEngine(mockMeasurementEngine);
    });

    await t.test('Constructor initializes correctly with MeasurementEngine', () => {
        assert.ok(gameEngine.measure, 'MeasurementEngine should be set');
        assert.deepStrictEqual(gameEngine.entities, [], 'Entities array should be empty initially');
        assert.deepStrictEqual(gameEngine.gameState, { currentMap: null, player: null, activeCombat: null }, 'Initial game state should be correct');
    });

    await t.test('Constructor logs error if MeasurementEngine is missing', () => {
        const originalError = console.error;
        const errorMock = t.mock.fn();
        console.error = errorMock;

        new GameEngine(null);
        assert.strictEqual(errorMock.mock.callCount(), 1, 'console.error should be called');
        assert.ok(errorMock.mock.calls[0].arguments[0].includes("MeasurementEngine instance is required for GameEngine."), 'Error message should be correct');

        console.error = originalError;
    });

    await t.test('addEntity correctly adds entities', () => {
        const entity1 = { id: 'e1' };
        const entity2 = { id: 'e2' };

        gameEngine.addEntity(entity1);
        assert.strictEqual(gameEngine.entities.length, 1, 'Entities array should have 1 entity');
        assert.strictEqual(gameEngine.entities[0], entity1, 'First entity should be added');

        gameEngine.addEntity(entity2);
        assert.strictEqual(gameEngine.entities.length, 2, 'Entities array should have 2 entities');
        assert.strictEqual(gameEngine.entities[1], entity2, 'Second entity should be added');
    });

    await t.test('removeEntity correctly removes entities', () => {
        const entity1 = { id: 'e1' };
        const entity2 = { id: 'e2' };
        gameEngine.addEntity(entity1);
        gameEngine.addEntity(entity2);

        gameEngine.removeEntity(entity1);
        assert.strictEqual(gameEngine.entities.length, 1, 'Entities array should have 1 entity after removal');
        assert.strictEqual(gameEngine.entities[0], entity2, 'Only entity2 should remain');

        gameEngine.removeEntity(entity2);
        assert.strictEqual(gameEngine.entities.length, 0, 'Entities array should be empty after all removals');
    });

    await t.test('removeEntity does nothing if entity not found', () => {
        const entity1 = { id: 'e1' };
        const entity2 = { id: 'e2' };
        gameEngine.addEntity(entity1);

        gameEngine.removeEntity(entity2); // entity2 does not exist
        assert.strictEqual(gameEngine.entities.length, 1, 'Entities array size should not change');
        assert.strictEqual(gameEngine.entities[0], entity1, 'Entity1 should still be present');
    });

    await t.test('update calls update method on each entity', () => {
        const mockEntity1 = { update: t.mock.fn() };
        const mockEntity2 = { update: t.mock.fn() };
        const entityNoUpdate = { id: 'noUpdate' };

        gameEngine.addEntity(mockEntity1);
        gameEngine.addEntity(mockEntity2);
        gameEngine.addEntity(entityNoUpdate);

        const deltaTime = 16.67;
        gameEngine.update(deltaTime);

        assert.strictEqual(mockEntity1.update.mock.callCount(), 1, 'mockEntity1.update should be called once');
        assert.strictEqual(mockEntity1.update.mock.calls[0].arguments[0], deltaTime, 'mockEntity1.update should receive deltaTime');
        assert.strictEqual(mockEntity2.update.mock.callCount(), 1, 'mockEntity2.update should be called once');
        assert.strictEqual(mockEntity2.update.mock.calls[0].arguments[0], deltaTime, 'mockEntity2.update should receive deltaTime');
    });

    await t.test('getGameState returns the current game state', () => {
        const initialState = gameEngine.getGameState();
        assert.deepStrictEqual(initialState, { currentMap: null, player: null, activeCombat: null }, 'Initial game state should be returned');

        gameEngine.gameState.currentMap = 'forest';
        gameEngine.gameState.player = { name: 'Hero' };
        const updatedState = gameEngine.getGameState();
        assert.deepStrictEqual(updatedState, { currentMap: 'forest', player: { name: 'Hero' }, activeCombat: null }, 'Updated game state should be returned');
    });

    await t.test('initializeGame logs a message', () => {
        const originalLog = console.log;
        const logMock = t.mock.fn();
        console.log = logMock;

        gameEngine.initializeGame();
        assert.strictEqual(logMock.mock.callCount(), 1, 'console.log should be called');
        assert.ok(logMock.mock.calls[0].arguments[0].includes("Game initialized and ready to start!"), 'Initialization message should be logged');

        console.log = originalLog;
    });

    await t.test('getMeasurementEngine returns the correct instance', () => {
        const retrievedEngine = gameEngine.getMeasurementEngine();
        assert.strictEqual(retrievedEngine, mockMeasurementEngine, 'Should return the same MeasurementEngine instance');
    });
});
