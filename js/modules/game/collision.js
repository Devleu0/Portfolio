// =================================================================================
// 게임 충돌 검사 모듈
// =================================================================================

/**
 * Swept AABB 충돌 감지 함수.
 * @param {DOMRect} r1 - 움직이는 사각형의 경계
 * @param {{x:number,y:number}} vel - 움직이는 사각형의 속도 벡터
 * @param {DOMRect} r2 - 고정된 사각형의 경계
 * @returns {{time:number, normal:{x:number,y:number}}}
 */
export function sweptAABB(r1, vel, r2) {
    const broadphaseBox = {
        left: vel.x > 0 ? r1.left : r1.left + vel.x,
        top: vel.y > 0 ? r1.top : r1.top + vel.y,
        right: vel.x > 0 ? r1.right + vel.x : r1.right,
        bottom: vel.y > 0 ? r1.bottom + vel.y : r1.bottom
    };

    if (broadphaseBox.right < r2.left || broadphaseBox.left > r2.right || broadphaseBox.bottom < r2.top || broadphaseBox.top > r2.bottom) {
        return { time: 1, normal: { x: 0, y: 0 } };
    }

    let dx_entry, dy_entry;
    let dx_exit, dy_exit;

    if (vel.x > 0) {
        dx_entry = r2.left - r1.right;
        dx_exit = r2.right - r1.left;
    } else {
        dx_entry = r2.right - r1.left;
        dx_exit = r2.left - r1.right;
    }

    if (vel.y > 0) {
        dy_entry = r2.top - r1.bottom;
        dy_exit = r2.bottom - r1.top;
    } else {
        dy_entry = r2.bottom - r1.top;
        dy_exit = r2.top - r1.bottom;
    }

    const tx_entry = vel.x === 0 ? -Infinity : dx_entry / vel.x;
    const tx_exit = vel.x === 0 ? Infinity : dx_exit / vel.x;
    const ty_entry = vel.y === 0 ? -Infinity : dy_entry / vel.y;
    const ty_exit = vel.y === 0 ? Infinity : dy_exit / vel.y;

    const entryTime = Math.max(tx_entry, ty_entry);
    const exitTime = Math.min(tx_exit, ty_exit);

    if (entryTime > exitTime || entryTime >= 1 || exitTime <= 0) {
        return { time: 1, normal: { x: 0, y: 0 } };
    }

    const normal = { x: 0, y: 0 };
    if (tx_entry > ty_entry) {
        normal.x = vel.x > 0 ? -1 : 1;
    } else {
        normal.y = vel.y > 0 ? -1 : 1;
    }

    return { time: entryTime, normal };
}
