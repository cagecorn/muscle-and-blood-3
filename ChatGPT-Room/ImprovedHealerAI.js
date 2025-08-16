import BehaviorTree from './src/ai/BehaviorTree.js';
import SelectorNode from './src/ai/nodes/SelectorNode.js';
import SequenceNode from './src/ai/nodes/SequenceNode.js';
import MoveToTargetNode from './src/ai/nodes/MoveToTargetNode.js';

import FindBestSkillByScoreNode from './src/ai/nodes/FindBestSkillByScoreNode.js';
import FindTargetBySkillTypeNode from './src/ai/nodes/FindTargetBySkillTypeNode.js';
import IsSkillInRangeNode from './src/ai/nodes/IsSkillInRangeNode.js';
import UseSkillNode from './src/ai/nodes/UseSkillNode.js';
import FindSafeHealingPositionNode from './src/ai/nodes/FindSafeHealingPositionNode.js';
import HasNotMovedNode from './src/ai/nodes/HasNotMovedNode.js';
import FindSafeRepositionNode from './src/ai/nodes/FindSafeRepositionNode.js';
import FindTargetNode from './src/ai/nodes/FindTargetNode.js';
import FindPathToTargetNode from './src/ai/nodes/FindPathToTargetNode.js';
import IsHealthBelowThresholdNode from './src/ai/nodes/IsHealthBelowThresholdNode.js';

/**
 * Improved HealerAI: 힐러 AI의 생존 본능을 강화한 버전입니다.
 * 체력이 30% 이하로 떨어지면 안전한 위치로 후퇴하도록 새로운 분기를 추가했습니다.
 */
function createImprovedHealerAI(engines = {}) {
    // --- 공통 사용 브랜치 ---
    const executeSkillBranch = new SelectorNode([
        new SequenceNode([
            new IsSkillInRangeNode(engines),
            new UseSkillNode(engines)
        ]),
        new SequenceNode([
            new HasNotMovedNode(),
            new FindSafeHealingPositionNode(engines),
            new MoveToTargetNode(engines),
            new IsSkillInRangeNode(engines),
            new UseSkillNode(engines)
        ])
    ]);

    // --- 기본 행동 로직 ---
    const basicActionBranch = new SelectorNode([
        // 1순위: 지원할 아군을 찾고 스킬 사용
        new SequenceNode([
            new FindBestSkillByScoreNode(engines),
            new FindTargetBySkillTypeNode(engines),
            executeSkillBranch
        ]),
        // 2순위: 지원 대상이 없으면 적을 찾아 공격
        new SequenceNode([
            new HasNotMovedNode(),
            new FindTargetNode(engines),
            new FindPathToTargetNode(engines),
            new MoveToTargetNode(engines)
        ]),
        // 3순위: 공격할 적도 없다면 안전한 위치로 이동
        new SequenceNode([
            new HasNotMovedNode(),
            new FindSafeRepositionNode(engines),
            new MoveToTargetNode(engines)
        ])
    ]);

    // --- 생존 본능 분기 ---
    const selfPreservationBranch = new SequenceNode([
        new IsHealthBelowThresholdNode(0.30),
        new HasNotMovedNode(),
        new FindSafeRepositionNode(engines),
        new MoveToTargetNode(engines)
    ]);

    // --- 최종 행동 트리 구성 ---
    const rootNode = new SelectorNode([
        // 1순위: 체력이 낮을 때 후퇴합니다.
        selfPreservationBranch,
        // 2순위: 기본 행동 (지원, 공격, 이동)
        basicActionBranch
    ]);

    return new BehaviorTree(rootNode);
}

export { createImprovedHealerAI };