import { activeSkills } from './active.js';
import { buffSkills } from './buff.js';
import { debuffSkills } from './debuff.js';
// import { passiveSkills } from './passive.js'; // passive skills are intentionally excluded
import { aidSkills } from './aid.js';
import { summonSkills } from './summon.js';
import { strategySkills } from './strategy.js';
// sentinelSkills와 darkKnightSkills import를 제거합니다.
import {
    newActiveSkills,
    newBuffSkills,
    newDebuffSkills,
    newAidSkills,
    newSummonSkills,
    newStrategySkills
} from '../../logic/skills/new_skill_cards.js';

// 모든 스킬을 하나의 객체로 통합하여 쉽게 조회할 수 있도록 함
export const skillCardDatabase = {
    ...activeSkills, // includes fireball and other active skills
    ...buffSkills,
    ...debuffSkills,
    // ...passiveSkills, // passive skills are intentionally excluded from card generation
    ...aidSkills,
    ...summonSkills,
    ...strategySkills,
    // 새로 추가된 스킬 카드들
    ...newActiveSkills,
    ...newBuffSkills,
    ...newDebuffSkills,
    ...newAidSkills,
    ...newSummonSkills,
    ...newStrategySkills,
    // sentinelSkills와 darkKnightSkills를 여기서 제거합니다.
};
