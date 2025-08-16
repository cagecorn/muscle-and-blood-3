import BehaviorTree from './src/ai/BehaviorTree.js';
import SelectorNode from './src/ai/nodes/SelectorNode.js';
import SequenceNode from './src/ai/nodes/SequenceNode.js';
import MoveToTargetNode from './src/ai/nodes/MoveToTargetNode.js';
import IsTargetValidNode from './src/ai/nodes/IsTargetValidNode.js';
import FindPriorityTargetNode from './src/ai/nodes/FindPriorityTargetNode.js';
import FindLowestHealthEnemyNode from './src/ai/nodes/FindLowestHealthEnemyNode.js';
import FindSafeRepositionNode from './src/ai/nodes/FindSafeRepositionNode.js';
import IsHealthBelowThresholdNode from './src/ai/nodes/IsHealthBelowThresholdNode.js';
import FindTargetNode from './src/ai/nodes/FindTargetNode.js';
import HasNotMovedNode from './src/ai/nodes/HasNotMovedNode.js';
import IsSkillInRangeNode from './src/ai/nodes/IsSkillInRangeNode.js';
import UseSkillNode from './src/ai/nodes/UseSkillNode.js';
import FindBestSkillByScoreNode from './src/ai/nodes/FindBestSkillByScoreNode.js';
import { NodeState } from './src/ai/nodes/Node.js';
import MoveToUseSkillNode from './src/ai/nodes/MoveToUseSkillNode.js';
import FindPathToTargetNode from './src/ai/nodes/FindPathToTargetNode.js';
import UseBuffSkillOrWaitNode from './src/ai/nodes/UseBuffSkillOrWaitNode.js';

/**
 * Improved MeleeAI: 근접 공격형 AI 행동 트리 (강화 버전)
 * 기존 AI에서 생존 임계치를 낮추어 보다 공격적으로 행동하도록 변경했습니다.
 * 1. (생존) 체력이 25% 미만이면 안전한 위치로 후퇴합니다.
 * 2. (마무리) 공격 가능한 체력이 가장 낮은 적을 찾아 공격합니다.
 * 3. (전략) 우선순위 타겟(원거리/힐러)을 찾아 공격합니다.
 * 4. (기본) 위 모든 행동이 불가능할 경우, 가장 가까운 적을 공격합니다.
 */
function createImprovedMeleeAI(engines = {}) {
    // 현재 타겟을 스킬 타겟으로 동기화하는 헬퍼 노드
    const syncSkillTarget = {
        async evaluate(_unit, blackboard) {
            const target = blackboard.get('currentTargetUnit');
            if (target) {
                blackboard.set('skillTarget', target);
                return NodeState.SUCCESS;
            }
            return NodeState.FAILURE;
        }
    };

    // 스킬 하나를 실행하는 공통 로직 (이동 포함)
    const executeSkillBranch = new SequenceNode([
        new FindBestSkillByScoreNode(engines),
        new IsTargetValidNode(),
        syncSkillTarget,
        new SelectorNode([
            new SequenceNode([
                new IsSkillInRangeNode(engines),
                new UseSkillNode(engines)
            ]),
            new SequenceNode([
                new HasNotMovedNode(),
                new MoveToUseSkillNode(engines),
                new UseSkillNode(engines)
            ])
        ])
    ]);

    const rootNode = new SelectorNode([
        // 1순위: 생존 본능 (체력이 25% 미만일 때 후퇴)
        new SequenceNode([
            new IsHealthBelowThresholdNode(0.25),
            new HasNotMovedNode(),
            new FindSafeRepositionNode(engines),
            new MoveToTargetNode(engines)
        ]),
        // 2순위: 체력이 가장 낮은 적 마무리
        new SequenceNode([
            new FindLowestHealthEnemyNode(engines),
            executeSkillBranch
        ]),
        // 3순위: 우선순위 타겟(원거리/힐러) 공격
        new SequenceNode([
            new FindPriorityTargetNode(engines),
            executeSkillBranch
        ]),
        // 4순위: 기본 공격 (가장 가까운 적)
        new SequenceNode([
            new FindTargetNode(engines),
            executeSkillBranch
        ]),
        // 5순위: 공격에 실패했다면 적을 향해 전진
        new SequenceNode([
            new HasNotMovedNode(),
            new FindTargetNode(engines),
            new FindPathToTargetNode(engines),
            new MoveToTargetNode(engines)
        ]),
        // 6순위: 전진도 불가능하면 안전한 위치로 이동
        new SequenceNode([
            new HasNotMovedNode(),
            new FindSafeRepositionNode(engines),
            new MoveToTargetNode(engines)
        ]),
        // 7순위: 경로를 찾지 못한 경우 버프 스킬 사용 또는 대기
        new UseBuffSkillOrWaitNode(engines)
    ]);

    return new BehaviorTree(rootNode);
}

export { createImprovedMeleeAI };