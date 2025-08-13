// src/game/actors/Unit.js

import { uniqueIDManager } from "../utils/UniqueIDManager.js";
import { statEngine } from "../utils/StatEngine.js";
import { mercenaryData } from "../data/mercenaries.js";

export class Unit {
  constructor(scene, gridX, gridY, unitData, faction) {
    this.scene = scene;
    this.gridX = gridX;
    this.gridY = gridY;
    
    const baseMercData = mercenaryData[unitData.id] || {};
    Object.assign(this, { ...baseMercData, ...unitData });

    this.uniqueId = uniqueIDManager.getNextId();
    this.faction = faction;
    this.sprite = scene.add.sprite(0, 0, this.sprite);
    this.finalStats = statEngine.calculateStats(this, this.baseStats || unitData);
    this.currentHp = this.finalStats.hp;
    this.currentAP = 0;

    // --- 🔹 STEP 5 추가된 부분 🔹 ---
    /** @type {any} 행동 계획을 저장하는 변수 (예: {type: 'attack', target: Unit}) */
    this.plannedAction = null; 
    // ------------------------------------
  }

  accumulateAP() {
    this.currentAP += this.finalStats.speed / 100;
  }
  
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
