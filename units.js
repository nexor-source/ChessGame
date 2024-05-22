const unitStats = {
    1: { cost: 1, attack: 1, health: 10, shape: 'triangle' },
    2: { cost: 2, attack: 2, health: 20, shape: 'square' },
    3: { cost: 3, attack: 3, health: 30, shape: 'circle' },
    // 添加更多id和对应的攻击、生命值、形状
};

class Unit {
    constructor(id) {
        const stats = unitStats[id];
        if (!stats) {
            throw new Error(`Invalid unit id: ${id}`);
        }

        this.attack = '🗡' + stats.attack;
        this.health = stats.health + '❤️';
        this.shape = stats.shape;
        this.cost = stats.cost;
        this.id = id;
        this.draggable = true;
        this.parentCell = null;
        this.element = null;
        Unit.instances.push(this);
    }

    // 添加一个方法用于摧毁unit
    destroy() {
        if (this.parentCell) {
            this.parentCell.setUnit(null);
            this.parentCell.element.classList.remove('unit-cell-filled');
        }
        this.element.remove();
        const index = Unit.instances.indexOf(this);
        if (index > -1) {
            Unit.instances.splice(index, 1);
        }
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'unit';

        const shapeElement = document.createElement('img');  // 修改为img元素
        shapeElement.src = `unit_pics/${this.id}.png`;  // 设置图片的URL，假设图片名与shape的值相同
        shapeElement.className = `unit-shape`;

        const attackElement = document.createElement('div');
        attackElement.textContent = this.attack;
        attackElement.className = 'unit-attack';

        const healthElement = document.createElement('div');
        healthElement.textContent = this.health;
        healthElement.className = 'unit-health';

        const costElement = document.createElement('div');
        costElement.textContent = this.cost;
        costElement.className = 'unit-cost';
        
        this.element.appendChild(costElement);
        this.element.appendChild(shapeElement);
        this.element.appendChild(attackElement);
        this.element.appendChild(healthElement);

        this.makeDraggable(this.element);

        return this.element;
    }

    makeDraggable(element) {
        if (!this.draggable) return;  // 如果不可拖动，直接返回
    
        let mouseDown = false;
        let startX, startY, offsetX = 0, offsetY = 0;
    
        // 渲染unit可以攻击到的范围的cell
        let cells = null;

        element.addEventListener('mousedown', (e) => {
            mouseDown = true;
            startX = e.clientX - offsetX;
            startY = e.clientY - offsetY;

            // 只在currentScene 是 currentScene SceneBattle的时候才渲染攻击范围
            if (this.parentCell && Scene.instances[0] instanceof SceneBattle) {
                cells = this.parentCell.parentField.getsurroundingCells(this.parentCell.x, this.parentCell.y);
                cells.forEach(cell => {
                    // 随机赋予以下几个class中的一个或者两个，[unit-cell-attack, unit-cell-move]
                    let random_class_list = ['unit-cell-attack', 'unit-cell-move'];
                    let random_class = random_class_list[Math.floor(Math.random() * random_class_list.length)];
                    cell.element.classList.add(random_class);
                    random_class = random_class_list[Math.floor(Math.random() * random_class_list.length)];
                    cell.element.classList.add(random_class);  
                });
            }
        });
    
        // 拖动时的位置变换
        document.addEventListener('mousemove', (e) => {
            if (!mouseDown) return;
            offsetX = e.clientX - startX;
            offsetY = e.clientY - startY;
            element.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
        });
        
        // 非法位置回溯 + 攻击范围渲染的取消
        document.addEventListener('mouseup', () => {
            mouseDown = false;
            // 非法位置回溯
            if (this.parentCell){
                this.parentCell.setUnit(this);
            }
            
            // 取消攻击范围渲染
            if (cells) {
                cells.forEach(cell => {
                    cell.element.classList.remove('unit-cell-attack');
                    cell.element.classList.remove('unit-cell-move');
                });
            }
        });
    }
}

Unit.instances = [];  // 定义并初始化静态属性