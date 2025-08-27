class GoldManager {
    constructor() {
        this.gold = 0;
    }

    /** 현재 골드를 반환 */
    get() {
        return this.gold;
    }

    /** 절대값으로 골드 설정 */
    set(amount) {
        this.gold = amount;
    }

    /** 골드를 초기화 */
    reset(amount = 0) {
        this.gold = amount;
    }

    /** 골드를 추가 */
    add(amount) {
        this.gold += amount;
    }

    /** 골드를 소모. 충분하면 차감하고 true 반환 */
    spend(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            return true;
        }
        return false;
    }
}

export const goldManager = new GoldManager();
