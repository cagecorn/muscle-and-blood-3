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

/**
 * Convert an MBTI trait object back into its 4-letter string.
 * @param {object} traits - An object containing E/I, S/N, T/F, J/P values.
 * @returns {string|null} The 4-letter MBTI string or null if data is missing.
 */
export function mbtiToString(traits) {
  if (!traits) return null;
  return (traits.E > traits.I ? 'E' : 'I') +
         (traits.S > traits.N ? 'S' : 'N') +
         (traits.T > traits.F ? 'T' : 'F') +
         (traits.J > traits.P ? 'J' : 'P');
}
