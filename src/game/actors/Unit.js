// src/game/actors/Unit.js

import { uniqueIDManager } from "../utils/UniqueIDManager.js";
import { statEngine } from "../utils/StatEngine.js";
import { mercenaryData } from "../data/mercenaries.js";

export class Unit {
  constructor(scene, gridX, gridY, unitData, faction) {
    this.scene = scene;
    this.gridX = gridX;
    this.gridY = gridY;
    
    // 기본 데이터와 병합
    const baseMercData = mercenaryData[unitData.id] || {};
    Object.assign(this, { ...baseMercData, ...unitData });

    this.uniqueId = uniqueIDManager.getNextId();
    this.faction = faction;
    this.sprite = scene.add.sprite(0, 0, this.sprite);
    this.finalStats = statEngine.calculateStats(this, this.baseStats || unitData);
    this.currentHp = this.finalStats.hp;

    // --- 🔹 STEP 3 추가된 부분 🔹 ---
    this.currentAP = 0; // 행동력(Action Power) 변수 추가 및 초기화
    // ------------------------------------
  }

  // --- 🔹 STEP 3 추가된 부분 🔹 ---
  /**
   * 유닛의 속도에 비례하여 행동력(AP)을 축적합니다.
   * 이 값은 나중에 소수점 계산의 정확도를 위해 100으로 나눕니다.
   */
  accumulateAP() {
    this.currentAP += this.finalStats.speed / 100;
  }
  // ------------------------------------

  move(gridX, gridY) {
    this.gridX = gridX;
    this.gridY = gridY;
    const { worldX, worldY } = this.scene.grid.getWorldPosition(gridX, gridY);
    this.scene.tweens.add({
      targets: this.sprite,
      x: worldX,
      y: worldY,
      ease: "Power2",
      duration: 500,
    });
  }
}
