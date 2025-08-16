import assert from 'assert';

// IndexedDB를 사용하지 않는 테스트 환경을 위한 스텁
globalThis.indexedDB = { open: () => ({}) };

// 필요한 모듈을 동적으로 불러옵니다.
const { default: UseSkillNode } = await import('../src/ai/nodes/UseSkillNode.js');
const { NodeState } = await import('../src/ai/nodes/Node.js');
const { default: Blackboard } = await import('../src/ai/Blackboard.js');
const { skillInventoryManager } = await import('../src/game/utils/SkillInventoryManager.js');
const { tokenEngine } = await import('../src/game/utils/TokenEngine.js');

// 최소한의 엔진 스텁을 준비합니다.
const delayEngine = { hold: async () => {} };
const vfxManager = { showSkillName() {}, showEffectName() {}, createDamageNumber() {} };
const narrationEngine = { show() {} };

const useSkillNode = new UseSkillNode({ delayEngine, vfxManager, narrationEngine });

// 테스트용 유닛과 대상 유닛을 생성합니다.
const caster = { uniqueId: 1, instanceName: 'Caster', team: 'A', finalStats: { hp: 100 }, currentHp: 100, sprite: {}, classPassive: null };
const enemy = { uniqueId: 2, instanceName: 'Enemy', team: 'B', finalStats: { hp: 100 }, currentHp: 100, sprite: {} };

// 토큰과 스킬을 설정합니다.
tokenEngine.registerUnit(caster);
const skillInstance = skillInventoryManager.addSkillById('adrenalineShot', 'NORMAL');

const blackboard = new Blackboard();
blackboard.set('skillTarget', enemy);
blackboard.set('currentSkillInstanceId', skillInstance.instanceId);

const result = await useSkillNode.evaluate(caster, blackboard);
assert.strictEqual(result, NodeState.FAILURE, '아군 대상 스킬이 적에게 시전되어서는 안 됩니다.');

console.log('Adrenaline targeting test passed.');
