export const MBTI_TYPES = [
  'INTJ','INTP','ENTJ','ENTP',
  'INFJ','INFP','ENFJ','ENFP',
  'ISTJ','ISFJ','ESTJ','ESFJ',
  'ISTP','ISFP','ESTP','ESFP'
];

// 각 MBTI 조합의 궁합 점수를 0~4 범위로 나타낸 매트릭스.
// 동일한 글자를 공유할 때마다 1점을 부여합니다.
export const MBTI_COMPATIBILITY_MATRIX = MBTI_TYPES.reduce((matrix, typeA) => {
  matrix[typeA] = {};
  MBTI_TYPES.forEach(typeB => {
    const score = [...typeA].reduce((acc, ch, idx) => acc + (ch === typeB[idx] ? 1 : 0), 0);
    matrix[typeA][typeB] = score;
  });
  return matrix;
}, {});

// 두 MBTI 간의 궁합 점수를 반환합니다.
export function getMbtiCompatibility(typeA, typeB) {
  return MBTI_COMPATIBILITY_MATRIX[typeA]?.[typeB] ?? 0;
}
