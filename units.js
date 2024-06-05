const { stat } = require("original-fs");

const unitStats = {
    // pawn
    1: { 
        cost: 0, 
        isHeavy: false,
        promptID: 2,
        actLogic: (() => {
            let flags = {};
            flags['0,-1'] = 'move';
            flags['0,-2'] = 'move+first'
            flags['1,-1'] = 'attack';
            flags['-1,-1'] = 'attack';
            return flags;
        })(),
        describe: "",
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
        })(),
        describe: "",
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
                flags[`${-i},0`] = 'move+attack';
            }
            return flags;
        })(),
        describe: "",
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
        })(),
        describe: "回合开始时如果没有王，则会-2士气",
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
                flags[`${-i},0`] = 'move+attack';
            }
            return flags;
        })(),
        describe: "",
    },
    // knight
    6: { 
        cost: 6, 
        isHeavy: true,
        actLogic: (() => {
            let flags = {};
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    if (i * j === 0) continue;
                    else {
                        flags[`${i*2},${j}`] = 'move+attack+noblock';
                        flags[`${i},${j*2}`] = 'move+attack+noblock';
                    }
                }
            }
            return flags;
        })(),
        describe: "",
    },
    // 添加更多id和对应的攻击、生命值、形状
    // archer
    7: { 
        cost: 0, 
        isHeavy: false,
        promptID: 8,
        actLogic: (() => {
            let flags = {};
            flags['0,1'] = 'move';
            flags['1,-1'] = 'move';
            flags['-1,-1'] = 'move';
            flags['2,-2'] = 'move+first';
            flags['-2,-2'] = 'move+first';
            flags['0,-2'] = 'range+attack';
            return flags;
        })(),
        describe: "",
    },
    // ranger
    8: { 
        cost: 6, 
        isHeavy: true,
        actLogic: (() => {
            let flags = {};
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    if (i * j === 0) {
                        flags[`${i},${j}`] = 'move+attack';
                    }
                    else {
                        flags[`${i*2},${j*2}`] = 'range+attack';
                    }
                }
            }
            return flags;
        })(),
        describe: "",
    },
    // axeman
    9: { 
        cost: 1, 
        isHeavy: false,
        promptID: 10,
        actLogic: (() => {
            let flags = {};
            flags['0,-1'] = 'move';
            flags['1,-1'] = 'attack';
            flags['-1,-1'] = 'attack';
            flags['-1,0'] = 'attack';
            flags['1,0'] = 'attack';
            return flags;
        })(),
        describe: "",
    },
    // berserker
    10: { 
        cost: 8, 
        isHeavy: true,
        actLogic: (() => {
            let flags = {};
            flags['0,-1'] = 'move+attack';
            flags['0,-2'] = 'move+attack';
            flags['0,1'] = 'move+attack';
            flags['0,2'] = 'move+attack';
            flags['1,0'] = 'move+attack';
            flags['2,0'] = 'move+attack';
            flags['-1,0'] = 'move+attack';
            flags['-2,0'] = 'move+attack';
            flags['-3,0'] = 'attack';
            flags['3,0'] = 'attack';
            flags['0,-3'] = 'attack';
            flags['0,3'] = 'attack';
            flags['1,-1'] = 'attack';
            flags['-1,-1'] = 'attack';
            flags['-1,1'] = 'attack';
            flags['1,1'] = 'attack';
            return flags;
        })(),
        describe: "",
    },
    // spearman
    11: { 
        cost: 1, 
        isHeavy: false,
        promptID: 12,
        actLogic: (() => {
            let flags = {};
            flags['0,-1'] = 'move+attack';
            flags['0,-2'] = 'attack';
            return flags;
        })(),
        describe: "",
    },
    // legionary
    12: {
        cost: 8,
        isHeavy: true,
        actLogic: (() => {
            let flags = {};
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    flags[`${i},${j}`] = 'move+attack';
                    flags[`${i*2},${j*2}`] = 'attack';
                }
            }
            return flags;
        })(),
        describe: "",
    },
    // swordman
    13: {
        cost: 1,
        isHeavy: false,
        promptID: 14,
        actLogic: (() => {
            let flags = {};
            flags['0,-1'] = 'move+attack';
            flags['1,0'] = 'attack';
            flags['-1,0'] = 'attack';
            flags['-2,-2'] = 'move+first';
            flags['2,-2'] = 'move+first';
            return flags;
        })(),
        describe: "",
    },
    // warrior
    14: {
        cost: 7,
        isHeavy: true,
        actLogic: (() => {
            let flags = {};
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    flags[`${i},${j}`] = 'move+attack';
                    if (i * j === 0){
                        flags[`${i*2},${j*2}`] = 'move+attack';
                    }
                }
            }
            return flags;
        })(),
        describe: "",
    },
    // dragon
    15: {
        cost: 15,
        isHeavy: true,
        actLogic: (() => {
            let flags = {};
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    flags[`${i},${j}`] = 'move+attack';
                    if (i * j === 0){
                        flags[`${i*2},${j*2}`] = 'move+attack';
                    }
                    else {
                        flags[`${i*2},${j}`] = 'move+attack+noblock';
                        flags[`${i},${j*2}`] = 'move+attack+noblock';
                    }
                }
            }
            return flags;
        })(),
        describe: "",
    },
    // demon
    16: {
        cost: 10,
        isHeavy: true,
        actLogic: (() => {
            let flags = {};
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    if (i * j === 0){
                        flags[`${i},${j}`] = 'move+attack';
                        flags[`${i*2},${j*2}`] = 'move+attack';
                        flags[`${i*3},${j*3}`] = 'move+attack';
                        flags[`${i*4},${j*4}`] = 'move+attack';
                    }
                    else {
                        flags[`${i*2},${j}`] = 'move+noblock';
                        flags[`${i},${j*2}`] = 'move+noblock';
                    }
                }
            }
            return flags;
        })(),
        describe: "",
    },
    // drake
    17: {
        cost: 4,
        isHeavy: false,
        actLogic: (() => {
            let flags = {};
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    if (i * j === 0){
                        flags[`${i},${j}`] = 'move+attack';
                        flags[`${i*2},${j*2}`] = 'attack';
                    }
                    else {
                        flags[`${i*2},${j*2}`] = 'move+noblock';
                    }
                }
            }
            return flags;
        })(),
        describe: "",
    },
    // firemage
    18: {
        cost: 10,
        isHeavy: true,
        actLogic: (() => {
            let flags = {};
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    flags[`${i},${j}`] = 'range+attack';
                    if (i * j === 0){
                        flags[`${i*2},${j*2}`] = 'move';
                        flags[`${i*3},${j*3}`] = 'move+noblock';
                    }
                    else {
                        flags[`${i*3},${j*2}`] = 'move+noblock';
                        flags[`${i*2},${j*3}`] = 'move+noblock';
                    }
                }
            }
            return flags;
        })(),
        describe: "",
    },
    // ninja
    19: {
        cost: 13,
        isHeavy: true,
        actLogic: (() => {
            let flags = {};
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    flags[`${i},${j}`] = 'move+attack';
                    if (i * j === 0){
                        flags[`${i*3},${j*3}`] = 'move+attack+noblock';
                    }
                    else {
                        flags[`${i*2},${j*2}`] = 'move+attack+noblock';
                    }
                }
            }
            return flags;
        })(),
        describe: "",
    },
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
        this.describeText = stats.describe;

        // 如果stats里面有promptID，就把它赋值给unit
        if (stats.promptID){
            this.promptID = stats.promptID;
        }

        this.id = id;
        this.isEnemy = false;
        this.draggable = true;
        this.parentCell = null;
        this.firstMove = true;

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