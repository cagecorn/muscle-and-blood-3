export const traits = {
    sturdy: {
        id: 'sturdy',
        name: '단단함',
        description: '방어력 5% 상승',
        apply: (stats) => {
            stats.physicalDefense = (stats.physicalDefense || 0) * 1.05;
        }
    },
    healthy: {
        id: 'healthy',
        name: '건강함',
        description: '최대 체력 7% 상승',
        apply: (stats) => {
            stats.hp = (stats.hp || 0) * 1.07;
        }
    },
    sharp: {
        id: 'sharp',
        name: '예리함',
        description: '치명타율 5% 상승',
        apply: (stats) => {
            stats.criticalChance = (stats.criticalChance || 0) + 5;
        }
    },
    clever: {
        id: 'clever',
        name: '총명함',
        description: '마법 공격력 5% 상승',
        apply: (stats) => {
            stats.magicAttack = (stats.magicAttack || 0) * 1.05;
        }
    },
    mighty: {
        id: 'mighty',
        name: '강인함',
        description: '근접 공격력 5% 상승',
        apply: (stats) => {
            stats.physicalAttack = (stats.physicalAttack || 0) * 1.05;
        }
    },
    marksman: {
        id: 'marksman',
        name: '명사수',
        description: '원거리 공격력 5% 상승',
        apply: (stats) => {
            stats.rangedAttack = (stats.rangedAttack || 0) * 1.05;
        }
    },
    devout: {
        id: 'devout',
        name: '신실함',
        description: '마법 방어력 5% 상승',
        apply: (stats) => {
            stats.magicDefense = (stats.magicDefense || 0) * 1.05;
        }
    },
    lucky: {
        id: 'lucky',
        name: '행운아',
        description: '운 3% 상승',
        apply: (stats) => {
            stats.luck = (stats.luck || 0) * 1.03;
        }
    }
};

export function applyTraits(stats, traitIds = []) {
    traitIds.forEach(id => {
        const trait = traits[id];
        if (trait && typeof trait.apply === 'function') {
            trait.apply(stats);
        }
    });
    return stats;
}
