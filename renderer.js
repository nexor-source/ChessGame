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


    let currentScene = new ScenePrepare();
    currentScene.render();

    function switchScene() {
        currentScene.clear();
        if (currentScene instanceof ScenePrepare) {
            currentScene = new SceneBattle();
        } else {
            currentScene = new ScenePrepare();
        }
        currentScene.render();
    }

    // const numberOfUnits = 3;  // 你想要的 Unit 数量

    // for (let i = 0; i < numberOfUnits; i++) {
    //     const unit = new Unit(i + 1);  // 创建一个新的 Unit
    //     document.body.appendChild(unit.render());  // 渲染这个 Unit
    // }

    // 在5秒后执行 unitStore.randomizeUnits()
    setTimeout(() => {
        player.updateGold(20);
    }, 5000);
});
