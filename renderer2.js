const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', (event) => {
    // 暂时记录玩家卡组数据
    let tempPlayerDeck = {}
    let socket = null;
    // 根据html的不同，加载不同的场景
    let currentScene = null;

    console.log('Loaded scene2.html');
                
    // 显示正在连接服务器
    alert('正在连接服务器');
    let sceneSwitchButton = document.createElement('button');
    sceneSwitchButton.id = 'sceneSwitchButton';
    sceneSwitchButton.innerText = '返回';
    sceneSwitchButton.addEventListener('click', switchScene);
    document.getElementById('app').appendChild(sceneSwitchButton);

    buildSocket().then(newSocket => {
        socket = newSocket;
        // 如果连接成功，则关闭正在连接服务器的窗口
        alert('连接成功，确认以开始匹配');
        sendMessage(socket, 'deckData', { deck : tempPlayerDeck, name : localStorage.getItem('playerName') });

        // 添加一个文字，内容是匹配中...，并且这三个点点点有一定的动画效果来告诉玩家当前游戏没有卡死，是在匹配中的
        // 创建一个新的div元素来显示"匹配中..."文本
        let matchingText = document.createElement('div');
        matchingText.id = 'matching-text';
        matchingText.innerHTML = '匹 配 中 <span>.</span> <span>.</span> <span>.</span>';


        // 将新的div元素添加到body中
        document.getElementById('app').appendChild(matchingText);


        // 添加一个监听器来等待服务器发送开始游戏的信息
        socket.addEventListener('message', event => {
            const data = JSON.parse(event.data);
            if (data.type === 'startGame') {
                // 删除匹配文本和返回按钮
                document.getElementById('app').removeChild(matchingText);
                document.getElementById('app').removeChild(sceneSwitchButton);

                // 添加新的投降按钮
                let surrenderButton = document.createElement('button');
                surrenderButton.id = 'surrenderButton';
                surrenderButton.innerText = '投降';
                surrenderButton.addEventListener('click', () => surrender(socket));
                document.getElementById('app').appendChild(surrenderButton);

                // 加载战斗场景
                currentScene = new SceneBattle();
                currentScene.render();
                Scene.instances = [];
                Scene.instances.push(currentScene);
                
                // 判断先手后手
                if (!data.moveFirst){
                    currentScene.gameInfo.changeTurn(false);
                }

                // 按照data.data中给的数据来生成所有的unit, data.data = [{id:x,pos:{x:x,y:x}},{id:x,pos:{x:x,y:x}}...]
                data.data.forEach(unitData => {
                    spawnIDUnitAtPos(unitData.pos.x, unitData.pos.y, unitData.id, true);
                });
                tempPlayerDeck.forEach(unitData => {
                    spawnIDUnitAtPos(unitData.pos.x, unitData.pos.y, unitData.id, false);
                });

                currentScene.gameInfo.updateEnemyName(data.enemyName);
                currentScene.gameInfo.updateCost();
                
                currentScene.battlefield.updateRightBottomElement();
            }
            // 监听move type的消息，如果,data.data = { from: { x: 1, y: 4 }, to: { x: 3, y: 4 } }，按照消息的格式进行移动
            else if (data.type === 'move') {
                if (data.data){
                    let from = data.data.from;
                    let to = data.data.to;

                    let unitClick = currentScene.battlefield.getCell(from.x,from.y).unit;
                    let cell = currentScene.battlefield.getCell(to.x,to.y);
                    checkMouseUp(unitClick, cell, true, data.data.range);
                }
                Scene.instances[0].gameInfo.changeTurn();
            }
            else if (data.type === 'endGame') {
                // 游戏结束
                if (data.data.win) {
                    alert(data.data.mes + 'You win!');
                } else {
                    alert('You lose!');
                }
                ipcRenderer.send('switch-scene', 'scene1.html');
            }
        });
        

    }).catch(error => {
        // 如果连接失败，则显示错误消息
        alert(`连接失败: ${error.message}`);
        // 转回准备场景
        ipcRenderer.send('switch-scene', 'scene1.html');
    });



    Scene.instances.push(currentScene);

    function switchScene() {
        ipcRenderer.send('switch-scene', 'scene1.html');
    }

    let unitClick = null;
    let cells = [];
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
                // console.log('Clicked on cell');
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
                    // console.log('Clicked on unit');
                    unitClick = unit;
                    break;
                }
            }
        }
        
        // 渲染攻击范围
        cells = [];
        if (unitClick){
            cells = Scene.instances[0].battlefield.renderAttackRange(unitClick);
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
            checkMouseUp(unitClick, cell);
        }

        // 取消攻击范围渲染
        if (cells.length > 0) {
            cells.forEach(cell => {
                cell.element.classList.remove('unit-cell-attack');
                cell.element.classList.remove('unit-cell-move');
                cell.maskElement.classList.remove('unit-cell-noblock');
                cell.maskElement.classList.remove('unit-cell-range');
                cell.maskElement.classList.remove('unit-cell-first');
            });
        }
    }); 

    document.addEventListener('mouseover', (e) => {
        // 检查鼠标悬停的cell
        let cellHover = null;
        for (let i = 0; i < UnitCell.instances.length; i++) {
            const cell = UnitCell.instances[i];
            const rect = cell.element.getBoundingClientRect();
            // 检查鼠标位置是否在单元格内
            if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                cellHover = cell;
                break;
            }
        }

        if (cellHover && cellHover.parentField instanceof UnitBattleField) {
            Scene.instances[0].battlefield.draw(cellHover);
        }
    });

    document.addEventListener('mouseout', (e) => {
        // 鼠标移出时，清空unitFieldPreview
        if (Scene.instances[0] && Scene.instances[0].unitFieldPreview) {
            Scene.instances[0].battlefield.cleanCanvas();
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
                    tempPlayerDeck.push({ id: data[i], pos: { x, y } });
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
            unit.render();
            unit.element.classList.add('in-battle');
            battlefield.element.appendChild(unit.element);  // 渲染这个 Unit
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
    }

    function checkMouseUp(unitClick, cell, from_enemy = false, from_range = false) {
        let successMove = false;
        const fromCell = unitClick.parentCell;
        const toCell = cell;
        if (from_enemy){
            if (cell && unitClick){
                if (cell.unit){
                    cell.unit.destroy();
                }
                else{
                }
                successMove = true;
            }
            else{
                // unitClick.revertPosition();
                console.log('opponent makes an invalid move');
            }
        }
        else if (unitClick.isEnemy){
            // unitClick.revertPosition();
        }
        else {
            if (cell && unitClick && Scene.instances[0].gameInfo.isYourTurn && cell.parentField instanceof UnitBattleField){
                // 如果cell上已经有unit
                if (cell.unit){
                    // 攻击是否合法
                    if (cell.element.classList.contains('unit-cell-attack') && cell.unit.isEnemy !== unitClick.isEnemy){
                        cell.unit.destroy();
                        successMove = true;
                    }
                }
                // 如果cell上没有unit
                else{
                    // 移动是否合法
                    if (cell.element.classList.contains('unit-cell-move')){
                        successMove = true;
                    } 
                }
            }
        }
        
        if (successMove){
            // 移出之前标记的from  to，并且添加新的from to标记
            const classList = ['from', 'to', 'mark-enemy', 'mark-yourself'];
            for (let i = 0; i < classList.length; i++){
                document.querySelectorAll(`.${classList[i]}`).forEach((element) => {
                    element.classList.remove(classList[i]);
                });
            }
            fromCell.replayElement.classList.add('from');
            toCell.replayElement.classList.add('to');
            if (from_enemy){
                fromCell.replayElement.classList.add('mark-enemy');
                toCell.replayElement.classList.add('mark-enemy');
            }
            else{
                fromCell.replayElement.classList.add('mark-yourself');
                toCell.replayElement.classList.add('mark-yourself');
            }

            // 检查unit是否会进行升变(prompt)，也就是检查非heavy的unit是否到了对方的底线。
            let prompt = false;
            if (unitClick.promptID){
                if (unitClick.isEnemy){
                    if (cell.y === 7){
                        prompt = true;
                    }
                }
                else{
                    if (cell.y === 0){
                        prompt = true;
                    }
                }
            }
            
            // 移动
            unitClick.firstMove = false;
            
            // 远程攻击逻辑 + 信息发送
            if (cell.maskElement.classList.contains('unit-cell-range') || from_range){
                if (!from_enemy) makeNewMove(socket, unitClick, cell, true);
                unitClick.revertPosition();
            }
            else{
                if (!from_enemy) makeNewMove(socket, unitClick, cell);
                cell.setUnit(unitClick);
            }

            // 晋升逻辑
            if (prompt){
                const x = unitClick.isEnemy;
                unitClick.destroy();
                spawnIDUnitAtPos(cell.x, cell.y, unitClick.promptID, x);
                Scene.instances[0].gameInfo.updateCost();
            }
            
            // 更新右下角信息
            Scene.instances[0].battlefield.updateRightBottomElement();
        }
        else {
            unitClick.revertPosition();
        }
    }

    
});

function buildSocket() {
    return new Promise((resolve, reject) => {
        let socket = new WebSocket('ws://58.87.96.41:8080');
        
        socket.onopen = function(e) {
            resolve(socket);
        };

        socket.onerror = function(error) {
            console.error('WebSocket error: ', JSON.stringify(error, null, 2));
            reject(error);
        };
    });
}

// 等待匹配

function sendMessage(socket, type, data) {
    const message = JSON.stringify({ type, data });
    socket.send(message);
}

function makeNewMove(socket, unit, cell, range = false) {
    let type = 'move';
    let data = {from:{ x: unit.parentCell.x, y: unit.parentCell.y},
    to: {x: cell.x, y:cell.y},
    range: range};
    const message = JSON.stringify({ type, data });

    socket.send(message);
    Scene.instances[0].gameInfo.changeTurn();
    checkEndGame(socket);
}

function checkEndGame(socket){
    if (Scene.instances[0].gameInfo.playerCost <= 0){
        sendMessage(socket, 'endGame', {win: false, mes: '对方士气过低！'});
    }
    else if (Scene.instances[0].gameInfo.opponentCost <= 0){
        sendMessage(socket, 'endGame', {win: true, mes: '对方士气过低！'});
    }
}

function surrender(socket){
    sendMessage(socket, 'endGame', {win: false, mes: '对方投降了！'});
}



