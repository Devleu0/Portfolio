import { THEME, ICONS, buildLangAttrs, getStr, getCategoryColor, state, isMobile } from '../app-config.js';
import { playSound } from '../audio-manager.js';
import { updateCounter, updateScoreDisplay, updateComboDisplay, triggerCollectEffect, triggerComboEffect, hideComboCounter, showComboBreakToast } from '../ui-components.js';
import { gameState } from './game-state.js';

export function createEvent(data, fallbackId) {
    const hasImg = !!data.customIcon;
    const badgeSize = hasImg ? 96 : (isMobile ? 48 : 64);
    const iconSize = isMobile ? 24 : 32;
    const elevation = data.elevation || 0;
    const entranceDir = parseInt(data.entranceDir || 0, 10);
    const hasFrame = entranceDir > 0;
    const wrapperSize = hasFrame ? 120 : badgeSize;
    const bottomStyle = `calc(35vh + ${elevation}px)`;

    const wrapper = document.createElement('div');
    wrapper.className = 'event-wrapper event-element';
    wrapper.setAttribute('data-id', data.id || fallbackId);
    wrapper.dataset.category = data.category || 'other';
    wrapper.style.cssText = `position: absolute; left: ${data.pos}px; bottom: ${bottomStyle}; width: ${wrapperSize}px; height: ${wrapperSize}px; pointer-events: auto; cursor: pointer;`;

    const catColor = data.colorOverride || getCategoryColor(data.category);
    wrapper.style.setProperty('--cat-color', catColor);

    wrapper.onclick = (e) => {
        e.stopPropagation();
        const rawLink = (data.link || '').trim();
        const targetUrl = rawLink.length > 0 ? rawLink : 'https://www.google.com/search?q=' + encodeURIComponent(getStr(data.title, 'ko'));
        window.open(targetUrl, '_blank');
    };

    if (data.isJumpPad) {
        const jumpPad = document.createElement('div');
        jumpPad.className = 'jump-pad-platform debug-collision platform-surface frame-wall wall-horizontal';
        jumpPad.dataset.isJumpPad = 'true';
        wrapper.appendChild(jumpPad);
    }

    if (elevation > 0) {
        if (data.isFloatingPlatform) {
            const platform = document.createElement('div');
            platform.className = 'floating-platform debug-collision platform-surface frame-wall wall-horizontal wall-top';
            wrapper.appendChild(platform);
        } else {
            const pole = document.createElement('div');
            pole.className = 'event-pole';
            pole.style.bottom = `-${elevation}px`;
            pole.style.height = `${elevation}px`;
            wrapper.appendChild(pole);
        }
    }

    const event = document.createElement('div');
    event.className = `event-badge${data.inProgress ? ' is-inprogress' : ''}`;
    event.classList.add('debug-collision');
    event.classList.add('floating');
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
        frame.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%;';

        event.style.position = 'absolute';
        event.style.top = '50%';
        event.style.left = '50%';
        event.style.transform = 'translate(-50%, -50%)';
        event.classList.add('floating');

        frame.appendChild(event);

        const wallDefs = {
            top: `<div class="frame-wall wall-horizontal wall-top platform-surface"${data.isJumpPad ? ' data-is-jump-pad="true"' : ''}></div>`,
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
        wrapper.walls.forEach(wall => wall.classList.add('debug-collision'));
        wrapper.appendChild(frame);
    } else {
        event.style.position = 'relative';
        event.style.left = data.customIcon ? '-8px' : '0';
        wrapper.appendChild(event);
        wrapper.walls = [];
    }

    // 부유 발판, 점프 패드가 있을 경우, 충돌 감지 대상에 추가
    const platformElements = wrapper.querySelectorAll('.floating-platform, .jump-pad-platform');
    if (platformElements.length > 0) {
        if (!wrapper.walls) {
            wrapper.walls = [];
        }
        platformElements.forEach(p => wrapper.walls.push(p));
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
        tooltip.setAttribute('data-ko', '점프/숙이기(W,S) 입력!');
        tooltip.setAttribute('data-en', 'Jump or Duck (W/S)!');
        tooltip.setAttribute('data-ja', 'ジャンプ/しゃがむ(W/S)入力！');
        tooltip.innerHTML = getStr({ ko: '점프/숙이기(W,S) 입력!', en: 'Jump or Duck (W/S)!', ja: 'ジャンプ/しゃがむ(W/S)入力！' }, state.currentLang);
        wrapper.appendChild(tooltip);
    }

    gameState.gameContainer.appendChild(wrapper);
    return wrapper;
}

export function processInteraction(event, judgement) {
    const dataId = parseInt(event.getAttribute('data-id'), 10);
    if (!dataId || gameState.locallyCollected.has(dataId) || gameState.beingCollected.has(dataId)) return;
    
    gameState.beingCollected.delete(dataId);
    gameState.pendingCollectTimeouts.delete(dataId);

    // 모든 상호작용을 'perfect'로 처리
    state.comboCount++;
    state.maxCombo = Math.max(state.maxCombo, state.comboCount);

    const multiplier = state.comboCount >= 10 ? 2.0 : state.comboCount >= 5 ? 1.5 : state.comboCount >= 3 ? 1.2 : 1.0;
    state.totalScore += Math.round(500 * multiplier);
    state.perfectCount++;
    triggerComboEffect(state.comboCount);

    const targetEl = event.querySelector('.cyber-frame') || event;
    triggerCollectEffect(targetEl, 'perfect', event.dataset.category);
    event.classList.add('collected');

    playSound('./audio/coin.mp3');
    gameState.locallyCollected.add(dataId);
    state.collectedIds.add(dataId);

    if (dataId === 1) {
        const tt = document.getElementById('tutorial-tooltip');
        if (tt) gsap.to(tt, { opacity: 0, y: -20, duration: 0.3, ease: 'power1.out' });
    }

    updateCounter();
    updateScoreDisplay();
    updateComboDisplay();

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(80); } catch (err) { }
    }
}
