// =================================================================================
// 애플리케이션 전역 설정, 상수 및 공유 상태 관리 모듈
// =================================================================================

// ---------------------------------------------------------------------------------
// 기본 환경 및 테마 설정
// ---------------------------------------------------------------------------------
export const isMobile = window.innerWidth <= 768; // 모바일 기기 여부 확인
export const mobileScale = 0.5;                     // 모바일 환경에서의 크기 축소 비율
export const THEME = 'retro';                       // 애플리케이션 테마 ('retro' 또는 'minimal')

// ---------------------------------------------------------------------------------
// 아이콘 및 색상 상수
// ---------------------------------------------------------------------------------
// 이벤트 카테고리별 SVG 아이콘 경로 데이터
export const ICONS = {
    birth: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
    graduation: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    enrollment: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    certificate: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
    military: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    internship: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    project: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    other: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>'
};

// 이벤트 카테고리별 색상
export const CATEGORY_COLORS = {
    birth:       '#22D3EE', // 청록
    enrollment:  '#4ADE80', // 초록
    graduation:  '#FBBF24', // 금색
    military:    '#F97316', // 주황
    certificate: '#A78BFA', // 보라
    project:     '#38BDF8', // 파랑
    internship:  '#F472B6', // 분홍
    other:       '#94A3B8', // 회색
};

/**
 * 카테고리 이름에 해당하는 색상 코드를 반환합니다.
 * @param {string} category - 카테고리 이름
 * @returns {string} 16진수 색상 코드
 */
export function getCategoryColor(category) {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
}

// 스크롤 진행률에 따른 하늘색 변화를 위한 색상 배열
export const SKY_STOPS = THEME === 'minimal' ? ['#020617', '#0F172A', '#1E293B', '#0F172A'] : ['#0F172A', '#1E1B4B', '#4C1D95', '#701A75'];

// ---------------------------------------------------------------------------------
// 전역 상태 객체 (Global State)
// ---------------------------------------------------------------------------------
// 애플리케이션의 모든 모듈이 공유하는 상태값들을 담고 있습니다.
export const state = {
    // 시스템 상태
    currentLang: 'ko',          // 현재 선택된 언어
    isScrolledToEnd: false,     // 스크롤이 끝까지 도달했는지 여부
    currentFinaleP: 0,          // 피날레 구간 진행률 (0 to 1)
    LAST_ZONE_START: 0,         // 피날레 구역이 시작되는 스크롤 위치
    
    // 게임 물리 및 플레이어 상태
    velocityY: 0,               // 플레이어의 수직 속도
    onGround: true,             // 플레이어가 땅에 있는지 여부
    isJumping: false,           // 플레이어가 점프 중인지 여부
    isDucking: false,           // 플레이어가 숙이는 중인지 여부
    onPlatform: null,           // 플레이어가 플랫폼 위에 있는지 여부
    keys: { left: false, right: false }, // 키보드 입력 상태
    
    // 게임 플레이 상태
    collectedIds: new Set(),    // 수집한 이벤트 ID 목록
    totalScore: 0,              // 총 점수
    perfectCount: 0,            // 'Perfect' 판정 횟수
    comboCount: 0,              // 현재 콤보 수
    maxCombo: 0,                // 최대 콤보 수
    
    // UI 및 애니메이션 상태
    isGameHudVisible: false,    // 게임 HUD가 보이는지 여부
    isStatSectionCounted: false,// 통계 섹션 카운트 애니메이션 실행 여부
};

// ---------------------------------------------------------------------------------
// 유틸리티 함수
// ---------------------------------------------------------------------------------

/**
 * HTML 문자열을 이스케이프하여 XSS 공격을 방지합니다.
 * @param {string} str - 이스케이프할 문자열
 * @returns {string} 이스케이프된 문자열
 */
export const escapeHtml = (str) => String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * 다국어 객체를 받아 HTML data 속성 문자열을 생성합니다.
 * @param {object|string} obj - 다국어 텍스트 객체 또는 단일 문자열
 * @returns {string} 'data-ko="..." data-en="..." data-ja="..."' 형식의 문자열
 */
export function buildLangAttrs(obj) {
    if (!obj) return 'data-ko="" data-en="" data-ja=""';
    if (typeof obj === 'string') return `data-ko="${escapeHtml(obj)}" data-en="${escapeHtml(obj)}" data-ja="${escapeHtml(obj)}"`;
    return `data-ko="${escapeHtml(obj.ko || '')}" data-en="${escapeHtml(obj.en || obj.ko || '')}" data-ja="${escapeHtml(obj.ja || obj.ko || '')}"`;
}

/**
 * 다국어 객체에서 현재 언어에 맞는 문자열을 반환합니다.
 * @param {object|string} obj - 다국어 텍스트 객체 또는 단일 문자열
 * @param {string} lang - 'ko', 'en', 'ja' 등의 언어 코드
 * @returns {string} 해당 언어의 문자열
 */
export function getStr(obj, lang) {
    if (typeof obj === 'string') return obj;
    return obj[lang] || obj.ko || '';
}


// --- 색상 계산 유틸리티 ---

// 16진수 색상을 RGB 배열로 변환
function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
}

// 두 값 사이를 선형 보간
function lerp(a, b, t) {
    return a + (b - a) * t;
}

// 두 16진수 색상을 주어진 비율(t)로 혼합
function mixColors(hexA, hexB, t) {
    const c1 = hexToRgb(hexA);
    const c2 = hexToRgb(hexB);
    return `rgb(${Math.round(lerp(c1[0], c2[0], t))}, ${Math.round(lerp(c1[1], c2[1], t))}, ${Math.round(lerp(c1[2], c2[2], t))})`;
}

/**
 * 전체 스크롤 진행률(progress)에 따라 동적인 하늘색을 계산하여 반환합니다.
 * `SKY_STOPS` 배열에 정의된 색상들 사이를 부드럽게 보간합니다.
 * @param {number} progress - 전체 스크롤 진행률 (0 to 1)
 * @returns {string} 'rgb(...)' 형식의 색상 문자열
 */
export function getSkyColor(progress) {
    const segCount = SKY_STOPS.length - 1;
    const segment = Math.min(Math.floor(progress * segCount), segCount - 1);
    const localT = progress * segCount - segment; // 현재 색상 구간 내에서의 진행률 (0 to 1)
    return mixColors(SKY_STOPS[segment], SKY_STOPS[segment + 1], localT);
}
