const { stat } = require("original-fs");

const unitStats = {
    // pawn
    1: { 
        cost: 0, 
        isHeavy: false,
        actLogic: (() => {
            let flags = {};
            flags['0,-1'] = 'move';
            flags['1,-1'] = 'attack';
            flags['-1,-1'] = 'attack';
            return flags;
        })()
    },
    // bishop
    2: { 
        cost: 10,
        isHeavy: true, 
        actLogic: (() => {
            let flags = {};
            for (let i = -7; i <= 7; i++) {
                if (i === 0) continue;
                flags[`${i},${i}`] = 'move+attack';
                flags[`${i},${-i}`] = 'move+attack';
                flags[`${-i},${i}`] = 'move+attack';
                flags[`${-i},${-i}`] = 'move+attack';
            }
            return flags;
        })()
    },
    // queen
    3: { 
        cost: 21, 
        isHeavy: true,
        actLogic: (() => {
            let flags = {};
            // 横向、纵向
            for (let i = -7; i <= 7; i++) {
                if (i === 0) continue;
                flags[`${i},${i}`] = 'move+attack';
                flags[`${i},${-i}`] = 'move+attack';
                flags[`${-i},${i}`] = 'move+attack';
                flags[`${-i},${-i}`] = 'move+attack';
                flags[`0,${i}`] = 'move+attack';
                flags[`0,${-i}`] = 'move+attack';
                flags[`${i},0`] = 'move+attack';
                flags[`${-i},`] = 'move+attack';
            }
            return flags;
        })()
    },
    // king
    4: { 
        cost: 23, 
        isHeavy: true,
        actLogic: (() => {
            let flags = {};
            // 周围8个方向
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    flags[`${i},${j}`] = 'move+attack';
                }
            }
            return flags;
        })()
    },
    // rook
    5: { 
        cost: 12, 
        isHeavy: true,
        actLogic: (() => {
            let flags = {};
            // 横向
            for (let i = -7; i <= 7; i++) {
                if (i === 0) continue;
                flags[`0,${i}`] = 'move+attack';
                flags[`0,${-i}`] = 'move+attack';
                flags[`${i},0`] = 'move+attack';
                flags[`${-i},`] = 'move+attack';
            }
            return flags;
        })()
    },
    // knight
    6: { 
        cost: 6, 
        isHeavy: true,
        actLogic: (() => {
            let flags = {};
            // 走日字
            flags['1,2'] = 'move+attack+noblock';
            flags['1,-2'] = 'move+attack+noblock';
            flags['-1,2'] = 'move+attack+noblock';
            flags['-1,-2'] = 'move+attack+noblock';
            flags['2,1'] = 'move+attack+noblock';
            flags['2,-1'] = 'move+attack+noblock';
            flags['-2,1'] = 'move+attack+noblock';
            flags['-2,-1'] = 'move+attack+noblock';
            return flags;
        })()
    },
    // 添加更多id和对应的攻击、生命值、形状
};

class Unit {
    constructor(id) {
        const stats = unitStats[id];
        if (!stats) {
            throw new Error(`Invalid unit id: ${id}`);
        }

        // this.attack = '🗡' + stats.attack;
        // this.health = stats.health + '❤️';
        this.shape = stats.shape;
        this.cost = stats.cost;
        this.actLogic = stats.actLogic;
        this.isHeavy = stats.isHeavy;

        this.id = id;
        this.isEnemy = false;
        this.draggable = true;
        this.parentCell = null;

        this.element = document.createElement('div');
        this.element.className = 'unit';
        Unit.instances.push(this);
    }

    // 设置敌方unit 
    setEnemy() {
        this.isEnemy = true;
        // this.draggable = false;
        this.element.classList.add('unit-enemy');
    }

    // 位置回溯
    revertPosition() {
        if (this.parentCell) {
            this.parentCell.attachUnit(this);
        }
    }

    // 添加一个方法用于摧毁unit
    destroy() {
        if (this.parentCell) {
            this.parentCell.element.classList.remove('unit-cell-filled');
            this.parentCell.setUnit(null);
            console.log('destroyed unit', this.id);
        }
        this.element.remove();
        const index = Unit.instances.indexOf(this);
        if (index > -1) {
            Unit.instances.splice(index, 1);
        }
        // 更新UI中的cost之和
        if (Scene.instances[0] instanceof SceneBattle && Scene.instances[0].gameInfo) {
            // 如果是king被吃了
            if (this.id === 4) {
                if (this.isEnemy) {
                    Scene.instances[0].gameInfo.changeKingDead(true);
                }
                else {
                    Scene.instances[0].gameInfo.changeKingDead(false);
                }
            }
            Scene.instances[0].gameInfo.updateCost();
        }
    }

    render() {
        const shapeElement = document.createElement('img');  // 修改为img元素
        shapeElement.src = `unit_pics/${this.id}.png`;  // 设置图片的URL，假设图片名与shape的值相同
        shapeElement.className = `unit-shape`;
        // 重子轻子判断
        if (this.isHeavy) {
            this.element.classList.add('unit-heavy');
        }
        // const attackElement = document.createElement('div');
        // attackElement.textContent = this.attack;
        // attackElement.className = 'unit-attack';

        // const healthElement = document.createElement('div');
        // healthElement.textContent = this.health;
        // healthElement.className = 'unit-health';

        const costElement = document.createElement('div');
        costElement.textContent = this.cost;
        costElement.className = 'unit-cost';
         

        this.element.appendChild(costElement);
        this.element.appendChild(shapeElement);
        // this.element.appendChild(attackElement);
        // this.element.appendChild(healthElement);

        // this.makeDraggable(this.element);

        

        return this.element;
    }
}

Unit.instances = [];  // 定义并初始化静态属性