import BehaviorTree from './src/ai/BehaviorTree.js';
import SelectorNode from './src/ai/nodes/SelectorNode.js';
import SequenceNode from './src/ai/nodes/SequenceNode.js';
import MoveToTargetNode from './src/ai/nodes/MoveToTargetNode.js';

import FindBestSkillByScoreNode from './src/ai/nodes/FindBestSkillByScoreNode.js';
import FindTargetBySkillTypeNode from './src/ai/nodes/FindTargetBySkillTypeNode.js';
import IsSkillInRangeNode from './src/ai/nodes/IsSkillInRangeNode.js';
import UseSkillNode from './src/ai/nodes/UseSkillNode.js';
import HasNotMovedNode from './src/ai/nodes/HasNotMovedNode.js';
import IsTargetTooCloseNode from './src/ai/nodes/IsTargetTooCloseNode.js';
import FindKitingPositionNode from './src/ai/nodes/FindKitingPositionNode.js';
import FindSafeRepositionNode from './src/ai/nodes/FindSafeRepositionNode.js';
import MoveToUseSkillNode from './src/ai/nodes/MoveToUseSkillNode.js';
import FindTargetNode from './src/ai/nodes/FindTargetNode.js';
import FindPathToTargetNode from './src/ai/nodes/FindPathToTargetNode.js';
import UseBuffSkillOrWaitNode from './src/ai/nodes/UseBuffSkillOrWaitNode.js';

/**
 * Improved RangedAI: 원거리 AI의 카이팅 및 행동 로직을 강화합니다.
 * 기존 dangerZone 값을 1에서 2로 늘려, 적이 2칸 이내에 접근하면 즉시 위치를 재조정하도록 설정했습니다.
 */
function createImprovedRangedAI(engines = {}) {
    // --- 공통 사용 브랜치 ---
    const executeSkillBranch = new SelectorNode([
        new SequenceNode([new IsSkillInRangeNode(engines), new UseSkillNode(engines)]),
        new SequenceNode([
            new HasNotMovedNode(),
            new MoveToUseSkillNode(engines),
            new UseSkillNode(engines)
        ])
    ]);

    // --- 기본 행동 로직 ---
    const basicActionBranch = new SelectorNode([
        new SequenceNode([
            new FindBestSkillByScoreNode(engines),
            new FindTargetBySkillTypeNode(engines),
            executeSkillBranch
        ]),
        new SequenceNode([
            new HasNotMovedNode(),
            new FindTargetNode(engines),
            new FindPathToTargetNode(engines),
            new MoveToTargetNode(engines)
        ]),
        new SequenceNode([
            new HasNotMovedNode(),
            new FindSafeRepositionNode(engines),
            new MoveToTargetNode(engines)
        ]),
        new UseBuffSkillOrWaitNode(engines)
    ]);

    // --- MBTI 기반 특수 행동들 ---
    const kitingBehavior = new SequenceNode([
        new HasNotMovedNode(),
        // dangerZone 값을 2로 높여 원거리 AI가 적과 2칸 거리에서도 후퇴하도록 조정합니다.
        new IsTargetTooCloseNode({ ...engines, dangerZone: 2 }),
        new FindKitingPositionNode(engines),
        new MoveToTargetNode(engines)
    ]);

    // --- 최종 행동 트리 구성 ---
    const rootNode = new SelectorNode([
        // 1순위: 카이팅과 같은 특수 행동
        kitingBehavior,
        // 2순위: 기본 행동
        basicActionBranch
    ]);

    return new BehaviorTree(rootNode);
}

export { createImprovedRangedAI };