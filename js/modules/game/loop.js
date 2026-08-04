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

    const prevY = gsap.getProperty(player, 'y');
    if (!state.onGround && !state.onPlatform) {
        state.velocityY += (isMobile ? 0.7 : 0.9) * timeScale;
    }
    const yDelta = state.velocityY * timeScale;
    const playerVel = { x: scrollDelta, y: yDelta };

    const playerRect = hitbox.getBoundingClientRect();
    let minCollisionTime = 1.0;
    let collisionNormal = { x: 0, y: 0 };
    let collidedWall = null;

    for (const event of gameState.eventElements) {
        if (!event.walls || event.walls.length === 0) continue;
        const obsRect = event.getBoundingClientRect();
        if (obsRect.right < -50 || obsRect.left > window.innerWidth + 50) continue;

        for (const wall of event.walls) {
            const wallRect = wall.getBoundingClientRect();
            const hit = sweptAABB(playerRect, playerVel, wallRect);
            if (hit.time < minCollisionTime) {
                minCollisionTime = hit.time;
                collisionNormal = hit.normal;
                collidedWall = wall;
            }
        }
    }

    if (scrollDelta !== 0) {
        window.scrollBy({ top: scrollDelta * minCollisionTime, left: 0, behavior: 'instant' });
    }
    gsap.set(player, { y: prevY + yDelta * minCollisionTime });

    if (minCollisionTime < 1.0) {
        if (collisionNormal.y === -1) {
            state.velocityY = 0;
            state.onPlatform = collidedWall;
            state.onGround = false;
            state.isJumping = false;
        }
        if (collisionNormal.y === 1) {
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
