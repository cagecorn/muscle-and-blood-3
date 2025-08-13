import { Scene } from 'https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.esm.js';

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
        Object.assign(cityContainer.style, {
            position: 'absolute',
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            pointerEvents: 'none'
        });

        const grid = this.createGrid();
        this.populateGrid(grid);

        cityContainer.appendChild(grid);
        document.getElementById('app').appendChild(cityContainer);

        const backButton = this.createBackButton();
        cityContainer.appendChild(backButton);

        this.events.on('shutdown', () => {
            const existing = document.getElementById('city-container');
            if (existing) {
                existing.remove();
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
            cell.style.gridRowStart = `${Math.floor(positions[index] / 3) + 1}`;
            cell.style.gridColumnStart = `${(positions[index] % 3) + 1}`;
            cell.style.display = 'flex';
            cell.style.flexDirection = 'column';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';

            const iconElement = document.createElement('div');
            iconElement.className = 'building-icon';
            iconElement.style.backgroundImage = `url(assets/images/territory/${iconData.icon}.png)`;
            iconElement.style.width = '120px';
            iconElement.style.height = '120px';

            const label = document.createElement('div');
            label.innerText = iconData.name;
            Object.assign(label.style, {
                textAlign: 'center',
                color: 'white',
                marginTop: '10px',
                fontSize: '20px',
                textShadow: '1px 1px 2px black'
            });

            cell.appendChild(iconElement);
            cell.appendChild(label);
            grid.appendChild(cell);
        });
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
            borderRadius: '5px'
        });

        backButton.onclick = () => {
            this.scene.start('WorldMapScene');
        };

        return backButton;
    }
}
