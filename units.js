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
    
        element.addEventListener('mousedown', (e) => {
            mouseDown = true;
            startX = e.clientX - offsetX;
            startY = e.clientY - offsetY;
        });
    
        document.addEventListener('mousemove', (e) => {
            if (!mouseDown) return;
            offsetX = e.clientX - startX;
            offsetY = e.clientY - startY;
            element.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
        });
    
        document.addEventListener('mouseup', () => {
            mouseDown = false;
            if (this.parentCell){
                this.parentCell.attachUnit(this);
            }
        });
    }
}

Unit.instances = [];  // 定义并初始化静态属性