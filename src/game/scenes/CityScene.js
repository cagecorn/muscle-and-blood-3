import { Scene } from 'https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.esm.js';
import { mercenaryEngine } from '../utils/MercenaryEngine.js';
import { mercenaryData } from '../data/mercenaries.js';
import { goldManager } from '../utils/GoldManager.js';
import { createGoldPanel, updateGoldPanel } from '../dom/GoldPanel.js';
import { skillInventoryManager } from '../utils/SkillInventoryManager.js';
import { skillCardDatabase } from '../data/skills/SkillCardDatabase.js';
import { SkillCardManager } from '../dom/SkillCardManager.js';

export class CityScene extends Scene {
    constructor() {
        super('CityScene');
    }

    create(data) {
        this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'city-1-bg');

        ['territory-container', 'dungeon-container', 'party-container', 'formation-container'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.display = 'none';
            }
        });

        const cityContainer = document.createElement('div');
        cityContainer.id = 'city-container';

        // DOM 컨테이너가 다른 UI 위에 노출되도록 위치와 z-index 지정
        Object.assign(cityContainer.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '10',
            pointerEvents: 'none'
        });

        const grid = this.createGrid();
        this.populateGrid(grid);

        cityContainer.appendChild(grid);
        document.getElementById('app').appendChild(cityContainer);

        const backButton = this.createBackButton();
        cityContainer.appendChild(backButton);

        createGoldPanel();
        updateGoldPanel();

        this.events.on('shutdown', () => {
            const container = document.getElementById('city-container');
            if (container) {
                container.remove();
            }
        });
    }

    createGrid() {
        const grid = document.createElement('div');
        grid.id = 'city-grid';
        Object.assign(grid.style, {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(3, 1fr)',
            width: '50%',
            height: '60%',
            gap: '30px',
            pointerEvents: 'auto'
        });
        return grid;
    }

    populateGrid(grid) {
        const icons = [
            { name: '여관', icon: 'tavern-icon', tooltip: '[여관]' },
            { name: '스킬샵', icon: 'skills-icon', tooltip: '[스킬샵]' },
            { name: '장비샵', icon: 'inventory-icon', tooltip: '[장비샵]' }
        ];

        const positions = [3, 4, 5];
        icons.forEach((iconData, index) => {
            const cell = document.createElement('div');
            const row = Math.floor(positions[index] / 3) + 1;
            const col = (positions[index] % 3) + 1;

            Object.assign(cell.style, {
                gridRow: `${row}`,
                gridColumn: `${col}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
            });

            const iconElement = document.createElement('div');
            iconElement.className = 'building-icon';
            iconElement.style.backgroundImage = `url(assets/images/territory/${iconData.icon}.png)`;
            Object.assign(iconElement.style, {
                width: '120px',
                height: '120px',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center'
            });

            const label = document.createElement('div');
            label.innerText = iconData.name;
            Object.assign(label.style, {
                textAlign: 'center',
                color: 'white',
                marginTop: '10px',
                fontSize: '20px',
                textShadow: '1px 1px 2px black'
            });

            iconElement.onclick = () => {
                if (iconData.name === '여관') {
                    this.showTavern();
                } else if (iconData.name === '스킬샵') {
                    this.showSkillShop();
                }
            };

            cell.appendChild(iconElement);
            cell.appendChild(label);
            grid.appendChild(cell);
        });
    }

    showSkillShop() {
        const grid = document.getElementById('city-grid');
        grid.style.display = 'none';
        const container = document.getElementById('city-container');
        container.style.backgroundImage = 'url(assets/images/territory/skills-scene.png)';
        container.style.backgroundSize = 'cover';

        const shopView = document.createElement('div');
        shopView.id = 'city-skillshop-view';
        shopView.style.pointerEvents = 'auto';
        container.appendChild(shopView);

        const drawBtn = document.createElement('div');
        drawBtn.className = 'tavern-button';
        drawBtn.style.backgroundImage = `url(assets/images/territory/skills-icon.png)`;
        drawBtn.style.marginTop = '80px';
        drawBtn.innerText = '랜덤 5장 카드 뽑기';
        drawBtn.style.color = 'white';
        drawBtn.style.textAlign = 'center';
        drawBtn.style.lineHeight = '120px';
        shopView.appendChild(drawBtn);

        const cardContainer = document.createElement('div');
        cardContainer.id = 'skillshop-card-container';
        Object.assign(cardContainer.style, {
            display: 'flex',
            gap: '10px',
            marginTop: '20px',
            justifyContent: 'center',
            pointerEvents: 'auto'
        });
        shopView.appendChild(cardContainer);

        drawBtn.onclick = () => this.drawRandomCards(cardContainer);

        const back = document.createElement('div');
        back.id = 'city-skillshop-back';
        back.innerText = '←';
        Object.assign(back.style, {
            position: 'absolute',
            top: '20px',
            left: '20px',
            padding: '10px 15px',
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            cursor: 'pointer',
            borderRadius: '5px'
        });
        back.onclick = () => {
            shopView.remove();
            container.style.backgroundImage = '';
            grid.style.display = 'grid';
        };
        shopView.appendChild(back);
    }

    drawRandomCards(container) {
        container.innerHTML = '';
        const skillIds = Object.keys(skillCardDatabase);
        const grades = ['NORMAL', 'RARE', 'EPIC', 'LEGENDARY'];
        for (let i = 0; i < 5; i++) {
            const id = skillIds[Math.floor(Math.random() * skillIds.length)];
            const grade = grades[Math.floor(Math.random() * grades.length)];
            skillInventoryManager.addSkillById(id, grade);
            const data = skillInventoryManager.getSkillData(id, grade);
            const card = SkillCardManager.createCardElement(data);
            card.style.opacity = '0';
            card.style.transition = 'opacity 0.5s';
            container.appendChild(card);
            setTimeout(() => (card.style.opacity = '1'), i * 100);
        }
    }

    showTavern() {
        const grid = document.getElementById('city-grid');
        grid.style.display = 'none';
        const container = document.getElementById('city-container');
        container.style.backgroundImage = 'url(assets/images/territory/tavern-scene.png)';
        container.style.backgroundSize = 'cover';

        const tavernView = document.createElement('div');
        tavernView.id = 'city-tavern-view';
        tavernView.style.pointerEvents = 'auto';
        container.appendChild(tavernView);

        const back = document.createElement('div');
        back.id = 'city-tavern-back';
        back.innerText = '←';
        Object.assign(back.style, {
            position: 'absolute',
            top: '20px',
            left: '20px',
            padding: '10px 15px',
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            cursor: 'pointer',
            borderRadius: '5px'
        });
        back.onclick = () => {
            tavernView.remove();
            container.style.backgroundImage = '';
            grid.style.display = 'grid';
        };
        tavernView.appendChild(back);

        const hireBtn = document.createElement('div');
        hireBtn.className = 'tavern-button';
        hireBtn.style.backgroundImage = `url(assets/images/territory/party-icon.png)`;
        hireBtn.style.marginTop = '80px';
        hireBtn.innerText = '용병 고용';
        hireBtn.style.color = 'white';
        hireBtn.style.textAlign = 'center';
        hireBtn.style.lineHeight = '120px';
        hireBtn.onclick = () => this.showCandidates(tavernView);
        tavernView.appendChild(hireBtn);
    }

    showCandidates(parent) {
        let list = document.getElementById('mercenary-list');
        if (list) list.remove();
        list = document.createElement('div');
        list.id = 'mercenary-list';
        Object.assign(list.style, {
            marginTop: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            pointerEvents: 'auto'
        });
        parent.appendChild(list);

        const mercenaryTypes = Object.values(mercenaryData);
        for (let i = 0; i < 5; i++) {
            const base = mercenaryTypes[Math.floor(Math.random() * mercenaryTypes.length)];
            const candidate = mercenaryEngine.generateMercenary(base);
            const panel = document.createElement('div');
            Object.assign(panel.style, {
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: 'white',
                padding: '10px',
                cursor: 'pointer'
            });
            const portrait = document.createElement('img');
            portrait.src = candidate.uiImage;
            portrait.style.width = '64px';
            portrait.style.height = '64px';
            portrait.style.marginRight = '10px';
            panel.appendChild(portrait);

            const info = document.createElement('div');
            const mbti = this.mbtiToString(candidate.mbti);
            const synergies = Object.values(candidate.synergies).filter(Boolean).join(', ');
            info.innerHTML = `
                <div>${candidate.instanceName} (${candidate.name}) Lv.${candidate.level}</div>
                <div>MBTI: ${mbti}</div>
                <div>시너지: ${synergies}</div>
                <div>특성: ${candidate.traits.join(', ')}</div>
                <div>비용: 100</div>`;
            panel.appendChild(info);

            panel.onclick = () => {
                if (goldManager.spend(100)) {
                    mercenaryEngine.hireGeneratedMercenary(candidate);
                    panel.remove();
                    updateGoldPanel();
                } else {
                    alert('골드가 부족합니다.');
                }
            };

            list.appendChild(panel);
        }
        updateGoldPanel();
    }

    mbtiToString(mbtiObj) {
        const pairs = [['E','I'],['S','N'],['T','F'],['J','P']];
        return pairs.map(([a,b]) => (mbtiObj[a] >= mbtiObj[b] ? a : b)).join('');
    }

    createBackButton() {
        const backButton = document.createElement('div');
        backButton.id = 'city-back-button';
        backButton.innerText = '← 월드맵으로';
        Object.assign(backButton.style, {
            position: 'absolute',
            top: '20px',
            left: '20px',
            padding: '10px 15px',
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'white',
            cursor: 'pointer',
            borderRadius: '5px',
            pointerEvents: 'auto'
        });

        backButton.onclick = () => {
            this.scene.start('WorldMapScene');
        };

        return backButton;
    }
}
