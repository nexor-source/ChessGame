const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', (event) => {
    

    ipcRenderer.send('check-tutorial-finished');

    ipcRenderer.on('tutorial-finished-status', (event, arg) => {
        if (!arg) {
            // 加载教程
            const tutorialFolder = 'tutorial/';
            let tutorialImages = ["1.png", "2.png", "3.png"/* ... */];
            let currentImageIndex = 0;
            
            // 创建教程元素
            let tutorialDiv = document.createElement('div');
            tutorialDiv.id = 'tutorial';

            let tutorialImage = document.createElement('img');
            tutorialImage.id = 'tutorial-image';
            tutorialImage.src = tutorialFolder + tutorialImages[currentImageIndex];

            tutorialImage.style.userSelect = 'none';
            tutorialImage.style.pointerEvents = 'none';
            tutorialImage.style.zIndex = 1000;
            tutorialImage.style.position = 'relative';

            tutorialDiv.appendChild(tutorialImage);

            document.body.appendChild(tutorialDiv);
            
            tutorialDiv.addEventListener('click', () => {
                // 点击后，移动到下一张图片
                currentImageIndex++;
        
                // 如果还有更多的教程图片，更新图片
                if (currentImageIndex < tutorialImages.length) {
                tutorialImage.src = tutorialFolder + tutorialImages[currentImageIndex];
                }
                // 否则，隐藏教程
                else {
                tutorialDiv.style.display = 'none';
                ipcRenderer.send('tutorial-finished'); // 发送教程结束消息
                loadOtherElements();
                }
            });
        }
        else {
            loadOtherElements();
        }
    });

    
});

function loadOtherElements() {
    // 匹配按钮添加
    let matchButton = document.createElement('button');
    matchButton.id = 'sceneSwitchButton';
    matchButton.textContent = '匹配';
    document.body.appendChild(matchButton);
    document.getElementById('sceneSwitchButton').addEventListener('click', switchScene);

    // 玩家名称输入处
    let inputElement = document.createElement("input");
    inputElement.type = "text";
    inputElement.id = "playerName";
    inputElement.placeholder = "输入玩家名字";
    inputElement.maxLength = 10;

    document.body.appendChild(inputElement);

    // 如果localStorage中有保存的玩家名字，设置为输入框的默认值
    if(localStorage.getItem('playerName')) {
        inputElement.value = localStorage.getItem('playerName');
    }


    console.log('Loaded scene1.html');
    currentScene = new ScenePrepare();
    currentScene.render();
    currentScene.unitStore.generateUnits();
    currentScene.unitFieldPlayer.loadPreset();
    currentScene.unitFieldPlayer.UpdateCost();

    Scene.instances.push(currentScene);

    function switchScene() {
        // 记录玩家选择的unitid
        UnitStore.playerdeck = [];
        let totalCost = 0;
        let kingNum = 0;
        // 遍历unitfield中的所有的unit的id添加到UnitStore.playerdeck中，如果那一行没有id的话就是放入-1的id
        for (let y = 0; y < currentScene.unitFieldPlayer.matrix.length; y++) {
            for (let x = 0; x < currentScene.unitFieldPlayer.matrix[y].length; x++) {
                const unit = currentScene.unitFieldPlayer.matrix[y][x].getUnit();
                if (unit) {
                    UnitStore.playerdeck.push(unit.id);
                    totalCost += unit.cost;
                    if (unit.id === 4){
                        kingNum += 1;
                    }
                }
                else {
                    UnitStore.playerdeck.push(-1);
                }
            }
        }

        // 检查是否满足条件
        if (UnitStore.playerdeck.includes(-1)){
            alert('玩家卡组必须填满，请检查');
            return;
        }
        else if (!kingNum){
            alert('玩家卡组必须包含国王，请检查');
            return;
        }
        else if (totalCost > 100){
            alert('玩家卡组cost之和不能超过100，请检查');
            return;
        }
        else if (kingNum > 1){
            alert('玩家卡组只能包含一个国王，请检查');
            return;
        }


        Scene.instances = [];
        // 输出Unitstore.playerdeck来检查是否正确
        let playerName = document.getElementById('playerName').value;
        ipcRenderer.send('send-deck-data', UnitStore.playerdeck);
        // 保存玩家名字到localStorage
        localStorage.setItem('playerName', playerName);
        localStorage.setItem('playerDeck', JSON.stringify(UnitStore.playerdeck));
        ipcRenderer.send('switch-scene', 'scene2.html');
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
                else if (cell.parentField instanceof UnitField){
                    // 检查重轻子类型和cell类型是否匹配
                    if ((unitClick.isHeavy && cell.x === 0) || (!unitClick.isHeavy && cell.x === 1)){
                        unitClick.revertPosition();
                    }
                    // 如果是来自商店的unit，则创建一个和自己id一样的unit绑定到那个格子
                    else if (unitClick.parentCell.parentField instanceof UnitStore){
                        // 如果有，就销毁原来的unit
                        if (cell.unit){
                            cell.unit.destroy();
                        }
                        // 放置你从商店拖过来的unit
                        let unit = new Unit(unitClick.id);
                        unit.render();

                        cell.element.appendChild(unit.element);
                        cell.attachUnit(unit);
                        cell.setUnit(unit);
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
                // 拖到了不知名的地方
                else{
                    unitClick.revertPosition();
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
    }); 
}








    


