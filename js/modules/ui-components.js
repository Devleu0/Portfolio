import { state, THEME, getStr, mobileScale, getCategoryColor, effectOffset } from './app-config.js';
import { getEventData, getEventElements, resetGame, getPlayerElement } from './game-manager.js';

export function updateCounter() {
    const counterEl = document.getElementById('counter-current');
    if (counterEl) counterEl.textContent = state.collectedIds.size;
}

export function updateScoreDisplay() {
    const scoreEl = document.getElementById('score-current');
    if (scoreEl) scoreEl.textContent = state.totalScore;
}

export function updateComboDisplay() {
    const comboEl = document.getElementById('combo-count');
    if (comboEl) comboEl.textContent = state.comboCount;
}

export function showBuffPopup(buffType) {
    const playerEl = getPlayerElement();
    if (!playerEl) return;

    let text = '';
    let color = '';

    switch (buffType) {
        case 'speed':
            text = 'SPEED UP!';
            color = '#FDE047'; // Yellow
            break;
        case 'shield':
            text = 'SHIELD ON!';
            color = '#38BDF8'; // Blue
            break;
        case 'score_multiplier':
            text = 'SCORE x2!';
            color = '#FBBF24'; // Gold
            break;
        case 'powerup':
            text = 'POWER UP!';
            color = '#FFFFFF'; // White
            break;
        default:
            return;
    }

    const playerRect = playerEl.getBoundingClientRect();
    const popup = document.createElement('div');
    popup.className = 'score-popup score-popup-buff'; // Reuse score-popup style
    popup.textContent = text;
    popup.style.cssText = `
        position: fixed;
        left: ${playerRect.left + playerRect.width * 3}px;
        top: ${playerRect.top - 20}px;
        transform: translateX(-50%);
        font-family: var(--font-title);
        font-size: 1.8em;
        font-weight: bold;
        color: ${color};
        text-shadow: 3px 3px 0 var(--shadow);
        white-space: nowrap;
        z-index: 101;
        pointer-events: none;
    `;
    document.body.appendChild(popup);

    gsap.fromTo(popup,
        { opacity: 0, y: 0, scale: 0.5 },
        {
            opacity: 1,
            y: -50,
            scale: 1,
            duration: 0.4,
            ease: 'back.out(1.7)',
            onComplete: () => {
                gsap.to(popup, {
                    opacity: 0,
                    y: -100,
                    duration: 0.5,
                    delay: 0.8,
                    ease: 'power1.in',
                    onComplete: () => popup.remove()
                });
            }
        }
    );
}


export function triggerCollectEffect(eventEl, judgement = 'perfect', category = 'other') {
    // 사각 애니메이션 (이벤트 기준)
    const wave = document.createElement('div');
    wave.className = 'collect-shockwave is-perfect';

    const catColor = getCategoryColor(category);
    wave.style.setProperty('--wave-color', catColor);

    eventEl.appendChild(wave);
    setTimeout(() => wave.remove(), 500);

    // 텍스트 이펙트 (플레이어 기준)
    const popupText = 'PERFECT!';
    const popupColor = 'gold';
    const popupSize = '1.5em';

    const playerEl = getPlayerElement();
    if (!playerEl) return;
    const playerRect = playerEl.getBoundingClientRect();

    const popup = document.createElement('div');
    popup.className = `score-popup score-popup-perfect`;
    popup.textContent = popupText;

    popup.style.cssText = `position: fixed; left: ${playerRect.right + effectOffset.x}px; top: ${playerRect.top + playerRect.height / 2 + effectOffset.y}px; transform: translateX(10px) translateY(-90%); color: ${popupColor}; font-weight: bold; white-space: nowrap; font-size: ${popupSize}; z-index: 100; pointer-events: none;`;
    document.body.appendChild(popup);

    gsap.fromTo(popup,
        { opacity: 0, yPercent: 50, scale: 0.8 },
        {
            opacity: 1, yPercent: -50, scale: 1, duration: 0.3, ease: 'power2.out',
            onComplete: () => {
                gsap.to(popup, {
                    opacity: 0, yPercent: -100, duration: 0.5, delay: 0.5, ease: 'power1.in',
                    onComplete: () => popup.remove()
                });
            }
        }
    );
}

function createProgressMarkers() {
    const progressBar = document.getElementById('progress-bar');
    const horizontalSection = document.querySelector('.horizontal-section');
    const eventsData = getEventData();
    if (!progressBar || !eventsData || eventsData.length === 0) return;

    const totalWidth = horizontalSection.scrollWidth - window.innerWidth;
    if (totalWidth <= 0) return;

    eventsData.forEach(event => {
        const marker = document.createElement('div');
        marker.className = 'progress-marker';
        const position = (event.pos / totalWidth) * 100;
        marker.style.left = `${position}%`;
        marker.style.background = getCategoryColor(event.category);

        const tooltip = document.createElement('div');
        tooltip.className = 'progress-tooltip';

        // Add data attributes for each language
        if (typeof event.title === 'object' && event.title !== null) {
            tooltip.dataset.ko = event.title.ko || '';
            tooltip.dataset.en = event.title.en || event.title.ko || '';
            tooltip.dataset.ja = event.title.ja || event.title.ko || '';
        } else {
            const titleStr = event.title || '';
            tooltip.dataset.ko = titleStr;
            tooltip.dataset.en = titleStr;
            tooltip.dataset.ja = titleStr;
        }

        tooltip.textContent = getStr(event.title, state.currentLang);
        marker.appendChild(tooltip);

        progressBar.appendChild(marker);
    });
}

function initModeButtons() {
    const gameModeBtn = document.getElementById('game-mode-btn');
    const resumeModeBtn = document.getElementById('resume-mode-btn');
    const destSection = document.getElementById('dest-section');

    function resetAndGoToTop() {
        gsap.to(window, {
            scrollTo: 0,
            duration: 1.5,
            ease: 'power2.inOut',
            onComplete: resetGame
        });
    }

    if (resumeModeBtn) {
        resumeModeBtn.addEventListener('click', () => {
            gsap.to(window, { scrollTo: '#resume-section', duration: 1.5, ease: 'power2.inOut' });
            if (gameModeBtn) gameModeBtn.classList.remove('active');
            resumeModeBtn.classList.add('active');
        });
    }

    if (gameModeBtn) {
        gameModeBtn.addEventListener('click', () => {
            resetAndGoToTop();
            if (resumeModeBtn) resumeModeBtn.classList.remove('active');
            gameModeBtn.classList.add('active');
        });
    }

    const skipGameBtn = document.getElementById('skip-game-btn');
    if (skipGameBtn && destSection) {
        skipGameBtn.addEventListener('click', () => {
            if (state.isScrolledToEnd) {
                resetAndGoToTop();
            } else {
                const eventElements = getEventElements();
                eventElements.forEach(obs => {
                    const dataId = parseInt(obs.getAttribute('data-id'), 10);
                    if (dataId) {
                        state.collectedIds.add(dataId);
                        obs.classList.add('collected');
                    }
                });
                updateCounter();
                gsap.to(window, { scrollTo: destSection, duration: 1.5, ease: 'power2.inOut' });
            }
        });
    }

    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', resetAndGoToTop);
    }
}

function initTerminalEffect() {
    const termTyped = document.getElementById('term-typed');
    if (!termTyped) return;
    let ti = 0;
    (function typeChar() {
        const text = window._termTypedText || '';
        if (ti <= text.length) {
            termTyped.innerHTML = text.slice(0, ti).replace(/\n/g, '<br>') + '<span class="term-cursor" id="term-cursor">█</span>';
            ti++;
            setTimeout(typeChar, 30);
        } else {
            setTimeout(() => { ti = 0; typeChar(); }, 4000);
        }
    })();
}

function initStatCounter() {
    const statGrid = document.querySelector('.stat-grid');
    if (!statGrid || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !state.isStatSectionCounted) {
            state.isStatSectionCounted = true;



            document.querySelectorAll('.stat-num:not(#final-rank)').forEach(el => {
                const target = parseInt(el.getAttribute('data-target'), 10) || 0;
                let current = { val: 0 };
                gsap.to(current, {
                    val: target,
                    duration: 1.5,
                    ease: 'power2.out',
                    roundProps: 'val',
                    onUpdate: () => { el.textContent = current.val; }
                });
            });

            const finalRankEl = document.getElementById('final-rank');
            if (finalRankEl) {
                const events = getEventData();
                const totalObjects = events.length;
                const estimatedMaxScore = totalObjects * 500 * 1.2;

                const rankThresholds = {
                    S: estimatedMaxScore * 0.9,
                    A: estimatedMaxScore * 0.7,
                    B: estimatedMaxScore * 0.4,
                };

                let rank = 'S';
                let rankColor = '#fbbf24'; // Color for S rank

                setTimeout(() => {
                    finalRankEl.textContent = rank;
                    finalRankEl.style.color = rankColor;
                    finalRankEl.style.textShadow = `0 0 15px ${rankColor}`;
                    finalRankEl.classList.add('rank-animate');
                }, 300);
            }

            const dossierDivider = document.getElementById('dossier-divider-section');
            if (dossierDivider) {
                dossierDivider.style.display = 'block';
                gsap.from(dossierDivider, { opacity: 0, y: 50, duration: 0.8, ease: 'power3.out' });
            }
        }
    }, { threshold: 0.4 });

    observer.observe(statGrid);
}

function initMobileMenu() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileNav = document.getElementById('mobile-nav');
    if (!hamburgerBtn || !mobileNav) return;

    hamburgerBtn.addEventListener('click', () => {
        mobileNav.classList.toggle('is-active');
        hamburgerBtn.classList.toggle('is-active');
    });

    // Sync controls
    document.getElementById('game-mode-btn-mobile')?.addEventListener('click', () => {
        document.getElementById('game-mode-btn')?.click();
        mobileNav.classList.remove('is-active');
        hamburgerBtn.classList.remove('is-active');
    });

    document.getElementById('resume-mode-btn-mobile')?.addEventListener('click', () => {
        document.getElementById('resume-mode-btn')?.click();
        mobileNav.classList.remove('is-active');
        hamburgerBtn.classList.remove('is-active');
    });

    const langSelectorMobile = document.getElementById('lang-selector-mobile');
    const langSelector = document.getElementById('lang-selector');
    if (langSelectorMobile && langSelector) {
        langSelectorMobile.addEventListener('change', (e) => {
            langSelector.value = e.target.value;
            langSelector.dispatchEvent(new Event('change'));
        });
    }

    const soundToggleBtnMobile = document.getElementById('sound-toggle-btn-mobile');
    const soundToggleBtn = document.getElementById('sound-toggle-btn');
    if (soundToggleBtnMobile && soundToggleBtn) {
        soundToggleBtnMobile.addEventListener('click', () => soundToggleBtn.click());
        // Keep text in sync
        const observer = new MutationObserver(() => {
            soundToggleBtnMobile.textContent = soundToggleBtn.textContent;
        });
        observer.observe(soundToggleBtn, { childList: true, subtree: true });
    }
}

function initZoneScenery() {
    const zones = document.querySelectorAll('.zone');
    const zoneData = state.zones;

    if (!zones.length || !zoneData || zones.length !== zoneData.length) {
        console.error('Zone elements and zone data mismatch.');
        return;
    }

    zones.forEach((zone, index) => {
        const data = zoneData[index];

        if (data.scenery && data.scenery.building) {
            const b = document.createElement('div');
            b.className = `zone-building zone-building--${data.scenery.building.type}`;
            b.style.backgroundImage = `url('${data.scenery.building.path}')`;
            zone.appendChild(b);
        }

        if (data.scenery && data.scenery.overlay) {
            const o = document.createElement('div');
            o.className = `zone-overlay zone-overlay--${data.scenery.overlay.type}`;
            o.style.backgroundImage = `url('${data.scenery.overlay.path}')`;
            zone.appendChild(o);
        }
    });
}

/**
 * 플레이어의 버프 상태에 따라 시각적 효과(CSS 클래스)를 업데이트합니다.
 */
export function updatePlayerBuffVisuals() {
    const playerEl = getPlayerElement();
    if (!playerEl) return;

    // Player-specific visual cues
    playerEl.classList.toggle('player-buff-speed', !!state.activeBuffs.speed.active);
    playerEl.classList.toggle('player-buff-shield', !!state.activeBuffs.shield.active);

    // Global visual cues
    const speedOverlay = document.getElementById('speed-lines-overlay');
    if (speedOverlay) {
        speedOverlay.classList.toggle('speed-lines-active', !!state.activeBuffs.speed.active);
    }
}

export function initUI() {
    initModeButtons();
    initTerminalEffect();
    initStatCounter();
    initMobileMenu();
    initZoneScenery();

    // Must run after a delay to ensure scrollWidth is calculated correctly
    setTimeout(createProgressMarkers, 500);

    // Also initialize the counter display
    updateCounter();
    // Simple smooth scroll for resume link
    const resumeLink = document.querySelector('a[href="#resume-section"]');
    if (resumeLink) {
        resumeLink.addEventListener('click', (e) => {
            e.preventDefault();
            gsap.to(window, { scrollTo: '#resume-section', duration: 1.5, ease: 'power2.inOut' });
        });
    }
}


// Combo System UI Functions
export function triggerComboEffect(combo) {
    const comboEl = document.getElementById('combo-display');
    const countEl = document.getElementById('combo-count');
    if (!comboEl || !countEl) return;

    countEl.textContent = combo;
    comboEl.classList.add('is-active');

    // Tier determination
    let tier = 'low';
    if (combo >= 10) tier = 'max';
    else if (combo >= 5) tier = 'high';
    else if (combo >= 3) tier = 'mid';

    comboEl.dataset.tier = tier;

    // Counter punch animation
    gsap.fromTo(comboEl,
        { scale: 1.4 },
        { scale: 1, duration: 0.25, ease: 'back.out(3)' }
    );

    if (tier === 'mid' || tier === 'high' || tier === 'max') {
        triggerScreenShake(tier);
        triggerBackgroundFlash(tier);
    }

    if (tier === 'max' && combo % 10 === 0) {
        showMaxComboPopup(combo);
    }
}

export function hideComboCounter() {
    const comboEl = document.getElementById('combo-display');
    if (!comboEl) return;
    gsap.to(comboEl, {
        opacity: 0, scale: 0.8, duration: 0.3,
        onComplete: () => {
            comboEl.classList.remove('is-active');
            // Reset opacity and scale for the next time
            gsap.set(comboEl, { opacity: 1, scale: 1, display: 'none' });
            comboEl.style.display = '';
        }
    });
}

function triggerScreenShake(tier) {
    const container = document.querySelector('.horizontal-container');
    if (!container) return;
    const shakeClass = `shake-${tier}`;

    // Using a timeout to allow the class to be removed before re-adding
    container.classList.remove('shake-mid', 'shake-high', 'shake-max');
    setTimeout(() => {
        container.classList.add(shakeClass);
        container.addEventListener('animationend', () => {
            container.classList.remove(shakeClass);
        }, { once: true });
    }, 10); // A small delay is often enough
}

function triggerBackgroundFlash(tier) {
    const flash = document.getElementById('combo-flash');
    if (!flash) return;
    const color = tier === 'max' ? 'radial-gradient(circle, rgba(253,224,71,0.5), transparent 70%)'
        : tier === 'high' ? 'radial-gradient(circle, rgba(253,224,71,0.3), transparent 70%)'
            : 'radial-gradient(circle, rgba(34,211,238,0.2), transparent 70%)';

    flash.style.background = color;
    gsap.fromTo(flash, { opacity: 1 }, { opacity: 0, duration: tier === 'max' ? 0.5 : 0.3, ease: 'power2.out' });
}

function showMaxComboPopup(combo) {
    const popup = document.createElement('div');
    popup.textContent = `MAX COMBO x${combo}!`;
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 3rem;
        font-family: var(--font-title);
        color: #FDE047;
        text-shadow: 4px 4px 0 var(--shadow);
        pointer-events: none;
        z-index: 100;
    `;
    document.body.appendChild(popup);
    gsap.fromTo(popup,
        { scale: 0.5, opacity: 0 },
        {
            scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)',
            onComplete: () => {
                gsap.to(popup, { opacity: 0, scale: 1.5, duration: 0.5, delay: 0.5, onComplete: () => popup.remove() });
            }
        }
    );
}

// Note: `showComboBreakToast` from the plan is not included here yet, as it's part of combo break logic.
export function showComboBreakToast(lastCombo) {
    const toast = document.createElement('div');
    toast.innerHTML = `COMBO BREAK <span style="color: #F87171;">(x${lastCombo})</span>`;
    toast.style.cssText = `
        position: fixed;
        top: 20%;
        left: 50%;
        transform: translateX(-50%);
        font-size: 1.5rem;
        font-family: var(--font-title);
        color: var(--text-sub);
        text-shadow: 2px 2px 0 var(--shadow);
        pointer-events: none;
        z-index: 100;
        opacity: 0;
        padding: 8px 16px;
        background: rgba(15, 23, 42, 0.8);
        border: 2px solid var(--zone-border);
    `;
    document.body.appendChild(toast);
    gsap.fromTo(toast,
        { y: 20, opacity: 0 },
        {
            y: 0, opacity: 1, duration: 0.3, ease: 'power2.out',
            onComplete: () => {
                gsap.to(toast, { opacity: 0, y: -20, duration: 0.6, delay: 0.6, ease: 'power1.in', onComplete: () => toast.remove() });
            }
        }
    );
}
