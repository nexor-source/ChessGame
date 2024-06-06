class GameInfo {
    constructor() {
        this.enemyName = 'Opponent'
        this.yourName = localStorage.getItem('playerName');
        this.nowPlayerName = 'You';
        this.isYourTurn = true;
        this.remainingTime = 'inf';
        this.playerCost = 0;
        this.opponentCost = 0;
        this.playerCostDelta = 0;
        this.opponentCostDelta = 0;
        this.round = 0;
        this.element = document.createElement('div');
        this.element.className = 'gameinfo'
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
        this.nowPlayerName = this.isYourTurn ? this.yourName : this.enemyName;
        this.nowPlayerName = this.nowPlayerName + (this.isYourTurn ? '(You)' : '(Opponent)');
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
            if (!unit.isDead){
                if (unit.isEnemy) {
                    this.opponentCost += unit.cost;
                } else {
                    this.playerCost += unit.cost;
                }
            }
        });
        // 额外改变，可能不止王一种棋子
        this.playerCost += this.playerCostDelta;
        this.opponentCost += this.opponentCostDelta;

        this.render();
    }

    updateEnemyName(name) {
        this.enemyName = name;
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
            document.getElementById('app').appendChild(element);
        });
    }

    clear() {
        UnitCell.instances = [];
        Unit.instances = [];
        this.elements.forEach(element => {
            document.getElementById('app').removeChild(element);
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
        this.unitFieldPreview = new UnitAttackPreviewField();
        const player = new Player();

        this.addElement(this.unitFieldPreview.render());
        this.addElement(this.unitFieldPlayer.render());
        this.addElement(this.unitStore.render());
        this.addElement(player.updateGold(10));
    }
}

class SceneBattle extends Scene {
    constructor() {
        super();

        this.battlefield = new UnitBattleField();
        this.gameInfo = new GameInfo();
        this.unitFieldPreview = new UnitAttackPreviewField();
        this.graveyard = new UnitGraveyard();

        this.addElement(this.graveyard.render());
        this.addElement(this.unitFieldPreview.render());
        this.addElement(this.battlefield.render());
        this.addElement(this.gameInfo.render());
    }

    // 提供一个方法来获取 UnitBattleField
    getBattleField() {
        return this.battlefield;
    }
}

Scene.instances = [];