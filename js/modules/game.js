// =================================================================================
// 게임 모듈 진입점
// =================================================================================

import { state, isMobile, mobileScale } from './config.js';
import { createPlayer, getPlayerElement as getPlayerElementInternal, getPlayerWrapper as getPlayerWrapperInternal } from './game/player.js';
import { createEvent } from './game/events.js';
import { setupControls } from './game/controls.js';
import { gameLoop } from './game/loop.js';
import { gameState } from './game/state.js';
import { hideComboCounter, updateCounter, updateScoreDisplay } from './ui.js';

export function getEventData() {
    return gameState.eventsData;
}

export function getEventElements() {
    return gameState.eventElements;
}

export function getPlayerElement() {
    return getPlayerElementInternal();
}

export function getPlayerWrapper() {
    return getPlayerWrapperInternal();
}

export function resetGame() {
    for (const timeoutId of gameState.pendingCollectTimeouts.values()) {
        clearTimeout(timeoutId);
    }
    gameState.pendingCollectTimeouts.clear();
    gameState.beingCollected.clear();
    gameState.locallyCollected.clear();
    state.collectedIds.clear();

    state.totalScore = 0;
    state.perfectCount = 0;
    state.comboCount = 0;
    state.maxCombo = 0;
    state.lastComboBeforeReset = 0;
    hideComboCounter();

    if (gameState.player) {
        gsap.set(gameState.player, { y: 0 });
    }
    state.velocityY = 0;
    state.onGround = true;
    state.onPlatform = null;
    state.isJumping = false;
    state.isDucking = false;
    state.keys.left = false;
    state.keys.right = false;
    state.keys.up = false;
    gameState.actionJustPressed = false;

    gameState.eventElements.forEach(el => el.classList.remove('collected'));
    updateCounter();
    updateScoreDisplay();

    const finalRankEl = document.getElementById('final-rank');
    if (finalRankEl) {
        finalRankEl.textContent = '-';
        finalRankEl.style.color = '';
        finalRankEl.style.textShadow = '';
        finalRankEl.classList.remove('rank-animate');
    }

    const tt = document.getElementById('tutorial-tooltip');
    if (tt) {
        gsap.killTweensOf(tt);
        gsap.set(tt, { opacity: 1, y: 0 });
    }

    state.isStatSectionCounted = false;
    const maxComboStatEl = document.getElementById('max-combo-stat');
    if (maxComboStatEl) {
        maxComboStatEl.textContent = '0';
        maxComboStatEl.dataset.target = '0';
    }
}

export async function initGame() {
    try {
        const response = await fetch('js/data/events.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        gameState.eventsData = await response.json();

        gameState.eventElements.forEach(el => el.remove());
        gameState.eventElements = [];

        const totalItems = gameState.eventsData.length;
        const counterTotalEl = document.getElementById('counter-total');
        if (counterTotalEl) counterTotalEl.textContent = totalItems;

        const milestonesStatEl = document.getElementById('milestones-stat');
        if (milestonesStatEl) milestonesStatEl.dataset.target = totalItems;

        if (isMobile) {
            gameState.eventsData.forEach(obs => {
                obs.pos *= mobileScale;
                if (obs.elevation) obs.elevation *= mobileScale;
            });
        }

        createPlayer();
        gameState.eventsData.forEach((data, index) => {
            gameState.eventElements.push(createEvent(data, index + 1000));
        });

        setupControls();

        gsap.ticker.remove(gameLoop);
        gsap.ticker.add(gameLoop);
    } catch (error) {
        console.error('Failed to initialize game:', error);
    }
}
