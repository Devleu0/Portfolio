import { state } from './config.js';
import { update as updateRenderer } from './renderer.js';

// 템플릿 리터럴(백틱 `)로 변경하여 줄바꿈 구문 오류 해결 
let termTypedTextData = {
    ko: `> 프로필 데이터를 불러오는 중... OK
> 시스템 준비 완료.
> 27개의 기록이 발견되었습니다.`,
    en: `> LOADING PROFILE DATA... OK
> SYSTEM READY.
> 27 RECORDS FOUND.`,
    ja: `> プロフィールデータを読み込み中... OK
> システム準備完了。
> 27個の記録が見つかりました。`
};

export function updateLanguage(lang) {
    state.currentLang = lang;
    document.documentElement.lang = lang;

    // Render dynamic resume sections with the new language
    updateRenderer(lang);

    // Update all other elements with '.lang-text'
    document.querySelectorAll('.lang-text').forEach(function (el) {
        const newText = el.getAttribute(`data-${lang}`) || el.getAttribute('data-ko') || '';
        // Only update if the element is not inside a renderer-controlled container,
        // or if it's a special case. For now, we update if text is different.
        if (newText && el.innerHTML !== newText) {
            el.innerHTML = newText;
        }
    });

    // Update terminal text
    window._termTypedText = termTypedTextData[lang];

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