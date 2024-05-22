window.addEventListener('DOMContentLoaded', (event) => {
    // 创建两个新的 UnitField 实例
    // // const unitFieldShow = new UnitField();
    // const unitFieldPlayer = new UnitField();
    // const unitStore = new UnitStore();
    // const player = new Player();


    // // 渲染这两个 UnitField
    // player.updateGold(10);
    // // document.body.appendChild(unitFieldShow.render(id = 'unit-field-show'));
    // document.body.appendChild(unitFieldPlayer.render(id = 'unit-field-player'));
    // document.body.appendChild(unitStore.render());
    // unitStore.randomizeUnits();

    document.getElementById('sceneSwitchButton').addEventListener('click', switchScene);
    document.getElementById('spawnRandomUnit').addEventListener('click', spawnRandomUnit);

    let currentScene = new SceneBattle();
    Scene.instances.push(currentScene);
    currentScene.render();

    function switchScene() {
        Scene.instances = [];
        currentScene.clear();
        if (currentScene instanceof ScenePrepare) {
            // 如果是准备阶段，切换到战斗阶段，同时会将准备场景中的UnitField类中的所有unit移动到战斗场景中

            // 获取 ScenePrepare 中的 UnitField 的所有单元格
            const matrix = currentScene.unitFieldPlayer.matrix;

            currentScene = new SceneBattle();
            currentScene.render();

            // 遍历matrix中的每一个单元格，如果是null则跳过，否则在对应的位置生成一个新的Unit
            for (let y = 0; y < matrix.length; y++) {
                for (let x = 0; x < matrix[y].length; x++) {
                    const unit = matrix[y][x].getUnit();
                    if (unit) {
                        spawnIDUnitAtPos(x, 6 + y, unit.id);
                    }
                }
            }

        } else {
            currentScene = new ScenePrepare();
            currentScene.render();
            currentScene.unitStore.randomizeUnits();
        }
        Scene.instances.push(currentScene);
    }

    function spawnIDUnitAtPos(x, y, unit_id) {
        const unit = new Unit(unit_id);  // 创建一个新的 Unit
        // 如果是战场才会生成
        if (currentScene instanceof SceneBattle) {
            const battlefield = currentScene.getBattleField();

            battlefield.element.appendChild(unit.render());  // 渲染这个 Unit
            const targetCell = battlefield.getCell(x, y);
            targetCell.setUnit(unit);
        }
    }

    function spawnRandomUnit() {
        const unit = new Unit(1);  // 创建一个新的 Unit

        // 如果是战场才会生成
        if (currentScene instanceof SceneBattle) {
            const battlefield = currentScene.getBattleField();

            battlefield.element.appendChild(unit.render());  // 渲染这个 Unit
            const emptyCells = battlefield.getEmptyCells();
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            randomCell.setUnit(unit);
        }
        
        // document.body.dispatchEvent(clickEvent); 
    }

    // const numberOfUnits = 3;  // 你想要的 Unit 数量

    // for (let i = 0; i < numberOfUnits; i++) {
    //     const unit = new Unit(i + 1);  // 创建一个新的 Unit
    //     document.body.appendChild(unit.render());  // 渲染这个 Unit
    // }

    // // 在5秒后执行 unitStore.randomizeUnits()
    // setTimeout(() => {
    //     player.updateGold(20);
    // }, 5000);

    // 在body上触发点击事件
    let clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: false,
        view: window
    });
    
});
