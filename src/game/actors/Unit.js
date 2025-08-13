export class Unit {
  constructor(scene, gridX, gridY, data, faction) {
    this.scene = scene;
    this.gridX = gridX;
    this.gridY = gridY;
    this.data = data;
    this.faction = faction;

    // 기본 스프라이트 생성
    this.sprite = scene.add.sprite(0, 0, data.sprite);
    scene.add.existing(this.sprite);

    // 초기 위치 설정
    this.move(gridX, gridY);
  }

  move(gridX, gridY) {
    this.gridX = gridX;
    this.gridY = gridY;
    const tileSize = 50; // Grid와 동일한 타일 크기 가정
    this.sprite.setPosition(gridX * tileSize, gridY * tileSize);
  }
}
