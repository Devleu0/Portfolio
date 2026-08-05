// =================================================================================
// GSAP를 사용한 스크롤 기반 애니메이션 관리 모듈
// =================================================================================

import { isMobile, mobileScale, getSkyColor, state } from './app-config.js';
import { getPlayerElement, getPlayerWrapper } from './game-core.js';

/**
 * 모바일 환경에서 각종 요소(구역, 배경 등)의 크기를 조정합니다.
 */
function initMobileScaling() {
    if (!isMobile) return;

    // 'zone' 너비 조정
    document.querySelectorAll('.zone').forEach(zone => {
        const originalWidth = parseInt(zone.style.width, 10);
        if (!isNaN(originalWidth)) {
            zone.style.width = (originalWidth * mobileScale) + 'px';
        }
    });

    // 패럴랙스 배경 너비 데이터 조정
    document.querySelectorAll('.parallax-bg').forEach(bg => {
        const originalWidth = parseInt(bg.dataset.width, 10);
        if (!isNaN(originalWidth)) {
            bg.dataset.width = (originalWidth * mobileScale);
        }
    });
}

/**
 * 메인 가로 스크롤 애니메이션을 설정합니다.
 * 사용자의 세로 스크롤에 반응하여 가로로 콘텐츠가 움직이도록 합니다.
 */
function initMainScrollAnimation() {
    const horizontalSection = document.querySelector('.horizontal-section');
    const player = getPlayerElement();
    const playerWrapper = getPlayerWrapper();

    // 애니메이션 대상 DOM 요소 캐싱
    const skyOverlay = document.getElementById('sky-overlay');
    const sun = document.getElementById('sun');
    const progressBarWrap = document.getElementById('progress-bar-wrap');
    const progressFill = document.getElementById('progress-fill');
    const finaleFlash = document.getElementById('finale-flash');
    const hudOverlay = document.getElementById('hud-overlay');
    const gameOnlyUI = gsap.utils.toArray('.game-only-ui');

    // GSAP ScrollTrigger를 사용하여 가로 스크롤 효과 생성
    gsap.to(horizontalSection, {
        // x축으로 (전체 너비 - 뷰포트 너비) 만큼 이동
        x: () => -(horizontalSection.scrollWidth - window.innerWidth) + "px",
        ease: "none", // 등속 이동
        scrollTrigger: {
            trigger: ".horizontal-container", // 트리거 요소
            pin: true, // 스크롤 동안 화면에 고정
            scrub: 1,  // 스크롤 위치와 애니메이션을 부드럽게 연결
            end: () => "+=" + horizontalSection.scrollWidth, // 끝나는 지점
            
            // 스크롤이 업데이트될 때마다 실행되는 콜백
            onUpdate: (self) => {
                const p = self.progress; // 전체 스크롤 진행률 (0 to 1)
                state.isScrolledToEnd = p > 0.998;
                
                // Manually update skip button text to avoid circular dependency
                const skipBtn = document.getElementById('skip-game-btn');
                if (skipBtn) {
                    const attr = state.isScrolledToEnd ? `data-${state.currentLang}-return` : `data-${state.currentLang}`;
                    const fallbackAttr = state.isScrolledToEnd ? 'data-ko-return' : 'data-ko';
                    const newText = skipBtn.getAttribute(attr) || skipBtn.getAttribute(fallbackAttr);
                    if (newText && skipBtn.innerHTML !== newText) {
                        skipBtn.innerHTML = newText;
                    }
                }

                // --- 1. 시각적 요소 업데이트 ---
                skyOverlay.style.background = `linear-gradient(to bottom, ${getSkyColor(p)}D0 0%, transparent 90%)`;
                sun.style.transform = `translate(${p * (window.innerWidth - 56)}px, ${40 + (1 - Math.sin(p * (Math.PI / 2))) * 140}px)`;
                progressFill.style.width = `${p * 100}%`;
                progressFill.style.boxShadow = p >= 0.999
                    ? '0 0 20px #22D3EE, 0 0 36px #22D3EE' // 끝에 도달했을 때 강조 효과
                    : '0 0 10px var(--accent)';

                // --- 2. 피날레 구간 로직 ---
                const maxTranslate = Math.max(1, horizontalSection.scrollWidth - window.innerWidth);
                const scaledLastZoneStart = isMobile ? state.LAST_ZONE_START * mobileScale : state.LAST_ZONE_START;
                const zoneStartFraction = Math.min(0.98, scaledLastZoneStart / maxTranslate);
                const denom = Math.max(0.0001, 1 - zoneStartFraction);
                // 피날레 구간 내에서의 진행률 (0 to 1)
                const finaleP = Math.min(1, Math.max(0, (p - zoneStartFraction) / denom)); 
                const flashP = finaleP > 0 ? Math.max(0, 1 - finaleP / 0.12) : 0; // 화면 번쩍임 효과
                
                document.documentElement.style.setProperty('--finale-p', finaleP.toFixed(3)); // CSS 변수로 전달
                finaleFlash.style.opacity = flashP.toFixed(3);
                state.currentFinaleP = finaleP;

                // 피날레 구간 진입 시 플레이어 애니메이션 활성화
                if (playerWrapper) {
                    const active = finaleP > 0.05;
                    playerWrapper.classList.toggle('player-victory-cycle', active);
                    playerWrapper.classList.toggle('player-finale-bounce', active);
                }
            },
            // --- 3. HUD 표시/숨김 로직 ---
            onEnter: () => { // 가로 스크롤 진입 시
                progressBarWrap.style.opacity = '1';
                progressBarWrap.style.pointerEvents = 'auto';
                gsap.to([hudOverlay, ...gameOnlyUI], { autoAlpha: 1, duration: 0.3 });
            },
            onLeave: () => { // 가로 스크롤 이탈 시
                progressBarWrap.style.opacity = '0';
                progressBarWrap.style.pointerEvents = 'none';
                gsap.to([hudOverlay, ...gameOnlyUI], { autoAlpha: 0, duration: 0.3 });
            },
            onEnterBack: () => { // 거꾸로 가로 스크롤 진입 시
                progressBarWrap.style.opacity = '1';
                progressBarWrap.style.pointerEvents = 'auto';
                gsap.to([hudOverlay, ...gameOnlyUI], { autoAlpha: 1, duration: 0.3 });
            },
            onLeaveBack: () => { // 거꾸로 가로 스크롤 이탈 시
                progressBarWrap.style.opacity = '0';
                progressBarWrap.style.pointerEvents = 'none';
                gsap.to([hudOverlay, ...gameOnlyUI], { autoAlpha: 0, duration: 0.3 });
            },
        }
    });

    // 패럴랙스(시차) 배경 스크롤 애니메이션
    gsap.utils.toArray('.parallax-bg').forEach(bg => {
        const zoneWidth = parseInt(bg.getAttribute('data-width'), 10);
        const speed = parseFloat(bg.getAttribute('data-speed')) || 0.4;
        gsap.to(bg, {
            x: -(zoneWidth * speed) + "px", // 속도에 따라 다른 이동 거리
            ease: "none",
            scrollTrigger: {
                trigger: ".horizontal-container",
                start: "top top",
                end: () => "+=" + horizontalSection.scrollWidth,
                scrub: 1
            }
        });
    });

    // 플레이어 스크롤 애니메이션
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

    // HUD 위치 조정
    if (hudOverlay) {
        const topHeader = document.getElementById('top-header');
        const headerHeight = topHeader.offsetHeight;
        hudOverlay.style.top = `${headerHeight + 12}px`;
    }
}

/**
 * '기술' 섹션의 스킬 바가 화면에 나타날 때 채워지는 애니메이션을 설정합니다.
 */
export function initSkillBarAnimations() {
    gsap.utils.toArray('.skill-card').forEach(card => {
        ScrollTrigger.create({
            trigger: card,
            start: 'top 80%', // 카드가 뷰포트 80% 지점에 도달했을 때
            once: true, // 한 번만 실행
            onEnter: () => {
                gsap.to(card.querySelectorAll('.xp-bar'), {
                    width: (index, bar) => bar.getAttribute('data-width'), // data-width 값으로 너비 변경
                    duration: 1,
                    ease: 'cubic-bezier(0.23, 1, 0.32, 1)',
                    stagger: 0.1 // 순차적으로 애니메이션
                });
            }
        });
    });
}

/**
 * '소개' 섹션의 요소들이 스크롤 시 아래에서 위로 나타나는 애니메이션을 설정합니다.
 */
function initAboutSectionAnimations() {
    gsap.utils.toArray('#about-section .reveal-on-scroll').forEach(elem => {
        gsap.from(elem, {
            scrollTrigger: {
                trigger: elem,
                start: 'top 85%',
                end: 'bottom 15%',
                toggleActions: 'play none none none' // 들어올 때 한 번만 재생
            },
            opacity: 0,
            y: 50, // 아래에서 위로
            duration: 0.8,
            ease: 'power3.out'
        });
    });
}

/**
 * 모든 애니메이션을 초기화하는 메인 함수입니다.
 */
export function initAnimations() {
    // GSAP 플러그인 등록
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    // 각 애니메이션 초기화 함수 호출
    initMobileScaling();
    initMainScrollAnimation();
    initSkillBarAnimations();
    initAboutSectionAnimations();

    // 창 크기 변경 시 ScrollTrigger 상태 새로고침 (반응형 대응)
    window.addEventListener('resize', () => ScrollTrigger.refresh());
}
