import Node, { NodeState } from './Node.js';
import { debugAIManager } from '../../game/debug/DebugAIManager.js';

class IsTargetInRangeNode extends Node {
    async evaluate(unit, blackboard) {
        debugAIManager.logNodeEvaluation(this, unit);
        const target = blackboard.get('currentTargetUnit');
        if (!target) {
            debugAIManager.logNodeResult(NodeState.FAILURE);
            return NodeState.FAILURE;
        }

        // null 병합 연산자를 사용해 0도 유효한 사거리로 인식합니다.
        const attackRange = unit.finalStats.attackRange ?? 1;
        const distance = Math.abs(unit.gridX - target.gridX) + Math.abs(unit.gridY - target.gridY);

        if (distance <= attackRange) {
            blackboard.set('isTargetInAttackRange', true);
            debugAIManager.logNodeResult(NodeState.SUCCESS);
            return NodeState.SUCCESS;
        }
        
        blackboard.set('isTargetInAttackRange', false);
        debugAIManager.logNodeResult(NodeState.FAILURE);
        return NodeState.FAILURE;
    }
}
export default IsTargetInRangeNode;
