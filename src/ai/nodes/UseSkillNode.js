import Node, { NodeState } from './Node.js';
import { debugAIManager } from '../../game/debug/DebugAIManager.js';
import { skillEngine, SKILL_TYPES } from '../../game/utils/SkillEngine.js';
import { skillInventoryManager } from '../../game/utils/SkillInventoryManager.js';
import { skillModifierEngine } from '../../game/utils/SkillModifierEngine.js';
import { debugSkillExecutionManager } from '../../game/debug/DebugSkillExecutionManager.js';
import { classProficiencies } from '../../game/data/classProficiencies.js';
import SkillEffectProcessor from '../../game/utils/SkillEffectProcessor.js'; // 새로 만든 클래스를 import
import { SKILL_TAGS } from '../../game/utils/SkillTagManager.js';
// ✨ YinYangEngine을 import하여 음양 지수를 조회합니다.
import { yinYangEngine } from '../../game/utils/YinYangEngine.js';
import { aspirationEngine } from '../../game/utils/AspirationEngine.js';

class UseSkillNode extends Node {
    constructor(engines = {}) {
        super();
        this.delayEngine = engines.delayEngine;
        this.skillEngine = engines.skillEngine || skillEngine;
        this.vfxManager = engines.vfxManager;
        this.narrationEngine = engines.narrationEngine;
        // SkillEffectProcessor를 초기화합니다.
        this.skillEffectProcessor = new SkillEffectProcessor(engines);
    }

    async evaluate(unit, blackboard) {
        debugAIManager.logNodeEvaluation(this, unit);

        const skillTarget = blackboard.get('skillTarget');
        const instanceId = blackboard.get('currentSkillInstanceId');

        if (!instanceId || !skillTarget) {
            debugAIManager.logNodeResult(NodeState.FAILURE, '스킬 인스턴스 또는 대상 없음');
            return NodeState.FAILURE;
        }

        const instanceData = skillInventoryManager.getInstanceData(instanceId);
        const baseSkillData = skillInventoryManager.getSkillData(instanceData.skillId, instanceData.grade);
        const modifiedSkill = skillModifierEngine.getModifiedSkill(baseSkillData, instanceData.grade);

        if (!modifiedSkill || !this.skillEngine.canUseSkill(unit, modifiedSkill)) {
            debugAIManager.logNodeResult(NodeState.FAILURE, `스킬 [${modifiedSkill?.name}] 사용 조건 미충족`);
            return NodeState.FAILURE;
        }

        // 잘못된 대상에게 스킬을 사용하려는지 확인합니다.
        if (
            (modifiedSkill.targetType === 'ally' && skillTarget.team !== unit.team) ||
            (modifiedSkill.targetType === 'enemy' && skillTarget.team === unit.team)
        ) {
            debugAIManager.logNodeResult(NodeState.FAILURE, '부적절한 대상에게 스킬 사용 시도');
            return NodeState.FAILURE;
        }

        // MBTI 스택 버프 시스템 제거로 관련 로직을 삭제합니다.

        debugSkillExecutionManager.logSkillExecution(unit, baseSkillData, modifiedSkill, instanceData.grade);
        // ✨ --- [핵심 수정] 공격 또는 지원 스킬 사용 시 플래그 설정 --- ✨
        const offensiveTypes = ['ACTIVE', 'DEBUFF'];
        const isOffensive = offensiveTypes.includes(modifiedSkill.type);
        const isSupport = modifiedSkill.tags?.includes(SKILL_TAGS.AID);

        if (isOffensive || isSupport) {
            // AIManager가 이 플래그를 보고 열망 감소 여부를 결정합니다.
            unit.offensiveActionTakenThisTurn = true;
        }
        // ✨ --- 수정 완료 --- ✨


        // 최종 사용할 스킬 데이터를 준비합니다
        const finalSkill = { ...modifiedSkill };
        const proficiencies = classProficiencies[unit.id] || [];
        const matchingTags = finalSkill.tags?.filter(t => proficiencies.includes(t)).length || 0;

        if (this.narrationEngine) {
            const targetBalance = yinYangEngine.getBalance(skillTarget.uniqueId);
            const skillValue = finalSkill.yinYangValue || 0;
            let narrationMessage = `${unit.instanceName}이(가) [${skillTarget.instanceName}]에게 [${finalSkill.name}]을(를) 사용합니다.`;

            if (targetBalance < -10 && skillValue > 0) {
                narrationMessage = `[${skillTarget.instanceName}]의 음기가 강해진 것을 보고, ${unit.instanceName}이(가) 양의 기술인 [${finalSkill.name}]으로 균형을 맞춥니다.`;
            }
            else if (targetBalance > 10 && skillValue < 0) {
                narrationMessage = `[${skillTarget.instanceName}]의 양기가 과해진 틈을 노려, ${unit.instanceName}이(가) 음의 기술인 [${finalSkill.name}]으로 허점을 파고듭니다.`;
            }
            this.narrationEngine.show(narrationMessage);
        }


        // 스킬 사용 기록
        if (!this.skillEngine.recordSkillUse(unit, finalSkill, skillTarget)) {
            debugAIManager.logNodeResult(NodeState.FAILURE, `스킬 [${finalSkill.name}] 사용 실패`);
            return NodeState.FAILURE;
        }
        const usedSkills = blackboard.get('usedSkillsThisTurn') || new Set();
        usedSkills.add(instanceId);
        blackboard.set('usedSkillsThisTurn', usedSkills);

        // 스킬 이름 VFX 표시
        this.vfxManager.showSkillName(unit.sprite, finalSkill.name, SKILL_TYPES[finalSkill.type].color);

        // ✨ SkillEffectProcessor에 모든 처리를 위임합니다.
        await this.skillEffectProcessor.process({
            unit,
            target: skillTarget,
            skill: finalSkill,
            instanceId,
            grade: instanceData.grade,
            blackboard
        });

        if (matchingTags > 0) {
            aspirationEngine.addAspiration(unit.uniqueId, matchingTags * 2, `${finalSkill.name} 숙련도 스킬 사용`);
        }

        // 처리 후 블랙보드 정리
        blackboard.set('currentSkillData', null);
        blackboard.set('currentSkillInstanceId', null);
        blackboard.set('skillTarget', null);

        await this.delayEngine.hold(500);

        debugAIManager.logNodeResult(NodeState.SUCCESS);
        return NodeState.SUCCESS;
    }

}

export default UseSkillNode;
