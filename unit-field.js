class UnitCell {  
    constructor(x = 0, y = 0, parentField = null) {
        this.unit = null;
        this.element = null;
        this.x = x;
        this.y = y;
        this.parentField = parentField;
        UnitCell.instances.push(this);

        this.element = document.createElement('div');
        this.element.className = 'unit-cell';

        // 创建一个新的元素来显示单位数量
        this.unitCountElement = document.createElement('div');
        this.unitCountElement.className = 'unit-count';
        this.unitCountElement.textContent = '0'; // 默认为0
        // 让用户无法选中
        this.unitCountElement.style.userSelect = 'none';
        this.element.appendChild(this.unitCountElement);
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

        // 由于unit被销毁，因此布局产生了变化，需要重新绑定所有unit，延迟100ms执行
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
        if (unit === null) {
            this.unitCountElement.textContent = '0';
        } else {
            this.unitCountElement.textContent = unit.id;
        }
        
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

    render() {
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

class UnitField extends UnitContainer {
    constructor() {
        super([
            [new UnitCell(), new UnitCell(), new UnitCell(), new UnitCell(), new UnitCell(), new UnitCell(), new UnitCell(), new UnitCell()],
            [new UnitCell(), new UnitCell(), new UnitCell(), new UnitCell(), new UnitCell(), new UnitCell(), new UnitCell(), new UnitCell()]
        ]);
    }
    
    render(id = '') {        
        this.element = document.createElement('div');
        this.element.className = 'unit-field';
        this.element.id = id;
        for (let y = 0; y < 2; y++) {
            for (let x = 0; x < 8; x++) {
                const cell = this.getCell(x, y);
                this.element.appendChild(cell.render());
            }
        }
        return this.element;
    }
}

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
                this.element.appendChild(cell.render());
            }
        }
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
}

class UnitStore extends UnitContainer {
    constructor() {
        super([
            [new UnitCell(), new UnitCell(), new UnitCell(), new UnitCell(), new UnitCell(), new UnitCell()]
        ]);
        this.unitNums = 6;
        this.element = document.createElement('div');
        this.element.className = 'unit-store';
        this.element.id = '';
    }
    
    randomizeUnits() {
        // for (let x = 0; x < this.unitNums; x++) {
        //     const cell = this.getCell(x, 0);
        //     cell.setUnit(new Unit(Math.floor(Math.random() * 3) + 1));
        // }
        for (let i = 0; i < 5; i++) {
            let unit = new Unit(Math.floor(Math.random() * 3) + 1);  // 创建一个新的 Unit
            unit.render();
            document.getElementsByClassName('unit-store')[0].appendChild(unit.element);  // 渲染这个 Unit
            this.matrix[0][i].setUnit(unit);
        }
    }

    render() {        
        for (let x = 0; x < this.unitNums; x++) {
            const cell = this.getCell(x, 0);
            this.element.appendChild(cell.render());
        }
        return this.element;
    }
}