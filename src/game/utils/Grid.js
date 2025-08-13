export class Grid {
  constructor(scene, columns, rows, tileSize) {
    this.scene = scene;
    this.columns = columns;
    this.rows = rows;
    this.tileSize = tileSize;
  }

  add(sprite, gridX, gridY) {
    sprite.setPosition(gridX * this.tileSize, gridY * this.tileSize);
  }

  getGridPosition(x, y) {
    return {
      gridX: Math.floor(x / this.tileSize),
      gridY: Math.floor(y / this.tileSize),
    };
  }
}
