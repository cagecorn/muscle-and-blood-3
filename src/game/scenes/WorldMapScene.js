// src/game/scenes/WorldMapScene.js

import { Scene } from 'https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.esm.js';
import { Grid } from "../utils/Grid.js";
import { Unit } from "../actors/Unit.js";
import { units as unitData } from "../data/units.js";

export class WorldMapScene extends Scene {
  constructor() {
    super("WorldMapScene");
  }

  create() {
    this.grid = new Grid(this, 30, 20, 50);
    this.units = []; 

    // --- 유닛 생성 코드는 이전과 동일합니다 (생략) ---
    const player = new Unit(this, 5, 10, unitData.player, "player");
    this.playerUnit = player;
    this.units.push(player);
    this.grid.add(player.sprite, 5, 10);
    const enemyCommander = new Unit(this, 25, 10, unitData.enemyCommander, "enemy");
    this.units.push(enemyCommander);
    this.grid.add(enemyCommander.sprite, 25, 10);
    const alliedMerc1 = new Unit(this, 5, 12, unitData.alliedMercenary, "player");
    this.units.push(alliedMerc1);
    this.grid.add(alliedMerc1.sprite, 5, 12);
    const alliedMerc2 = new Unit(this, 7, 12, unitData.alliedMercenary, "player");
    this.units.push(alliedMerc2);
    this.grid.add(alliedMerc2.sprite, 7, 12);
    const enemyMerc1 = new Unit(this, 23, 12, unitData.enemyMercenary, "enemy");
    this.units.push(enemyMerc1);
    this.grid.add(enemyMerc1.sprite, 23, 12);
    const enemyMerc2 = new Unit(this, 25, 12, unitData.enemyMercenary, "enemy");
    this.units.push(enemyMerc2);
    this.grid.add(enemyMerc2.sprite, 25, 12);
    // ----------------------------------------------------

    this.input.on("pointerdown", (pointer) => {
      const { gridX, gridY } = this.grid.getGridPosition(pointer.x, pointer.y);
      this.playerUnit.move(gridX, gridY);
      this.runWeGoTurn();
    });
  }

  runWeGoTurn() {
    console.log("===== We-Go Turn Start! =====");
    // TODO: 여기에 AP 충전 로직을 넣을 예정
    this.planAIActions();
    // TODO: 여기에 행동 실행 로직을 넣을 예정
  }

  // --- 🔹 STEP 5 추가된 함수 🔹 ---
  /**
   * 모든 AI 유닛의 행동 계획을 수립합니다.
   */
  planAIActions() {
    console.log("--- AI 계획 단계 ---");
    // 모든 유닛들을 순회하며
    this.units.forEach(unit => {
      // AI 유닛(적군)일 경우에만 계획을 세웁니다.
      if (unit.faction === 'enemy') {
        const target = this.findClosestTarget(unit, 'player');
        if (target) {
          // 계획을 세웁니다: "저 타겟을 공격하겠다!"
          unit.plannedAction = { type: 'attack', target: target };
          console.log(`${unit.name}이(가) ${target.name}을(를) 공격할 계획입니다.`);
        }
      }
    });
  }

  /**
   * 특정 유닛에게서 가장 가까운 적을 찾습니다.
   * @param {Unit} fromUnit - 기준 유닛
   * @param {string} targetFaction - 찾을 목표의 진영 ('player' or 'enemy')
   * @returns {Unit | null} 가장 가까운 타겟 유닛
   */
  findClosestTarget(fromUnit, targetFaction) {
    const targets = this.units.filter(u => u.faction === targetFaction && u.currentHp > 0);
    if (targets.length === 0) return null;

    let closestTarget = null;
    let minDistance = Infinity;

    targets.forEach(target => {
      const distance = Phaser.Math.Distance.Between(fromUnit.gridX, fromUnit.gridY, target.gridX, target.gridY);
      if (distance < minDistance) {
        minDistance = distance;
        closestTarget = target;
      }
    });
    return closestTarget;
  }
  // ------------------------------------
}
