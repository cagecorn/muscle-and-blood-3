// src/game/components/ActionPowerManager.js

export class ActionPowerManager {
  /**
   * @param {Array<Unit>} units - 전투에 참여하는 모든 유닛의 배열
   */
  constructor(units) {
    this.units = units;
  }

  /**
   * 매 턴 시작 시 모든 유닛의 행동력을 축적시킵니다.
   */
  accumulateAllAP() {
    console.log("--- AP 충전 ---");
    this.units.forEach(unit => {
      unit.accumulateAP();
      console.log(`${unit.name}: ${unit.currentAP.toFixed(2)} AP`);
    });
  }

  /**
   * 행동할 유닛들의 우선순위 목록을 반환합니다.
   * @returns {Array<Unit>} AP가 높은 순서로 정렬된 유닛 배열
   */
  getActionPriorityList() {
    // 행동력이 1 이상인 유닛들만 필터링하여, AP가 높은 순으로 정렬합니다.
    const readyUnits = this.units.filter(unit => unit.currentAP >= 1);
    
    readyUnits.sort((a, b) => b.currentAP - a.currentAP);

    console.log("--- 행동 순서 결정 ---");
    readyUnits.forEach((unit, index) => {
      console.log(`${index + 1}순위: ${unit.name} (${unit.currentAP.toFixed(2)} AP)`);
    });

    return readyUnits;
  }

  /**
   * 유닛의 행동이 끝나면 소모된 AP를 차감합니다.
   * @param {Unit} unit - 행동을 마친 유닛
   * @param {number} cost - 소모된 AP (기본값 1)
   */
  spendAP(unit, cost = 1) {
    unit.currentAP -= cost;
    console.log(`${unit.name} 행동 완료. 남은 AP: ${unit.currentAP.toFixed(2)}`);
  }
}
