import assert from 'assert';
import { aspirationEngine } from '../src/game/utils/AspirationEngine.js';
import { classProficiencies } from '../src/game/data/classProficiencies.js';
import { SKILL_TAGS } from '../src/game/utils/SkillTagManager.js';
import { skillInventoryManager } from '../src/game/utils/SkillInventoryManager.js';
import { skillModifierEngine } from '../src/game/utils/SkillModifierEngine.js';

// Node 환경에서 indexedDB가 없기 때문에 간단한 스텁을 제공합니다.
globalThis.indexedDB = {
    open: () => ({ addEventListener() {}, onerror: null, onsuccess: null, onupgradeneeded: null, result: null })
};

const { default: UseSkillNode } = await import('../src/ai/nodes/UseSkillNode.js');

console.log('--- 숙련도 태그 열망 회복 테스트 ---');

// 현재 테스트에서 사용할 스킬은 외부에서 변경될 수 있으므로 변수로 관리합니다.
let currentSkill = {
    id: 's1',
    name: 'Proficiency Strike',
    type: 'ACTIVE',
    targetType: 'enemy',
    tags: [SKILL_TAGS.MELEE, SKILL_TAGS.PHYSICAL, SKILL_TAGS.FIRE],
};

// SkillInventoryManager와 SkillModifierEngine의 메서드를 스텁으로 덮어씁니다.
skillInventoryManager.getInstanceData = () => ({ skillId: currentSkill.id, grade: 1 });
skillInventoryManager.getSkillData = () => currentSkill;
skillModifierEngine.getModifiedSkill = skill => skill;

// UseSkillNode에서 사용할 엔진 스텁을 구성합니다.
const engines = {
    delayEngine: { hold: async () => {} },
    skillEngine: { canUseSkill: () => true, recordSkillUse: () => true },
    vfxManager: { showSkillName: () => {} },
    skillEffectProcessor: { process: async () => {} }
};
const node = new UseSkillNode(engines);
// 실제 SkillEffectProcessor 대신 간단한 스텁을 사용하여 불필요한 전투 로직을 차단합니다.
node.skillEffectProcessor = { process: async () => {} };

// 테스트에 사용할 유닛과 대상
const unit = { id: 'warrior', uniqueId: 'u1', instanceName: 'Warrior', team: 'A', sprite: {}, gridX: 0, gridY: 0 };
const target = { uniqueId: 't1', team: 'B', sprite: {}, gridX: 1, gridY: 0, currentHp: 100 };

// 블랙보드 스텁
const blackboard = {
    data: new Map([
        ['currentSkillInstanceId', 'inst1'],
        ['skillTarget', target]
    ]),
    get(key) { return this.data.get(key); },
    set(key, value) { this.data.set(key, value); }
};

// 배틀 시뮬레이터를 세팅하여 AspirationEngine이 유닛 정보를 확인할 수 있게 합니다.
aspirationEngine.setBattleSimulator({ turnQueue: [unit, target] });

// 1) 숙련 태그가 2개 포함된 스킬 사용 시 열망 +4
aspirationEngine.initializeUnits([unit, target]);
await node.evaluate(unit, blackboard);
let data = aspirationEngine.getAspirationData(unit.uniqueId);
let matches = currentSkill.tags.filter(t => (classProficiencies[unit.id] || []).includes(t)).length;
assert.strictEqual(data.aspiration, 50 + matches * 2, '숙련 태그 스킬 사용 시 열망 증가 오류');

// 2) 숙련 태그가 없는 스킬 사용 시 열망 변화 없음
currentSkill = {
    id: 's2',
    name: 'Unfamiliar Spell',
    type: 'ACTIVE',
    targetType: 'enemy',
    tags: [SKILL_TAGS.FIRE]
};
blackboard.set('currentSkillInstanceId', 'inst2');
blackboard.set('skillTarget', target);
aspirationEngine.initializeUnits([unit, target]);
await node.evaluate(unit, blackboard);
data = aspirationEngine.getAspirationData(unit.uniqueId);
matches = currentSkill.tags.filter(t => (classProficiencies[unit.id] || []).includes(t)).length;
assert.strictEqual(data.aspiration, 50 + matches * 2, '비숙련 태그 스킬 사용 시 열망 변화');

console.log('  열망 회복 테스트 통과');

