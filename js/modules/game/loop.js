import { isMobile, state, PERFECT_THRESHOLD_MS, GOOD_THRESHOLD_MS } from '../config.js';
import { gameState } from './state.js';
import { moveAxis, shiftRect, cacheWallRect } from './collision.js';
import { finalizeCollection, processInteraction } from './events.js';
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
        const expand = 5; // 충돌 감지 영역을 약간 확장
        const isOverlappingBadge = (
            finalPlayerRect.left < badgeRect.right + expand &&
            finalPlayerRect.right > badgeRect.left - expand &&
            finalPlayerRect.top < badgeRect.bottom + expand &&
            finalPlayerRect.bottom > badgeRect.top - expand
        );

        if (isOverlappingBadge) {
            // 충돌 발생! 이제 액션 타이밍을 확인한다.
            const timeDiff = Math.abs(performance.now() - gameState.actionTimestamp);
            let judgement;

            if (gameState.actionJustPressed && timeDiff <= GOOD_THRESHOLD_MS) {
                // 액션이 제시간에 이루어짐
                judgement = (timeDiff <= PERFECT_THRESHOLD_MS) ? 'perfect' : 'good';
            } else {
                // 액션이 없었거나 너무 늦음
                judgement = 'miss';
            }
            
            processInteraction(event, judgement);

            // 판정에 사용된 액션 플래그를 즉시 리셋하여,
            // 하나의 액션이 여러 이벤트에 중복으로 적용되지 않도록 한다.
            gameState.actionJustPressed = false;
            
        } else if (finalPlayerRect.left > obsRect.right + 150) {
            // 이벤트를 완전히 지나친 경우 'miss' 처리
            gameState.beingCollected.add(dataId);
            const delay = 300 + Math.random() * 200;
            const timeoutId = setTimeout(() => finalizeCollection(event, true), delay); // true for miss
            gameState.pendingCollectTimeouts.set(dataId, timeoutId);
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