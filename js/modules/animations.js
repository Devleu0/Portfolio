
import { isMobile, mobileScale, THEME, LAST_ZONE_START, getSkyColor, state } from './config.js';
import { getPlayerElement, getPlayerWrapper } from './game.js';
import { updateLanguage } from './language.js';

function initMobileScaling() {
    if (!isMobile) return;

    document.querySelectorAll('.zone').forEach(zone => {
        const originalWidth = parseInt(zone.style.width, 10);
        if (!isNaN(originalWidth)) {
            zone.style.width = (originalWidth * mobileScale) + 'px';
        }
    });

    document.querySelectorAll('.parallax-bg').forEach(bg => {
        const originalWidth = parseInt(bg.dataset.width, 10);
        if (!isNaN(originalWidth)) {
            bg.dataset.width = (originalWidth * mobileScale);
        }
    });
}

function initMainScrollAnimation() {
    const horizontalSection = document.querySelector('.horizontal-section');
    const player = getPlayerElement();
    const playerWrapper = getPlayerWrapper();

    const skyOverlay = document.getElementById('sky-overlay');
    const sun = document.getElementById('sun');
    const progressBarWrap = document.getElementById('progress-bar-wrap');
    const progressFill = document.getElementById('progress-fill');
    const finaleFlash = document.getElementById('finale-flash');
    const hudOverlay = document.getElementById('hud-overlay');

    gsap.to(horizontalSection, {
        x: () => -(horizontalSection.scrollWidth - window.innerWidth) + "px",
        ease: "none",
        scrollTrigger: {
            trigger: ".horizontal-container",
            pin: true,
            scrub: 1,
            end: () => "+=" + horizontalSection.scrollWidth,
            onUpdate: (self) => {
                const p = self.progress;
                state.isScrolledToEnd = p > 0.998;
                updateLanguage(state.currentLang); // Refresh language to update skip button

                // --- Visual Updates ---
                skyOverlay.style.background = `linear-gradient(to bottom, ${getSkyColor(p)}${THEME === 'minimal' ? 'FF' : 'D0'} 0%, transparent 90%)`;
                sun.style.transform = `translate(${p * (window.innerWidth - 56)}px, ${40 + (1 - Math.sin(p * (Math.PI / 2))) * 140}px)`;
                progressFill.style.width = `${p * 100}%`;
                progressFill.style.boxShadow = p >= 0.999
                    ? (THEME === 'minimal' ? '0 0 20px rgba(56,189,248,0.85), 0 0 36px rgba(56,189,248,0.5)' : '0 0 20px #22D3EE, 0 0 36px #22D3EE')
                    : (THEME === 'minimal' ? '0 0 10px rgba(56,189,248,0.8)' : '0 0 10px var(--accent)');

                // --- Finale Logic ---
                const maxTranslate = Math.max(1, horizontalSection.scrollWidth - window.innerWidth);
                const zoneStartFraction = Math.min(0.98, LAST_ZONE_START / maxTranslate);
                const denom = Math.max(0.0001, 1 - zoneStartFraction);
                const finaleP = Math.min(1, Math.max(0, (p - zoneStartFraction) / denom));
                const flashP = finaleP > 0 ? Math.max(0, 1 - finaleP / 0.12) : 0;
                document.documentElement.style.setProperty('--finale-p', finaleP.toFixed(3));
                finaleFlash.style.opacity = flashP.toFixed(3);
                state.currentFinaleP = finaleP;

                if (THEME !== 'minimal' && playerWrapper) {
                    const active = finaleP > 0.05;
                    playerWrapper.classList.toggle('player-victory-cycle', active);
                    playerWrapper.classList.toggle('player-finale-bounce', active);
                }
            },
            onEnter: () => {
                progressBarWrap.style.opacity = '1';
                gsap.to(hudOverlay, { autoAlpha: 1, duration: 0.3 });
            },
            onLeave: () => {
                progressBarWrap.style.opacity = '0';
                gsap.to(hudOverlay, { autoAlpha: 0, duration: 0.3 });
            },
            onEnterBack: () => {
                progressBarWrap.style.opacity = '1';
                gsap.to(hudOverlay, { autoAlpha: 1, duration: 0.3 });
            },
            onLeaveBack: () => {
                progressBarWrap.style.opacity = '0';
                gsap.to(hudOverlay, { autoAlpha: 0, duration: 0.3 });
            },
        }
    });

    gsap.utils.toArray('.parallax-bg').forEach(bg => {
        const zoneWidth = parseInt(bg.getAttribute('data-width'), 10);
        const speed = parseFloat(bg.getAttribute('data-speed')) || 0.4;
        gsap.to(bg, {
            x: -(zoneWidth * speed) + "px",
            ease: "none",
            scrollTrigger: {
                trigger: ".horizontal-container",
                start: "top top",
                end: () => "+=" + horizontalSection.scrollWidth,
                scrub: 1
            }
        });
    });

    gsap.to(player, {
        x: () => horizontalSection.scrollWidth - window.innerWidth - parseInt(player.style.left),
        ease: "none",
        scrollTrigger: {
            trigger: ".horizontal-container",
            start: "top top",
            end: () => "+=" + horizontalSection.scrollWidth,
            scrub: 1
        }
    });

    // HUD Visibility
    if (hudOverlay) {
        const topHeader = document.getElementById('top-header');
        const headerHeight = topHeader.offsetHeight;
        hudOverlay.style.top = `${headerHeight + 12}px`;
        gsap.set(hudOverlay, { autoAlpha: 0 });
    }
}

function initSkillBarAnimations() {
    gsap.utils.toArray('.skill-card').forEach(card => {
        ScrollTrigger.create({
            trigger: card,
            start: 'top 80%',
            once: true,
            onEnter: () => {
                gsap.to(card.querySelectorAll('.xp-bar'), {
                    width: (index, bar) => bar.getAttribute('data-width'),
                    duration: 1,
                    ease: 'cubic-bezier(0.23, 1, 0.32, 1)',
                    stagger: 0.1
                });
            }
        });
    });
}

function initAboutSectionAnimations() {
    gsap.utils.toArray('#about-section .reveal-on-scroll').forEach(elem => {
        gsap.from(elem, {
            scrollTrigger: {
                trigger: elem,
                start: 'top 85%',
                end: 'bottom 15%',
                toggleActions: 'play none none none'
            },
            opacity: 0,
            y: 50,
            duration: 0.8,
            ease: 'power3.out'
        });
    });
}

export function initAnimations() {
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
    initMobileScaling();
    initMainScrollAnimation();
    initSkillBarAnimations();
    initAboutSectionAnimations();

    window.addEventListener('resize', () => ScrollTrigger.refresh());
}
