
import { initLanguageSwitcher } from './modules/language.js';
import { initAudio } from './modules/audio.js';
import { initGame } from './modules/game.js';
import { initUI } from './modules/ui.js';
import { initAnimations } from './modules/animations.js';

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

    // Function to initialize and start the game
    async function initializeAndStartGame() {
        // Hide the start overlay
        startOverlay.style.opacity = '0';
        startOverlay.style.pointerEvents = 'none';

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
