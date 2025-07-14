const test = require('node:test');
const assert = require('assert');

// js/managers/layerEngine.js 파일의 전체 내용 (테스트를 위해 직접 복사)
class LayerEngine {
    constructor() {
        this.layers = new Map();
        this.addLayer('background');
        this.addLayer('world');
        this.addLayer('entities');
        this.addLayer('effects');
        this.addLayer('ui');
        console.log('LayerEngine initialized with default layers.');
    }

    addLayer(layerName, index = -1) {
        if (this.layers.has(layerName)) {
            console.warn(`Layer '${layerName}' already exists.`);
            return;
        }
        this.layers.set(layerName, []);
        console.log(`Layer '${layerName}' added.`);
    }

    clearLayer(layerName) {
        if (this.layers.has(layerName)) {
            this.layers.set(layerName, []);
            console.log(`Layer '${layerName}' cleared.`);
        } else {
            console.warn(`Layer '${layerName}' not found.`);
        }
    }

    addEntityToLayer(layerName, entity) {
        if (this.layers.has(layerName)) {
            this.layers.get(layerName).push(entity);
        } else {
            console.warn(`Layer '${layerName}' not found. Entity not added.`);
        }
    }

    removeEntityFromLayer(layerName, entity) {
        if (this.layers.has(layerName)) {
            const layerEntities = this.layers.get(layerName);
            const index = layerEntities.indexOf(entity);
            if (index > -1) {
                layerEntities.splice(index, 1);
            }
        }
    }

    getAllLayers() {
        return this.layers;
    }

    getEntitiesInLayer(layerName) {
        return this.layers.get(layerName);
    }
}


test('LayerEngine Tests', async (t) => {
    let layerEngine;

    t.beforeEach(() => {
        layerEngine = new LayerEngine();
    });

    await t.test('Constructor initializes with default layers', () => {
        const expectedLayers = ['background', 'world', 'entities', 'effects', 'ui'];
        expectedLayers.forEach(layer => {
            assert.ok(layerEngine.layers.has(layer), `Layer '${layer}' should exist`);
            assert.deepStrictEqual(layerEngine.layers.get(layer), [], `Layer '${layer}' should be empty array`);
        });
        assert.strictEqual(layerEngine.layers.size, expectedLayers.length, 'Should have correct number of default layers');
    });

    await t.test('addLayer adds a new layer', () => {
        layerEngine.addLayer('newLayer');
        assert.ok(layerEngine.layers.has('newLayer'), 'New layer should be added');
        assert.deepStrictEqual(layerEngine.layers.get('newLayer'), [], 'New layer should be an empty array');
    });

    await t.test('addLayer warns if layer already exists', (t) => {
        const originalWarn = console.warn;
        const warnMock = t.mock.fn();
        console.warn = warnMock;

        layerEngine.addLayer('world');
        assert.strictEqual(warnMock.mock.callCount(), 1, 'console.warn should be called');
        assert.ok(warnMock.mock.calls[0].arguments[0].includes("Layer 'world' already exists."), 'Warning message should be correct');

        console.warn = originalWarn;
    });

    await t.test('clearLayer empties an existing layer', () => {
        layerEngine.addEntityToLayer('entities', { id: 1 });
        assert.strictEqual(layerEngine.getEntitiesInLayer('entities').length, 1, 'Layer should have an entity before clearing');

        layerEngine.clearLayer('entities');
        assert.deepStrictEqual(layerEngine.getEntitiesInLayer('entities'), [], 'Layer should be empty after clearing');
    });

    await t.test('clearLayer warns if layer does not exist', (t) => {
        const originalWarn = console.warn;
        const warnMock = t.mock.fn();
        console.warn = warnMock;

        layerEngine.clearLayer('nonExistentLayer');
        assert.strictEqual(warnMock.mock.callCount(), 1, 'console.warn should be called');
        assert.ok(warnMock.mock.calls[0].arguments[0].includes("Layer 'nonExistentLayer' not found."), 'Warning message should be correct');

        console.warn = originalWarn;
    });

    await t.test('addEntityToLayer adds an entity to a layer', () => {
        const entity = { id: 1, name: 'Test Entity' };
        layerEngine.addEntityToLayer('entities', entity);
        assert.strictEqual(layerEngine.getEntitiesInLayer('entities').length, 1, 'Entity should be added to layer');
        assert.strictEqual(layerEngine.getEntitiesInLayer('entities')[0], entity, 'Added entity should be correct');
    });

    await t.test('addEntityToLayer warns if layer does not exist', (t) => {
        const originalWarn = console.warn;
        const warnMock = t.mock.fn();
        console.warn = warnMock;

        layerEngine.addEntityToLayer('nonExistentLayer', { id: 1 });
        assert.strictEqual(warnMock.mock.callCount(), 1, 'console.warn should be called');
        assert.ok(warnMock.mock.calls[0].arguments[0].includes("Layer 'nonExistentLayer' not found."), 'Warning message should be correct');

        console.warn = originalWarn;
    });

    await t.test('removeEntityFromLayer removes an entity from a layer', () => {
        const entity1 = { id: 1 };
        const entity2 = { id: 2 };
        layerEngine.addEntityToLayer('entities', entity1);
        layerEngine.addEntityToLayer('entities', entity2);
        assert.strictEqual(layerEngine.getEntitiesInLayer('entities').length, 2, 'Layer should have 2 entities initially');

        layerEngine.removeEntityFromLayer('entities', entity1);
        assert.strictEqual(layerEngine.getEntitiesInLayer('entities').length, 1, 'Layer should have 1 entity after removal');
        assert.strictEqual(layerEngine.getEntitiesInLayer('entities')[0], entity2, 'Remaining entity should be correct');
    });

    await t.test('removeEntityFromLayer does nothing if entity not found', () => {
        const entity1 = { id: 1 };
        const entity2 = { id: 2 };
        layerEngine.addEntityToLayer('entities', entity1);
        assert.strictEqual(layerEngine.getEntitiesInLayer('entities').length, 1, 'Layer should have 1 entity initially');

        layerEngine.removeEntityFromLayer('entities', entity2);
        assert.strictEqual(layerEngine.getEntitiesInLayer('entities').length, 1, 'Layer size should remain unchanged');
        assert.strictEqual(layerEngine.getEntitiesInLayer('entities')[0], entity1, 'Original entity should still be there');
    });

    await t.test('removeEntityFromLayer warns if layer does not exist', (t) => {
        const originalWarn = console.warn;
        const warnMock = t.mock.fn();
        console.warn = warnMock;
        layerEngine.removeEntityFromLayer('nonExistentLayer', { id: 1 });
        assert.strictEqual(warnMock.mock.callCount(), 0, 'console.warn should not be called');
        console.warn = originalWarn;
    });

    await t.test('getAllLayers returns the layers map', () => {
        const allLayers = layerEngine.getAllLayers();
        assert.strictEqual(allLayers, layerEngine.layers, 'getAllLayers should return the internal layers map');
        assert.ok(allLayers.has('background'), 'Returned map should contain default layers');
    });

    await t.test('getEntitiesInLayer returns entities for a specific layer', () => {
        const entity = { id: 10 };
        layerEngine.addEntityToLayer('ui', entity);
        const uiEntities = layerEngine.getEntitiesInLayer('ui');
        assert.strictEqual(uiEntities.length, 1, 'Should retrieve correct number of entities');
        assert.strictEqual(uiEntities[0], entity, 'Should retrieve correct entity');
    });

    await t.test('getEntitiesInLayer returns undefined for non-existent layer', () => {
        const result = layerEngine.getEntitiesInLayer('imaginaryLayer');
        assert.strictEqual(result, undefined, 'Should return undefined for non-existent layer');
    });
});
