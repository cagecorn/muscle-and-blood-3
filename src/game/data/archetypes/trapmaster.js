import { SKILL_TAGS } from '../../utils/SkillTagManager.js';

/**
 * 트랩마스터 (Trapmaster) 아키타입 정의
 * 전장을 함정과 넉백 스킬로 통제하는 전략가.
 */
export const trapmasterArchetype = {
    id: 'Trapmaster',
    name: '트랩마스터',

    // 1. 핵심 코어 태그
    coreTags: [
        SKILL_TAGS.TRAP,
        SKILL_TAGS.KINETIC,
        SKILL_TAGS.AREA_DENIAL
    ],

    // 2. 선호 스킬 목록
    preferredSkills: [
        'steelTrap',
        'venomTrap',
        'blastTrap',
        'gustShot',
        'knockbackShot'
    ],

    // 3. 선호 장비 옵션
    preferredEquipment: {
        prefixes: [
            { name: '함정의', stat: 'trapCapacity' },
            { name: '충격의', stat: 'pushDistance' }
        ],
        suffixes: [
            { name: '교란의', stat: 'areaDenial' }
        ],
        mbtiEffects: [
            'I_TRAPMASTER',
            'N_TRAPMASTER',
            'P_TRAPMASTER'
        ]
    },

    // 4. MBTI 선호도 프로필
    mbtiProfile: {
        I: 3,
        N: 3,
        P: 2,
        T: 1
    }
};
