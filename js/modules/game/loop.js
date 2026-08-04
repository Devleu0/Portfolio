import { isMobile, state } from '../config.js';
import { gameState } from './state.js';
import { moveAxis, shiftRect, cacheWallRect } from './collision.js';
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

    // 근처 이벤트의 벽 좌표를 프레임당 한 번만 읽어 캐싱한다. moveAxis는 이후
    // 이 캐시된 사각형만 사용하므로, 서브스텝을 몇 번을 돌든 DOM 레이아웃을
    // 다시 읽지 않고, 프레임 내내 좌표가 고정되어 있음이 보장된다.
    const nearbyWalls = [];
    for (const event of gameState.eventElements) {
        if (!event.walls || event.walls.length === 0) continue;
        const obsRect = event.getBoundingClientRect();
        if (obsRect.right < -50 || obsRect.left > window.innerWidth + 50) continue;
        for (const wall of event.walls) {
            nearbyWalls.push(cacheWallRect(wall));
        }
    }

    const prevY = gsap.getProperty(player, 'y');
    const playerRect = hitbox.getBoundingClientRect();
    // 서브스텝 크기: 히트박스 크기의 절반 이하로 잡아, 그보다 얇지 않은 벽은
    // 절대 건너뛸 수 없도록 한다(터널링 방지의 핵심).
    const maxStep = Math.max(2, Math.min(playerRect.width, playerRect.height) / 2);

    // ---- 1) X축(수평) 이동 해석 ----
    // 이 프로젝트의 "가로 이동"은 window.scrollBy({ top }) 을 통해 ScrollTrigger가
    // .horizontal-section을 translateX 시키는 방식이므로 반드시 top으로 스크롤한다.
    let xMoved = 0;
    if (scrollDelta !== 0) {
        const xResult = moveAxis(playerRect, scrollDelta, nearbyWalls, 'x', maxStep);
        xMoved = xResult.delta;
        window.scrollBy({ top: xMoved, left: 0, behavior: 'instant' });
    }

    // ---- 2) Y축(수직) 이동 해석 ----
    // 실제 스크롤 후 DOM을 다시 읽지 않고, X 이동 결과(xMoved)를 반영한 좌표를
    // 직접 계산해 사용한다 — ScrollTrigger의 transform 갱신 타이밍에 의존하지 않는
    // 결정론적인 방식이며, X와 Y 축은 서로의 이동 결과에 전혀 간섭하지 않는다.
    const playerRectAfterX = shiftRect(playerRect, xMoved, 0);
    const yResult = moveAxis(playerRectAfterX, yDelta, nearbyWalls, 'y', maxStep);
    gsap.set(player, { y: prevY + yResult.delta });

    if (yResult.collided) {
        if (yResult.normal === -1) {
            state.velocityY = 0;
            state.onPlatform = yResult.wall;
            state.onGround = false;
            state.isJumping = false;
        }
        if (yResult.normal === 1) {
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