import { isMobile, state } from '../config.js';
import { gameState } from './state.js';
import { sweptAABB } from './collision.js';
import { finalizeCollection } from './events.js';
import { doJump } from './player.js';

export function gameLoop(time, deltaTime) {
    const timeScale = (deltaTime / (1000 / 60));

    if (state.keys.up) {
        doJump();
    }

    const scrollSpeed = isMobile ? 16 : 24;
    const horizontalMove = scrollSpeed * timeScale;

    let scrollDelta = 0;
    if (state.keys.right) scrollDelta = horizontalMove;
    if (state.keys.left) scrollDelta = -horizontalMove;

    const player = gameState.player;
    const playerInner = gameState.playerInner;
    const hitbox = gameState.hitbox;
    if (!player || !playerInner || !hitbox) return;

    playerInner.style.setProperty('--facing', state.keys.right ? '1' : (state.keys.left ? '-1' : playerInner.style.getPropertyValue('--facing') || '1'));
    playerInner.classList.toggle('player-running', state.keys.right || state.keys.left);

    if (!state.onGround && !state.onPlatform) {
        state.velocityY += (isMobile ? 0.7 : 0.9) * timeScale;
    }
    const yDelta = state.velocityY * timeScale;

    // 근처 이벤트의 벽들을 한 번만 모아서 X축/Y축 스윕에 재사용한다.
    const nearbyWalls = [];
    for (const event of gameState.eventElements) {
        if (!event.walls || event.walls.length === 0) continue;
        const obsRect = event.getBoundingClientRect();
        if (obsRect.right < -50 || obsRect.left > window.innerWidth + 50) continue;
        for (const wall of event.walls) {
            nearbyWalls.push(wall);
        }
    }

    // 두 축(X, Y) 스윕 모두 이 프레임 시작 시점의 동일한 rect 스냅샷을 사용한다.
    // (스크롤 직후 getBoundingClientRect를 다시 읽으면 ScrollTrigger의 transform 갱신이
    //  아직 반영되지 않았을 수 있어, 그 시점 의존성을 아예 없앤다.)
    const prevY = gsap.getProperty(player, 'y');
    const playerRect = hitbox.getBoundingClientRect();

    // ---- 1) X축(수평) 이동 해석 ----
    // 옆벽 충돌은 오직 수평 이동만 제한해야 하며, 같은 프레임의 낙하/점프(Y축)에
    // 영향을 주면 안 된다. 그래서 vel.y=0으로 스윕해 X축만 독립적으로 검사한다.
    // 이 프로젝트의 "가로 이동"은 실제로는 window.scrollBy({ top }) 을 통해
    // ScrollTrigger가 .horizontal-section을 translateX 시키는 방식이므로,
    // 반드시 top으로 스크롤해야 한다 (left 아님).
    let xCollisionTime = 1.0;
    if (scrollDelta !== 0) {
        for (const wall of nearbyWalls) {
            const wallRect = wall.getBoundingClientRect();
            const hit = sweptAABB(playerRect, { x: scrollDelta, y: 0 }, wallRect);
            if (hit.time < xCollisionTime) {
                xCollisionTime = hit.time;
            }
        }
        // 이 프로젝트는 세로 스크롤(window.scrollY)을 GSAP ScrollTrigger가 감지해서 .horizontal-section을 가로로 translateX 시키는 구조입니다.  "
        // 수평 이동"의 실체는 window.scrollBy({top: ...}) 입니다. x, y 를 착각하지 마세요.
        window.scrollBy({ top: scrollDelta * xCollisionTime, left: 0, behavior: 'instant' });
    }

    // ---- 2) Y축(수직) 이동 해석 ----
    // 같은 프레임의 playerRect를 그대로 사용해 수직 이동(vel.x=0)만 독립적으로 스윕한다.
    // 이렇게 하면 발판 착지/천장 충돌 판정이 옆벽 충돌과 완전히 분리된다.
    let yCollisionTime = 1.0;
    let yNormal = 0;
    let collidedWall = null;

    for (const wall of nearbyWalls) {
        const wallRect = wall.getBoundingClientRect();
        const hit = sweptAABB(playerRect, { x: 0, y: yDelta }, wallRect);
        if (hit.time < yCollisionTime) {
            yCollisionTime = hit.time;
            yNormal = hit.normal.y;
            collidedWall = wall;
        }
    }
    gsap.set(player, { y: prevY + yDelta * yCollisionTime });

    if (yCollisionTime < 1.0) {
        if (yNormal === -1) {
            state.velocityY = 0;
            state.onPlatform = collidedWall;
            state.onGround = false;
            state.isJumping = false;
        }
        if (yNormal === 1) {
            state.velocityY = 0;
        }
    } else {
        state.onPlatform = null;
    }

    const finalPlayerY = gsap.getProperty(player, 'y');
    if (state.velocityY >= 0 && finalPlayerY >= 0) {
        gsap.set(player, { y: 0 });
        state.velocityY = 0;
        state.onGround = true;
        state.isJumping = false;
        state.onPlatform = null;
    } else {
        state.onGround = false;
    }

    const finalPlayerRect = hitbox.getBoundingClientRect();
    let isAnythingOverlapping = false;

    gameState.eventElements.forEach(event => {
        const obsRect = event.getBoundingClientRect();
        if (obsRect.bottom < -200 || obsRect.top > window.innerHeight + 200) return;

        const dataId = parseInt(event.getAttribute('data-id'), 10);
        if (!dataId || gameState.locallyCollected.has(dataId) || gameState.beingCollected.has(dataId)) return;

        const eventBadge = event.querySelector('.event-badge');
        if (!eventBadge) return;

        const badgeRect = eventBadge.getBoundingClientRect();
        const expand = 3;
        const isOverlappingBadge = (
            finalPlayerRect.left < badgeRect.right + expand &&
            finalPlayerRect.right > badgeRect.left - expand &&
            finalPlayerRect.top < badgeRect.bottom + expand &&
            finalPlayerRect.bottom > badgeRect.top - expand
        );

        if (isOverlappingBadge) {
            isAnythingOverlapping = true;
            finalizeCollection(event, gameState.actionJustPressed);
        } else if (finalPlayerRect.left > obsRect.right + 150) {
            gameState.beingCollected.add(dataId);
            const delay = 300 + Math.random() * 200;
            const timeoutId = setTimeout(() => finalizeCollection(event, false), delay);
            gameState.pendingCollectTimeouts.set(dataId, timeoutId);
        }
    });

    playerInner.style.color = isAnythingOverlapping ? '#fff' : 'var(--accent)';
    playerInner.style.filter = isAnythingOverlapping
        ? 'drop-shadow(0 0 16px var(--accent))'
        : 'drop-shadow(0 0 8px var(--accent))';
}