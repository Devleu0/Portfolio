// =================================================================================
// 게임 충돌 검사 모듈
// =================================================================================


/**
 * 두 사각형이 겹치는지 검사한다. 경계가 맞닿기만 한 경우(등호)는 겹침으로 보지
 * 않는다 — 이래야 벽에 붙어 선 상태에서 다른 축으로는 자유롭게 움직일 수 있다.
 */
export function rectsOverlap(a, b) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

/** 사각형을 dx, dy만큼 평행이동한 새 사각형(순수 계산, DOM 재조회 없음)을 반환한다. */
export function shiftRect(rect, dx, dy) {
    return {
        left: rect.left + dx,
        right: rect.right + dx,
        top: rect.top + dy,
        bottom: rect.bottom + dy,
    };
}

/**
 * 벽 DOM 요소의 화면 좌표를 한 번만 읽어 순수 객체로 캐싱한다.
 * moveAxis는 이 캐시된 사각형만 사용하므로, 서브스텝을 아무리 많이 돌아도
 * getBoundingClientRect()가 다시 호출되지 않는다.
 */
export function cacheWallRect(wallEl) {
    const r = wallEl.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, el: wallEl };
}

/**
 * 한 축(x 또는 y)으로 delta만큼 이동을 시도하고 벽들과의 충돌을 해석한다.
 * @param {{left,right,top,bottom}} rect - 이동 시작 시점의 플레이어 사각형
 * @param {number} delta - 이번 프레임에 이동하려는 거리(부호 있음)
 * @param {{left,right,top,bottom,el}[]} cachedWalls - cacheWallRect로 미리 캐싱한
 *   벽 사각형 배열. DOM을 다시 읽지 않고 순수 수학 연산만 수행한다.
 * @param {'x'|'y'} axis - 이동시킬 축
 * @param {number} maxStep - 서브스텝 최대 크기(px). 벽을 건너뛰지 않으려면
 *   충돌 가능한 오브젝트 중 가장 얇은 두께보다 작아야 한다. 보통 플레이어
 *   히트박스 크기의 절반 정도를 쓰면 안전하다.
 * @returns {{delta:number, collided:boolean, normal:number, wall:Element|null}}
 *   delta: 실제로 이동 가능했던 거리(막히면 벽 바로 앞에서 멈춘 값)
 *   normal: y축 기준 -1=바닥에 착지, 1=천장에 부딪힘 (x축은 참고용, 좌우 -1/1)
 *   wall: 충돌한 벽의 원본 DOM 요소(cachedWalls[i].el)
 */
export function moveAxis(rect, delta, cachedWalls, axis, maxStep = 8) {
    if (delta === 0 || cachedWalls.length === 0) {
        return { delta, collided: false, normal: 0, wall: null };
    }

    // --- [1단계: 끼임 방지 및 일방통행(통과형 발판) 처리] ---
    const ignoredWalls = new Set();
    
    for (const wallRect of cachedWalls) {
        const isJumpPad = wallRect.el.classList.contains('jump-pad-platform') || 
                          wallRect.el.dataset.isJumpPad === 'true';

        // 1. 끼임 방지(Anti-Stuck): 이동을 시작하기도 전에 이미 겹쳐있는 벽이라면 무시합니다.
        // 이렇게 하면 벽에 끼이더라도 바깥으로 자유롭게 걸어 나오거나 떨어질 수 있습니다.
        if (rectsOverlap(rect, wallRect)) {
            ignoredWalls.add(wallRect);
            continue;
        }

        // 2. 일방통행 발판(One-Way Platform): 발판/점프대의 경우 '위에서 아래로 떨어질 때'만 충돌합니다.
        // 즉, 옆으로 지나가거나 아래에서 위로 점프할 때는 발판을 유령처럼 통과하게 만듭니다.
        if (isJumpPad) {
            // X축 이동이거나, Y축으로 점프 중(위로 올라가는 중)일 때는 충돌을 무시합니다.
            if (axis === 'x' || (axis === 'y' && delta <= 0)) {
                ignoredWalls.add(wallRect);
            }
        }
    }
    // --------------------------------------------------

    const steps = Math.min(64, Math.max(1, Math.ceil(Math.abs(delta) / maxStep)));
    const stepDelta = delta / steps;

    let moved = 0;
    let collided = false;
    let normal = 0;
    let hitWall = null;

    for (let i = 0; i < steps; i++) {
        const nextMoved = moved + stepDelta;
        const testRect = axis === 'x'
            ? shiftRect(rect, nextMoved, 0)
            : shiftRect(rect, 0, nextMoved);

        let blocked = false;
        for (const wallRect of cachedWalls) {
            // 위에서 무시하기로 결정한 벽(이미 끼어있거나, 아래서 뚫고 올라가는 발판)은 충돌을 무시합니다.
            if (ignoredWalls.has(wallRect)) continue;

            if (rectsOverlap(testRect, wallRect)) {
                blocked = true;
                hitWall = wallRect.el;
                break;
            }
        }

        if (blocked) {
            collided = true;
            normal = stepDelta > 0 ? -1 : 1;
            break;
        }
        moved = nextMoved;
    }

    return { delta: moved, collided, normal, wall: hitWall };
}

/**
 * (레거시) 기존 swept-AABB 시간 기반 충돌 검사. 더 이상 loop.js에서 사용하지
 * 않지만, 다른 곳에서 참조할 가능성을 고려해 남겨둔다.
 * @deprecated moveAxis를 사용하세요.
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

    const rawEntryTime = Math.max(tx_entry, ty_entry);
    const exitTime = Math.min(tx_exit, ty_exit);

    if (rawEntryTime > exitTime || rawEntryTime >= 1 || exitTime <= 0) {
        return { time: 1, normal: { x: 0, y: 0 } };
    }

    const entryTime = Math.max(rawEntryTime, 0);

    const normal = { x: 0, y: 0 };
    if (tx_entry > ty_entry) {
        normal.x = vel.x > 0 ? -1 : 1;
    } else {
        normal.y = vel.y > 0 ? -1 : 1;
    }

    return { time: entryTime, normal };
}