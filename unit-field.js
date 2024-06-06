class UnitCell {  
    constructor(x = 0, y = 0, parentField = null) {
        this.unit = null;
        this.x = x;
        this.y = y;
        this.parentField = parentField;
        UnitCell.instances.push(this);

        this.element = document.createElement('div');
        this.element.className = 'unit-cell';

        // 创建一个新的元素来显示单位数量
        // this.unitCountElement = document.createElement('div');
        // this.unitCountElement.className = 'unit-count';
        // this.unitCountElement.textContent = '0'; // 默认为0

        // 创建一个遮罩图形，用于攻击特效展示
        this.maskElement = document.createElement('div');
        this.maskElement.classList.add('mask-base');

        // 创建一个遮罩图形，用于行动回放
        this.replayElement = document.createElement('div');
        this.replayElement.classList.add('replay-base');
        
        // 让用户无法选中
        // this.unitCountElement.style.userSelect = 'none';
        // this.element.appendChild(this.unitCountElement);
    }

    destroy() {
        if (this.unit) {
            this.unit.destroy();
        }
        this.element.remove();
        const index = UnitCell.instances.indexOf(this);
        if (index > -1) {
            UnitCell.instances.splice(index, 1);
        }

        // 由于unit被销毁，因此布局产生了变化，需要重新绑定所有unit
        Unit.instances.forEach(unit => {
            unit.attachToCell();
        });
    }

    // unit吸附到unit-cell上
    attachUnit(unit) {
        // 获取 unit 的边界矩形和尺寸
        const unitRect = unit.element.getBoundingClientRect();

        // 计算 unit 的中心点
        const unitCenterX = unitRect.left + unitRect.width / 2;
        const unitCenterY = unitRect.top + unitRect.height / 2;

        const unitCellRect = this.element.getBoundingClientRect();
        const cellCenterX = unitCellRect.left + unitCellRect.width / 2;
        const cellCenterY = unitCellRect.top + unitCellRect.height / 2;

        // 计算中心点的坐标差
        const deltaX = cellCenterX - unitCenterX;
        const deltaY = cellCenterY - unitCenterY;

        // 更新 unit 的位置
        unit.element.style.left = (parseFloat(unit.element.style.left) || 0) + deltaX + 'px';
        unit.element.style.top = (parseFloat(unit.element.style.top) || 0) + deltaY + 'px';
    }

    // 判断child的中心点是否在parent内部
    _isInside(child, parent) {
        var childRect = child.getBoundingClientRect();
        var parentRect = parent.getBoundingClientRect();
    
        // 计算 child 的中心点
        var childCenterX = childRect.left + childRect.width / 2;
        var childCenterY = childRect.top + childRect.height / 2;
    
        return (
            childCenterX >= parentRect.left &&
            childCenterX <= parentRect.right &&
            childCenterY >= parentRect.top &&
            childCenterY <= parentRect.bottom
        );
    }

    getUnit() {
        return this.unit;
    }

    setUnit(unit) {
        this.unit = unit;

        // 更新单位数量
        // if (unit) {
        //     this.unitCountElement.textContent = unit.id;
        // } else {
        //     this.unitCountElement.textContent = '0';
        // }
        
        if (unit){
            if (unit.parentCell && unit.parentCell !== this) {
                unit.parentCell.setUnit(null);
            }
            unit.parentCell = this;
            this.attachUnit(unit);
            this.element.classList.add('unit-cell-filled');  // 添加类
        } else {
            this.element.classList.remove('unit-cell-filled');  // 移除类
        }
    }

    // 与另一个格子交换unit
    swapUnit(cell) {
        // 更新单位数量
        // this.unitCountElement.textContent = cell.unit.id;
        // cell.unitCountElement.textContent = this.unit.id;
        this.attachUnit(cell.unit);
        cell.attachUnit(this.unit);
        
        // 更新父母
        this.unit.parentCell = cell;
        cell.unit.parentCell = this;

        // 更新cell的unit
        const temp = this.unit;
        this.unit = cell.unit;
        cell.unit = temp;
    }

    // 创建右下角攻防数量显示
    createRightBottomElement() {
        // 创建右下角的元素
        this.rightBottomElement = document.createElement('div');
        this.rightBottomElement.className = 'right-bottom-blue';
        this.rightBottomElement.textContent = ''; // 你可以根据需要设置文本内容
        this.element.appendChild(this.rightBottomElement);
    }

    // 判断和另一个格子之间是否有unit
    hasUnitBetween(cell) {
        // 计算两个cell之间的x,y坐标差
        let dx = cell.x - this.x;
        let dy = cell.y - this.y;

        // 检查两个cell之间是否有其他unit
        for (let i = 1; i < Math.max(Math.abs(dx), Math.abs(dy)); i++){
            let targetCell = this.parentField.getCell(this.x + Math.sign(dx) * i, this.y + Math.sign(dy) * i);
            if (targetCell.unit){
                return true;
            }
        }
        return false;
    }

    render() {
        
        this.element.appendChild(this.maskElement);
        this.element.appendChild(this.replayElement);

        if (this.unit) {
            this.element.appendChild(this.unit.render());
        }
        
        return this.element;
    }
}

UnitCell.instances = [];  // 定义并初始化静态属性

class UnitContainer {
    constructor(matrix) {
        this.matrix = matrix;
    }
    
    // 返回所有unit
    getUnits() {
        let units = [];
        for (let y = 0; y < this.matrix.length; y++) {
            for (let x = 0; x < this.matrix[y].length; x++) {
                const cell = this.getCell(x, y);
                if (cell.getUnit()) {
                    units.push(cell.getUnit());
                }
            }
        }
        return units;
    }

    getCell(x, y) {
        // 判断是否越界
        if (x < 0 || x >= this.matrix[0].length || y < 0 || y >= this.matrix.length) {
            return null;
        }
        return this.matrix[y][x];
    }

    placeUnit(unit, x, y) {
        const cell = this.getCell(x, y);
        cell.setUnit(unit);
    }

    destroy() {
        // 如果存在 matrix，遍历并销毁所有单元
        if (this.matrix) {
            this.matrix.forEach(unit => {
                if (unit) {
                    unit.destroy();
                }
            });
        }
    }
}

// 玩家的棋子卡组
class UnitField extends UnitContainer {
    constructor() {
        super();
        this.matrix = [];
        for (let i = 0; i < 2; i++) {
            let row = [];
            for (let j = 0; j < 8; j++) {
                row.push(new UnitCell(i, 0, this));
            }
            this.matrix.push(row);
        }
    }

    // 计算所有unit的cost的和，并更新到页面上
    UpdateCost() {
        let cost = 0;
        for (let y = 0; y < 2; y++) {
            for (let x = 0; x < 8; x++) {
                const cell = this.getCell(x, y);
                if (cell.getUnit()) {
                    cost += cell.getUnit().cost;
                }
            }
        }
        Player.instances[0].updateGold(cost);
    }
    
    render(id = '') {        
        this.element = document.createElement('div');
        this.element.className = 'unit-field';
        this.element.id = id;
        for (let y = 0; y < 2; y++) {
            for (let x = 0; x < 8; x++) {
                const cell = this.getCell(x, y);
                if ((x+y)%2===0){
                    cell.element.classList.add('white-cell');
                }else {
                    cell.element.classList.add('black-cell');
                }
                this.element.appendChild(cell.render());
            }
        }
        return this.element;
    }

    // 加载棋子预设
    loadPreset() {
        let matrixID = [1,1,1,1,1,1,1,1, 5,6,2,3,4,2,6,5];
        let playerDeck = JSON.parse(localStorage.getItem('playerDeck')) || matrixID;

        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 8; j++) {
                let unit = new Unit(playerDeck[i*8+j]);  // 创建一个新的 Unit
                unit.render();
                this.matrix[i][j].element.appendChild(unit.element);  // 渲染这个 Unit
                this.matrix[i][j].setUnit(unit);
                this.matrix[i][j].attachUnit(unit);
            }
        }
    }
}

// 战场场地
class UnitBattleField extends UnitContainer {
    constructor() {
        super();
        this.matrix = [];
        for (let i = 0; i < 8; i++) {
            let row = [];
            for (let j = 0; j < 8; j++) {
                row.push(new UnitCell(j, i, this));
            }
            this.matrix.push(row);
        }

        // 创建一个8*8的用于记录【每个格子可以被哪些格子攻击到】的矩阵
        this.attackMatrix = [];
        for (let i = 0; i < 8; i++) {
            let row = [];
            for (let j = 0; j < 8; j++) {
                row.push([]);
            }
            this.attackMatrix.push(row);
        }

        // 绘制攻击线条
        this.canvas = document.createElement('canvas');

    }

    clearAttackMatrix() {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                this.attackMatrix[i][j] = [];
            }
        }
    }

    draw(cellHover) {
        // 如果鼠标悬停在cell上，绘制线条
        if (cellHover) {
            const rect = cellHover.element.getBoundingClientRect();
            const cellCenterX = rect.left + rect.width / 2;
            const cellCenterY = rect.top + rect.height / 2;

            // 遍历attackMatrix[cellHover.y][cellHover.x]，里面全是可以被哪些格子攻击到
            
            // console.log(`可以攻击到的单位数量是${this.attackMatrix[cellHover.y][cellHover.x].length}`)
            for (let i = 0; i < this.attackMatrix[cellHover.y][cellHover.x].length; i++) {
                const cellAtt = this.attackMatrix[cellHover.y][cellHover.x][i];
                const rectAtt = cellAtt.element.getBoundingClientRect();
                const cellCenterXAtt = rectAtt.left + rectAtt.width / 2;
                const cellCenterYAtt = rectAtt.top + rectAtt.height / 2;

                // console.log(`x从${cellCenterXAtt}到${cellCenterX},y从${cellCenterYAtt}到${cellCenterY}`)
                this.drawLine(cellCenterXAtt, cellCenterYAtt, cellCenterX, cellCenterY, cellAtt.getUnit().isEnemy);
            }
        }
    }

    cleanCanvas() {
        const context = this.canvas.getContext('2d');
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawLine(startX, startY, endX, endY, isEnemy = false) {
        // 获取canvas的边界
        const rect = this.canvas.getBoundingClientRect();
    
        // 将坐标转换为canvas的坐标
        const canvasStartX = startX - rect.left;
        const canvasStartY = startY - rect.top;
        const canvasEndX = endX - rect.left;
        const canvasEndY = endY - rect.top;

        const context = this.canvas.getContext('2d');
        if (isEnemy){
            context.strokeStyle = 'red';
        } else {
            context.strokeStyle = 'blue';
        }
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(canvasStartX, canvasStartY);
        context.lineTo(canvasEndX, canvasEndY);
        context.stroke();
        context.closePath();
    }

    updateCanvasSize() {
        // 获取父元素的宽度和高度
        const rect = this.element.getBoundingClientRect();
    
        // 将canvas的宽度和高度设置为与父元素的宽度和高度相同
        this.canvas.width = 870;
        this.canvas.height = 870;
    }

    render(id = '') {
        this.element = document.createElement('div');
        this.element.className = 'unit-battlefield';
        this.element.id = id;
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const cell = this.getCell(x, y);
                if ((x+y)%2===0){
                    cell.element.classList.add('white-cell');
                }else {
                    cell.element.classList.add('black-cell');
                }
                cell.createRightBottomElement();
                this.element.appendChild(cell.render());
            }
        }
        this.element.appendChild(this.canvas);
        this.updateCanvasSize();
        return this.element;
    }

    getsurroundingCells(x, y) {
        let surroundingCells = [];
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                let newX = x + i;
                let newY = y + j;
                if (newX >= 0 && newX < 8 && newY >= 0 && newY < 8) {
                    surroundingCells.push(this.getCell(newX, newY));
                }
            }
        }
        return surroundingCells;
    }

    // 返回所有空着的unitcell
    getEmptyCells() {
        let emptyCells = [];
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const cell = this.getCell(x, y);
                if (!cell.getUnit()) {
                    emptyCells.push(cell);
                }
            }
        }
        return emptyCells;
    }

    // 渲染某个unit的攻击范围，返回渲染的所有cell的list
    renderAttackRange(unitClick) {
        if (unitClick === null) return [];

        let cells = [];
        let delta = 1;
        if (unitClick.isEnemy){
            delta = -1;
        }
        if (unitClick){
            if (unitClick.parentCell && Scene.instances[0] instanceof SceneBattle) {
                // 获取unitClick的actlogic
                let actLogic = unitClick.actLogic;
                const logicWords = ['move', 'attack'];
                let blocked = false;
                // 遍历actlogic中的所有key
                for (let key in actLogic){
                    let [dx, dy] = key.split(',').map(Number);
                    let cell = unitClick.parentCell.parentField.getCell(unitClick.parentCell.x + dx * delta, unitClick.parentCell.y + dy * delta);
                    // 将actlogic[key]按照'+'分割
                    const logic = actLogic[key].split('+');
                    if (cell){                        
                        for (let k = 0; k < logicWords.length; k++){
                            const logicWord = logicWords[k];
                            // 不是第一次行动则不会有first特性块的渲染
                            if (logic.includes('first') && !unitClick.firstMove){
                                continue;
                            }
                            if (logic.includes(logicWord)){
                                if (logic.includes('noblock')){
                                    blocked = false;
                                    cell.maskElement.classList.add('unit-cell-noblock');
                                } else {
                                    blocked = cell.hasUnitBetween(unitClick.parentCell);
                                }
                                // 没有被阻挡，渲染
                                if (!blocked){
                                    cell.element.classList.add(`unit-cell-${logicWord}`);
                                    if (logicWord === 'attack' && logic.includes('range')){
                                        cell.maskElement.classList.add('unit-cell-range');
                                    }
                                    if (logic.includes('first')){
                                        cell.maskElement.classList.add('unit-cell-first');
                                    }
                                }
                            }
                        }
                        cells.push(cell);
                    }
                }
            }
        }
        return cells;
    }

    // 更新所有cell的右下角的数字
    updateRightBottomElement() {
        this.clearAttackMatrix();
        // 初始化一个8*8的矩阵记录每个格子被攻击的次数
        let attackCount = [];
        for (let i = 0; i < 8; i++) {
            let row = [];
            for (let j = 0; j < 8; j++) {
                row.push(0);
            }
            attackCount.push(row);
        }
        // 遍历所有unit，更新attackCount
        const logicWords = ['attack'];
        Unit.instances.forEach(unit => {
                if (unit.parentCell){
                    let x = unit.parentCell.x;
                    let y = unit.parentCell.y;
                    let actLogic = unit.actLogic;
                    let theta = 1;
                    if (unit.isEnemy){
                        theta = -1;
                    }
                    for (let key in actLogic){
                        let [dx, dy] = key.split(',').map(Number);
                        let cell = this.getCell(x + dx * theta, y + dy * theta);
                        const logic = actLogic[key].split('+');
                        if (cell){
                            for (let k = 0; k < logicWords.length; k++){
                                const logicWord = logicWords[k];
                                if (logic.includes('first') && !unit.firstMove){
                                    continue;
                                }
                                if (logic.includes(logicWord)){
                                    if (logic.includes('noblock')){
                                        attackCount[cell.y][cell.x] += theta;
                                        this.attackMatrix[cell.y][cell.x].push(unit.parentCell);
                                    } else {
                                        let blocked = cell.hasUnitBetween(unit.parentCell);
                                        if (!blocked){
                                            attackCount[cell.y][cell.x] += theta;
                                            this.attackMatrix[cell.y][cell.x].push(unit.parentCell);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        );
        // 遍历所有cell，更新右下角的数字
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const cell = this.getCell(x, y);
                if (attackCount[y][x] < 0){
                    cell.rightBottomElement.textContent = Math.abs(attackCount[y][x]);
                    cell.rightBottomElement.className = 'right-bottom-red';
                }
                else if (attackCount[y][x] > 0){
                    cell.rightBottomElement.textContent = Math.abs(attackCount[y][x]);
                    cell.rightBottomElement.className = 'right-bottom-blue';
                }
                else {
                    cell.rightBottomElement.textContent = '';
                    cell.rightBottomElement.className = '';
                }
            }
        }

    }
}

// 可以选择的所有棋子
class UnitStore extends UnitContainer {
    constructor() {
        super();
        this.matrix = [];
        this.rowNum = 4;
        this.colNum = 10;
        for (let i = 0; i < this.rowNum; i++) {
            let row = [];
            for (let j = 0; j < this.colNum; j++) {
                row.push(new UnitCell(0, 0, this));
            }
            this.matrix.push(row);
        }
        this.element = document.createElement('div');
        this.element.className = 'unit-store';
        this.element.id = '';
    }
    
    randomizeUnits() {
        for (let i = 0; i < this.rowNum; i++) {
            for (let j = 0; j < this.colNum; j++) {
                let unit = new Unit(Math.floor(Math.random() * 6) + 1);  // 创建一个新的 Unit
                unit.render();
                this.matrix[i][j].element.appendChild(unit.element);  // 渲染这个 Unit
                this.matrix[i][j].setUnit(unit);
                // 不是我明明在setUnit里面已经attachUnit过了我为什么还要在这里重新attach一次？
                this.matrix[i][j].attachUnit(unit);
            }
        }
    }

    // 顺序按照unitid从1到6生成单位
    generateUnits() {
        let gid = 1;
        for (let i = 0; i < this.rowNum; i++) {
            for (let j = 0; j < this.colNum; j++) {
                if (gid > 19) {
                    break;
                }
                let unit = new Unit(gid);  // 创建一个新的 Unit
                unit.render();
                this.matrix[i][j].element.appendChild(unit.element);  // 渲染这个 Unit
                this.matrix[i][j].setUnit(unit);
                // 不是我明明在setUnit里面已经attachUnit过了我为什么还要在这里重新attach一次？
                this.matrix[i][j].attachUnit(unit);
                gid += 1;
            }
            if (gid > 19) {
                break;
            }
        }
    }
    

    render() {    
        for (let y = 0; y < this.matrix.length; y++) {
            for (let x = 0; x < this.matrix[0].length; x++) {
                const cell = this.getCell(x, y);
                this.element.appendChild(cell.render());
            }
        }    
        return this.element;
    }
}

// 预览棋子的攻击方式
class UnitAttackPreviewField extends UnitContainer {
    constructor() {
        super();
        this.matrix = [];
        this.rowNum = 15;
        this.colNum = 15;
        for (let i = 0; i < this.rowNum; i++) {
            let row = [];
            for (let j = 0; j < this.colNum; j++) {
                row.push(new UnitCell(j, i, this));
            }
            this.matrix.push(row);
        }
        this.element = document.createElement('div');
        this.element.className = 'unit-field-preview';
        this.element.id = '';

        // 添加一个文字元素
        this.textElement = document.createElement('div');
        this.textElement.className = 'describe-text';
        this.constantText = "<span style='color:red'>【红色：仅能攻击】</span><br><span style='color:blue'>【蓝色：仅能移动】</span><br><span style='color:purple'>【紫色：攻击且移动】</span><br><span style='color:green'>【绿色边框：该路径不会被阻挡】</span><br><span style='color:red'>【准心：远程攻击自己不会位移】</span><br><span style='color:lightgray'>【浅色：该棋子第一次行动专属】</span><br><br>"
        this.textElement.innerHTML = this.constantText;
        this.element.appendChild(this.textElement);
    }

    renderAttackRangePreview(unitClick){
        // 渲染unit_selected的攻击范围
        if (unitClick === null) return;

        // 获取unitClick的actlogic
        let actLogic = unitClick.actLogic;
        const logicWords = ['move', 'attack'];
        let blocked = false;
        // 遍历actlogic中的所有key
        for (let key in actLogic){
            let [dx, dy] = key.split(',').map(Number);
            let cell = this.getCell(7 + dx, 7 + dy);
            // 将actlogic[key]按照'+'分割
            const logic = actLogic[key].split('+');
            if (cell){                
                for (let k = 0; k < logicWords.length; k++){
                    const logicWord = logicWords[k];
                    if (logic.includes('first') && !unitClick.firstMove){
                        continue;
                    }
                    if (logic.includes(logicWord)){
                        if (logic.includes('noblock')){
                            blocked = false;
                            cell.maskElement.classList.add('unit-cell-noblock');
                        }
                        // 没有被阻挡，渲染
                        if (!blocked){
                            cell.element.classList.add(`unit-cell-${logicWord}`);
                            if (logicWord === 'attack' && logic.includes('range')){
                                cell.maskElement.classList.add('unit-cell-range');
                            }
                            if (logic.includes('first')){
                                cell.maskElement.classList.add('unit-cell-first');
                            }
                        }
                    }
                }
            }
        }

        // 介绍文字的展示
        this.textElement.innerHTML = this.constantText +  "<strong>" + unitClick.describeText + "</strong>";
    }

    renderCancel(){
        // 清空所有的unit-cell-preview
        for (let y = 0; y < this.rowNum; y++) {
            for (let x = 0; x < this.colNum; x++) {
                const cell = this.getCell(x, y);
                cell.element.classList.remove('unit-cell-attack');
                cell.element.classList.remove('unit-cell-move');
                cell.maskElement.classList.remove('unit-cell-noblock');
                cell.maskElement.classList.remove('unit-cell-range');
                cell.maskElement.classList.remove('unit-cell-first');
            }
        }
        // 介绍文字的取消
        this.textElement.innerHTML = this.constantText;
    }

    render() {    
        for (let y = 0; y < this.matrix.length; y++) {
            for (let x = 0; x < this.matrix[0].length; x++) {
                const cell = this.getCell(x, y);
                cell.render();
                cell.element.classList.add('unit-cell-preview');
                this.element.appendChild(cell.element);
                if (x === 7 && y === 7){
                    cell.element.classList.add('unit-circle');
                }
            }
        }
        return this.element;
    }
}

// 添加unit墓地，在对战场景下被destory的unit会先来到这里（如果为空），如果这里已经有死亡单位了，则真销毁死亡单位，并将新的单位放在这里
class UnitGraveyard extends UnitContainer {
    constructor() {
        super();
        this.matrix = [];
        this.rowNum = 1;
        this.colNum = 1;
        for (let i = 0; i < this.rowNum; i++) {
            let row = [];
            for (let j = 0; j < this.colNum; j++) {
                row.push(new UnitCell(j, i, this));
            }
            this.matrix.push(row);
        }
        this.element = document.createElement('div');
        this.element.className = 'unit-graveyard';
        this.element.id = 'graveyard';
    }

    // 添加新单位到墓地的cell中，如果墓地的cell已满则销毁最早的单位再加入
    addUnit(unit) {
        let cell = this.getCell(0, 0);
        if (cell.getUnit()) {
            cell.getUnit().delete();
        }
        cell.setUnit(unit);
    }

    render() {    
        for (let y = 0; y < this.matrix.length; y++) {
            for (let x = 0; x < this.matrix[0].length; x++) {
                const cell = this.getCell(x, y);
                cell.render();
                cell.maskElement.classList.add('unit-cell-graveyard');
                this.element.appendChild(cell.element);
            }
        }    
        return this.element;
    }
}

// // 记录玩家选择的单位
// UnitStore.playerdeck = [];  // 定义并初始化静态属性