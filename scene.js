class GameInfo {
    constructor() {
        this.nowPlayerName = 'You';
        this.isYourTurn = true;
        this.remainingTime = 0;
        this.playerCost = 0;
        this.opponentCost = 0;
        this.playerCostDelta = 0;
        this.opponentCostDelta = 0;
        this.round = 0;
        this.element = document.createElement('div');
        this.isKingDead = false;
        this.isKingDeadEnemy = false;
    }

    // 修改king死亡状态
    changeKingDead(isEnemy) {
        if (isEnemy) {
            this.isKingDeadEnemy = true;
        } else {
            this.isKingDead = true;
        }
    }

    render() {
        this.element.id = 'info-box';
        this.element.innerHTML = `
            <p>当前回合: ${this.nowPlayerName}</p>
            <p>剩余时间: ${this.remainingTime}</p>
            <p>我方棋子士气总和: ${this.playerCost}</p>
            <p>敌方棋子士气总和: ${this.opponentCost}</p>
            <p>回合数: ${this.round}</p>
        `;
        return this.element;
    }

    changeTurn(changeRound = true) {
        this.isYourTurn = !this.isYourTurn;
        this.nowPlayerName = this.isYourTurn ? 'You' : 'Opponent';
        if (changeRound) this.round++;
        // 如果某人的回合开始时自己没有王，则costdelta会-2
        if (this.isYourTurn && this.isKingDead) {
            this.updateCostDelta(-2, 0);
        }
        else if (!this.isYourTurn && this.isKingDeadEnemy) {
            this.updateCostDelta(0, -2);
        }
        this.updateCost();
    }

    updateCostDelta(playerCostDeltaChange, opponentCostDeltaChange) {
        this.playerCostDelta += playerCostDeltaChange;
        this.opponentCostDelta += opponentCostDeltaChange;
    }

    updateCost() {
        // 遍历Unit.instances中的所有unit，如果unit.isEnemy为false，则playerCost += unit.cost，否则opponentCost += unit.cost
        this.playerCost = 0;
        this.opponentCost = 0;
        Unit.instances.forEach(unit => {
            if (unit.isEnemy) {
                this.opponentCost += unit.cost;
            } else {
                this.playerCost += unit.cost;
            }
        });
        // 额外改变，可能不止王一种棋子
        this.playerCost += this.playerCostDelta;
        this.opponentCost += this.opponentCostDelta;

        this.render();
    }
}

class Scene {
    constructor() {
        this.elements = [];
    }

    addElement(element) {
        this.elements.push(element);
    }

    render() {
        this.elements.forEach(element => {
            document.body.appendChild(element);
        });
    }

    clear() {
        UnitCell.instances = [];
        Unit.instances = [];
        this.elements.forEach(element => {
            document.body.removeChild(element);
        });
        this.elements = [];
    }
}

class ScenePrepare extends Scene {
    constructor() {
        super();
        // 添加你需要的元素
        this.unitFieldPlayer = new UnitField();
        this.unitStore = new UnitStore();
        const player = new Player();


        this.addElement(this.unitFieldPlayer.render());
        this.addElement(this.unitStore.render());
        this.addElement(player.updateGold(10));
    }
}

class SceneBattle extends Scene {
    constructor() {
        super();
        // 添加一个用于测试的文字
        let text = document.createElement('p');
        text.textContent = '这是战斗阶段';

        this.battlefield = new UnitBattleField();
        this.gameInfo = new GameInfo();

        
        this.addElement(this.battlefield.render());
        this.addElement(this.gameInfo.render());
        this.addElement(text);
    }

    // 提供一个方法来获取 UnitBattleField
    getBattleField() {
        return this.battlefield;
    }
}

Scene.instances = [];