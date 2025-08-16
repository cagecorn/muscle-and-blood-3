import assert from 'assert';
import { archetypeAssignmentEngine } from '../src/game/utils/ArchetypeAssignmentEngine.js';
import { mercenaryEquipmentSelector } from '../src/game/utils/MercenaryEquipmentSelector.js';

console.log('--- 💣 트랩마스터 아키타입 통합 테스트 시작 ---');

const originalRandom = Math.random;
Math.random = () => 0.5;
archetypeAssignmentEngine.archetypeProfiles = {
    Trapmaster: archetypeAssignmentEngine.archetypeProfiles.Trapmaster,
};

const mockTrapmaster = {
    id: 'gunner',
    instanceName: '은둔의 사수',
    mbti: { I: 90, N: 85, P: 70, T: 40, E: 0, S: 0, F: 0, J: 0 }
};

archetypeAssignmentEngine.assignArchetype(mockTrapmaster);
Math.random = originalRandom;

assert.strictEqual(
    mockTrapmaster.archetype,
    'Trapmaster',
    '트랩마스터 아키타입이 올바르게 할당되지 않았습니다.'
);
console.log('✅ 테스트 1 통과: MBTI 성향에 따라 트랩마스터 아키타입이 정확히 할당되었습니다.');

const genericWeapon = { name: '일반 석궁', stats: { rangedAttack: 5 } };
const trapWeapon = {
    name: '교란의 석궁',
    stats: { rangedAttack: 5, statusEffectApplication: 5 }
};
const trapMbtiWeapon = {
    name: '직관의 석궁',
    stats: { rangedAttack: 5, statusEffectApplication: 5 },
    mbtiEffects: [{ trait: 'N_TRAPMASTER' }]
};

const genericScore = mercenaryEquipmentSelector._calculateItemScore(mockTrapmaster, genericWeapon);
const trapScore = mercenaryEquipmentSelector._calculateItemScore(mockTrapmaster, trapWeapon);
const trapMbtiScore = mercenaryEquipmentSelector._calculateItemScore(mockTrapmaster, trapMbtiWeapon);

console.log(`  - 일반 장비 점수: ${genericScore.toFixed(0)}`);
console.log(`  - 트랩마스터 전용 옵션 장비 점수: ${trapScore.toFixed(0)}`);
console.log(`  - 트랩마스터 전용 MBTI 장비 점수: ${trapMbtiScore.toFixed(0)}`);

assert(trapScore >= genericScore, '트랩마스터가 전용 옵션 장비를 더 선호해야 합니다.');
assert(trapMbtiScore > trapScore, '트랩마스터가 전용 MBTI 장비를 가장 선호해야 합니다.');

console.log('--- ✅ 모든 트랩마스터 테스트 완료 ---');
