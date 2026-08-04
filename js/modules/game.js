import {
    isMobile, mobileScale, THEME, ICONS, buildLangAttrs, getStr, state, getCategoryColor
} from './config.js';
import { playSound } from './audio.js';
import { updateCounter, updateScoreDisplay, triggerCollectEffect, triggerComboEffect, hideComboCounter, showComboBreakToast } from './ui.js';

let gameContainer, player, playerWrapper, playerInner;

let obstaclesData = [];
let obstacleElements = [];
let prevPlayerY = 0;

const locallyCollected = new Set();
const beingCollected = new Set();
const pendingCollectTimeouts = new Map();
let actionJustPressed = false;

const jumpHeight = isMobile ? -75 : -150;
const duckScale = 0.5;
const jumpEase = "power1.out";

export function getObstacleData() { return obstaclesData; }
export function getObstacleElements() { return obstacleElements; }
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
    player.style.cssText = `position:absolute; width:${isMobile ? 32 : 64}px; height:${isMobile ? 32 : 64}px; bottom:35vh; left:${isMobile ? 75 : 150}px; transform-origin:bottom center;`;

    playerWrapper = document.createElement('div');
    playerWrapper.style.cssText = 'width:100%; height:100%; transform-origin:bottom center;';

    playerInner = document.createElement('div');
    playerInner.style.cssText = 'width:100%; height:100%; transform-origin:bottom center; color:var(--accent); filter:drop-shadow(0 0 8px rgba(56,189,248,0.6)) drop-shadow(0 4px 8px rgba(0,0,0,0.5)); will-change: transform;';
    playerInner.innerHTML = '<svg viewBox="0 0 16 16" width="100%" height="100%" style="display:block; shape-rendering: crispEdges;"><rect x="5" y="2" width="6" height="6" fill="currentColor"/><rect x="6" y="8" width="4" height="4" fill="currentColor"/><rect x="4" y="8" width="2" height="3" fill="currentColor"/><rect x="10" y="8" width="2" height="3" fill="currentColor"/><rect x="6" y="12" width="2" height="3" fill="currentColor"/><rect x="8" y="12" width="2" height="3" fill="currentColor"/></svg>';

    playerWrapper.appendChild(playerInner);
    player.appendChild(playerWrapper);
    gameContainer.appendChild(player);
}

function createObstacle(data, fallbackId) {
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
    wrapper.className = 'obstacle-wrapper obstacle-element';
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
        pole.className = 'obstacle-pole';
        pole.style.bottom = `-${elevation}px`;
        pole.style.height = `${elevation}px`;
        wrapper.appendChild(pole);
    }

    const obstacle = document.createElement('div');
    obstacle.className = `obstacle-badge${data.inProgress ? ' is-inprogress' : ''}`;
    // 프레임 존재 여부와 관계없이 뱃지는 고유 크기를 가짐
    obstacle.style.width = (data.customIcon ? 86 : badgeSize) + 'px';
    obstacle.style.height = (data.customIcon ? 64 : badgeSize) + 'px';
    obstacle.style.borderRadius = data.customIcon ? '8px' : '0';
    
    if (THEME === 'minimal' && !data.customIcon) {
        obstacle.style.background = 'rgba(30,41,59,0.8)';
        obstacle.style.backdropFilter = 'blur(8px)';
    } else if (!data.customIcon) {
        obstacle.style.background = catColor;
    }

    const strokeColor = THEME === 'minimal' ? catColor : '#020617';
    if (data.customIcon) {
        obstacle.innerHTML = `<img src="${data.customIcon}" alt="${getStr(data.title, state.currentLang)}" style="width:100%; height:100%; object-fit:cover; image-rendering:pixelated;" />`;
    } else {
        obstacle.innerHTML = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${ICONS[data.category] || ICONS.other}</svg>`;
    }

    if (hasFrame) {
        const frame = document.createElement('div');
        frame.className = 'cyber-frame';
        // 프레임이 wrapper를 채우도록 설정
        frame.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%;';
        
        // 뱃지에 중앙 정렬 및 애니메이션 스타일 적용
        obstacle.style.position = 'absolute';
        obstacle.style.top = '50%';
        obstacle.style.left = '50%';
        obstacle.style.transform = 'translate(-50%, -50%)';
        obstacle.classList.add('floating');

        frame.appendChild(obstacle);

        const wallDefs = {
            top: '<div class="frame-wall wall-horizontal wall-top platform-surface"></div>',
            bottom: '<div class="frame-wall wall-horizontal wall-bottom"></div>',
            left: '<div class="frame-wall wall-vertical wall-left"></div>',
            right: '<div class="frame-wall wall-vertical wall-right"></div>',
        };
        
        let wallHtml = '';
        if (entranceDir !== 1) wallHtml += wallDefs.top;
        if (entranceDir !== 2) wallHtml += wallDefs.left;
        if (entranceDir !== 3) wallHtml += wallDefs.bottom;
        if (entranceDir !== 4) wallHtml += wallDefs.right;
        frame.insertAdjacentHTML('beforeend', wallHtml);
        
        wrapper.walls = Array.from(frame.querySelectorAll('.frame-wall'));
        wrapper.appendChild(frame);
    } else {
        obstacle.style.position = 'relative';
        obstacle.style.left = data.customIcon ? '-8px' : '0';
        wrapper.appendChild(obstacle);
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

function finalizeCollection(obstacle, didAction) {
    const dataId = parseInt(obstacle.getAttribute('data-id'), 10);
    if (!dataId || locallyCollected.has(dataId)) return;

    const obstacleBadge = obstacle.querySelector('.obstacle-badge');

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

    const frame = obstacle.querySelector('.cyber-frame');
    if (frame && didAction) {
        // For framed items, play a custom disintegration animation
        triggerCollectEffect(obstacleBadge, didAction, obstacle.dataset.category);
        
        gsap.to(frame.querySelectorAll('.frame-wall'), {
            opacity: 0,
            scale: 1.5,
            stagger: 0.05,
            duration: 0.3,
            ease: 'power2.out',
        });
        gsap.to(obstacleBadge, {
            opacity: 0,
            scale: 2,
            duration: 0.4,
            ease: 'power2.out',
            delay: 0.1,
            onComplete: () => {
                obstacle.classList.add('collected');
            }
        });
    } else {
        // Default collection effect for non-framed items
        triggerCollectEffect(obstacle, didAction, obstacle.dataset.category);
        obstacle.classList.add('collected');
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
    const scrollSpeed = isMobile ? 16 : 24;
    const move = scrollSpeed * (deltaTime / (1000 / 60));
    if (state.keys.right) window.scrollBy({ top: move, left: 0, behavior: 'instant' });
    if (state.keys.left) window.scrollBy({ top: -move, left: 0, behavior: 'instant' });

    playerInner.style.setProperty('--facing', state.keys.right ? '1' : (state.keys.left ? '-1' : playerInner.style.getPropertyValue('--facing') || '1'));
    playerInner.classList.toggle('player-running', state.keys.right || state.keys.left);

    const playerRect = player.getBoundingClientRect();
    const currentPlayerY = gsap.getProperty(player, "y");
    const isFalling = currentPlayerY > prevPlayerY;

    let isAnythingOverlapping = false;
    const viewportWidth = window.innerWidth;

    obstacleElements.forEach(obstacle => {
        const obsRect = obstacle.getBoundingClientRect();
        
        if (obsRect.right < -200 || obsRect.left > viewportWidth + 200) return;

        const dataId = parseInt(obstacle.getAttribute('data-id'), 10);
        if (!dataId || locallyCollected.has(dataId) || beingCollected.has(dataId)) return;

        let wallHit = false;
        if (obstacle.walls && obstacle.walls.length > 0) {
            for (const wall of obstacle.walls) {
                const wallRect = wall.getBoundingClientRect();
                const isOverlappingWall = (
                    playerRect.left < wallRect.right &&
                    playerRect.right > wallRect.left &&
                    playerRect.top < wallRect.bottom &&
                    playerRect.bottom > wallRect.top
                );

                if (isOverlappingWall) {
                    const isPlatformSurface = wall.classList.contains('platform-surface');
                    const playerBottomAbsolute = playerRect.bottom;
                    const wallTopAbsolute = wallRect.top;
                    const landingTolerance = isMobile ? 5 : 10;

                    if (isPlatformSurface && isFalling && state.isJumping && 
                        playerBottomAbsolute > wallTopAbsolute - landingTolerance && 
                        playerBottomAbsolute < wallTopAbsolute + landingTolerance) {
                        
                        gsap.killTweensOf(player);
                        state.isJumping = false;
                        state.onPlatform = wall; // 플랫폼에 착지
                        
                        const playerInitialAbsoluteBottom = window.innerHeight * (1 - 0.35);
                        const newPlayerTranslateY = wallTopAbsolute - playerInitialAbsoluteBottom;
                        gsap.set(player, { y: newPlayerTranslateY });
                        
                        wallHit = false;
                    } else {
                        wallHit = true;
                        if (state.comboCount >= 5) {
                            showComboBreakToast(state.comboCount);
                        }
                        state.lastComboBeforeReset = state.comboCount;
                        state.comboCount = 0;
                        hideComboCounter();
                    }
                    if (wallHit) break;
                }
            }
        }

        if (wallHit) {
            isAnythingOverlapping = true;
            return;
        }
        
        const obstacleBadge = obstacle.querySelector('.obstacle-badge');
        if (!obstacleBadge) return;

        const badgeRect = obstacleBadge.getBoundingClientRect();
        const expand = 3;
        const isOverlappingBadge = (
            playerRect.left < badgeRect.right + expand &&
            playerRect.right > badgeRect.left - expand &&
            playerRect.top < badgeRect.bottom + expand &&
            playerRect.bottom > badgeRect.top - expand
        );

        if (isOverlappingBadge) {
            isAnythingOverlapping = true;
            finalizeCollection(obstacle, actionJustPressed);
        } else if (playerRect.left > obsRect.right + 150) {
            beingCollected.add(dataId);
            const delay = 300 + Math.random() * 200;
            const timeoutId = setTimeout(() => finalizeCollection(obstacle, false), delay);
            pendingCollectTimeouts.set(dataId, timeoutId);
        }
    });

    // 플랫폼에서 벗어났는지 확인
    if (state.onPlatform) {
        const platformRect = state.onPlatform.getBoundingClientRect();
        if (!(playerRect.right > platformRect.left && playerRect.left < platformRect.right)) {
            fallToGround(); // 플랫폼에서 벗어나면 낙하
        }
    }

    playerInner.style.color = isAnythingOverlapping ? '#fff' : 'var(--accent)';
    playerInner.style.filter = isAnythingOverlapping 
        ? 'drop-shadow(0 0 16px var(--accent))' 
        : 'drop-shadow(0 0 8px var(--accent))';
    
    prevPlayerY = currentPlayerY;
}

function doJump() {
    if (state.isJumping) return;
    handleActionPress();
    state.isJumping = true;
    state.onPlatform = null;
    playSound('./audio/jump.mp3');
    createJumpDust();
    gsap.to(player, {
        y: jumpHeight,
        duration: 0.35,
        yoyo: true,
        repeat: 1,
        ease: jumpEase,
        onComplete: fallToGround
    });
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
    state.onPlatform = null; // ADDED: Reset onPlatform

    obstacleElements.forEach(el => el.classList.remove('collected'));
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
        const response = await fetch('js/data/obstacles.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        obstaclesData = await response.json();

        // 기존 장애물 배열 초기화
        obstacleElements = [];

        const totalItems = obstaclesData.length;
        const counterTotalEl = document.getElementById('counter-total');
        if (counterTotalEl) counterTotalEl.textContent = totalItems;
        
        const milestonesStatEl = document.getElementById('milestones-stat');
        if (milestonesStatEl) milestonesStatEl.dataset.target = totalItems;

        if (isMobile) {
            obstaclesData.forEach(obs => {
                obs.pos *= mobileScale;
                if (obs.elevation) obs.elevation *= mobileScale;
            });
        }

        createPlayer();
        obstaclesData.forEach((data, index) => {
            obstacleElements.push(createObstacle(data, index + 1000));
        });

        setupControls();
        
        // 중복 등록 방지를 위해 제거 후 추가
        gsap.ticker.remove(gameLoop);
        gsap.ticker.add(gameLoop);
    } catch (error) {
        console.error("Failed to initialize game:", error);
    }
}

function fallToGround() {
    gsap.killTweensOf(player); // 기존 플레이어 트윈 중지
    state.isJumping = false;
    state.onPlatform = null; // 플랫폼 상태 해제
    
    // Y를 0 (바닥)으로 돌려보내는 애니메이션 시작
    gsap.to(player, {
        y: 0,
        duration: 0.3,
        ease: "power1.in",
        onComplete: createJumpDust // 착지 시 먼지 효과 재사용
    });
}
