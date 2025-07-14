const test = require('node:test');
const assert = require('assert');
const MeasurementEngine = require('../js/measurementEngine.js');

class StubResolutionEngine {
  constructor() {
    this.canvas = { width: 960, height: 540 };
  }
  getInternalResolution() {
    return { width: 1920, height: 1080 };
  }
}

test('MeasurementEngine scaling functions convert values based on canvas size', () => {
  const measure = new MeasurementEngine(new StubResolutionEngine());
  assert.strictEqual(measure.getPixelX(1920), 960);
  assert.strictEqual(measure.getPixelY(1080), 540);
});
