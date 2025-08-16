import assert from 'assert';

globalThis.indexedDB = { open: () => ({}) };

const { skillCardDatabase } = await import('../src/game/data/skills/SkillCardDatabase.js');
const { skillInventoryManager } = await import('../src/game/utils/SkillInventoryManager.js');

const newSkillIds = [
  'flameWhip',
  'thunderStrike',
  'shadowStep',
  'chainLightning',
  'soulDrain',
  'battleCry',
  'windBlessing',
  'berserkRage',
  'curseOfWeakness',
  'silence',
  'infectiousWound',
  'purification',
  'revitalizingPulse',
  'summonStoneGolem',
  'fortifyPosition'
];

newSkillIds.forEach(id => {
  assert(skillCardDatabase[id], `${id} should exist in skill card database`);
  const count = skillInventoryManager.getInventory().filter(s => s.skillId === id).length;
  assert(count >= 5, `${id} should be added to inventory at game start`);
});

assert.strictEqual(
  skillCardDatabase.shadowStep.NORMAL.type,
  'BUFF',
  'shadowStep should be registered as a buff skill'
);

console.log('--- New skill cards integration test passed ---');

