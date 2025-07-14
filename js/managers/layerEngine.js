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

