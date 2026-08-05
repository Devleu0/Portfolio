import { isMobile, state } from '../app-config.js';
import { playSound } from '../audio-manager.js';
import { gameState } from './game-state.js';

const JUMP_INITIAL_VELOCITY = isMobile ? -16 : -20;
const GRAVITY = isMobile ? 0.7 : 0.9;
const duckScale = 0.5;

export function createPlayer() {
    const horizontalSection = document.querySelector('.horizontal-section');
    if (!horizontalSection) return;

    if (gameState.gameContainer && gameState.gameContainer.parentNode) {
        gameState.gameContainer.parentNode.removeChild(gameState.gameContainer);
    }

    gameState.gameContainer = document.createElement('div');
    gameState.gameContainer.style.cssText = 'position:absolute; top:0; z-index:10; left:0; width:100%; height:100%; overflow:hidden; pointer-events:none;';
    horizontalSection.appendChild(gameState.gameContainer);

    gameState.player = document.createElement('div');
    gameState.player.style.cssText = `position:absolute; width:${isMobile ? 32 : 64}px; height:${isMobile ? 32 : 64}px; bottom:35vh; left:${isMobile ? 75 : 150}px; transform-origin:bottom center; will-change: transform;`;

    const hitboxWidth = isMobile ? 16 : 32;
    const hitboxHeight = isMobile ? 26 : 52;
    const hitboxLeft = isMobile ? (32 - 16) / 2 : (64 - 32) / 2;
    const hitboxTop = isMobile ? 2 : 8;

    gameState.hitbox = document.createElement('div');
    gameState.hitbox.style.cssText = `position:absolute; width:${hitboxWidth}px; height:${hitboxHeight}px; left:${hitboxLeft}px; top:${hitboxTop}px;`;
    gameState.hitbox.classList.add('debug-collision');
    gameState.player.appendChild(gameState.hitbox);

    gsap.killTweensOf(gameState.player);
    gsap.set(gameState.player, { y: 0 });
    state.velocityY = 0;
    state.onGround = true;
    state.onPlatform = null;
    state.isJumping = false;

    gameState.playerWrapper = document.createElement('div');
    gameState.playerWrapper.style.cssText = 'width:100%; height:100%; transform-origin:bottom center;';

    gameState.playerInner = document.createElement('div');
    gameState.playerInner.style.cssText = 'width:100%; height:100%; transform-origin:bottom center; color:var(--accent); filter:drop-shadow(0 0 8px rgba(56,189,248,0.6)) drop-shadow(0 4px 8px rgba(0,0,0,0.5)); will-change: transform;';
    gameState.playerInner.innerHTML = '<svg viewBox="0 0 16 16" width="100%" height="100%" style="display:block; shape-rendering: crispEdges;"><rect x="5" y="2" width="6" height="6" fill="currentColor"/><rect x="6" y="8" width="4" height="4" fill="currentColor"/><rect x="4" y="8" width="2" height="3" fill="currentColor"/><rect x="10" y="8" width="2" height="3" fill="currentColor"/><rect x="6" y="12" width="2" height="3" fill="currentColor"/><rect x="8" y="12" width="2" height="3" fill="currentColor"/></svg>';

    gameState.playerWrapper.appendChild(gameState.playerInner);
    gameState.player.appendChild(gameState.playerWrapper);
    gameState.gameContainer.appendChild(gameState.player);
}

export function createJumpDust() {
    const dustCount = 3;
    const playerX = gsap.getProperty(gameState.player, 'x');
    const playerWidth = isMobile ? 32 : 64;

    for (let i = 0; i < dustCount; i++) {
        const dustParticle = document.createElement('div');
        dustParticle.style.cssText = `position: absolute; width: 8px; height: 8px; background-color: white; bottom: 35vh; left: ${isMobile ? 75 : 150 + (playerWidth / 2)}px; transform: translateX(${playerX}px);`;
        gameState.gameContainer.appendChild(dustParticle);

        gsap.to(dustParticle, {
            x: `+=${(Math.random() - 0.5) * 50}`,
            y: -15 - Math.random() * 20,
            scale: Math.random() * 0.5 + 0.5,
            opacity: 0,
            duration: 0.5 + Math.random() * 0.3,
            ease: 'power1.out',
            onComplete: () => dustParticle.remove()
        });
    }
}

export function doJump() {
    if (state.onGround || state.onPlatform) {
        gameState.actionJustPressed = true;
        gameState.actionTimestamp = performance.now();
        state.isJumping = true;
        state.onGround = false;
        state.onPlatform = null;
        state.velocityY = JUMP_INITIAL_VELOCITY;
        playSound('./audio/jump.mp3');
        createJumpDust();
    }
}

export function doDuckStart() {
    if (state.isDucking) return;
    gameState.actionJustPressed = true;
    gameState.actionTimestamp = performance.now();
    state.isDucking = true;
    gsap.to(gameState.player, { scaleY: duckScale, transformOrigin: 'bottom center', duration: 0.1 });
}

export function doDuckEnd() {
    if (!state.isDucking) return;
    gsap.to(gameState.player, { scaleY: 1, duration: 0.1, onComplete: () => state.isDucking = false });
}

export function getPlayerElement() {
    return gameState.player;
}

export function getPlayerWrapper() {
    return gameState.playerWrapper;
}

export function getHitbox() {
    return gameState.hitbox;
}

export const GRAVITY_VALUE = GRAVITY;
