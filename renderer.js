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
        Scene.instances = [];
        if (currentScene instanceof ScenePrepare) {
            // 记录玩家选择的unitid
            UnitStore.playerdeck = [];
            // 遍历unitfield中的所有的unit的id添加到UnitStore.playerdeck中，如果那一行没有id的话就是放入-1的id
            for (let y = 0; y < currentScene.unitFieldPlayer.matrix.length; y++) {
                for (let x = 0; x < currentScene.unitFieldPlayer.matrix[y].length; x++) {
                    const unit = currentScene.unitFieldPlayer.matrix[y][x].getUnit();
                    if (unit) {
                        UnitStore.playerdeck.push(unit.id);
                    }
                    else {
                        UnitStore.playerdeck.push(-1);
                    }
                }
            }
            // 输出Unitstore.playerdeck来检查是否正确
            ipcRenderer.send('send-deck-data', UnitStore.playerdeck);
            ipcRenderer.send('switch-scene', 'scene2.html');
        } else {
            ipcRenderer.send('switch-scene', 'scene1.html');
        }
    }

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
                if (unit.draggable) {
                    console.log('Clicked on unit');
                    unitClick = unit;
                    break;
                }
            }
        }
        
        // 渲染攻击范围
        cells = [];
        if (unitClick){
            if (unitClick.parentCell && Scene.instances[0] instanceof SceneBattle) {
                // 获取unitClick的actlogic
                let actLogic = unitClick.actLogic;
                // 遍历actlogic中的所有key
                for (let key in actLogic){
                    let [dx, dy] = key.split(',').map(Number);
                    let cell = unitClick.parentCell.parentField.getCell(unitClick.parentCell.x + dx, unitClick.parentCell.y + dy);
                    // 将actlogic[key]按照'+'分割
                    const logic = actLogic[key].split('+');
                    if (cell){
                        // move在logic中
                        if (logic.includes('move')){
                            cell.element.classList.add('unit-cell-move');
                        }
                        // attack在logic中
                        if (logic.includes('attack')){
                            cell.element.classList.add('unit-cell-attack');
                        }
                        cells.push(cell);
                    }
                }
                
                // cells = unitClick.parentCell.parentField.getsurroundingCells(unitClick.parentCell.x, unitClick.parentCell.y);
                // cells.forEach(cell => {
                //     // 随机赋予以下几个class中的一个或者两个，[unit-cell-attack, unit-cell-move]
                //     let random_class_list = ['unit-cell-attack', 'unit-cell-move'];
                //     let random_class = random_class_list[Math.floor(Math.random() * random_class_list.length)];
                //     cell.element.classList.add(random_class);
                //     random_class = random_class_list[Math.floor(Math.random() * random_class_list.length)];
                //     cell.element.classList.add(random_class);  
                // });
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

            // 分成两个场景来单独写
            // 如果是战斗场景
            if (Scene.instances[0] instanceof SceneBattle){
                // 如果找到了cell
                if (cell){
                    // 如果cell上已经有unit
                    if (cell.unit){
                        // 攻击是否合法
                        if (cell.element.classList.contains('unit-cell-attack') && cell.unit.isEnemy !== unitClick.isEnemy){
                            cell.unit.destroy();
                            cell.setUnit(unitClick);
                        } else{
                            unitClick.revertPosition();
                        }
                    }
                    // 如果cell上没有unit
                    else{
                        // 移动是否合法
                        if (cell.element.classList.contains('unit-cell-move')){
                            cell.setUnit(unitClick);
                        } else{
                            unitClick.revertPosition();
                        }
                    }
                }
                // 如果没有找到cell, 则回溯
                else{
                    unitClick.revertPosition();
                }

                // 取消攻击范围渲染
                if (cells.length > 0) {
                    cells.forEach(cell => {
                        cell.element.classList.remove('unit-cell-attack');
                        cell.element.classList.remove('unit-cell-move');
                    });
                }
            }

            // 如果不是战斗场景
            else if (Scene.instances[0] instanceof ScenePrepare){
                // 如果找到了cell
                if (cell){
                    // 如果拖到商店
                    if (cell.parentField instanceof UnitStore){
                        // 如果是来自商店的unit，则回溯
                        if (unitClick.parentCell.parentField instanceof UnitStore){
                            unitClick.revertPosition();
                        }
                        // 如果是来自玩家的unit，则删除
                        if (unitClick.parentCell.parentField instanceof UnitField){
                            unitClick.destroy();
                        }
                    }
                    // 如果拖到玩家的格子
                    if (cell.parentField instanceof UnitField){
                        // 检查重轻子类型和cell类型是否匹配
                        if ((unitClick.isHeavy && cell.x === 0) || (!unitClick.isHeavy && cell.x === 1)){
                            unitClick.revertPosition();
                        }
                        // 如果是来自商店的unit，则创建一个和自己id一样的unit绑定到那个格子
                        else if (unitClick.parentCell.parentField instanceof UnitStore){
                            if (cell.unit){
                            }
                            else{
                                let unit = new Unit(unitClick.id);
                                unit.render();
                                cell.element.appendChild(unit.element);
                                cell.attachUnit(unit);
                                cell.setUnit(unit);
                            }
                            unitClick.revertPosition();
                        }
                        // 如果是来自玩家的unit
                        else if (unitClick.parentCell.parentField instanceof UnitField){
                            if (cell.unit){
                                cell.swapUnit(unitClick.parentCell);
                            }
                            else{
                                cell.setUnit(unitClick);
                            }
                        }
                    }



                    // // 如果是来自商店的unit
                    // if (unitClick.parentCell.parentField instanceof UnitStore){
                    //     // 如果拖到商店，就回溯
                    //     if (cell.parentField instanceof UnitStore){
                    //         unitClick.revertPosition();
                    //     }
                    //     // 如果拖到玩家的格子，则回溯，并且创建一个和自己id一样的unit绑定到那个格子
                    //     if (cell.parentField instanceof UnitField){
                    //         unitClick.revertPosition();
                    //         let unit = new Unit(unitClick.id);
                    //         unit.render();
                    //         cell.element.appendChild(unit.element);
                    //         cell.attachUnit(unit);
                    //         cell.setUnit(unit);
                    //     }
                    // }
                    // // 如果是来自玩家deck的unit
                    // if (unitClick.parentCell.parentField instanceof UnitField){
                    //     // 如果拖到商店，就删除
                    //     if (cell.parentField instanceof UnitStore){
                    //         unitClick.destroy();
                    //     }
                    //     // 如果拖到自己的格子
                    //     if (cell.parentField instanceof UnitField){
                    //         // 位置互换
                    //         if (cell.unit){
                    //             cell.swapUnit(unitClick.parentCell);
                    //         }
                    //         // 直接放置
                    //         else{
                    //             cell.setUnit(unitClick);
                    //         }
                    //     }
                    // }
                }
                // 如果没有找到cell
                else{
                    // 如果是来自商店的unit，则回溯
                    if (unitClick.parentCell.parentField instanceof UnitStore){
                        unitClick.revertPosition();
                    }
                    // 如果是来自玩家deck的unit，则删掉
                    else if (unitClick.parentCell.parentField instanceof UnitField){
                        unitClick.destroy();
                    }
                }
                Scene.instances[0].unitFieldPlayer.UpdateCost();
            }
        }
    }); 

    // 在新的渲染进程中，接收卡组数据
    ipcRenderer.on('receive-deck-data', (event, data) => {
        if (data){
            for (let i = 0; i < data.length; i++) {
                if (data[i] != -1) {
                    spawnIDUnitAtPos(i % 8, 6 + Math.floor(i / 8), data[i]);
                }
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
        const unit = new Unit(Math.floor(Math.random() * 6)+1);  // 创建一个新的 Unit
        unit.setEnemy();
        // 如果是战场才会生成
        if (currentScene instanceof SceneBattle) {
            const battlefield = currentScene.getBattleField();
    
            battlefield.element.appendChild(unit.render());  // 渲染这个 Unit
            const emptyCells = battlefield.getEmptyCells();
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            randomCell.setUnit(unit);
        }
    
        // else if (currentScene instanceof ScenePrepare){
        //     currentScene.unitStore.randomizeUnits();
        // }
    }
});

