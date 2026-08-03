
import { initLanguageSwitcher } from './modules/language.js';
import { initAudio } from './modules/audio.js';
import { initGame } from './modules/game.js';
import { initUI } from './modules/ui.js';
import { initAnimations } from './modules/animations.js';
import { init as initRenderer } from './modules/renderer.js';
import { state, isMobile, mobileScale } from './modules/config.js';

async function createZoneElements() {
    try {
        const response = await fetch('js/data/zones.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const zones = await response.json();
        state.zones = zones; // Store zones in the global state

        const horizontalSection = document.querySelector('.horizontal-section');
        if (!horizontalSection) {
            console.error('Horizontal section not found!');
            return;
        }

        let totalWidthBeforeFinale = 0;
        const finaleIndex = zones.findIndex(z => z.isFinale);

        zones.forEach((zoneData, index) => {
            if (finaleIndex === -1 || index < finaleIndex) {
                totalWidthBeforeFinale += zoneData.width;
            }

            const zoneEl = document.createElement('div');
            zoneEl.className = 'zone';
            zoneEl.setAttribute('data-zone-id', zoneData.id);

            if (zoneData.isFinale) {
                zoneEl.classList.add('finale');
                const finaleLayer = document.createElement('div');
                finaleLayer.className = 'finale-layer';

                const confettiData = [
                    { left: '0%', background: '#22D3EE', duration: '2s', delay: '0s' },
                    { left: '53%', background: '#FBBF24', duration: '2.4s', delay: '0.3s' },
                    { left: '6%', background: '#F472B6', duration: '2.8s', delay: '0.6s' },
                    { left: '59%', background: '#4ADE80', duration: '3.2s', delay: '0.9s' },
                    { left: '12%', background: '#22D3EE', duration: '3.6s', delay: '1.2s' },
                    { left: '65%', background: '#FBBF24', duration: '2s', delay: '1.5s' },
                    { left: '18%', background: '#F472B6', duration: '2.4s', delay: '0s' },
                    { left: '71%', background: '#4ADE80', duration: '2.8s', delay: '0.3s' },
                    { left: '24%', background: '#22D3EE', duration: '3.2s', delay: '0.6s' },
                    { left: '77%', background: '#FBBF24', duration: '3.6s', delay: '0.9s' },
                    { left: '30%', background: '#F472B6', duration: '2s', delay: '1.2s' },
                    { left: '83%', background: '#4ADE80', duration: '2.4s', delay: '1.5s' },
                    { left: '36%', background: '#22D3EE', duration: '2.8s', delay: '0s' },
                    { left: '89%', background: '#FBBF24', duration: '3.2s', delay: '0.3s' },
                    { left: '42%', background: '#F472B6', duration: '3.6s', delay: '0.6s' },
                    { left: '95%', background: '#4ADE80', duration: '2s', delay: '0.9s' },
                    { left: '48%', background: '#22D3EE', duration: '2.4s', delay: '1.2s' },
                    { left: '1%', background: '#FBBF24', duration: '2.8s', delay: '1.5s' },
                ];

                confettiData.forEach(confetto => {
                    const c = document.createElement('div');
                    c.className = 'finale-confetti';
                    c.style.top = '-20px';
                    c.style.left = confetto.left;
                    c.style.background = confetto.background;
                    c.style.animationDuration = confetto.duration;
                    c.style.animationDelay = confetto.delay;
                    finaleLayer.appendChild(c);
                });

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

            // Create and append parallax backgrounds only if bgType is not 'none'
            if (zoneData.bgType && zoneData.bgType !== 'none') {
                const parallaxLayers = [
                    { speed: 0.1, class: 'parallax-bg-far' },
                    { speed: 0.2, class: 'parallax-bg-mid' },
                    { speed: 0.4, class: 'parallax-bg-near' }
                ];
                parallaxLayers.forEach(layer => {
                    const bgEl = document.createElement('div');
                    bgEl.className = `parallax-bg ${layer.class}`;
                    bgEl.setAttribute('data-width', zoneData.width);
                    bgEl.setAttribute('data-speed', layer.speed);
                    zoneEl.appendChild(bgEl);
                });
            }


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

        // Store the raw, unscaled width. Scaling will be handled in the animation logic.
        state.LAST_ZONE_START = totalWidthBeforeFinale;

    } catch (error) {
        console.error('Error creating zone elements:', error);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // Create and show a start overlay
    const startOverlay = document.createElement('div');
    startOverlay.id = 'start-overlay';
    startOverlay.innerHTML = `
        <div class="start-message">
            <div class="lang-text" data-ko="화면을 클릭하여 시작" data-en="Click to Start" data-ja="クリックして開始">Click to Start</div>
            <div class="start-keys">[ W, A, S, D ] or [ ←, → ]</div>
        </div>
    `;
    document.body.appendChild(startOverlay);

    // Load and render dynamic data from JSON
    await initRenderer();

    // Create the game world from zone data
    await createZoneElements();

    // Initialize the game, which creates the player and obstacles
    await initGame();

        // Initialize all game systems
        initLanguageSwitcher();
        initAudio();
        await initGame();
        initAnimations();
        initUI();
    }

    // Add a one-time event listener for the first user interaction
    document.addEventListener('pointerdown', initializeAndStartGame, { once: true });
});
