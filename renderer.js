const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', (event) => {
    // 按钮事件绑定
    document.getElementById('sceneSwitchButton').addEventListener('click', switchScene);
    document.getElementById('spawnRandomUnit').addEventListener('click', spawnRandomUnit);

    // 根据html的不同，加载不同的场景
    const currentURL = window.location.href;
    let currentScene = null;
    if (currentURL.includes('scene1.html')) {
        console.log('Loaded scene1.html');
        currentScene = new ScenePrepare();
        currentScene.render();
        currentScene.unitStore.randomizeUnits();
    } 
    else if (currentURL.includes('scene2.html')) {
        console.log('Loaded scene2.html');
        currentScene = new SceneBattle();
        currentScene.render();
    }

    Scene.instances.push(currentScene);
    
    function switchScene() {
        // const currentWindow = remote.getCurrentWindow();
        Scene.instances = [];
        if (currentScene instanceof ScenePrepare) {
            ipcRenderer.send('switch-scene', 'scene2.html');
        } else {
            ipcRenderer.send('switch-scene', 'scene1.html');
        }
    }

    // function switchScene() {
    //     Scene.instances = [];
    //     currentScene.clear();
    //     // document.removeAllListeners();
    //     if (currentScene instanceof ScenePrepare) {
    //         // 如果是准备阶段，切换到战斗阶段，同时会将准备场景中的UnitField类中的所有unit移动到战斗场景中

    //         // 获取 ScenePrepare 中的 UnitField 的所有单元格
    //         const matrix = currentScene.unitFieldPlayer.matrix;
            
    //         currentScene = new SceneBattle();
    //         currentScene.render();

    //         // 遍历matrix中的每一个单元格，如果是null则跳过，否则在对应的位置生成一个新的Unit
    //         for (let y = 0; y < matrix.length; y++) {
    //             for (let x = 0; x < matrix[y].length; x++) {
    //                 const unit = matrix[y][x].getUnit();
    //                 if (unit) {
    //                     spawnIDUnitAtPos(x, 6 + y, unit.id);
    //                 }
    //             }
    //         }
    //     } else {
    //         currentScene = new ScenePrepare();
    //         currentScene.render();
    //         currentScene.unitStore.randomizeUnits();
    //     }
        
    //     Scene.instances.push(currentScene);
    // }

    let cellClick = null;
    let unitClick = null;
    let cells = null;
    let startX, startY;
    let mouseDown = false;
    document.addEventListener('mousedown', (e) => {
        // 获取鼠标位置
        mouseDown = true;
        startX = e.clientX;
        startY = e.clientY;
    
        // 检查点击的cell
        cellClick = null;
        for (let i = 0; i < UnitCell.instances.length; i++) {
            const cell = UnitCell.instances[i];
            const rect = cell.element.getBoundingClientRect();
            // 检查鼠标位置是否在单元格内
            if (startX >= rect.left && startX <= rect.right && startY >= rect.top && startY <= rect.bottom) {
                console.log('Clicked on cell');
                cellClick = cell;
                break;
            }
        }

        // 检查点击的Unit
        unitClick = null;
        for (let i = 0; i < Unit.instances.length; i++) {
            const unit = Unit.instances[i];
            const rect = unit.element.getBoundingClientRect();
            // 检查鼠标位置是否在Unit内
            if (startX >= rect.left && startX <= rect.right && startY >= rect.top && startY <= rect.bottom) {
                console.log('Clicked on unit');
                unitClick = unit;
                break;
            }
        }
        
        // 只在currentScene 是 currentScene SceneBattle的时候才渲染攻击范围
        cells = null;
        if (unitClick){
            if (unitClick.parentCell && Scene.instances[0] instanceof SceneBattle) {
                cells = unitClick.parentCell.parentField.getsurroundingCells(unitClick.parentCell.x, unitClick.parentCell.y);
                cells.forEach(cell => {
                    // 随机赋予以下几个class中的一个或者两个，[unit-cell-attack, unit-cell-move]
                    let random_class_list = ['unit-cell-attack', 'unit-cell-move'];
                    let random_class = random_class_list[Math.floor(Math.random() * random_class_list.length)];
                    cell.element.classList.add(random_class);
                    random_class = random_class_list[Math.floor(Math.random() * random_class_list.length)];
                    cell.element.classList.add(random_class);  
                });
            }
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (!mouseDown) return;
        // 如果选中了unit，就移动unit
        if (unitClick) {
            // 获取 unitClick 元素的当前 transform 值
            let transform = window.getComputedStyle(unitClick.element).transform;
    
            // 解析 transform 值来获取 unitClick 元素的当前位置
            let matrix = new WebKitCSSMatrix(transform);
            let currentX = matrix.m41;
            let currentY = matrix.m42;
    
            // 计算偏移量
            offsetX = currentX + e.clientX - startX;
            offsetY = currentY + e.clientY - startY;
    
            // 更新 startX 和 startY 的值
            startX = e.clientX;
            startY = e.clientY;
    
            // 移动 unitClick 元素
            unitClick.element.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
        }
    });

    document.addEventListener('mouseup', (e) => {
        mouseDown = false;
        if (unitClick){
            // 拖动结束后，寻找unit所处的cell
            let cell = UnitCell.instances.find(cell => {
                return (
                    cell._isInside(unitClick.element, cell.element)
                );
            });
            
            // 如果找到了cell
            if (cell){
                // 如果cell上已经有unit
                if (cell.unit){
                    // 如果是战斗场景，则判断是否可以进行攻击
                    if (Scene.instances[0] instanceof SceneBattle){
                        if (cell.element.classList.contains('unit-cell-attack')){
                            cell.unit.destroy();
                            cell.setUnit(unitClick);
                        }
                        else{
                            // 非法位置回溯
                            unitClick.revertPosition();
                        }
                    }
                    // 如果不是战斗场景，则直接回溯
                    else{
                        unitClick.revertPosition();
                    }
                }
                // 如果cell上没有unit
                else{
                    // 如果是战斗场景，则判断是否可以移动
                    if (Scene.instances[0] instanceof SceneBattle){
                        if (cell.element.classList.contains('unit-cell-move')){
                            cell.setUnit(unitClick);
                        }
                        else{
                            // 非法位置回溯
                            unitClick.revertPosition();
                        }
                    }
                    // 如果不是战斗场景，则直接移动
                    else{
                        cell.setUnit(unitClick);
                    }
                }
            }
            // 如果没有找到cell, 则回溯
            else{
                unitClick.revertPosition();
            }

            // 取消攻击范围渲染
            if (cells) {
                cells.forEach(cell => {
                    cell.element.classList.remove('unit-cell-attack');
                    cell.element.classList.remove('unit-cell-move');
                });
            }


        }
    });

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
        const unit = new Unit(Math.floor(Math.random() * 3)+1);  // 创建一个新的 Unit

        // 如果是战场才会生成
        if (currentScene instanceof SceneBattle) {
            const battlefield = currentScene.getBattleField();

            battlefield.element.appendChild(unit.render());  // 渲染这个 Unit
            const emptyCells = battlefield.getEmptyCells();
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            randomCell.setUnit(unit);
        }
    }
    
});
