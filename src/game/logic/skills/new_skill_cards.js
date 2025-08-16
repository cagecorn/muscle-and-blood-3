// 신규 스킬 카드 모음
// 이 파일은 추가로 생성된 다양한 유형의 스킬 카드를 정의합니다.

import { EFFECT_TYPES } from '../../utils/EffectTypes.js';
import { SKILL_TAGS } from '../../utils/SkillTagManager.js';

// 액티브 스킬
export const newActiveSkills = {
    // 화염 채찍: 화염 속성 근거리 공격
    flameWhip: {
        yinYangValue: -2,
        NORMAL: {
            id: 'flameWhip',
            name: '화염 채찍',
            type: 'ACTIVE',
            tags: [SKILL_TAGS.ACTIVE, SKILL_TAGS.PHYSICAL, SKILL_TAGS.FIRE, SKILL_TAGS.MELEE],
            cost: 2,
            targetType: 'enemy',
            description: '불타는 채찍을 휘둘러 적에게 100%의 화염 피해를 주고, 2턴간 [화상] 디버프를 겁니다.',
            illustrationPath: null,
            cooldown: 2,
            range: 2,
            damageMultiplier: { min: 0.9, max: 1.1 },
            effect: {
                id: 'burn',
                type: EFFECT_TYPES.DEBUFF,
                duration: 2,
                modifiers: { stat: 'damageOverTime', type: 'percentage', value: 0.05 }
            }
        }
    },

    // 썬더 스트라이크: 번개 속성 원거리 공격
    thunderStrike: {
        yinYangValue: -3,
        NORMAL: {
            id: 'thunderStrike',
            name: '썬더 스트라이크',
            type: 'ACTIVE',
            tags: [SKILL_TAGS.ACTIVE, SKILL_TAGS.MAGIC, SKILL_TAGS.WIND, SKILL_TAGS.RANGED],
            cost: 3,
            targetType: 'enemy',
            description: '번개를 떨어뜨려 적에게 120%의 마법 피해를 입히고, 1턴간 [마비] 상태로 만듭니다.',
            illustrationPath: null,
            cooldown: 3,
            range: 4,
            damageMultiplier: { min: 1.1, max: 1.3 },
            effect: {
                id: 'paralysis',
                type: EFFECT_TYPES.STATUS_EFFECT,
                duration: 1,
                chance: 0.5
            }
        }
    },

    // 그림자 이동: 위치 이동 및 다음 공격 강화
    shadowStep: {
        yinYangValue: -1,
        NORMAL: {
            id: 'shadowStep',
            name: '그림자 이동',
            type: 'ACTIVE',
            tags: [SKILL_TAGS.ACTIVE, SKILL_TAGS.DARK, SKILL_TAGS.SPECIAL],
            cost: 1,
            targetType: 'self',
            description: '그림자 속으로 숨어 순간이동합니다. 지정한 위치(최대 3칸)로 이동하며 다음 공격이 20% 증가합니다.',
            illustrationPath: null,
            cooldown: 2,
            range: 3,
            effect: {
                id: 'shadowStepBuff',
                type: EFFECT_TYPES.BUFF,
                duration: 1,
                modifiers: { stat: 'physicalAttack', type: 'percentage', value: 0.20 }
            }
        }
    },

    // 연쇄 번개: 여러 대상을 연쇄적으로 공격
    chainLightning: {
        yinYangValue: -3,
        NORMAL: {
            id: 'chainLightning',
            name: '연쇄 번개',
            type: 'ACTIVE',
            tags: [SKILL_TAGS.ACTIVE, SKILL_TAGS.MAGIC, SKILL_TAGS.WIND, SKILL_TAGS.RANGED],
            cost: 3,
            targetType: 'enemy',
            description: '번개가 대상을 관통하여 최대 3명의 적에게 각각 80%, 60%, 40%의 마법 피해를 순차적으로 입힙니다.',
            illustrationPath: null,
            cooldown: 4,
            range: 4,
            // 커스텀 속성: 연쇄 타격 수 설정
            maxTargets: 3,
            damageSequence: [0.8, 0.6, 0.4]
        }
    },

    // 영혼 흡수: 피해를 입힌 만큼 체력을 회복
    soulDrain: {
        yinYangValue: -2,
        NORMAL: {
            id: 'soulDrain',
            name: '영혼 흡수',
            type: 'ACTIVE',
            tags: [SKILL_TAGS.ACTIVE, SKILL_TAGS.MAGIC, SKILL_TAGS.DARK, SKILL_TAGS.SPECIAL],
            cost: 2,
            targetType: 'enemy',
            description: '적의 영혼을 흡수하여 90%의 마법 피해를 입히고, 피해의 50%만큼 자신의 체력을 회복합니다.',
            illustrationPath: null,
            cooldown: 3,
            range: 3,
            damageMultiplier: { min: 0.85, max: 0.95 },
            // 커스텀 속성: 흡혈 비율
            lifeSteal: 0.5
        }
    }
};


// 버프 스킬
export const newBuffSkills = {
    // 전투의 포효: 공격력 및 이동력 증가 아우라
    battleCry: {
        yinYangValue: +3,
        NORMAL: {
            id: 'battleCry',
            name: '전투의 포효',
            type: 'BUFF',
            tags: [SKILL_TAGS.BUFF, SKILL_TAGS.AURA, SKILL_TAGS.WILL],
            cost: 2,
            targetType: 'self',
            description: '크게 포효하여 주위 2칸 내 모든 아군의 공격력을 15% 증가시키고 이동력을 1 증가시킵니다. 지속시간 2턴.',
            illustrationPath: null,
            cooldown: 5,
            range: 0,
            effect: {
                id: 'battleCryAura',
                type: EFFECT_TYPES.BUFF,
                duration: 2,
                isAura: true,
                radius: 2,
                modifiers: [
                    { stat: 'physicalAttack', type: 'percentage', value: 0.15 },
                    { stat: 'movement', type: 'flat', value: 1 }
                ]
            }
        }
    },

    // 바람의 축복: 이동력 및 회피율 증가
    windBlessing: {
        yinYangValue: +2,
        NORMAL: {
            id: 'windBlessing',
            name: '바람의 축복',
            type: 'BUFF',
            tags: [SKILL_TAGS.BUFF, SKILL_TAGS.WIND],
            cost: 1,
            targetType: 'ally',
            description: '아군 하나에게 3턴간 이동력 +2 및 회피율 10% 증가의 버프를 부여합니다.',
            illustrationPath: null,
            cooldown: 3,
            range: 3,
            effect: {
                id: 'windBlessingBuff',
                type: EFFECT_TYPES.BUFF,
                duration: 3,
                modifiers: [
                    { stat: 'movement', type: 'flat', value: 2 },
                    { stat: 'evasion', type: 'percentage', value: 0.10 }
                ]
            }
        }
    },

    // 광전사의 분노: 공격력 증가 대신 방어력 감소
    berserkRage: {
        yinYangValue: +1,
        NORMAL: {
            id: 'berserkRage',
            name: '광전사의 분노',
            type: 'BUFF',
            tags: [SKILL_TAGS.BUFF, SKILL_TAGS.PHYSICAL, SKILL_TAGS.SACRIFICE],
            cost: 2,
            targetType: 'self',
            description: '자신을 희생하여 3턴간 물리 공격력을 25% 증가시키는 대신 방어력이 15% 감소합니다.',
            illustrationPath: null,
            cooldown: 4,
            range: 0,
            effect: {
                id: 'berserkRageBuff',
                type: EFFECT_TYPES.BUFF,
                duration: 3,
                modifiers: [
                    { stat: 'physicalAttack', type: 'percentage', value: 0.25 },
                    { stat: 'physicalDefense', type: 'percentage', value: -0.15 }
                ]
            }
        }
    }
};

// 디버프 스킬
export const newDebuffSkills = {
    // 약화의 저주: 공격력과 방어력 감소
    curseOfWeakness: {
        yinYangValue: +2,
        NORMAL: {
            id: 'curseOfWeakness',
            name: '약화의 저주',
            type: 'DEBUFF',
            tags: [SKILL_TAGS.DEBUFF, SKILL_TAGS.MAGIC, SKILL_TAGS.DARK],
            cost: 2,
            targetType: 'enemy',
            description: '적에게 약화의 저주를 걸어 3턴간 공격력과 방어력을 각각 10% 감소시킵니다.',
            illustrationPath: null,
            cooldown: 3,
            range: 3,
            effect: {
                id: 'curseOfWeakness',
                type: EFFECT_TYPES.DEBUFF,
                duration: 3,
                modifiers: [
                    { stat: 'physicalAttack', type: 'percentage', value: -0.10 },
                    { stat: 'physicalDefense', type: 'percentage', value: -0.10 }
                ]
            }
        }
    },

    // 침묵: 스킬 사용 불가 디버프
    silence: {
        yinYangValue: +3,
        NORMAL: {
            id: 'silence',
            name: '침묵',
            type: 'DEBUFF',
            tags: [SKILL_TAGS.DEBUFF, SKILL_TAGS.PROHIBITION, SKILL_TAGS.MAGIC],
            cost: 2,
            targetType: 'enemy',
            description: '적을 2턴간 침묵시켜 스킬을 사용할 수 없게 합니다.',
            illustrationPath: null,
            cooldown: 4,
            range: 3,
            effect: {
                id: 'silence',
                type: EFFECT_TYPES.DEBUFF,
                duration: 2,
                prohibitsSkills: true
            }
        }
    },

    // 감염된 상처: 지속 피해 및 치유 감소
    infectiousWound: {
        yinYangValue: +2,
        NORMAL: {
            id: 'infectiousWound',
            name: '감염된 상처',
            type: 'DEBUFF',
            tags: [SKILL_TAGS.DEBUFF, SKILL_TAGS.POISON],
            cost: 2,
            targetType: 'enemy',
            description: '적에게 감염된 상처를 입혀 3턴 동안 매 턴 체력의 5% 손실을 입히고, 치유 효과가 50% 감소합니다.',
            illustrationPath: null,
            cooldown: 4,
            range: 2,
            effect: {
                id: 'infectedWound',
                type: EFFECT_TYPES.DEBUFF,
                duration: 3,
                dotPercent: 0.05,
                healReduction: 0.5
            }
        }
    }
};

// 지원 스킬
export const newAidSkills = {
    // 정화: 체력 회복 및 디버프 제거
    purification: {
        yinYangValue: +2,
        NORMAL: {
            id: 'purification',
            name: '정화',
            type: 'AID',
            tags: [SKILL_TAGS.AID, SKILL_TAGS.HEAL],
            cost: 2,
            targetType: 'ally',
            description: '아군 하나의 체력을 {{heal}}만큼 회복시키고, 모든 디버프를 제거합니다.',
            illustrationPath: null,
            cooldown: 3,
            range: 3,
            healMultiplier: { min: 0.8, max: 1.0 },
            removesDebuff: { chance: 1.0 }
        }
    },

    // 활력의 맥동: 범위 내 아군에게 지속 회복
    revitalizingPulse: {
        yinYangValue: +3,
        NORMAL: {
            id: 'revitalizingPulse',
            name: '활력의 맥동',
            type: 'AID',
            tags: [SKILL_TAGS.AID, SKILL_TAGS.HEAL, SKILL_TAGS.AURA],
            cost: 3,
            targetType: 'self',
            description: '2턴간 주위 2칸 내 모든 아군이 매 턴 체력의 10%를 회복하는 오라를 생성합니다.',
            illustrationPath: null,
            cooldown: 5,
            range: 0,
            effect: {
                id: 'revitalizingPulseAura',
                type: EFFECT_TYPES.BUFF,
                duration: 2,
                isAura: true,
                radius: 2,
                healPercent: 0.10
            }
        }
    }
};

// 소환 스킬
export const newSummonSkills = {
    summonStoneGolem: {
        yinYangValue: +5,
        NORMAL: {
            id: 'summonStoneGolem',
            name: '소환: 스톤 골렘',
            type: 'SUMMON',
            tags: [SKILL_TAGS.SUMMON, SKILL_TAGS.EARTH, SKILL_TAGS.SPECIAL],
            description: '튼튼한 스톤 골렘을 소환합니다. (소모: 대지 4, 철 2)',
            illustrationPath: 'assets/images/summon/stone-golem.png',
            cooldown: 80,
            creatureId: 'stoneGolem',
            resourceCost: [
                { type: 'EARTH', amount: 4 },
                { type: 'IRON', amount: 2 }
            ]
        }
    }
};

// 전략 스킬
export const newStrategySkills = {
    fortifyPosition: {
        yinYangValue: +4,
        NORMAL: {
            id: 'fortifyPosition',
            name: '진지 강화',
            type: 'STRATEGY',
            cost: 3,
            targetType: 'self',
            description: '모든 아군의 방어력을 15% 증가시키고 받는 상태 이상 지속시간을 1턴 감소시킵니다. 효과는 3턴 지속되며, 전투 당 한 번만 사용할 수 있습니다.',
            illustrationPath: null,
            cooldown: 100,
            range: 0,
            effect: {
                id: 'fortifyPositionBuff',
                type: EFFECT_TYPES.BUFF,
                duration: 3,
                isGlobal: true,
                modifiers: { stat: 'physicalDefense', type: 'percentage', value: 0.15 },
                statusDurationReduction: 1
            }
        }
    }
};
