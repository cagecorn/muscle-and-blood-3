import assert from 'assert';
import { MBTI_COMPATIBILITY_MATRIX, getMbtiCompatibility } from '../src/game/data/mbtiCompatibility.js';

console.log('--- MBTI 궁합 매트릭스 테스트 시작 ---');

assert.strictEqual(getMbtiCompatibility('INTJ', 'INTJ'), 4);
assert.strictEqual(getMbtiCompatibility('INTJ', 'ENTJ'), 3);
assert.strictEqual(
  MBTI_COMPATIBILITY_MATRIX['INTJ']['ENTJ'],
  getMbtiCompatibility('ENTJ', 'INTJ')
);

console.log('MBTI 궁합 매트릭스 테스트 성공');
