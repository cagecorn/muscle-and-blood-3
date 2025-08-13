// src/game/data/units.js

export const units = {
  player: {
    name: "아군 지휘관",
    hp: 100,
    maxHp: 100,
    attack: 10,
    defense: 5,
    speed: 50, // 속도 스탯 추가
    weight: 10, // 무게 (기존 턴 순서용)
    sprite: "istp",
    skills: [],
  },
  enemyCommander: {
    name: "적 지휘관",
    hp: 100,
    maxHp: 100,
    attack: 10,
    defense: 5,
    speed: 50,
    weight: 10,
    sprite: "infp", // 적절한 스프라이트 이름으로 변경 필요
    skills: [],
  },
  alliedMercenary: {
    name: "아군 용병",
    hp: 80,
    maxHp: 80,
    attack: 15,
    defense: 3,
    speed: 60,
    weight: 8,
    sprite: "warrior", // 적절한 스프라이트 이름으로 변경 필요
    skills: [],
  },
  enemyMercenary: {
    name: "적군 용병",
    hp: 80,
    maxHp: 80,
    attack: 15,
    defense: 3,
    speed: 40,
    weight: 12,
    sprite: "warrior", // 적절한 스프라이트 이름으로 변경 필요
    skills: [],
  },
};
