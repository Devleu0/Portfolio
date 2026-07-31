
import { state } from './config.js';

// This will be populated by the game module
let termTypedTextData = {
    ko: '> 프로필 데이터를 불러오는 중... OK
        > 시스템 준비 완료.
    > 27개의 기록이 발견되었습니다.',
    en: '> LOADING PROFILE DATA... OK
    > SYSTEM READY.
    > 27 RECORDS FOUND.',
    ja: '> プロフィールデータを読み込み中... OK
    > システム準備完了。
    > 27個の記録が見つかりました。'
};

export function updateLanguage(lang) {
    state.currentLang = lang;
    document.documentElement.lang = lang;

    // Update all elements with '.lang-text'
    document.querySelectorAll('.lang-text').forEach(function (el) {
        const newText = el.getAttribute(`data-${lang}`) || el.getAttribute('data-ko') || '';
        if (newText && el.innerHTML !== newText) {
            el.innerHTML = newText;
        }
    });

    // Toggle visibility of about content sections
    document.querySelectorAll('.about-content').forEach(function (el) {
        el.style.display = 'none';
    });
    const activeAboutContent = document.querySelector(`.about-content[lang="${lang}"]`);
    if (activeAboutContent) {
        activeAboutContent.style.display = 'block';
    }

    // Update terminal text (via a global-like variable accessible to the terminal animation)
    window._termTypedText = termTypedTextData[lang];

    // Update the skip button text immediately
    const skipBtn = document.getElementById('skip-game-btn');
    if (skipBtn) {
        const attr = state.isScrolledToEnd ? `data-${lang}-return` : `data-${lang}`;
        const fallbackAttr = state.isScrolledToEnd ? 'data-ko-return' : 'data-ko';
        skipBtn.innerHTML = skipBtn.getAttribute(attr) || skipBtn.getAttribute(fallbackAttr);
    }
}

export function initLanguageSwitcher() {
    const langSelector = document.getElementById('lang-selector');
    if (langSelector) {
        langSelector.addEventListener('change', (e) => updateLanguage(e.target.value));
        // Set initial language based on selector
        updateLanguage(langSelector.value);
    } else {
        // Fallback if selector is not present
        updateLanguage('ko');
    }
}
