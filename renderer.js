const { ipcRenderer } = require('electron');



window.addEventListener('DOMContentLoaded', (event) => {
    
    // 按钮事件绑定
    document.getElementById('sceneSwitchButton').addEventListener('click', switchScene);
    document.getElementById('spawnRandomUnit').addEventListener('click', spawnRandomUnit);

    // 暂时记录玩家卡组数据
    let tempPlayerDeck = {}
    let socket = null;
    // 根据html的不同，加载不同的场景
    const currentURL = window.location.href;
    let currentScene = null;
    if (currentURL.includes('scene1.html')) {
        console.log('Loaded scene1.html');
        currentScene = new ScenePrepare();
        currentScene.render();
        currentScene.unitStore.generateUnits();
        currentScene.unitFieldPlayer.loadPreset();
    }

    else if (currentURL.includes('scene2.html')) {
        console.log('Loaded scene2.html');
                
        // 显示正在连接服务器
        alert('正在连接服务器');
        buildSocket().then(newSocket => {
            socket = newSocket;
            // 如果连接成功，则关闭正在连接服务器的窗口
            alert('连接成功，确认以开始匹配');
            sendMessage(socket, 'deckData', tempPlayerDeck);
            // 添加一个监听器来等待服务器发送开始游戏的信息
            socket.addEventListener('message', event => {
                const data = JSON.parse(event.data);
                if (data.type === 'startGame') {
                    currentScene = new SceneBattle();
                    currentScene.render();
                    Scene.instances = [];
                    Scene.instances.push(currentScene);
                    // 按照data.data中给的数据来生成所有的unit, data.data = [{id:x,position:{x:x,y:x}},{id:x,position:{x:x,y:x}}...]
                    data.data.forEach(unitData => {
                        spawnIDUnitAtPos(unitData.position.x, unitData.position.y, unitData.id, true);
                    });
                    tempPlayerDeck.forEach(unitData => {
                        spawnIDUnitAtPos(unitData.position.x, unitData.position.y, unitData.id, false);
                    });
                }
            });

        }).catch(error => {
            // 如果连接失败，则显示错误消息
            alert(`连接失败: ${error.message}`);
            // 转回准备场景
            ipcRenderer.send('switch-scene', 'scene1.html');
        });
    }


    
    Scene.instances.push(currentScene);

    function switchScene() {
        if (currentScene instanceof ScenePrepare) {
            // 记录玩家选择的unitid
            UnitStore.playerdeck = [];
            let totalCost = 0;
            let hasKing = false;
            // 遍历unitfield中的所有的unit的id添加到UnitStore.playerdeck中，如果那一行没有id的话就是放入-1的id
            for (let y = 0; y < currentScene.unitFieldPlayer.matrix.length; y++) {
                for (let x = 0; x < currentScene.unitFieldPlayer.matrix[y].length; x++) {
                    const unit = currentScene.unitFieldPlayer.matrix[y][x].getUnit();
                    if (unit) {
                        UnitStore.playerdeck.push(unit.id);
                        totalCost += unit.cost;
                        if (unit.id === 4){
                            hasKing = true;
                        }
                    }
                    else {
                        UnitStore.playerdeck.push(-1);
                    }
                }
            }

            // 检查是否满足条件
            if (UnitStore.playerdeck.includes(-1) || !hasKing || totalCost >= 50) {
                alert('玩家deck不满足要求，请检查:[是否已填满]，[是否包含王]，[是否所有cost之和小于50]');
                return;
            }

            Scene.instances = [];
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
                            if (logic.includes('noblock')){
                                cell.maskElement.classList.add('unit-cell-move', 'unit-cell-noblock');
                            }
                            else {
                                // 计算cell和unitClick的parentCell之间的x,y坐标差
                                let dx = cell.x - unitClick.parentCell.x;
                                let dy = cell.y - unitClick.parentCell.y;

                                // 检查cell和unitClick的parentCell之间是否有其他unit
                                let blocked = false;
                                for (let i = 1; i < Math.max(Math.abs(dx), Math.abs(dy)); i++){
                                    let targetCell = unitClick.parentCell.parentField.getCell(unitClick.parentCell.x + Math.sign(dx) * i, unitClick.parentCell.y + Math.sign(dy) * i);
                                    if (targetCell.unit){
                                        blocked = true;
                                        break;
                                    }
                                }
                                if (!blocked){
                                    cell.maskElement.classList.add('unit-cell-move');
                                }
                            }
                        }
                        // attack在logic中
                        if (logic.includes('attack')){
                            if (logic.includes('noblock')){
                                cell.maskElement.classList.add('unit-cell-attack', 'unit-cell-noblock');
                            }
                            else {
                                // 计算cell和unitClick的parentCell之间的x,y坐标差
                                let dx = cell.x - unitClick.parentCell.x;
                                let dy = cell.y - unitClick.parentCell.y;
                                
                                // 检查cell和unitClick的parentCell之间是否有其他unit
                                let blocked = false;
                                for (let i = 1; i < Math.max(Math.abs(dx), Math.abs(dy)); i++){
                                    let targetCell = unitClick.parentCell.parentField.getCell(unitClick.parentCell.x + Math.sign(dx) * i, unitClick.parentCell.y + Math.sign(dy) * i);
                                    if (targetCell.unit){
                                        blocked = true;
                                        break;
                                    }
                                }
                                if (!blocked){
                                    cell.maskElement.classList.add('unit-cell-attack');
                                }
                            }
                        }
                        cells.push(cell);
                    }
                }
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

            // 分成两个场景来单独写，战斗场景成功的移动需要给服务器发送json消息，type是move，data是{from:{x:x,y:y}, to:{x:x,y:y}}
            // 如果是战斗场景
            if (Scene.instances[0] instanceof SceneBattle){
                // 如果找到了cell
                if (cell){
                    // 如果cell上已经有unit
                    if (cell.unit){
                        // 攻击是否合法
                        if (cell.maskElement.classList.contains('unit-cell-attack') && cell.unit.isEnemy !== unitClick.isEnemy){
                            cell.unit.destroy();
                            makeNewMove(socket, unitClick, cell);
                            cell.setUnit(unitClick);
                        } else{
                            unitClick.revertPosition();
                        }
                    }
                    // 如果cell上没有unit
                    else{
                        // 移动是否合法
                        if (cell.maskElement.classList.contains('unit-cell-move')){
                            makeNewMove(socket, unitClick, cell);
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
                        cell.maskElement.classList.remove('unit-cell-attack');
                        cell.maskElement.classList.remove('unit-cell-move');
                        cell.maskElement.classList.remove('unit-cell-noblock');
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
            // 清空 tempPlayerDeck
            tempPlayerDeck = [];
            // 遍历接收到的数据，生成位置记录
            for (let i = 0; i < data.length; i++) {
                if (data[i] != -1) {
                    const x = i % 8;
                    const y = 6 + Math.floor(i / 8);
                    tempPlayerDeck.push({ id: data[i], position: { x, y } });
                    // 半永久记录卡组数据
                }
            }
        }
    });

    function spawnIDUnitAtPos(x, y, unit_id, is_enemy = false) {
        const unit = new Unit(unit_id);  // 创建一个新的 Unit
        if (is_enemy){
            unit.setEnemy();
        }
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

function buildSocket() {
    return new Promise((resolve, reject) => {
        let socket = new WebSocket('ws://localhost:8080');

        socket.onopen = function(e) {
            resolve(socket);
        };

        socket.onerror = function(error) {
            reject(error);
        };
    });
}

// 等待匹配


function sendMessage(socket, type, data) {
    const message = JSON.stringify({ type, data });
    socket.send(message);
}

function makeNewMove(socket, unit, cell) {
    let type = 'move';
    let data = {from:{ x: unit.parentCell.x, y: unit.parentCell.y},
    to: {x: cell.x, y:cell.y}}
    const message = JSON.stringify({ type, data });
    socket.send(message);
}