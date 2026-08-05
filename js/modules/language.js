import { state } from './config.js';
import { update as updateRenderer } from './renderer.js';
import { initSkillBarAnimations } from './animations.js';

export function updateLanguage(lang, rerenderFull = true) {
    state.currentLang = lang;
    document.documentElement.lang = lang;

    // Render dynamic resume sections with the new language
    if (rerenderFull) {
        updateRenderer(lang);
        // Re-initialize skill bar animations for the new elements
        initSkillBarAnimations();
    }

    // Update all other elements with '.lang-text'
    document.querySelectorAll('.lang-text').forEach(function (el) {
        const newText = el.getAttribute(`data-${lang}`) || el.getAttribute('data-ko') || '';
        // Only update if the element is not inside a renderer-controlled container,
        // or if it's a special case. For now, we update if text is different.
        if (newText && el.innerHTML !== newText) {
            el.innerHTML = newText;
        }
    });

    // Update all tooltip elements with '.progress-tooltip'
    document.querySelectorAll('.progress-tooltip').forEach(function (el) {
        const newText = el.getAttribute(`data-${lang}`) || el.getAttribute('data-ko') || '';
        if (newText && el.textContent !== newText) {
            el.textContent = newText;
        }
    });

    // Update the skip button text immediately
    const skipBtn = document.getElementById('skip-game-btn');
    if (skipBtn) {
        const attr = state.isScrolledToEnd ? `data-${lang}-return` : `data-${lang}`;
        const fallbackAttr = state.isScrolledToEnd ? 'data-ko-return' : 'data-ko';
        const newText = skipBtn.getAttribute(attr) || skipBtn.getAttribute(fallbackAttr);
        if (newText) {
            skipBtn.innerHTML = newText;
        }
    }
}

export function initLanguageSwitcher() {
    const langSelector = document.getElementById('lang-selector');
    const supportedLangs = ['ko', 'en', 'ja'];
    const browserLang = navigator.language.split('-')[0];
    let initialLang = 'en';

    if (supportedLangs.includes(browserLang)) {
        initialLang = browserLang;
    }

    if (langSelector) {
        langSelector.value = initialLang;
        langSelector.addEventListener('change', (e) => updateLanguage(e.target.value));
        updateLanguage(initialLang);
    } else {
        updateLanguage(initialLang);
    }
}