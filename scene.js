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

        this.addElement(this.battlefield.render());
        this.addElement(text);
    }

    // 提供一个方法来获取 UnitBattleField
    getBattleField() {
        return this.battlefield;
    }
}

Scene.instances = [];