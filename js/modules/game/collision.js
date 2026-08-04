// =================================================================================
// 게임 충돌 검사 모듈
// =================================================================================
// 방식: 이산(discrete) AABB + 서브스텝(substep) 기반 축 분리 이동 해석.
// 2D 플랫포머에서 널리 쓰이는 검증된 패턴으로, X/Y 두 축을 완전히 독립적으로
// 처리하고(축간 간섭 없음), 이동량을 히트박스 크기 절반 이하의 작은 단위로 쪼개어
// 한 걸음씩 겹침을 검사한다.
//  - 터널링(고속 통과) 방지: 한 스텝의 이동량이 항상 자신의 절반 크기보다 작으므로,
//    그보다 얇지 않은 벽은 절대 건너뛸 수 없다.
//  - 끼임(stuck) 방지: 판정이 "겹침 여부"(부등식)일 뿐 시간(time)을 나누는 수식이
//    아니라서, 경계에 닿아만 있는 상태(overlap=false)는 충돌로 취급되지 않는다.
//  - 성능/정확성: cacheWallRect로 벽 좌표를 프레임당 한 번만 읽어 캐싱한 뒤
//    moveAxis에 넘긴다. moveAxis 내부(서브스텝 루프)에서는 getBoundingClientRect를
//    전혀 호출하지 않으므로, 불필요한 레이아웃 재계산이 없고 프레임 내내 벽
//    좌표가 고정된 값으로 유지된다는 것이 보장된다.

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