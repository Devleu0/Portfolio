import { isMobile, state, PERFECT_THRESHOLD_MS, GOOD_THRESHOLD_MS } from '../config.js';
import { gameState } from './state.js';
import { moveAxis, shiftRect, cacheWallRect } from './collision.js';
import { processInteraction } from './events.js';
import { doJump } from './player.js';
import { playSound } from '../audio.js';

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
    const maxStep = Math.max(2, Math.min(playerRect.width, playerRect.height) / 2);

    let xMoved = 0;
    if (scrollDelta !== 0) {
        const xResult = moveAxis(playerRect, scrollDelta, nearbyWalls, 'x', maxStep);
        xMoved = xResult.delta;
        window.scrollBy({ top: xMoved, left: 0, behavior: 'instant' });
    }

    const playerRectAfterX = shiftRect(playerRect, xMoved, 0);
    const yResult = moveAxis(playerRectAfterX, yDelta, nearbyWalls, 'y', maxStep);
    gsap.set(player, { y: prevY + yResult.delta });

    if (yResult.collided) {
        // 점프 패드 로직
        if (yResult.wall.dataset.isJumpPad === 'true' && yResult.normal === -1) {
            state.velocityY = -25; // 강력한 점프
            playSound('./audio/jump.mp3');
            state.onPlatform = null;
            state.onGround = false;
            state.isJumping = true; // 점프 상태로 설정
        } else if (yResult.normal === -1) { // 일반 플랫폼에 착지
            state.velocityY = 0;
            state.onPlatform = yResult.wall;
            state.onGround = false;
            state.isJumping = false;
        }
        if (yResult.normal === 1) { // 천장에 머리 부딪힘
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
        const expand = 5; // 충돌 감지 영역을 약간 확장
        const isOverlappingBadge = (
            finalPlayerRect.left < badgeRect.right + expand &&
            finalPlayerRect.right > badgeRect.left - expand &&
            finalPlayerRect.top < badgeRect.bottom + expand &&
            finalPlayerRect.bottom > badgeRect.top - expand
        );

        if (isOverlappingBadge) {
            // 충돌 시 즉시 'perfect'로 처리
            processInteraction(event, 'perfect');
        } else if (finalPlayerRect.left > obsRect.right + 150) {
            // 이벤트를 완전히 지나친 경우에도 'perfect'로 자동 획득 처리
            processInteraction(event, 'perfect');
        }
    });

    // 시각적 피드백을 위한 중첩 확인 로직 (판정 로직과 분리)
    // 참고: 위에서 이미 수집된 이벤트는 locallyCollected에 추가되므로,
    // 이 로직은 아직 수집되지 않은 이벤트에 대해서만 중첩을 감지하게 된다.
    gameState.eventElements.forEach(event => {
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
        }
    });

    playerInner.style.color = isAnythingOverlapping ? '#fff' : 'var(--accent)';
    playerInner.style.filter = isAnythingOverlapping
        ? 'drop-shadow(0 0 16px var(--accent))'
        : 'drop-shadow(0 0 8px var(--accent))';
}