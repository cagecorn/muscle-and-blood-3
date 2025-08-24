import Node, { NodeState } from './Node.js';
import { debugAIManager } from '../../game/debug/DebugAIManager.js';

/**
 * 위기에 처한 아군을 위협하는 적을 찾아 타겟으로 설정합니다.
 * FindNearestAllyInDangerNode가 선행되어 allyInDanger가 블랙보드에 있어야 합니다.
 */
class FindEnemyAttackingAllyNode extends Node {
    async evaluate(unit, blackboard) {
        debugAIManager.logNodeEvaluation(this, unit);
        const ally = blackboard.get('allyInDanger');
        const enemies = blackboard.get('enemyUnits')?.filter(e => e.currentHp > 0);

        if (!ally || !enemies || enemies.length === 0) {
            debugAIManager.logNodeResult(NodeState.FAILURE, '위험 아군 또는 적이 없음');
            return NodeState.FAILURE;
        }

        let target = null;
        let minDist = Infinity;
        for (const enemy of enemies) {
            const range = enemy.finalStats.attackRange || 1;
            const dist = Math.abs(enemy.gridX - ally.gridX) + Math.abs(enemy.gridY - ally.gridY);
            if (dist <= range && dist < minDist) {
                target = enemy;
                minDist = dist;
            }
        }

        if (target) {
            blackboard.set('currentTargetUnit', target);
            blackboard.set('skillTarget', target);
            debugAIManager.logNodeResult(NodeState.SUCCESS, `위협 적 [${target.instanceName}] 설정`);
            return NodeState.SUCCESS;
        }

        debugAIManager.logNodeResult(NodeState.FAILURE, '위협 적을 찾지 못함');
        return NodeState.FAILURE;
    }
}

export default FindEnemyAttackingAllyNode;

