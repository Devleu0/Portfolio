// =================================================================================
// 애플리케이션 메인 진입점 (Entry Point)
// =================================================================================
// 이 파일은 모든 모듈을 가져와 순서대로 초기화하는 역할을 합니다.

// ---------------------------------------------------------------------------------
// 모듈 임포트
// ---------------------------------------------------------------------------------
import { initLanguageSwitcher } from './modules/language.js';
import { initAudio } from './modules/audio.js';
import { initGame } from './modules/game.js';
import { initUI } from './modules/ui.js';
import { initAnimations } from './modules/animations.js';
import { init as initRenderer } from './modules/renderer.js';
import { state } from './modules/config.js';

// ---------------------------------------------------------------------------------
// Zone(구역) 요소 생성 함수
// ---------------------------------------------------------------------------------
/**
 * `zones.json` 데이터를 기반으로 각 구역(Zone)의 DOM 요소를 생성하고,
 * 패럴랙스 배경, 제목, 특수 효과 등을 설정합니다.
 */
async function createZoneElements() {
    try {
        // 1. 구역 데이터 로드
        const response = await fetch('js/data/zones.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const zones = await response.json();
        state.zones = zones; // 전역 상태에 구역 데이터 저장

        const horizontalSection = document.querySelector('.horizontal-section');
        if (!horizontalSection) {
            console.error('오류: .horizontal-section 요소를 찾을 수 없습니다.');
            return;
        }

        let totalWidthBeforeFinale = 0;
        const finaleIndex = zones.findIndex(z => z.isFinale);

        // 2. 각 구역에 대해 DOM 요소 생성
        zones.forEach((zoneData, index) => {
            if (finaleIndex === -1 || index < finaleIndex) {
                totalWidthBeforeFinale += zoneData.width;
            }

            const zoneEl = document.createElement('div');
            zoneEl.className = 'zone';
            zoneEl.setAttribute('data-zone-id', zoneData.id);

            // 3. '피날레' 구역 특별 처리 (콘페티 효과 등)
            if (zoneData.isFinale) {
                zoneEl.classList.add('finale');
                const finaleLayer = document.createElement('div');
                finaleLayer.className = 'finale-layer';

                // 콘페티(색종이 조각) 데이터 및 요소 생성
                const confettiData = [
                    { left: '0%', background: '#22D3EE', duration: '2s', delay: '0s' }, { left: '53%', background: '#FBBF24', duration: '2.4s', delay: '0.3s' },
                    { left: '6%', background: '#F472B6', duration: '2.8s', delay: '0.6s' }, { left: '59%', background: '#4ADE80', duration: '3.2s', delay: '0.9s' },
                    { left: '12%', background: '#22D3EE', duration: '3.6s', delay: '1.2s' }, { left: '65%', background: '#FBBF24', duration: '2s', delay: '1.5s' },
                    { left: '18%', background: '#F472B6', duration: '2.4s', delay: '0s' }, { left: '71%', background: '#4ADE80', duration: '2.8s', delay: '0.3s' },
                    { left: '24%', background: '#22D3EE', duration: '3.2s', delay: '0.6s' }, { left: '77%', background: '#FBBF24', duration: '3.6s', delay: '0.9s' },
                    { left: '30%', background: '#F472B6', duration: '2s', delay: '1.2s' }, { left: '83%', background: '#4ADE80', duration: '2.4s', delay: '1.5s' },
                    { left: '36%', background: '#22D3EE', duration: '2.8s', delay: '0s' }, { left: '89%', background: '#FBBF24', duration: '3.2s', delay: '0.3s' },
                    { left: '42%', background: '#F472B6', duration: '3.6s', delay: '0.6s' }, { left: '95%', background: '#4ADE80', duration: '2s', delay: '0.9s' },
                    { left: '48%', background: '#22D3EE', duration: '2.4s', delay: '1.2s' }, { left: '1%', background: '#FBBF24', duration: '2.8s', delay: '1.5s' },
                ];

                confettiData.forEach(confetto => {
                    const c = document.createElement('div');
                    c.className = 'finale-confetti';
                    c.style.cssText = `top: -20px; left: ${confetto.left}; background: ${confetto.background}; animation-duration: ${confetto.duration}; animation-delay: ${confetto.delay};`;
                    finaleLayer.appendChild(c);
                });

                // 피날레 캡션 (STAGE CLEAR)
                const caption = document.createElement('div');
                caption.className = 'finale-caption';
                caption.innerHTML = '<div class="finale-caption-retro">STAGE CLEAR</div>';
                finaleLayer.appendChild(caption);
                zoneEl.appendChild(finaleLayer);
            }

            zoneEl.style.width = `${zoneData.width}px`;
            zoneEl.style.backgroundColor = zoneData.backgroundColor;
            if (zoneData.noBorder) {
                zoneEl.style.borderRight = 'none';
            }

            // 4. 패럴랙스(시차) 배경 레이어 생성
            if (zoneData.scenery && zoneData.scenery.type !== 'none' && zoneData.scenery.parallax) {
                const parallaxLayers = [
                    { speed: 0.1, class: 'parallax-bg-far', key: 'far' },
                    { speed: 0.2, class: 'parallax-bg-mid', key: 'mid' },
                    { speed: 0.4, class: 'parallax-bg-near', key: 'near' }
                ];
                parallaxLayers.forEach(layer => {
                    const imageUrl = zoneData.scenery.parallax[layer.key];
                    if (!imageUrl) return; // 해당 레이어 이미지가 없으면 건너뜀

                    const bgEl = document.createElement('div');
                    bgEl.className = `parallax-bg ${layer.class}`;
                    bgEl.style.backgroundImage = `url('${imageUrl}')`;
                    bgEl.setAttribute('data-width', zoneData.width);
                    bgEl.setAttribute('data-speed', layer.speed);
                    zoneEl.appendChild(bgEl);
                });
            }

            // 5. 구역 제목, 부제, 플레이버 텍스트 추가
            const titleEl = document.createElement('div');
            titleEl.className = 'zone-title lang-text';
            titleEl.setAttribute('data-ko', zoneData.title.ko);
            titleEl.setAttribute('data-en', zoneData.title.en);
            titleEl.setAttribute('data-ja', zoneData.title.ja);
            titleEl.textContent = zoneData.title[state.currentLang] || zoneData.title.en;
            zoneEl.appendChild(titleEl);

            if (zoneData.subtitle) {
                const subtitleEl = document.createElement('div');
                subtitleEl.className = 'zone-subtitle lang-text';
                subtitleEl.setAttribute('data-ko', zoneData.subtitle.ko);
                subtitleEl.setAttribute('data-en', zoneData.subtitle.en);
                subtitleEl.setAttribute('data-ja', zoneData.subtitle.ja);
                subtitleEl.textContent = zoneData.subtitle[state.currentLang] || zoneData.subtitle.en;
                zoneEl.appendChild(subtitleEl);
            }
            
            if (zoneData.flavorText) {
                const flavorEl = document.createElement('div');
                flavorEl.className = 'zone-flavor-text lang-text';
                flavorEl.setAttribute('data-ko', zoneData.flavorText.ko);
                flavorEl.setAttribute('data-en', zoneData.flavorText.en);
                flavorEl.setAttribute('data-ja', zoneData.flavorText.ja);
                flavorEl.textContent = zoneData.flavorText[state.currentLang] || zoneData.flavorText.en;
                zoneEl.appendChild(flavorEl);
            }

            horizontalSection.appendChild(zoneEl);
        });

        // 피날레 구역 시작 위치를 전역 상태에 저장
        state.LAST_ZONE_START = totalWidthBeforeFinale;

    } catch (error) {
        console.error('구역 요소 생성 중 오류 발생:', error);
    }
}

// ---------------------------------------------------------------------------------
// DOM 로드 완료 후 초기화 실행
// ---------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    // 1. 데이터 의존성이 없는 기본 시스템 초기화
    initLanguageSwitcher(); // 다국어 지원
    initAudio();            // 오디오 시스템

    // 2. JSON 데이터 로드 및 렌더링
    await initRenderer(); // 이력서 데이터 등

    // 3. 'zone' 데이터 기반으로 게임 세계 구성
    await createZoneElements();

    // 4. 게임 로직 초기화 (플레이어, 이벤트 등 생성)
    await initGame();

    // 5. 모든 DOM 요소가 준비된 후 애니메이션 초기화
    initAnimations();

    // 6. UI 컴포넌트 초기화
    initUI();
});
