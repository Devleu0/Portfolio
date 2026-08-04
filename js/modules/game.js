import {
    isMobile, mobileScale, THEME, ICONS, buildLangAttrs, getStr, state, getCategoryColor
} from './config.js';
import { playSound } from './audio.js';
import { updateCounter, updateScoreDisplay, triggerCollectEffect, triggerComboEffect, hideComboCounter, showComboBreakToast } from './ui.js';

let gameContainer, player, playerWrapper, playerInner;

let eventsData = [];
let eventElements = [];

const locallyCollected = new Set();
const beingCollected = new Set();
const pendingCollectTimeouts = new Map();
let actionJustPressed = false;

const JUMP_INITIAL_VELOCITY = isMobile ? -16 : -20;
const GRAVITY = isMobile ? 0.7 : 0.9;
const duckScale = 0.5;

export function getEventData() { return eventsData; }
export function getEventElements() { return eventElements; }
export function getPlayerElement() { return player; }
export function getPlayerWrapper() { return playerWrapper; }

function createPlayer() {
    const horizontalSection = document.querySelector('.horizontal-section');
    
    // 기존 컨테이너가 있다면 제거 (중복 생성 방지)
    if (gameContainer && gameContainer.parentNode) {
        gameContainer.parentNode.removeChild(gameContainer);
    }

    gameContainer = document.createElement('div');
    gameContainer.style.cssText = 'position:absolute; top:0; z-index:10; left:0; width:100%; height:100%; overflow:hidden; pointer-events:none;';
    horizontalSection.appendChild(gameContainer);

    player = document.createElement('div');
    player.style.cssText = `position:absolute; width:${isMobile ? 32 : 64}px; height:${isMobile ? 32 : 64}px; bottom:35vh; left:${isMobile ? 75 : 150}px; transform-origin:bottom center; will-change: transform;`;
    player.classList.add('debug-collision'); // Add this line
    // Kill any existing tweens on the player element when re-creating
    gsap.killTweensOf(player);
    // Reset position and state
    gsap.set(player, { y: 0 });
    state.velocityY = 0;
    state.onGround = true;
    state.onPlatform = null;
    state.isJumping = false;


    playerWrapper = document.createElement('div');
    playerWrapper.style.cssText = 'width:100%; height:100%; transform-origin:bottom center;';

    playerInner = document.createElement('div');
    playerInner.style.cssText = 'width:100%; height:100%; transform-origin:bottom center; color:var(--accent); filter:drop-shadow(0 0 8px rgba(56,189,248,0.6)) drop-shadow(0 4px 8px rgba(0,0,0,0.5)); will-change: transform;';
    playerInner.innerHTML = '<svg viewBox="0 0 16 16" width="100%" height="100%" style="display:block; shape-rendering: crispEdges;"><rect x="5" y="2" width="6" height="6" fill="currentColor"/><rect x="6" y="8" width="4" height="4" fill="currentColor"/><rect x="4" y="8" width="2" height="3" fill="currentColor"/><rect x="10" y="8" width="2" height="3" fill="currentColor"/><rect x="6" y="12" width="2" height="3" fill="currentColor"/><rect x="8" y="12" width="2" height="3" fill="currentColor"/></svg>';

    playerWrapper.appendChild(playerInner);
    player.appendChild(playerWrapper);
    gameContainer.appendChild(player);
}

function createEvent(data, fallbackId) {
    const hasImg = !!data.customIcon;
    const badgeSize = hasImg ? 96 : (isMobile ? 48 : 64);
    const iconSize = isMobile ? 24 : 32;
    const elevation = data.elevation || 0;
    const entranceDir = parseInt(data.entranceDir || 0, 10);
    const hasFrame = entranceDir > 0;
    
    // 프레임이 있으면 wrapper가 더 커야 함
    const wrapperSize = hasFrame ? 120 : badgeSize;
    const bottomStyle = `calc(35vh + ${elevation}px)`;

    const wrapper = document.createElement('div');
    wrapper.className = 'event-wrapper event-element';
    wrapper.setAttribute('data-id', data.id || fallbackId);
    wrapper.dataset.category = data.category || 'other';
    // wrapper 크기를 동적으로 설정
    wrapper.style.cssText = `position: absolute; left: ${data.pos}px; bottom: ${bottomStyle}; width: ${wrapperSize}px; height: ${wrapperSize}px; pointer-events: auto; cursor: pointer;`;

    const catColor = data.colorOverride || getCategoryColor(data.category);
    wrapper.style.setProperty('--cat-color', catColor);

    wrapper.onclick = (e) => {
        e.stopPropagation();
        const rawLink = (data.link || '').trim();
        const targetUrl = rawLink.length > 0 ? rawLink : "https://www.google.com/search?q=" + encodeURIComponent(getStr(data.title, 'ko'));
        window.open(targetUrl, '_blank');
    };

    if (elevation > 0) {
        const pole = document.createElement('div');
        pole.className = 'event-pole';
        pole.style.bottom = `-${elevation}px`;
        pole.style.height = `${elevation}px`;
        wrapper.appendChild(pole);
    }

    const event = document.createElement('div');
    event.className = `event-badge${data.inProgress ? ' is-inprogress' : ''}`;
    // 프레임 존재 여부와 관계없이 뱃지는 고유 크기를 가짐
    event.style.width = (data.customIcon ? 86 : badgeSize) + 'px';
    event.style.height = (data.customIcon ? 64 : badgeSize) + 'px';
    event.style.borderRadius = data.customIcon ? '8px' : '0';
    
    if (THEME === 'minimal' && !data.customIcon) {
        event.style.background = 'rgba(30,41,59,0.8)';
        event.style.backdropFilter = 'blur(8px)';
    } else if (!data.customIcon) {
        event.style.background = catColor;
    }

    const strokeColor = THEME === 'minimal' ? catColor : '#020617';
    if (data.customIcon) {
        event.innerHTML = `<img src="${data.customIcon}" alt="${getStr(data.title, state.currentLang)}" style="width:100%; height:100%; object-fit:cover; image-rendering:pixelated;" />`;
    } else {
        event.innerHTML = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${ICONS[data.category] || ICONS.other}</svg>`;
    }

    if (hasFrame) {
        const frame = document.createElement('div');
        frame.className = 'cyber-frame';
        // 프레임이 wrapper를 채우도록 설정
        frame.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%;';
        
        // 뱃지에 중앙 정렬 및 애니메이션 스타일 적용
        event.style.position = 'absolute';
        event.style.top = '50%';
        event.style.left = '50%';
        event.style.transform = 'translate(-50%, -50%)';
        event.classList.add('floating');

        frame.appendChild(event);

        const wallDefs = {
            top: '<div class="frame-wall wall-horizontal wall-top platform-surface"></div>',
            bottom: '<div class="frame-wall wall-horizontal wall-bottom platform-surface"></div>',
            left: '<div class="frame-wall wall-vertical wall-left platform-surface"></div>',
            right: '<div class="frame-wall wall-vertical wall-right platform-surface"></div>',
        };
        
        let wallHtml = '';
        if (entranceDir !== 1) wallHtml += wallDefs.top;
        if (entranceDir !== 2) wallHtml += wallDefs.left;
        if (entranceDir !== 3) wallHtml += wallDefs.bottom;
        if (entranceDir !== 4) wallHtml += wallDefs.right;
        frame.insertAdjacentHTML('beforeend', wallHtml);
        
        wrapper.walls = Array.from(frame.querySelectorAll('.frame-wall'));
        wrapper.walls.forEach(wall => wall.classList.add('debug-collision')); // Add this line
        wrapper.appendChild(frame);
    } else {
        event.style.position = 'relative';
        event.style.left = data.customIcon ? '-8px' : '0';
        wrapper.appendChild(event);
        wrapper.walls = [];
    }

    const tag = document.createElement('div');
    tag.className = 'info-tag';
    const catName = (data.category || 'milestone').toUpperCase();
    tag.innerHTML = `<div class="cat-badge" style="background:${catColor}">[${catName}]</div><div class="title lang-text" ${buildLangAttrs(data.title)}>${getStr(data.title, 'ko')}</div><div class="info-tag-divider"></div><div class="desc lang-text" ${buildLangAttrs(data.desc)}>${getStr(data.desc, 'ko')}</div>`;
    wrapper.appendChild(tag);

    if (data.id === 1) {
        const tooltip = document.createElement('div');
        tooltip.id = 'tutorial-tooltip';
        tooltip.className = 'tutorial-tooltip lang-text';
        tooltip.setAttribute('data-ko', '타이밍에 맞춰 점프/숙이기(W,S) 입력!');
        tooltip.setAttribute('data-en', 'Jump or Duck (W/S) at the exact timing!');
        tooltip.setAttribute('data-ja', 'タイミングに合わせてジャンプ/しゃがむ(W/S)入力！');
        tooltip.innerHTML = getStr({ ko: '타이밍에 맞춰 점프/숙이기(W,S) 입력!', en: 'Jump or Duck (W/S) at the exact timing!', ja: 'タイミングに合わせてジャンプ/しゃがむ(W/S)入力！' }, state.currentLang);
        wrapper.appendChild(tooltip);
    }

    gameContainer.appendChild(wrapper);
    return wrapper;
}

function handleActionPress() {
    actionJustPressed = true;
    setTimeout(() => { actionJustPressed = false; }, 230);
}

function createJumpDust() {
    const dustCount = 3;
    const playerX = gsap.getProperty(player, "x");
    const playerWidth = isMobile ? 32 : 64;

    for (let i = 0; i < dustCount; i++) {
        const dustParticle = document.createElement('div');
        dustParticle.style.cssText = `position: absolute; width: 8px; height: 8px; background-color: white; bottom: 35vh; left: ${isMobile ? 75 : 150 + (playerWidth / 2)}px; transform: translateX(${playerX}px);`;
        gameContainer.appendChild(dustParticle);

        gsap.to(dustParticle, {
            x: `+=${(Math.random() - 0.5) * 50}`,
            y: -15 - Math.random() * 20,
            scale: Math.random() * 0.5 + 0.5,
            opacity: 0,
            duration: 0.5 + Math.random() * 0.3,
            ease: "power1.out",
            onComplete: () => dustParticle.remove()
        });
    }
}

function finalizeCollection(event, didAction) {
    const dataId = parseInt(event.getAttribute('data-id'), 10);
    if (!dataId || locallyCollected.has(dataId)) return;

    const eventBadge = event.querySelector('.event-badge');

    if (didAction) {
        state.comboCount++;
        state.maxCombo = Math.max(state.maxCombo, state.comboCount);

        const multiplier = state.comboCount >= 10 ? 2.0
                         : state.comboCount >= 5  ? 1.5
                         : state.comboCount >= 3  ? 1.2
                         : 1.0;
        state.totalScore += Math.round(500 * multiplier);
        state.perfectCount++;

        triggerComboEffect(state.comboCount);
    } else {
        if (state.comboCount >= 5) {
            showComboBreakToast(state.comboCount);
        }
        state.lastComboBeforeReset = state.comboCount;
        state.comboCount = 0;
        hideComboCounter();
        state.totalScore += 100;
    }

    const frame = event.querySelector('.cyber-frame');
    if (frame && didAction) {
        // For framed items, play a custom disintegration animation
        triggerCollectEffect(eventBadge, didAction, event.dataset.category);
        
        gsap.to(frame.querySelectorAll('.frame-wall'), {
            opacity: 0,
            scale: 1.5,
            stagger: 0.05,
            duration: 0.3,
            ease: 'power2.out',
        });
        gsap.to(eventBadge, {
            opacity: 0,
            scale: 2,
            duration: 0.4,
            ease: 'power2.out',
            delay: 0.1,
            onComplete: () => {
                event.classList.add('collected');
            }
        });
    } else {
        // Default collection effect for non-framed items
        triggerCollectEffect(event, didAction, event.dataset.category);
        event.classList.add('collected');
    }

    playSound('./audio/coin.mp3');

    locallyCollected.add(dataId);
    state.collectedIds.add(dataId);
    
    if (dataId === 1) {
        const tt = document.getElementById('tutorial-tooltip');
        if (tt) gsap.to(tt, { opacity: 0, y: -20, duration: 0.3, ease: "power1.out" });
    }

    updateCounter();
    updateScoreDisplay();

    pendingCollectTimeouts.delete(dataId);
    beingCollected.delete(dataId);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(didAction ? 80 : 40); } catch (err) { }
    }
}

function gameLoop(time, deltaTime) {
    const timeScale = (deltaTime / (1000 / 60)); // Original deltaTime normalization

    // --- Vertical Scrolling ---
    const scrollSpeed = isMobile ? 16 : 24; // Reverted to original speed
    const move = scrollSpeed * timeScale;
    
    // N.B. scrollY is captured *before* movement
    const originalScrollY = window.scrollY; 

    if (state.keys.right) window.scrollBy({ top: move, left: 0, behavior: 'instant' });
    if (state.keys.left) window.scrollBy({ top: -move, left: 0, behavior: 'instant' });

    playerInner.style.setProperty('--facing', state.keys.right ? '1' : (state.keys.left ? '-1' : playerInner.style.getPropertyValue('--facing') || '1'));
    playerInner.classList.toggle('player-running', state.keys.right || state.keys.left);

    // --- Vertical Physics ---
    const prevY = gsap.getProperty(player, "y");

    // Apply gravity
    if (!state.onGround && !state.onPlatform) {
        state.velocityY += GRAVITY * timeScale;
    }
    
    let currentY = prevY + state.velocityY * timeScale;
    const playerRectBeforeMove = player.getBoundingClientRect();

    // --- Collision Detection & Resolution ---
    let onAnyPlatform = null;
    let horizontalCollision = false;
    let horizontalPenetration = 0; // For push-out calculation

    for (const event of eventElements) {
        if (!event.walls || event.walls.length === 0) continue;

        const obsRect = event.getBoundingClientRect();
        if (obsRect.bottom < 0 || obsRect.top > window.innerHeight) continue; 

        for (const wall of event.walls) {
            const wallRect = wall.getBoundingClientRect();
            
            const playerRect = {
                left: playerRectBeforeMove.left,
                right: playerRectBeforeMove.right,
                top: playerRectBeforeMove.top - (prevY - currentY),
                bottom: playerRectBeforeMove.bottom - (prevY - currentY),
                width: playerRectBeforeMove.width,
            };

            if (playerRect.left < wallRect.right && playerRect.right > wallRect.left &&
                playerRect.top < wallRect.bottom && playerRect.bottom > wallRect.top) {
                
                const prevPlayerBottom = playerRectBeforeMove.bottom;
                const isHorizontalWall = wall.classList.contains('wall-horizontal');

                if (isHorizontalWall) {
                    // Vertical collision logic
                    if (state.velocityY >= 0 && prevPlayerBottom <= wallRect.top + 1) {
                        currentY = prevY - (playerRectBeforeMove.bottom - wallRect.top);
                        state.velocityY = 0;
                        onAnyPlatform = wall;
                        break; 
                    }
                    if (state.velocityY < 0 && playerRectBeforeMove.top >= wallRect.bottom - 1) {
                        currentY = prevY + (wallRect.bottom - playerRectBeforeMove.top);
                        state.velocityY = 0;
                    }
                } else {
                    // Horizontal collision logic
                    horizontalCollision = true;
                    const playerCenter = playerRect.left + playerRect.width / 2;
                    const wallCenter = wallRect.left + wallRect.width / 2;
                    
                    if (playerCenter < wallCenter) {
                        horizontalPenetration = playerRect.right - wallRect.left;
                    } else {
                        horizontalPenetration = playerRect.left - wallRect.right;
                    }
                }
            }
        }
        if (onAnyPlatform) break;
    }

    if (horizontalCollision) {
        // Push out based on penetration depth to prevent getting stuck.
        // This adjusts the scroll position that was just set.
        window.scrollTo({ top: window.scrollY - horizontalPenetration, behavior: 'instant' });
    }

    // --- Update Player State & Position ---
    state.onPlatform = onAnyPlatform;
    if (state.onPlatform) {
        state.onGround = false;
        state.isJumping = false;
    } else {
        if (currentY > 0) {
            currentY = 0;
            state.velocityY = 0;
            state.onGround = true;
            state.isJumping = false;
        } else {
            state.onGround = false;
        }
    }
    gsap.set(player, { y: currentY });

    // --- Badge Collection Logic ---
    const finalPlayerRect = player.getBoundingClientRect();
    let isAnythingOverlapping = false;
    eventElements.forEach(event => {
        const obsRect = event.getBoundingClientRect();
        if (obsRect.bottom < -200 || obsRect.top > window.innerHeight + 200) return;

        const dataId = parseInt(event.getAttribute('data-id'), 10);
        if (!dataId || locallyCollected.has(dataId) || beingCollected.has(dataId)) return;

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
            finalizeCollection(event, actionJustPressed);
        } else if (finalPlayerRect.left > obsRect.right + 150) { 
            beingCollected.add(dataId);
            const delay = 300 + Math.random() * 200;
            const timeoutId = setTimeout(() => finalizeCollection(event, false), delay);
            pendingCollectTimeouts.set(dataId, timeoutId);
        }
    });

    playerInner.style.color = isAnythingOverlapping ? '#fff' : 'var(--accent)';
    playerInner.style.filter = isAnythingOverlapping 
        ? 'drop-shadow(0 0 16px var(--accent))' 
        : 'drop-shadow(0 0 8px var(--accent))';
}

function doJump() {
    if (state.onGround || state.onPlatform) {
        handleActionPress();
        state.isJumping = true;
        state.onGround = false;
        state.onPlatform = null;
        state.velocityY = JUMP_INITIAL_VELOCITY;
        playSound('./audio/jump.mp3');
        createJumpDust();
    }
}

function doDuckStart() {
    if (state.isDucking) return;
    handleActionPress();
    state.isDucking = true;
    gsap.to(player, { scaleY: duckScale, transformOrigin: "bottom center", duration: 0.1 });
}

function doDuckEnd() {
    if (!state.isDucking) return;
    gsap.to(player, { scaleY: 1, duration: 0.1, onComplete: () => state.isDucking = false });
}

function setupControls() {
    window.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
        if (k === 'd' || k === 'arrowright') state.keys.right = true;
        if (k === 'a' || k === 'arrowleft') state.keys.left = true;
        if (k === 'w' || k === 'arrowup') doJump();
        if (k === 's' || k === 'arrowdown') doDuckStart();
    });

    window.addEventListener('keyup', (e) => {
        const k = e.key.toLowerCase();
        if (k === 'd' || k === 'arrowright') state.keys.right = false;
        if (k === 'a' || k === 'arrowleft') state.keys.left = false;
        if (k === 's' || k === 'arrowdown') doDuckEnd();
    });

    function attachTouch(id, onDown, onUp) {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('pointerdown', (e) => { e.preventDefault(); onDown(e); });
        btn.addEventListener('pointerup', (e) => { e.preventDefault(); if (onUp) onUp(e); });
        btn.addEventListener('pointerleave', (e) => { e.preventDefault(); if (onUp) onUp(e); });
    }

    attachTouch('btn-left', () => { state.keys.left = true; }, () => { state.keys.left = false; });
    attachTouch('btn-right', () => { state.keys.right = true; }, () => { state.keys.right = false; });
    
    attachTouch('btn-jump', () => doJump());
    attachTouch('btn-duck', () => doDuckStart(), () => doDuckEnd());
}

export function resetGame() {
    for (const timeoutId of pendingCollectTimeouts.values()) {
        clearTimeout(timeoutId);
    }
    pendingCollectTimeouts.clear();
    beingCollected.clear();
    locallyCollected.clear();
    state.collectedIds.clear();

    state.totalScore = 0;
    state.perfectCount = 0;
    state.comboCount = 0;
    state.maxCombo = 0;
    state.lastComboBeforeReset = 0;
    hideComboCounter();
    
    // Reset physics state
    gsap.set(player, { y: 0 });
    state.velocityY = 0;
    state.onGround = true;
    state.onPlatform = null;
    state.isJumping = false;
    state.isDucking = false;

    eventElements.forEach(el => el.classList.remove('collected'));
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
        eventsData = await response.json();

        // 기존 장애물 배열 초기화
        eventElements.forEach(el => el.remove());
        eventElements = [];

        const totalItems = eventsData.length;
        const counterTotalEl = document.getElementById('counter-total');
        if (counterTotalEl) counterTotalEl.textContent = totalItems;
        
        const milestonesStatEl = document.getElementById('milestones-stat');
        if (milestonesStatEl) milestonesStatEl.dataset.target = totalItems;

        if (isMobile) {
            eventsData.forEach(obs => {
                obs.pos *= mobileScale;
                if (obs.elevation) obs.elevation *= mobileScale;
            });
        }

        createPlayer();
        eventsData.forEach((data, index) => {
            eventElements.push(createEvent(data, index + 1000));
        });

        setupControls();
        
        // 중복 등록 방지를 위해 제거 후 추가
        gsap.ticker.remove(gameLoop);
        gsap.ticker.add(gameLoop);
    } catch (error) {
        console.error("Failed to initialize game:", error);
    }
}
