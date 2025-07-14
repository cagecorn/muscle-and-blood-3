// data/class.js

// 이 모듈은 게임 내 모든 클래스의 기본 정보를 정의합니다.
// IdManager와 연동하여 고유 ID를 사용합니다.

export const CLASS_ROLES = {
    MELEE_DPS: 'melee_dps',
    RANGED_DPS: 'ranged_dps',
    TANK: 'tank',
    HEALER: 'healer',
    MAGIC_DPS: 'magic_dps'
};

export const CLASSES = {
    WARRIOR: {
        id: 'class_warrior',
        name: '전사',
        role: CLASS_ROLES.MELEE_DPS,
        description: '강력한 근접 공격과 방어력을 겸비한 병종.',
        skills: ['skill_melee_attack', 'skill_shield_block'], //예시, 실제 있는 스킬 아님.
        moveRange: 3 // 전사의 이동 거리
    },
    // ✨ 새롭게 추가된 좀비 클래스
    zombie: {
        id: 'class_skeleton',
        name: '좀비',
        role: CLASS_ROLES.MELEE_DPS,
        description: '다수로 몰려오는 기본적인 언데드 적.',
        skills: ['skill_melee_attack'], //예시, 실제 있는 스킬 아님.
        moveRange: 2 // 좀비의 이동 거리(예시)
    }
    // 다른 클래스들이 여기에 추가됩니다.
    // MAGE: { id: 'class_mage', ... }
    // ARCHER: { id: 'class_archer', ... }
};
