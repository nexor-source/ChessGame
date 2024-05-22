class Player {
    constructor() {
        this.gold = 0;  // 初始化金币数量为0
        this.goldElement = document.createElement('div');
        this.goldElement.id = 'gold-amount';
        this.renderGold();
    }

    // 更新金币数量
    updateGold(amount) {
        this.gold = amount;
        return this.renderGold();
    }

    // 更新显示的金币数量
    renderGold() {
        this.goldElement.textContent = this.gold + '💰';
        return this.goldElement;
    }
}