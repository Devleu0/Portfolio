import { state, THEME, getStr, mobileScale } from './config.js';
import { getObstacleData, getObstacleElements, resetGame } from './game.js';

export function updateCounter() {
    const counterEl = document.getElementById('counter-current');
    if (counterEl) counterEl.textContent = state.collectedIds.size;
}

export function updateScoreDisplay() {
    const scoreEl = document.getElementById('score-current');
    if (scoreEl) scoreEl.textContent = state.totalScore;
}

export function triggerCollectEffect(obstacleEl, didAction = false) {
    const wave = document.createElement('div');
    wave.className = 'collect-shockwave';
    if (didAction) {
        wave.style.setProperty('--wave-color', 'gold');
    }
    obstacleEl.appendChild(wave);
    setTimeout(() => wave.remove(), 500);

    if (didAction) {
        const score = document.createElement('div');
        score.className = 'score-popup-perfect';
        score.textContent = 'PERFECT!';

        const obsRect = obstacleEl.getBoundingClientRect();
        score.style.cssText = `position: fixed; left: ${obsRect.right}px; top: ${obsRect.top + obsRect.height / 2}px; transform: translateX(10px) translateY(-90%); color: gold; font-weight: bold; white-space: nowrap; font-size: 1.5em; z-index: 100; pointer-events: none;`;
        document.body.appendChild(score);

        gsap.fromTo(score,
            { opacity: 0, yPercent: 50 },
            {
                opacity: 1, yPercent: -50, duration: 0.3, ease: 'power2.out',
                onComplete: () => {
                    gsap.to(score, {
                        opacity: 0, yPercent: -100, duration: 0.5, delay: 0.5, ease: 'power1.in',
                        onComplete: () => score.remove()
                    });
                }
            }
        );
    }
}

function createProgressMarkers() {
    const progressBar = document.getElementById('progress-bar');
    const horizontalSection = document.querySelector('.horizontal-section');
    const obstaclesData = getObstacleData();
    if (!progressBar || !obstaclesData || obstaclesData.length === 0) return;

    const totalWidth = horizontalSection.scrollWidth - window.innerWidth;
    if (totalWidth <= 0) return;

    obstaclesData.forEach(obstacle => {
        const marker = document.createElement('div');
        marker.className = 'progress-marker';
        const position = (obstacle.pos / totalWidth) * 100;
        marker.style.left = `${position}%`;

        const tooltip = document.createElement('div');
        tooltip.className = 'progress-tooltip';
        tooltip.textContent = getStr(obstacle.title, state.currentLang);
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
                const obstacleElements = getObstacleElements();
                obstacleElements.forEach(obs => {
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
                    duration: 1,
                    roundProps: 'val',
                    onUpdate: () => { el.textContent = current.val; }
                });
            });

            const finalRankEl = document.getElementById('final-rank');
            if (finalRankEl) {
                let rank = 'C';
                let rankColor = '#94a3b8';
                if (state.totalScore >= 12000) { rank = 'S'; rankColor = '#fbbf24'; }
                else if (state.totalScore >= 9000) { rank = 'A'; rankColor = '#f87171'; }
                else if (state.totalScore >= 5000) { rank = 'B'; rankColor = '#60a5fa'; }

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