# 클래스 아키타입 현황

## 1. 구현된 클래스 아키타입
현재 저장소에 정의된 아키타입은 다음과 같습니다.

- Dreadnought
- Frostweaver
- Aquilifer
- Executioner
- Arcane Blade
- Force Major
- Berserker
- Spellbreaker
- Trapmaster

## 2. 어미-자식 관계
각 아키타입이 속한 상위 클래스는 다음과 같습니다.

- **Warrior**: Dreadnought, Berserker, Spellbreaker
- **Nanomancer**: Frostweaver, Arcane Blade, Force Major
- **Priest**: Aquilifer
- **Rogue**: Executioner
- **Ranger**: Trapmaster
- **Necromancer**: (미구현 – 예정된 아키타입: Dreadbringer)

## 3. 자식 아키타입이 부족한 클래스
현재 6개의 상위 클래스 중에서 Warrior와 Nanomancer를 제외한 **4개 클래스**(Priest, Rogue, Ranger, Necromancer)는 자식 아키타입이 0~1개 수준으로 부족합니다.

## 4. 16개의 클래스 / 6개의 어미 아키타입은 별개
용병이 가진 16개의 클래스와 6개의 어미 아키타입은 별개이며, 6개의 어미 아키타입은 아키타입 종류를 나누기 위한 '카데고리 항목'에 가까우며 실제 게임 로직에는 구현되지 않습니다. 이 점을 주의하세요.(여럿 아키타입을 만들기 위해서 임의로 나누는 카데고리 그룹입니다.)

