import BehaviorTree from '../BehaviorTree.js';
import SelectorNode from '../nodes/SelectorNode.js';
import SequenceNode from '../nodes/SequenceNode.js';
import MoveToTargetNode from '../nodes/MoveToTargetNode.js';

import FindBestSkillByScoreNode from '../nodes/FindBestSkillByScoreNode.js';
import FindTargetBySkillTypeNode from '../nodes/FindTargetBySkillTypeNode.js';
import IsSkillInRangeNode from '../nodes/IsSkillInRangeNode.js';
import UseSkillNode from '../nodes/UseSkillNode.js';
import HasNotMovedNode from '../nodes/HasNotMovedNode.js';
import IsTargetTooCloseNode from '../nodes/IsTargetTooCloseNode.js';
import FindKitingPositionNode from '../nodes/FindKitingPositionNode.js';
import FindSafeRepositionNode from '../nodes/FindSafeRepositionNode.js';
import MoveToUseSkillNode from '../nodes/MoveToUseSkillNode.js';
import FindTargetNode from '../nodes/FindTargetNode.js';
import FindPathToTargetNode from '../nodes/FindPathToTargetNode.js';
import UseBuffSkillOrWaitNode from '../nodes/UseBuffSkillOrWaitNode.js';

/**
 * Improved RangedAI: 원거리 AI의 카이팅 및 행동 로직을 강화한 버전입니다.
 * dangerZone 값을 2로 늘려 적이 2칸 이내에 접근하면 후퇴하도록 조정했습니다.
 */
function createRangedAI(engines = {}) {
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
        // 경로를 찾지 못했다면 버프 스킬 사용 또는 대기
        new UseBuffSkillOrWaitNode(engines)
    ]);

    // --- MBTI 기반 특수 행동들 ---
    const kitingBehavior = new SequenceNode([
        new HasNotMovedNode(),
        // dangerZone 값을 2로 높여 원거리 AI가 더 먼 거리에서도 후퇴합니다.
        new IsTargetTooCloseNode({ ...engines, dangerZone: 2 }),
        new FindKitingPositionNode(engines),
        new MoveToTargetNode(engines)
    ]);

    // ... 다른 MBTI 기반 생존/특수 행동 로직 ...

    // --- 최종 행동 트리 구성 ---
    const rootNode = new SelectorNode([
        // 1순위: 카이팅과 같은 특수 행동
        kitingBehavior,
        // ... 다른 MBTI 기반 고차원적 행동들 ...
        
        // 2순위: 위 행동들이 실행되지 않았다면, 반드시 기본 행동 수행
        basicActionBranch
    ]);

    return new BehaviorTree(rootNode);
}

export { createRangedAI };
