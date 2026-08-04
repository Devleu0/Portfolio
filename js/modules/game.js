
// =================================================================================
// 게임 로직 및 상태 관리를 담당하는 모듈
// =================================================================================

// ---------------------------------------------------------------------------------
// 모듈 및 설정 임포트
// ---------------------------------------------------------------------------------
import {
    isMobile, mobileScale, THEME, ICONS, buildLangAttrs, getStr, state, getCategoryColor
} from './config.js';
import { playSound } from './audio.js';
import { updateCounter, updateScoreDisplay, triggerCollectEffect, triggerComboEffect, hideComboCounter, showComboBreakToast } from './ui.js';

// ---------------------------------------------------------------------------------
// 전역 변수 및 상태
// ---------------------------------------------------------------------------------
let gameContainer, player, playerWrapper, playerInner, hitbox; // 게임 및 플레이어 DOM 요소
let eventsData = []; // events.json에서 로드된 이벤트 데이터 배열
let eventElements = []; // 생성된 이벤트 DOM 요소 배열

const locallyCollected = new Set();    // 현재 세션에서 수집된 이벤트 ID
const beingCollected = new Set();      // 수집 처리 중인 이벤트 ID (중복 방지)
const pendingCollectTimeouts = new Map(); // 지나친 이벤트의 자동 수집 타임아웃
let actionJustPressed = false;         // 사용자가 방금 액션(점프/덕)을 했는지 여부

// ---------------------------------------------------------------------------------
// 게임 물리 상수
// ---------------------------------------------------------------------------------
const JUMP_INITIAL_VELOCITY = isMobile ? -16 : -20; // 점프 초기 속도
const GRAVITY = isMobile ? 0.7 : 0.9;               // 중력 가속도
const duckScale = 0.5;                              // 숙이기 시 플레이어 크기 비율

// ---------------------------------------------------------------------------------
// Getter 함수 (외부 모듈에서 상태 접근용)
// ---------------------------------------------------------------------------------
export function getEventData() { return eventsData; }
export function getEventElements() { return eventElements; }
export function getPlayerElement() { return player; }
export function getPlayerWrapper() { return playerWrapper; }

// ---------------------------------------------------------------------------------
// 플레이어 생성 및 초기화
// ---------------------------------------------------------------------------------
function createPlayer() {
    const horizontalSection = document.querySelector('.horizontal-section');

    // 기존 플레이어가 있다면 제거 (재시작 시 중복 생성 방지)
    if (gameContainer && gameContainer.parentNode) {
        gameContainer.parentNode.removeChild(gameContainer);
    }

    // 게임 요소를 담을 컨테이너 생성
    gameContainer = document.createElement('div');
    gameContainer.style.cssText = 'position:absolute; top:0; z-index:10; left:0; width:100%; height:100%; overflow:hidden; pointer-events:none;';
    horizontalSection.appendChild(gameContainer);

    // 플레이어 요소 생성
    player = document.createElement('div');
    player.style.cssText = `position:absolute; width:${isMobile ? 32 : 64}px; height:${isMobile ? 32 : 64}px; bottom:35vh; left:${isMobile ? 75 : 150}px; transform-origin:bottom center; will-change: transform;`;

    // 정확한 충돌 판정을 위한 hitbox 요소 생성
    const hitboxWidth = isMobile ? 16 : 32;
    const hitboxHeight = isMobile ? 26 : 52;
    const hitboxLeft = isMobile ? (32 - 16) / 2 : (64 - 32) / 2;
    const hitboxTop = isMobile ? 2 : 8; // SVG내부의 스프라이트 위치에 맞게 상단 오프셋 조정

    hitbox = document.createElement('div');
    hitbox.style.cssText = `position:absolute; width:${hitboxWidth}px; height:${hitboxHeight}px; left:${hitboxLeft}px; top:${hitboxTop}px;`;
    hitbox.classList.add('debug-collision');
    player.appendChild(hitbox);

    // GSAP 애니메이션 초기화 및 상태 리셋
    gsap.killTweensOf(player);
    gsap.set(player, { y: 0 });
    state.velocityY = 0;
    state.onGround = true;
    state.onPlatform = null;
    state.isJumping = false;

    // 플레이어 외형 래퍼
    playerWrapper = document.createElement('div');
    playerWrapper.style.cssText = 'width:100%; height:100%; transform-origin:bottom center;';

    // 플레이어 내부 그래픽 (SVG)
    playerInner = document.createElement('div');
    playerInner.style.cssText = 'width:100%; height:100%; transform-origin:bottom center; color:var(--accent); filter:drop-shadow(0 0 8px rgba(56,189,248,0.6)) drop-shadow(0 4px 8px rgba(0,0,0,0.5)); will-change: transform;';
    playerInner.innerHTML = '<svg viewBox="0 0 16 16" width="100%" height="100%" style="display:block; shape-rendering: crispEdges;"><rect x="5" y="2" width="6" height="6" fill="currentColor"/><rect x="6" y="8" width="4" height="4" fill="currentColor"/><rect x="4" y="8" width="2" height="3" fill="currentColor"/><rect x="10" y="8" width="2" height="3" fill="currentColor"/><rect x="6" y="12" width="2" height="3" fill="currentColor"/><rect x="8" y="12" width="2" height="3" fill="currentColor"/></svg>';

    playerWrapper.appendChild(playerInner);
    player.appendChild(playerWrapper);
    gameContainer.appendChild(player);
}

// ---------------------------------------------------------------------------------
// 이벤트(수집품) 생성
// ---------------------------------------------------------------------------------
function createEvent(data, fallbackId) {
    const hasImg = !!data.customIcon;
    const badgeSize = hasImg ? 96 : (isMobile ? 48 : 64);
    const iconSize = isMobile ? 24 : 32;
    const elevation = data.elevation || 0; // 지면으로부터의 높이
    const entranceDir = parseInt(data.entranceDir || 0, 10); // 프레임 입구 방향
    const hasFrame = entranceDir > 0; // 프레임(벽) 존재 여부

    // 프레임이 있는 경우 래퍼 크기 확장
    const wrapperSize = hasFrame ? 120 : badgeSize;
    const bottomStyle = `calc(35vh + ${elevation}px)`;

    // 이벤트 전체를 감싸는 래퍼
    const wrapper = document.createElement('div');
    wrapper.className = 'event-wrapper event-element';
    wrapper.setAttribute('data-id', data.id || fallbackId);
    wrapper.dataset.category = data.category || 'other';
    wrapper.style.cssText = `position: absolute; left: ${data.pos}px; bottom: ${bottomStyle}; width: ${wrapperSize}px; height: ${wrapperSize}px; pointer-events: auto; cursor: pointer;`;

    const catColor = data.colorOverride || getCategoryColor(data.category);
    wrapper.style.setProperty('--cat-color', catColor);

    // 클릭 시 링크 열기
    wrapper.onclick = (e) => {
        e.stopPropagation();
        const rawLink = (data.link || '').trim();
        const targetUrl = rawLink.length > 0 ? rawLink : "https://www.google.com/search?q=" + encodeURIComponent(getStr(data.title, 'ko'));
        window.open(targetUrl, '_blank');
    };

    // 높이가 있는 경우 지지대 생성
    if (elevation > 0) {
        const pole = document.createElement('div');
        pole.className = 'event-pole';
        pole.style.bottom = `-${elevation}px`;
        pole.style.height = `${elevation}px`;
        wrapper.appendChild(pole);
    }

    // 이벤트 뱃지 (아이콘/이미지 표시 부분)
    const event = document.createElement('div');
    event.className = `event-badge${data.inProgress ? ' is-inprogress' : ''}`;
    event.classList.add('debug-collision');
    event.style.width = (data.customIcon ? 86 : badgeSize) + 'px';
    event.style.height = (data.customIcon ? 64 : badgeSize) + 'px';
    event.style.borderRadius = data.customIcon ? '8px' : '0';

    if (THEME === 'minimal' && !data.customIcon) {
        event.style.background = 'rgba(30,41,59,0.8)';
        event.style.backdropFilter = 'blur(8px)';
    } else if (!data.customIcon) {
        event.style.background = catColor;
    }

    // 아이콘 또는 커스텀 이미지 설정
    const strokeColor = THEME === 'minimal' ? catColor : '#020617';
    if (data.customIcon) {
        event.innerHTML = `<img src="${data.customIcon}" alt="${getStr(data.title, state.currentLang)}" style="width:100%; height:100%; object-fit:cover; image-rendering:pixelated;" />`;
    } else {
        event.innerHTML = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${ICONS[data.category] || ICONS.other}</svg>`;
    }

    // 프레임(벽)이 있는 이벤트 처리
    if (hasFrame) {
        const frame = document.createElement('div');
        frame.className = 'cyber-frame';
        frame.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%;';

        event.style.position = 'absolute';
        event.style.top = '50%';
        event.style.left = '50%';
        event.style.transform = 'translate(-50%, -50%)';
        event.classList.add('floating');

        frame.appendChild(event);

        // 입구 방향에 따라 벽 생성
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

        // 충돌 감지를 위해 벽 요소들을 저장
        wrapper.walls = Array.from(frame.querySelectorAll('.frame-wall'));
        wrapper.walls.forEach(wall => wall.classList.add('debug-collision'));
        wrapper.appendChild(frame);
    } else {
        event.style.position = 'relative';
        event.style.left = data.customIcon ? '-8px' : '0';
        wrapper.appendChild(event);
        wrapper.walls = []; // 프레임 없는 경우 빈 배열
    }

    // 정보 태그 (마우스오버 시 표시)
    const tag = document.createElement('div');
    tag.className = 'info-tag';
    const catName = (data.category || 'milestone').toUpperCase();
    tag.innerHTML = `<div class="cat-badge" style="background:${catColor}">[${catName}]</div><div class="title lang-text" ${buildLangAttrs(data.title)}>${getStr(data.title, 'ko')}</div><div class="info-tag-divider"></div><div class="desc lang-text" ${buildLangAttrs(data.desc)}>${getStr(data.desc, 'ko')}</div>`;
    wrapper.appendChild(tag);

    // 튜토리얼 툴팁 (첫 번째 이벤트에만)
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

// ---------------------------------------------------------------------------------
// 플레이어 액션 처리
// ---------------------------------------------------------------------------------

// 액션(점프/숙이기) 입력을 짧은 시간 동안 기억
function handleActionPress() {
    actionJustPressed = true;
    setTimeout(() => { actionJustPressed = false; }, 230); // 0.23초 후 리셋
}

// 점프 시 먼지 이펙트 생성
function createJumpDust() {
    const dustCount = 3;
    const playerX = gsap.getProperty(player, "x");
    const playerWidth = isMobile ? 32 : 64;

    for (let i = 0; i < dustCount; i++) {
        const dustParticle = document.createElement('div');
        dustParticle.style.cssText = `position: absolute; width: 8px; height: 8px; background-color: white; bottom: 35vh; left: ${isMobile ? 75 : 150 + (playerWidth / 2)}px; transform: translateX(${playerX}px);`;
        gameContainer.appendChild(dustParticle);

        // GSAP으로 파티클 애니메이션
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

// ---------------------------------------------------------------------------------
// 수집품 획득 처리
// ---------------------------------------------------------------------------------
function finalizeCollection(event, didAction) {
    const dataId = parseInt(event.getAttribute('data-id'), 10);
    if (!dataId || locallyCollected.has(dataId)) return; // ID가 없거나 이미 수집했으면 무시

    const eventBadge = event.querySelector('.event-badge');

    // 액션(점프/숙이기)으로 획득했는지 여부 (Perfect/Good)
    if (didAction) { // Perfect
        state.comboCount++;
        state.maxCombo = Math.max(state.maxCombo, state.comboCount);

        // 콤보에 따른 점수 배율
        const multiplier = state.comboCount >= 10 ? 2.0
            : state.comboCount >= 5 ? 1.5
                : state.comboCount >= 3 ? 1.2
                    : 1.0;
        state.totalScore += Math.round(500 * multiplier);
        state.perfectCount++;

        triggerComboEffect(state.comboCount);
    } else { // Good (지나쳐서 자동 획득)
        if (state.comboCount >= 5) {
            showComboBreakToast(state.comboCount); // 5콤보 이상에서 끊기면 토스트 표시
        }
        state.lastComboBeforeReset = state.comboCount;
        state.comboCount = 0;
        hideComboCounter();
        state.totalScore += 100;
    }

    // 수집 애니메이션 처리
    const frame = event.querySelector('.cyber-frame');
    if (frame && didAction) {
        // 프레임이 있는 아이템은 프레임과 뱃지가 함께 부서지는 효과
        triggerCollectEffect(eventBadge, didAction, event.dataset.category);

        // gsap.to(frame.querySelectorAll('.frame-wall'), {
        //     opacity: 0, scale: 1.5, stagger: 0.05, duration: 0.3, ease: 'power2.out',
        // }); // 프레임 벽이 사라지는 애니메이션 주석 처리
        // gsap.to(eventBadge, {
        //     opacity: 0, scale: 2, duration: 0.4, ease: 'power2.out', delay: 0.1,
        //     onComplete: () => event.classList.add('collected')
        // }); // 뱃지가 사라지는 애니메이션 주석 처리
        // 대신 collected 클래스를 바로 추가하여 CSS로 상태 처리
        event.classList.add('collected');
    } else {
        // 일반 아이템 수집 효과
        triggerCollectEffect(event, didAction, event.dataset.category);
        event.classList.add('collected');
    }

    playSound('./audio/coin.mp3'); // 수집 효과음 재생

    // 상태 업데이트
    locallyCollected.add(dataId);
    state.collectedIds.add(dataId);

    // 튜토리얼 툴팁 숨기기
    if (dataId === 1) {
        const tt = document.getElementById('tutorial-tooltip');
        if (tt) gsap.to(tt, { opacity: 0, y: -20, duration: 0.3, ease: "power1.out" });
    }

    updateCounter(); // UI 카운터 업데이트
    updateScoreDisplay(); // UI 점수 업데이트

    pendingCollectTimeouts.delete(dataId);
    beingCollected.delete(dataId);

    // 햅틱 피드백 (지원 시)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(didAction ? 80 : 40); } catch (err) { }
    }
}


// ---------------------------------------------------------------------------------
// 연속적인 충돌 감지 (Swept AABB)
// ---------------------------------------------------------------------------------

/**
 * Swept AABB 충돌 감지 함수. 움직이는 사각형의 이동 경로와 고정된 사각형의 충돌을 검사합니다.
 * @param {DOMRect} r1 움직이는 사각형의 경계
 * @param {{x: number, y: number}} vel 움직이는 사각형의 속도 벡터
 * @param {DOMRect} r2 고정된 사각형의 경계
 * @returns {{time: number, normal: {x: number, y: number}}} 충돌 시간(0-1)과 충돌 표면의 법선 벡터
 */
function sweptAABB(r1, vel, r2) {
    // 이동 경로를 포함하는 넓은 범위(Broad-phase)에서 먼저 검사합니다.
    const broadphaseBox = {
        left: vel.x > 0 ? r1.left : r1.left + vel.x,
        top: vel.y > 0 ? r1.top : r1.top + vel.y,
        right: vel.x > 0 ? r1.right + vel.x : r1.right,
        bottom: vel.y > 0 ? r1.bottom + vel.y : r1.bottom
    };

    if (broadphaseBox.right < r2.left || broadphaseBox.left > r2.right || broadphaseBox.bottom < r2.top || broadphaseBox.top > r2.bottom) {
        return { time: 1, normal: { x: 0, y: 0 } }; // 충돌 없음
    }

    // 각 축에 대해 충돌 시작과 끝까지의 거리를 계산합니다.
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

    // 각 축에 대해 충돌 시작과 끝까지의 시간을 계산합니다.
    let tx_entry, ty_entry;
    let tx_exit, ty_exit;

    tx_entry = vel.x === 0 ? -Infinity : dx_entry / vel.x;
    tx_exit = vel.x === 0 ? Infinity : dx_exit / vel.x;
    ty_entry = vel.y === 0 ? -Infinity : dy_entry / vel.y;
    ty_exit = vel.y === 0 ? Infinity : dy_exit / vel.y;

    // 가장 늦은 충돌 시작 시간과 가장 이른 충돌 종료 시간을 찾습니다.
    const entryTime = Math.max(tx_entry, ty_entry);
    const exitTime = Math.min(tx_exit, ty_exit);

    // 충돌이 없다고 판단되는 경우:
    // - 충돌 진입 시간이 충돌 이탈 시간보다 늦을 경우 (충돌 간격이 없음)
    // - 충돌 진입 시간이 1 이상일 경우 (이번 프레임 이후에 충돌)
    // - 충돌 이탈 시간이 0 이하일 경우 (이번 프레임 이전에 이미 충돌이 끝남)
    if (entryTime > exitTime || entryTime >= 1 || exitTime <= 0) {
        return { time: 1, normal: { x: 0, y: 0 } };
    }

    // 충돌이 있다면, 충돌면의 법선(normal) 벡터를 계산합니다.
    let normal = { x: 0, y: 0 };
    if (tx_entry > ty_entry) {
        normal.x = vel.x > 0 ? -1 : 1;
    } else {
        normal.y = vel.y > 0 ? -1 : 1;
    }

    return { time: entryTime, normal: normal };
}


// ---------------------------------------------------------------------------------
// 메인 게임 루프 (GSAP Ticker로 매 프레임 실행)
// ---------------------------------------------------------------------------------
function gameLoop(time, deltaTime) {
    const timeScale = (deltaTime / (1000 / 60)); // 프레임 속도에 따른 보정값

    // --- 1. 플레이어 액션 ---
    if (state.keys.up) {
        doJump();
    }

    // --- 2. 수평 이동 계산 ---
    const scrollSpeed = isMobile ? 16 : 24;
    const horizontalMove = scrollSpeed * timeScale;

    let scrollDelta = 0;
    if (state.keys.right) scrollDelta = horizontalMove;
    if (state.keys.left) scrollDelta = -horizontalMove;

    // 이동 방향에 따라 플레이어 방향 전환
    playerInner.style.setProperty('--facing', state.keys.right ? '1' : (state.keys.left ? '-1' : playerInner.style.getPropertyValue('--facing') || '1'));
    playerInner.classList.toggle('player-running', state.keys.right || state.keys.left);

    // --- 3. 수직 이동 및 물리 계산 ---
    const prevY = gsap.getProperty(player, "y");
    if (!state.onGround && !state.onPlatform) {
        state.velocityY += GRAVITY * timeScale;
    }
    const yDelta = state.velocityY * timeScale;

    // 플레이어의 최종 이동 벡터 (수평 이동은 스크롤과 같은 방향으로 적용)
    const playerVel = { x: scrollDelta, y: yDelta };

    // --- 4. 충돌 감지 및 처리 (Swept AABB) ---
    const playerRect = hitbox.getBoundingClientRect();
    let minCollisionTime = 1.0;
    let collisionNormal = { x: 0, y: 0 };
    let collidedWall = null;

    for (const event of eventElements) {
        if (!event.walls || event.walls.length === 0) continue;

        // 화면에 보이지 않는 이벤트는 대략적으로 건너뛰기 (성능 최적화)
        const obsRect = event.getBoundingClientRect();
        if (obsRect.right < -50 || obsRect.left > window.innerWidth + 50) continue;

        for (const wall of event.walls) {
            const wallRect = wall.getBoundingClientRect();

            // 플레이어 이동 경로와 벽의 충돌을 검사
            const hit = sweptAABB(playerRect, playerVel, wallRect);

            if (hit.time < minCollisionTime) {
                minCollisionTime = hit.time;
                collisionNormal = hit.normal;
                collidedWall = wall;
            }
        }
    }

    // --- 5. 위치 업데이트 및 충돌 반응 ---
    // 충돌 지점까지만 이동
    if (scrollDelta !== 0) {
        window.scrollBy({ top: scrollDelta * minCollisionTime, left: 0, behavior: 'instant' });
    }
    gsap.set(player, { y: prevY + yDelta * minCollisionTime });

    // 충돌이 발생했을 경우의 처리
    if (minCollisionTime < 1.0) {
        if (collisionNormal.y === -1) { // 위에서 아래로 충돌 (착지)
            state.velocityY = 0;
            state.onPlatform = collidedWall;
            state.onGround = false;
            state.isJumping = false;
        }
        if (collisionNormal.y === 1) { // 아래에서 위로 충돌 (머리 박음)
            state.velocityY = 0;
        }
        // 수평 충돌의 경우, 이동을 제한했으므로 별도의 속도 처리는 불필요.
    } else {
        // 충돌이 없었으면, 플랫폼 상태를 리셋
        state.onPlatform = null;
    }

    // 바닥 충돌 및 공중 상태 처리
    const finalPlayerY = gsap.getProperty(player, "y");
    // 떨어지는 중이고(velocityY >= 0) 바닥에 닿거나 통과했다면(finalPlayerY >= 0)
    if (state.velocityY >= 0 && finalPlayerY >= 0) {
        gsap.set(player, { y: 0 });
        state.velocityY = 0;
        state.onGround = true;
        state.isJumping = false;
        state.onPlatform = null;
    } else {
        // 그 외의 경우 (점프 중이거나 아직 떨어지지 않은 경우)
        state.onGround = false;
    }


    // --- 6. 수집품 획득 로직 ---
    const finalPlayerRect = hitbox.getBoundingClientRect();
    let isAnythingOverlapping = false;
    eventElements.forEach(event => {
        const obsRect = event.getBoundingClientRect();
        if (obsRect.bottom < -200 || obsRect.top > window.innerHeight + 200) return; // 화면에서 멀리 벗어난 것은 스킵

        const dataId = parseInt(event.getAttribute('data-id'), 10);
        if (!dataId || locallyCollected.has(dataId) || beingCollected.has(dataId)) return; // 이미 처리된 것은 스킵

        const eventBadge = event.querySelector('.event-badge');
        if (!eventBadge) return;

        // 플레이어와 뱃지 충돌 검사
        const badgeRect = eventBadge.getBoundingClientRect();
        const expand = 3; // 충돌 판정 범위 확장
        const isOverlappingBadge = (
            finalPlayerRect.left < badgeRect.right + expand &&
            finalPlayerRect.right > badgeRect.left - expand &&
            finalPlayerRect.top < badgeRect.bottom + expand &&
            finalPlayerRect.bottom > badgeRect.top - expand
        );

        if (isOverlappingBadge) { // 뱃지와 겹쳤을 때 (Perfect)
            isAnythingOverlapping = true;
            finalizeCollection(event, actionJustPressed);
        } else if (finalPlayerRect.left > obsRect.right + 150) { // 뱃지를 지나쳤을 때 (Good)
            beingCollected.add(dataId);
            const delay = 300 + Math.random() * 200;
            const timeoutId = setTimeout(() => finalizeCollection(event, false), delay);
            pendingCollectTimeouts.set(dataId, timeoutId);
        }
    });

    // 뱃지와 겹쳤을 때 플레이어 시각 효과
    playerInner.style.color = isAnythingOverlapping ? '#fff' : 'var(--accent)';
    playerInner.style.filter = isAnythingOverlapping
        ? 'drop-shadow(0 0 16px var(--accent))'
        : 'drop-shadow(0 0 8px var(--accent))';
}


// ---------------------------------------------------------------------------------
// 플레이어 액션 함수
// ---------------------------------------------------------------------------------
function doJump() {
    if (state.onGround || state.onPlatform) { // 땅 또는 플랫폼에 있을 때만 점프 가능
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

// ---------------------------------------------------------------------------------
// 컨트롤 설정 (키보드, 터치)
// ---------------------------------------------------------------------------------
function setupControls() {
    // 키보드 이벤트
    window.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        // 기본 브라우저 동작(스크롤 등) 방지
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();

        if (k === 'd' || k === 'arrowright') state.keys.right = true;
        if (k === 'a' || k === 'arrowleft') state.keys.left = true;
        if (k === 'w' || k === 'arrowup') state.keys.up = true;
        if (k === 's' || k === 'arrowdown') doDuckStart();
    });

    window.addEventListener('keyup', (e) => {
        const k = e.key.toLowerCase();
        if (k === 'd' || k === 'arrowright') state.keys.right = false;
        if (k === 'a' || k === 'arrowleft') state.keys.left = false;
        if (k === 'w' || k === 'arrowup') state.keys.up = false;
        if (k === 's' || k === 'arrowdown') doDuckEnd();
    });

    // 터치(모바일) 이벤트
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

// ---------------------------------------------------------------------------------
// 게임 리셋
// ---------------------------------------------------------------------------------
export function resetGame() {
    // 모든 예약된 자동 수집 타임아웃 제거
    for (const timeoutId of pendingCollectTimeouts.values()) {
        clearTimeout(timeoutId);
    }
    pendingCollectTimeouts.clear();
    beingCollected.clear();
    locallyCollected.clear();
    state.collectedIds.clear();

    // 점수 및 콤보 관련 상태 리셋
    state.totalScore = 0;
    state.perfectCount = 0;
    state.comboCount = 0;
    state.maxCombo = 0;
    state.lastComboBeforeReset = 0;
    hideComboCounter();

    // 플레이어 물리 상태 리셋
    gsap.set(player, { y: 0 });
    state.velocityY = 0;
    state.onGround = true;
    state.onPlatform = null;
    state.isJumping = false;
    state.isDucking = false;

    // 모든 이벤트의 'collected' 클래스 제거
    eventElements.forEach(el => el.classList.remove('collected'));
    updateCounter();
    updateScoreDisplay();

    // 최종 랭크 표시 리셋
    const finalRankEl = document.getElementById('final-rank');
    if (finalRankEl) {
        finalRankEl.textContent = '-';
        finalRankEl.style.color = '';
        finalRankEl.style.textShadow = '';
        finalRankEl.classList.remove('rank-animate');
    }
    // 튜토리얼 툴팁 다시 표시
    const tt = document.getElementById('tutorial-tooltip');
    if (tt) {
        gsap.killTweensOf(tt);
        gsap.set(tt, { opacity: 1, y: 0 });
    }

    // 통계 섹션 관련 상태 리셋
    state.isStatSectionCounted = false;
    const maxComboStatEl = document.getElementById('max-combo-stat');
    if (maxComboStatEl) {
        maxComboStatEl.textContent = '0';
        maxComboStatEl.dataset.target = '0';
    }
}


// ---------------------------------------------------------------------------------
// 게임 초기화 (메인 함수)
// ---------------------------------------------------------------------------------
export async function initGame() {
    try {
        // 1. 이벤트 데이터 로드
        const response = await fetch('js/data/events.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        eventsData = await response.json();

        // 2. 기존 요소 초기화
        eventElements.forEach(el => el.remove());
        eventElements = [];

        // 3. UI 카운터 설정
        const totalItems = eventsData.length;
        const counterTotalEl = document.getElementById('counter-total');
        if (counterTotalEl) counterTotalEl.textContent = totalItems;

        const milestonesStatEl = document.getElementById('milestones-stat');
        if (milestonesStatEl) milestonesStatEl.dataset.target = totalItems;

        // 4. 모바일 환경 스케일 조정
        if (isMobile) {
            eventsData.forEach(obs => {
                obs.pos *= mobileScale;
                if (obs.elevation) obs.elevation *= mobileScale;
            });
        }

        // 5. 플레이어 및 이벤트 생성
        createPlayer();
        eventsData.forEach((data, index) => {
            eventElements.push(createEvent(data, index + 1000));
        });

        // 6. 컨트롤 설정 및 게임 루프 시작
        setupControls();

        gsap.ticker.remove(gameLoop); // 중복 등록 방지
        gsap.ticker.add(gameLoop);

    } catch (error) {
        console.error("Failed to initialize game:", error);
    }
}