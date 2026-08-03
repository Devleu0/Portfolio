
import { initLanguageSwitcher } from './modules/language.js';
import { initAudio } from './modules/audio.js';
import { initGame } from './modules/game.js';
import { initUI } from './modules/ui.js';
import { initAnimations } from './modules/animations.js';
import { init as initRenderer } from './modules/renderer.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize systems that don't depend on game data first
    initLanguageSwitcher();
    initAudio();

    // Load and render dynamic data from JSON
    await initRenderer();

    // Initialize the game, which creates the player and obstacles
    await initGame();

    // Initialize animations, which depend on the game elements being in the DOM
    initAnimations();

    // Initialize UI components, which may also depend on game elements
    initUI();
});
