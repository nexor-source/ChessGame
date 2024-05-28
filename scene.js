class GameInfo {
    constructor() {
        this.nowPlayerName = 'You';
        this.isYourTurn = true;
        this.remainingTime = 0;
        this.playerCost = 0;
        this.opponentCost = 0;
        this.round = 0;
        this.element = document.createElement('div');
    }

    render() {
        this.element.id = 'info-box';
        this.element.innerHTML = `
            <p>当前回合: ${this.nowPlayerName}</p>
            <p>剩余时间: ${this.remainingTime}</p>
            <p>我方棋子花费总和: ${this.playerCost}</p>
            <p>敌方棋子花费总和: ${this.opponentCost}</p>
            <p>回合数: ${this.round}</p>
        `;
        return this.element;
    }

    changeTurn(changeRound = true) {
        this.isYourTurn = !this.isYourTurn;
        this.nowPlayerName = this.isYourTurn ? 'You' : 'Opponent';
        if (changeRound) this.round++;
        this.render();
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