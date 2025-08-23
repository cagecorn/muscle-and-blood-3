export const CLASS_MBTI_MAP = {
  esper: 'INTJ',
  nanomancer: 'INTP',
  commander: 'ENTJ',
  clown: 'ENTP',
  android: 'INFJ',
  plagueDoctor: 'INFP',
  mechanic: 'ENFJ',
  gunner: 'ENFP',
  sentinel: 'ISTJ',
  medic: 'ISFJ',
  warrior: 'ESTJ',
  paladin: 'ESFJ',
  hacker: 'ISTP',
  ghost: 'ISFP',
  flyingmen: 'ESTP',
  darkKnight: 'ESFP'
};

export function mbtiFromString(mbtiStr){
  const high = 80, low = 20;
  const traits = {E:low,I:low,S:low,N:low,T:low,F:low,J:low,P:low};
  const pairs = [['E','I'],['S','N'],['T','F'],['J','P']];
  pairs.forEach((pair, idx) => {
    const letter = mbtiStr[idx];
    const [first, second] = pair;
    traits[letter] = high;
    traits[first === letter ? second : first] = low;
  });
  return traits;
}
