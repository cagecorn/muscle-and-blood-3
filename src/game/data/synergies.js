export const fateSynergies = {
    vanguard: {
        name: '선봉대',
        stat: 'hp',
        statName: 'HP',
        bonuses: [
            { count: 4, multiplier: 1.05 },
            { count: 6, multiplier: 1.10 },
            { count: 8, multiplier: 1.20 },
            { count: 10, multiplier: 1.30 },
            { count: 12, multiplier: 1.50 }
        ]
    },
    striker: {
        name: '타격대',
        stat: 'physicalAttack',
        statName: '물리 공격력',
        bonuses: [
            { count: 4, multiplier: 1.10 },
            { count: 6, multiplier: 1.20 },
            { count: 8, multiplier: 1.40 },
            { count: 10, multiplier: 1.60 },
            { count: 12, multiplier: 1.80 }
        ]
    },
    oathkeeper: {
        name: '서약자',
        stat: 'maxBarrier',
        statName: '용맹 배리어',
        bonuses: [
            { count: 4, multiplier: 1.10 },
            { count: 6, multiplier: 1.20 },
            { count: 8, multiplier: 1.35 },
            { count: 10, multiplier: 1.50 },
            { count: 12, multiplier: 1.60 }
        ]
    },
    acrobat: {
        name: '곡예사',
        stat: ['physicalEvadeChance', 'magicEvadeChance'],
        statName: '회피율',
        bonuses: [
            { count: 4, multiplier: 1.05 },
            { count: 6, multiplier: 1.10 },
            { count: 8, multiplier: 1.15 },
            { count: 10, multiplier: 1.20 },
            { count: 12, multiplier: 1.30 }
        ]
    }
};
