
import { initLanguageSwitcher } from './modules/language.js';
import { initAudio } from './modules/audio.js';
import { initGame } from './modules/game.js';
import { initUI } from './modules/ui.js';
import { initAnimations } from './modules/animations.js';
import { init as initRenderer } from './modules/renderer.js';
import { state } from './modules/config.js';

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
            if (zoneData.isFinale) {
                zoneEl.classList.add('finale');
            }
            zoneEl.style.width = `${zoneData.width}px`;
            zoneEl.style.backgroundColor = zoneData.backgroundColor;
            if (zoneData.noBorder) {
                zoneEl.style.borderRight = 'none';
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

        state.LAST_ZONE_START = isMobile ? totalWidthBeforeFinale * mobileScale : totalWidthBeforeFinale;


    } catch (error) {
        console.error('Error creating zone elements:', error);
    }
}


document.addEventListener('DOMContentLoaded', async () => {
    // Initialize systems that don't depend on game data first
    initLanguageSwitcher();
    initAudio();

    // Load and render dynamic data from JSON
    await initRenderer();

    // Create the game world from zone data
    await createZoneElements();

    // Initialize the game, which creates the player and obstacles
    await initGame();

    // Initialize animations, which depend on the game elements being in the DOM
    initAnimations();

    // Initialize UI components, which may also depend on game elements
    initUI();
});
