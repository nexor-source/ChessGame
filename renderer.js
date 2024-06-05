window.addEventListener('DOMContentLoaded', (event) => {
    
    document.addEventListener('mouseover', (e) => {
        // 检查鼠标悬停的Unit
        let unitHover = null;
        for (let i = 0; i < Unit.instances.length; i++) {
            const unit = Unit.instances[i];
            const rect = unit.element.getBoundingClientRect();
            // 检查鼠标位置是否在Unit内
            if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                unitHover = unit;
                break;
            }
        }
    
        // 如果鼠标悬停在unit上，调用unitFieldPreview的某个函数
        if (unitHover) {
            Scene.instances[0].unitFieldPreview.renderAttackRangePreview(unitHover);
        }
    });

    document.addEventListener('mouseout', (e) => {
        // 鼠标移出时，清空unitFieldPreview
        if (Scene.instances[0] && Scene.instances[0].unitFieldPreview) {
            Scene.instances[0].unitFieldPreview.renderCancel();
        }
    });
});
