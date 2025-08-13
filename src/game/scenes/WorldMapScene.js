// src/game/scenes/WorldMapScene.js

// Vite 없이 실행할 수 있도록 phaser ESM을 직접 참조합니다.
import { Scene } from 'https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.esm.js';
import { Grid } from "../utils/Grid";
import { Unit } from "../actors/Unit";
import { units as unitData } from "../data/units";

export class WorldMapScene extends Scene {
  constructor() {
    super("WorldMapScene");
  }

  create() {
    this.grid = new Grid(this, 30, 20, 50);
    this.units = []; // 모든 유닛을 관리할 배열

    // 아군 지휘관 생성
    const player = new Unit(this, 5, 10, unitData.player, "player");
    this.playerUnit = player; // 플레이어 유닛은 따로 관리하여 조작
    this.units.push(player);
    this.grid.add(player.sprite, 5, 10);

    // 적군 지휘관 생성
    const enemyCommander = new Unit(
      this,
      25,
      10,
      unitData.enemyCommander,
      "enemy"
    );
    this.units.push(enemyCommander);
    this.grid.add(enemyCommander.sprite, 25, 10);

    // 용병 생성 (2명씩)
    const alliedMerc1 = new Unit(
      this,
      5,
      12,
      unitData.alliedMercenary,
      "player"
    );
    this.units.push(alliedMerc1);
    this.grid.add(alliedMerc1.sprite, 5, 12);

    const alliedMerc2 = new Unit(
      this,
      7,
      12,
      unitData.alliedMercenary,
      "player"
    );
    this.units.push(alliedMerc2);
    this.grid.add(alliedMerc2.sprite, 7, 12);

    const enemyMerc1 = new Unit(
      this,
      23,
      12,
      unitData.enemyMercenary,
      "enemy"
    );
    this.units.push(enemyMerc1);
    this.grid.add(enemyMerc1.sprite, 23, 12);

    const enemyMerc2 = new Unit(
      this,
      25,
      12,
      unitData.enemyMercenary,
      "enemy"
    );
    this.units.push(enemyMerc2);
    this.grid.add(enemyMerc2.sprite, 25, 12);

    // 플레이어 이동 로직
    this.input.on("pointerdown", (pointer) => {
      const { gridX, gridY } = this.grid.getGridPosition(pointer.x, pointer.y);
      this.playerUnit.move(gridX, gridY);

      // STEP 2에서 구현할 함수 호출 (지금은 빈 함수)
      this.runWeGoTurn();
    });
  }

  // STEP 2에서 구현할 We-go 턴 실행 함수
  runWeGoTurn() {
    console.log("We-go turn triggered! (아직 기능 없음)");
    // 이 안에 행동력 기반의 전투 로직이 들어갈 예정입니다.
  }
}
