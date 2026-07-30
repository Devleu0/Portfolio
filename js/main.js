gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// --- Mobile Scaling ---
const isMobile = window.innerWidth <= 768;
const mobileScale = 0.5;

if (isMobile) {
    // Scale down zone widths which are set via inline styles in the HTML
    document.querySelectorAll('.zone').forEach(zone => {
        const originalWidth = parseInt(zone.style.width, 10);
        if (!isNaN(originalWidth)) {
            zone.style.width = (originalWidth * mobileScale) + 'px';
        }
    });
    // Also scale the parallax data attribute which is used by GSAP
    document.querySelectorAll('.parallax-bg').forEach(bg => {
        const originalWidth = parseInt(bg.dataset.width, 10);
        if (!isNaN(originalWidth)) {
            bg.dataset.width = (originalWidth * mobileScale);
        }
    });
}
// --- End Mobile Scaling ---

// --- Sound Engine ---
let audioCtx;
let isMuted = true; // Initially muted
let jumpBuffer = null;
let coinBuffer = null;

async function setupAudio() {
    if (window.AudioContext || window.webkitAudioContext) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        // Resume context on user interaction
        const resumeAudio = () => {
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            document.body.removeEventListener('click', resumeAudio);
            document.body.removeEventListener('keydown', resumeAudio);
        };
        document.body.addEventListener('click', resumeAudio);
        document.body.addEventListener('keydown', resumeAudio);

        jumpBuffer = await loadSound('./audio/jump.mp3');
        coinBuffer = await loadSound('./audio/coin.mp3');
    }
}

async function loadSound(url) {
    if (!audioCtx) return null;
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        return audioBuffer;
    } catch (error) {
        console.error(`Error loading sound: ${url}`, error);
        return null;
    }
}

function playSound(buffer) {
    if (isMuted || !buffer || !audioCtx || audioCtx.state !== 'running') return;
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
}

document.addEventListener('DOMContentLoaded', () => {
    const soundBtn = document.getElementById('sound-toggle-btn');
    if (soundBtn) {
        soundBtn.textContent = 'SOUND OFF'; // Initial state
        soundBtn.addEventListener('click', () => {
            if (!audioCtx) {
                setupAudio().then(() => {
                    isMuted = !isMuted;
                    soundBtn.textContent = isMuted ? 'SOUND OFF' : 'SOUND ON';
                    if (!isMuted) playSound(coinBuffer); // Play a sound on first unmute
                });
            } else {
                if (audioCtx.state === 'suspended') {
                    audioCtx.resume();
                }
                isMuted = !isMuted;
                soundBtn.textContent = isMuted ? 'SOUND OFF' : 'SOUND ON';
            }
        });
    }
});
// --- End Sound Engine ---

const escapeHtml = (str) => String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const buildLangAttrs = (obj) => {
    if (!obj) return 'data-ko="" data-en="" data-ja=""';
    if (typeof obj === 'string') return 'data-ko="' + escapeHtml(obj) + '" data-en="' + escapeHtml(obj) + '" data-ja="' + escapeHtml(obj) + '"';
    return 'data-ko="' + escapeHtml(obj.ko || '') + '" data-en="' + escapeHtml(obj.en || obj.ko || '') + '" data-ja="' + escapeHtml(obj.ja || obj.ko || '') + '"';
};
var THEME = 'retro';
var currentLang = 'ko';

function updateLanguage(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    document.querySelectorAll('.lang-text').forEach(function (el) {
        var newText = el.getAttribute('data-' + lang) || el.getAttribute('data-ko') || '';
        if (newText) el.innerHTML = newText;
    });

    document.querySelectorAll('.about-content').forEach(function (el) {
        el.style.display = 'none';
    });
    const activeAboutContent = document.querySelector('.about-content[lang="' + lang + '"]');
    if (activeAboutContent) {
        activeAboutContent.style.display = 'block';
    }

    var termTypedText = lang === 'ko' ? '> 프로필 데이터를 불러오는 중... OK\n> 시스템 준비 완료.\n> 27개의 기록이 발견되었습니다.' :
        lang === 'en' ? '> LOADING PROFILE DATA... OK\n> SYSTEM READY.\n> 27 RECORDS FOUND.' :
            '> プロフィールデータを読み込み中... OK\n> システム準備完了。\n> 27個の記録が見つかりました。';
    window._termTypedText = termTypedText;

    // Also update the skip button text immediately
    var skipBtn = document.getElementById('skip-game-btn');
    if (skipBtn && window.isScrolledToEnd) {
        skipBtn.innerHTML = skipBtn.getAttribute('data-' + lang + '-return') || skipBtn.getAttribute('data-ko-return');
    } else if (skipBtn) {
        skipBtn.innerHTML = skipBtn.getAttribute('data-' + lang) || skipBtn.getAttribute('data-ko');
    }
}

var langSelector = document.getElementById('lang-selector');
if (langSelector) langSelector.addEventListener('change', function (e) { updateLanguage(e.target.value); });

// Set initial state for about contents
updateLanguage(langSelector.value);

var ICONS = {
    birth: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
    graduation: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    enrollment: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    certificate: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
    military: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    internship: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    project: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    other: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>'
};

var horizontalSection = document.querySelector('.horizontal-section');
var gameContainer = document.createElement('div');
gameContainer.style.cssText = 'position:absolute; top:0; z-index:10; left:0; width:100%; height:100%; overflow:hidden; pointer-events:none;';
horizontalSection.appendChild(gameContainer);

var player = document.createElement('div');
player.style.cssText = `position:absolute; width:${isMobile ? 32 : 64}px; height:${isMobile ? 32 : 64}px; bottom:35vh; left:${isMobile ? 75 : 150}px; transform-origin:bottom center;`;

var playerWrapper = document.createElement('div');
playerWrapper.style.cssText = 'width:100%; height:100%; transform-origin:bottom center;';

var playerInner = document.createElement('div');
playerInner.style.cssText = 'width:100%; height:100%; transform-origin:bottom center; color:var(--accent); filter:drop-shadow(0 0 8px rgba(56,189,248,0.6)) drop-shadow(0 4px 8px rgba(0,0,0,0.5)); will-change: transform;';
playerInner.innerHTML = '<svg viewBox="0 0 16 16" width="100%" height="100%" style="display:block; shape-rendering: crispEdges;"><rect x="5" y="2" width="6" height="6" fill="currentColor"/><rect x="6" y="8" width="4" height="4" fill="currentColor"/><rect x="4" y="8" width="2" height="3" fill="currentColor"/><rect x="10" y="8" width="2" height="3" fill="currentColor"/><rect x="6" y="12" width="2" height="3" fill="currentColor"/><rect x="8" y="12" width="2" height="3" fill="currentColor"/></svg>';

playerWrapper.appendChild(playerInner); player.appendChild(playerWrapper); gameContainer.appendChild(player);

var LAST_ZONE_START = isMobile ? 22400 * mobileScale : 22400;
var posHistory = [];
var ghostEls = [];
if (THEME === 'minimal') {
    var ghostSvg = `<svg viewBox="0 0 100 100" width="100%" height="100%" style="display:block; overflow:visible;"><circle cx="50" cy="30" r="16" fill="currentColor" opacity="0.6"/><rect x="34" y="46" width="32" height="34" rx="12" fill="currentColor"/><rect x="24" y="48" width="12" height="26" rx="6" fill="currentColor"/><rect x="64" y="48" width="12" height="26" rx="6" fill="currentColor"/></svg>`;
    for (var gi = 0; gi < 3; gi++) {
        var ghost = document.createElement('div');
        ghost.className = 'finale-ghost';
        ghost.innerHTML = ghostSvg;
        gameContainer.appendChild(ghost);
        ghostEls.push(ghost);
    }
}

var obstaclesData = [
    {
        "id": 1,
        "pos": 300,
        "elevation": 0,
        "title": {
            "ko": "출생",
            "en": "Birth",
            "ja": "誕生"
        },
        "desc": {
            "ko": "광주광역시 (2003.09)",
            "en": "Gwangju Metropolitan City (Sep 2003)",
            "ja": "光州広域市 (2003年9月)"
        },
        "color": "#38BDF8",
        "category": "birth",
        "link": "https://www.gwangju.go.kr/",
        "hidden": false
    },
    {
        "id": 2,
        "pos": 1736,
        "elevation": 0,
        "title": {
            "ko": "초등학교 입학",
            "en": "Elem. School Entrance",
            "ja": "小学校入学"
        },
        "desc": {
            "ko": "장덕초 (2010.03)",
            "en": "Jangdeok Elementary School (Mar 2010)",
            "ja": "長徳小学校 (2010年3月)"
        },
        "color": "#38BDF8",
        "category": "enrollment",
        "link": "http://jangdeok.gen.es.kr/"
    },
    {
        "id": 3,
        "pos": 3064,
        "elevation": 100,
        "title": {
            "ko": "초등학교 졸업",
            "en": "Elem. School Grad",
            "ja": "小学校卒業"
        },
        "desc": {
            "ko": "장덕초 (2016.02)",
            "en": "Jangdeok Elementary School (Feb 2016)",
            "ja": "長徳小学校 (2016年2月)"
        },
        "color": "#38BDF8",
        "category": "graduation",
        "link": "http://jangdeok.gen.es.kr/"
    },
    {
        "id": 4,
        "pos": 3322,
        "elevation": 0,
        "title": {
            "ko": "중학교 입학",
            "en": "Middle School Entrance",
            "ja": "中学校入学"
        },
        "desc": {
            "ko": "장덕중 (2016.03)",
            "en": "Jangdeok Middle School (Mar 2016)",
            "ja": "長徳中学校 (2016年3月)"
        },
        "color": "#38BDF8",
        "category": "enrollment",
        "link": "http://jangdeok.gen.ms.kr/"
    },
    {
        "id": 5,
        "pos": 4682,
        "elevation": 100,
        "title": {
            "ko": "중학교 졸업",
            "en": "Middle School Grad",
            "ja": "中学校卒業"
        },
        "desc": {
            "ko": "장덕중 (2019.02)",
            "en": "Jangdeok Middle School (Feb 2019)",
            "ja": "長徳中学校 (2019年2月)"
        },
        "color": "#38BDF8",
        "category": "graduation",
        "link": "http://jangdeok.gen.ms.kr/"
    },
    {
        "id": 6,
        "pos": 4904,
        "elevation": 0,
        "title": {
            "ko": "고등학교 입학",
            "en": "High School Entrance",
            "ja": "高校入学"
        },
        "desc": {
            "ko": "광주진흥고 (2019.03)",
            "en": "Gwangju Jinheung High School (Mar 2019)",
            "ja": "光州進興高校 (2019年3月)"
        },
        "color": "#38BDF8",
        "category": "enrollment",
        "link": "http://jinheung.gen.hs.kr/"
    },
    {
        "id": 7,
        "pos": 6296,
        "elevation": 100,
        "title": {
            "ko": "고등학교 졸업",
            "en": "High School Grad",
            "ja": "高校卒業"
        },
        "desc": {
            "ko": "광주진흥고 (2022.02)",
            "en": "Gwangju Jinheung High School (Feb 2022)",
            "ja": "光州進興高校 (2022年2月)"
        },
        "color": "#38BDF8",
        "category": "graduation",
        "link": "http://jinheung.gen.hs.kr/"
    },
    {
        "id": 21,
        "pos": 6696,
        "elevation": 0,
        "color": "#38BDF8",
        "category": "other",
        "title": {
            "ko": "대학교 입학",
            "en": "University Entrance",
            "ja": "大学入学"
        },
        "desc": {
            "ko": "전남대학교 인공지능학부 (2022.03~)",
            "en": "Chonnam National University, School of AI (2022.03~)",
            "ja": "全南大学 人工知能学科 (2022.03~)"
        },
        "inProgress": true,
        "customIcon": null,
        "link": ""
    },
    {
        "id": 8,
        "pos": 7900,
        "elevation": 100,
        "title": {
            "ko": "한국사 3급",
            "en": "Korean History Lv3",
            "ja": "韓国史3級"
        },
        "desc": {
            "ko": "국사편찬위원회 (2022.08)",
            "en": "National Institute of Korean History (August 2022)",
            "ja": "国史編纂委員会 (2022年8月)"
        },
        "color": "#38BDF8",
        "category": "certificate",
        "link": "https://www.historyexam.go.kr/"
    },
    {
        "id": 23,
        "pos": 8300,
        "elevation": 0,
        "color": "#38BDF8",
        "category": "enrollment",
        "title": {
            "ko": "복수전공",
            "en": "double major",
            "ja": "複数専攻"
        },
        "desc": {
            "ko": "지능실감미디어융합 (2023.03~)",
            "en": "Intelligent Media Engineering (2023.03~)",
            "ja": "知能メディア工学 (2023.03~)"
        },
        "inProgress": true,
        "customIcon": null,
        "link": ""
    },
    {
        "id": 9,
        "pos": 10300,
        "elevation": 100,
        "title": {
            "ko": "ISTQB CTFL",
            "en": "ISTQB CTFL",
            "ja": "ISTQB CTFL"
        },
        "desc": {
            "ko": "KSTQB (2023.06)",
            "en": "KSTQB (June 2023)",
            "ja": "KSTQB (2023年6月)"
        },
        "color": "#38BDF8",
        "category": "certificate",
        "link": "https://www.kstqb.org/"
    },
    {
        "id": 10,
        "pos": 11650,
        "elevation": 0,
        "title": {
            "ko": "공군 입대",
            "en": "Air Force ",
            "ja": "空軍入隊 "
        },
        "desc": {
            "ko": "방공포 보직 (2023.09)",
            "en": "Air Defense Artillery Assignment (Sep 2023)",
            "ja": "防空砲兵の役職 (2023年9月)"
        },
        "color": "#38BDF8",
        "category": "military",
        "link": "https://rokaf.mil.kr/"
    },
    {
        "id": 11,
        "pos": 12316,
        "elevation": 50,
        "title": {
            "ko": "일병 진급",
            "en": "Promoted to PFC",
            "ja": "一等兵 進級"
        },
        "desc": {
            "ko": "(2023.11)",
            "en": "(November 2023)",
            "ja": "(2023年11月)"
        },
        "color": "#38BDF8",
        "category": "military",
        "link": "https://rokaf.mil.kr/"
    },
    {
        "id": 12,
        "pos": 13316,
        "elevation": 100,
        "title": {
            "ko": "상병 진급",
            "en": "Promoted to Corporal",
            "ja": "上等兵 進級"
        },
        "desc": {
            "ko": "(2024.05)",
            "en": "(May 2024)",
            "ja": "(2024年5月)"
        },
        "color": "#38BDF8",
        "category": "military",
        "link": "https://rokaf.mil.kr/"
    },
    {
        "id": 13,
        "pos": 14316,
        "elevation": 150,
        "title": {
            "ko": "병장 진급",
            "en": "Promoted to Sergeant",
            "ja": "兵長 進級"
        },
        "desc": {
            "ko": "(2024.11)",
            "en": "(November 2024)",
            "ja": "(2024年11月)"
        },
        "color": "#38BDF8",
        "category": "military",
        "link": "https://rokaf.mil.kr/"
    },
    {
        "id": 14,
        "pos": 15316,
        "elevation": 100,
        "title": {
            "ko": "JLPT N1",
            "en": "JLPT N1",
            "ja": "JLPT N1"
        },
        "desc": {
            "ko": "군 복무 중 (2025.01)",
            "en": "Achieved during military service (Jan 2025)",
            "ja": "兵役中達成 (2025年1月)"
        },
        "color": "#38BDF8",
        "category": "certificate",
        "link": "https://www.jlpt.or.kr/"
    },
    {
        "id": 15,
        "pos": 16150,
        "elevation": 50,
        "title": {
            "ko": "만기 전역",
            "en": "Discharged",
            "ja": "満期除隊"
        },
        "desc": {
            "ko": "공군 병 851기 병장 (2025.06)",
            "en": "Republic of Korea Air Force Sergeant (E-5), 851st Class (June 2025)",
            "ja": "韓国空軍兵長 (851期, 2025年6月)"
        },
        "color": "#38BDF8",
        "category": "military",
        "link": "https://rokaf.mil.kr/"
    },
    {
        "id": 24,
        "pos": 17300,
        "elevation": 100,
        "title": {
            "ko": "Little Atelier",
            "en": "Little Atelier",
            "ja": "Little Atelier"
        },
        "desc": {
            "ko": "Unity Interaction 프로젝트",
            "en": "Unity Interaction Project",
            "ja": "Unity インタラクション プロジェクト"
        },
        "color": "#38BDF8",
        "category": "project",
        "inProgress": false,
        "link": "https://devleu.tistory.com/43"
    },
    {
        "id": 26,
        "pos": 17000,
        "elevation": 50,
        "title": {
            "ko": "Asset Sentinel",
            "en": "Asset Sentinel",
            "ja": "Asset Sentinel"
        },
        "desc": {
            "ko": "Unity 에디터 툴 (2025.12)",
            "en": "Unity Editor Tool (2025.12)",
            "ja": "Unity エディターツール (2025.12)"
        },
        "color": "#38BDF8",
        "category": "project",
        "inProgress": false,
        "link": "https://devleu.tistory.com/45"
    },
    {
        "id": 27,
        "pos": 17600,
        "elevation": 50,
        "title": {
            "ko": "Ram Pressure Analyzer",
            "en": "Ram Pressure Analyzer",
            "ja": "Ram Pressure Analyzer"
        },
        "desc": {
            "ko": "WPF 기반 메모리/페이지 폴트 분석기 (2026.01)",
            "en": "WPF-based Memory/Page Fault Analyzer (2026.01)",
            "ja": "WPFベースのメモリ/ページフォールトアナライザー (2026.01)"
        },
        "color": "#38BDF8",
        "category": "project",
        "inProgress": false,
        "link": "https://devleu.tistory.com/46"
    },
    {
        "id": 25,
        "pos": 19800,
        "elevation": 100,
        "title": {
            "ko": "VidHub",
            "en": "VidHub",
            "ja": "VidHub"
        },
        "desc": {
            "ko": "안드로이드 동영상 플랫폼",
            "en": "Android Video Platform",
            "ja": "Android 動画プラットフォーム"
        },
        "color": "#38BDF8",
        "category": "project",
        "inProgress": false,
        "link": "https://devleu.tistory.com/44"
    },
    {
        "id": 16,
        "pos": 17900,
        "elevation": 100,
        "title": {
            "ko": "SQL개발자(SQLD)",
            "en": "SQL Developer ",
            "ja": "SQL開発者(SQLD)"
        },
        "desc": {
            "ko": "한국데이터산업진흥원 (2026.03)",
            "en": "Korea Data Agency (March 2026)",
            "ja": "韓国データ産業振興院 (2026.03)"
        },
        "color": "#38BDF8",
        "category": "certificate",
        "link": "https://www.dataq.or.kr/"
    },
    {
        "id": 22,
        "pos": 18300,
        "elevation": 50,
        "color": "#38BDF8",
        "category": "other",
        "title": {
            "ko": "부전공",
            "en": "minor",
            "ja": "副専攻"
        },
        "desc": {
            "ko": "일어일문학 부전공  (2026.03~)",
            "en": "Minor in Japanese Language and Literature  (2026.03~)",
            "ja": "日本語日本文 副専攻  (2026.03~)"
        },
        "inProgress": true,
        "customIcon": null,
        "link": ""
    },
    {
        "id": 17,
        "pos": 18934,
        "elevation": 100,
        "title": {
            "ko": "TOEIC 780점",
            "en": "TOEIC 780",
            "ja": "TOEIC 780点"
        },
        "desc": {
            "ko": "ETS (2026.04)",
            "en": "ETS (April 2026)",
            "ja": "ETS (2026年4月)"
        },
        "color": "#38BDF8",
        "category": "certificate",
        "link": "https://exam.toeic.co.kr/"
    },
    {
        "id": 18,
        "pos": 19422,
        "elevation": 100,
        "title": {
            "ko": "ADsP",
            "en": "ADsP",
            "ja": "ADsP"
        },
        "desc": {
            "ko": "데이터분석 준전문가 (2026.06)",
            "en": "Associate Data Analyst (2026.06)",
            "ja": "データ分析準専門家 (2026.06)"
        },
        "color": "#38BDF8",
        "category": "certificate",
        "link": "https://www.dataq.or.kr/"
    },
    {
        "id": 20,
        "pos": 20034,
        "elevation": 150,
        "title": {
            "ko": "Blind Walker",
            "en": "Blind Walker (VR)",
            "ja": "Blind Walker"
        },
        "desc": {
            "ko": "Unity VR 프로젝트",
            "en": "Unity VR Project",
            "ja": "Unity VR プロジェクト"
        },
        "color": "#38BDF8",
        "category": "project",
        "inProgress": false,
        "link": "https://devleu.tistory.com/42"
    },
    {
        "id": 19,
        "pos": 20510,
        "elevation": 0,
        "title": {
            "ko": "해외 인턴십 시작",
            "en": "Global Internship Start",
            "ja": "海外インターン開始"
        },
        "desc": {
            "ko": "Global Innovation Handle (2026.06)",
            "en": "Global Innovation Handle (June 2026)",
            "ja": "グローバルイノベーションハンドル（2026年6月）"
        },
        "color": "#38BDF8",
        "category": "internship",
        "link": "",
        "inProgress": true
    }
];

if (isMobile) {
    obstaclesData.forEach(obs => {
        obs.pos *= mobileScale;
        if (obs.elevation) obs.elevation *= mobileScale;
    });
}
var obstacleElements = [];
var collectedIds = new Set();
let totalScore = 0;
let perfectCount = 0;

function getStr(obj, lang) { return typeof obj === 'string' ? obj : (obj[lang] || obj.ko || ''); }

function updateCounter() {
    var counterEl = document.getElementById('counter-current');
    if (counterEl) counterEl.textContent = collectedIds.size;
}

function updateScoreDisplay() {
    var scoreEl = document.getElementById('score-current');
    if (scoreEl) scoreEl.textContent = totalScore;
}


function createObstacle(data, fallbackId) {
    var hasImg = !!data.customIcon;
    var size = hasImg ? (THEME === 'minimal' ? 100 : 96) : (isMobile ? 48 : (THEME === 'minimal' ? 70 : 64));
    var iconSize = isMobile ? 24 : 32;
    var elevation = data.elevation || 0;
    var bottomStyle = 'calc(35vh + ' + elevation + 'px)';

    var wrapper = document.createElement('div');
    wrapper.className = 'obstacle-wrapper obstacle-element';
    wrapper.setAttribute('data-id', data.id || fallbackId);
    wrapper.style.position = 'absolute'; wrapper.style.left = data.pos + 'px'; wrapper.style.bottom = bottomStyle;
    wrapper.style.width = size + 'px'; wrapper.style.height = size + 'px'; wrapper.style.pointerEvents = 'auto'; wrapper.style.cursor = 'pointer';

    wrapper.onclick = function (e) {
        e.stopPropagation();
        var rawLink = (data.link || '').trim();
        var targetUrl = rawLink.length > 0 ? rawLink : "https://www.google.com/search?q=" + encodeURIComponent(getStr(data.title, 'ko'));
        window.open(targetUrl, '_blank');
    };

    if (elevation > 0) {
        var pole = document.createElement('div');
        pole.className = 'obstacle-pole';
        pole.style.bottom = '-' + elevation + 'px';
        pole.style.height = elevation + 'px';
        wrapper.appendChild(pole);
    }

    var obstacle = document.createElement('div');
    obstacle.className = 'obstacle-badge' + (data.inProgress ? ' is-inprogress' : '');
    obstacle.style.width = data.customIcon ? '86px' : '100%';
    obstacle.style.height = data.customIcon ? '64px' : '100%';
    obstacle.style.borderRadius = data.customIcon ? '8px' : (THEME === 'minimal' ? '50%' : '0');
    obstacle.style.position = 'relative';
    obstacle.style.left = data.customIcon ? '-8px' : '0';

    if (THEME === 'minimal' && !data.customIcon) { obstacle.style.background = 'rgba(30,41,59,0.8)'; obstacle.style.backdropFilter = 'blur(8px)'; }
    else if (!data.customIcon) { obstacle.style.background = data.color || '#22D3EE'; }

    var strokeColor = THEME === 'minimal' ? (data.color || 'var(--accent)') : '#020617';
    if (data.customIcon) {
        obstacle.innerHTML = '<img src="' + data.customIcon + '" alt="' + escapeHtml(getStr(data.title, currentLang)) + '" style="width:100%; height:100%; object-fit:cover; image-rendering:' + (THEME === 'minimal' ? 'auto' : 'pixelated') + ';" />';
    } else {
        obstacle.innerHTML = '<svg width="' + iconSize + '" height="' + iconSize + '" viewBox="0 0 24 24" fill="none" stroke="' + strokeColor + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[data.category] || ICONS.other) + '</svg>';
    }
    wrapper.appendChild(obstacle);

    var tag = document.createElement('div');
    tag.className = 'info-tag';
    var catName = (data.category || 'milestone').toUpperCase();
    tag.innerHTML = `<div class="cat-badge">[${catName}]</div><div class="title lang-text" ${buildLangAttrs(data.title)}>${getStr(data.title, 'ko')}</div><div class="info-tag-divider"></div><div class="desc lang-text" ${buildLangAttrs(data.desc)}>${getStr(data.desc, 'ko')}</div>`;
    wrapper.appendChild(tag);

    // --- 튜토리얼 툴팁 추가 ---
    if (data.id === 1) {
        var tooltip = document.createElement('div');
        tooltip.id = 'tutorial-tooltip';
        tooltip.className = 'tutorial-tooltip lang-text';
        tooltip.setAttribute('data-ko', '타이밍에 맞춰 점프/숙이기(W,S) 입력!');
        tooltip.setAttribute('data-en', 'Jump or Duck (W/S) at the exact timing!');
        tooltip.setAttribute('data-ja', 'タイミングに合わせてジャンプ/しゃがむ(W/S)入力！');

        // 현재 선택된 언어에 맞춰 텍스트 초기화
        tooltip.innerHTML = getStr({
            ko: '타이밍에 맞춰 점프/숙이기(W,S) 입력!',
            en: 'Jump or Duck (W/S) at the exact timing!',
            ja: 'タイミングに合わせてジャンプ/しゃがむ(W/S)入力！'
        }, currentLang);

        wrapper.appendChild(tooltip);
    }

    gameContainer.appendChild(wrapper); return wrapper;
}

obstaclesData.forEach(function (data, index) { obstacleElements.push(createObstacle(data, index + 1000)); });
updateLanguage('ko');

var SKY_STOPS = THEME === 'minimal' ? ['#020617', '#0F172A', '#1E293B', '#0F172A'] : ['#0F172A', '#1E1B4B', '#4C1D95', '#701A75'];
function hexToRgb(hex) { var h = hex.replace('#', ''); return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)]; }
function lerp(a, b, t) { return a + (b - a) * t; }
function mixColors(hexA, hexB, t) { var c1 = hexToRgb(hexA), c2 = hexToRgb(hexB); return 'rgb(' + Math.round(lerp(c1[0], c2[0], t)) + ', ' + Math.round(lerp(c1[1], c2[1], t)) + ', ' + Math.round(lerp(c1[2], c2[2], t)) + ')'; }
function getSkyColor(progress) { var segCount = SKY_STOPS.length - 1; var segment = Math.min(Math.floor(progress * segCount), segCount - 1); var localT = progress * segCount - segment; return mixColors(SKY_STOPS[segment], SKY_STOPS[segment + 1], localT); }

var currentFinaleP = 0;
var isScrolledToEnd = false;
var skyOverlay = document.getElementById('sky-overlay'); var sun = document.getElementById('sun'); var progressBarWrap = document.getElementById('progress-bar-wrap'); var progressFill = document.getElementById('progress-fill'); var finaleFlash = document.getElementById('finale-flash');
var skipGameBtn = document.getElementById('skip-game-btn');

gsap.to(horizontalSection, {
    x: () => -(horizontalSection.scrollWidth - window.innerWidth) + "px", ease: "none",
    scrollTrigger: {
        trigger: ".horizontal-container", pin: true, scrub: 1, end: () => "+=" + horizontalSection.scrollWidth,
        onUpdate: function (self) {
            var p = self.progress;
            isScrolledToEnd = p > 0.998;

            if (skipGameBtn) {
                var currentText = skipGameBtn.innerHTML;
                var newText;
                if (isScrolledToEnd) {
                    newText = skipGameBtn.getAttribute('data-' + currentLang + '-return') || skipGameBtn.getAttribute('data-ko-return');
                } else {
                    newText = skipGameBtn.getAttribute('data-' + currentLang) || skipGameBtn.getAttribute('data-ko');
                }
                if (currentText !== newText) {
                    skipGameBtn.innerHTML = newText;
                }
            }

            skyOverlay.style.background = 'linear-gradient(to bottom, ' + getSkyColor(p) + (THEME === 'minimal' ? 'FF' : 'D0') + ' 0%, transparent 90%)';
            sun.style.transform = 'translate(' + (p * (window.innerWidth - 56)) + 'px, ' + (40 + (1 - Math.sin(p * (Math.PI / 2))) * 140) + 'px)';
            progressFill.style.width = (p * 100) + '%';
            progressFill.style.boxShadow = p >= 0.999
                ? (THEME === 'minimal' ? '0 0 20px rgba(56,189,248,0.85), 0 0 36px rgba(56,189,248,0.5)' : '0 0 20px #22D3EE, 0 0 36px #22D3EE')
                : (THEME === 'minimal' ? '0 0 10px rgba(56,189,248,0.8)' : '0 0 10px var(--accent)');

            var maxTranslate = Math.max(1, horizontalSection.scrollWidth - window.innerWidth);
            var zoneStartFraction = Math.min(0.98, LAST_ZONE_START / maxTranslate);
            var denom = Math.max(0.0001, 1 - zoneStartFraction);
            var finaleP = Math.min(1, Math.max(0, (p - zoneStartFraction) / denom));
            var flashP = finaleP > 0 ? Math.max(0, 1 - finaleP / 0.12) : 0;
            document.documentElement.style.setProperty('--finale-p', finaleP.toFixed(3));
            finaleFlash.style.opacity = flashP.toFixed(3);
            currentFinaleP = finaleP;

            if (THEME !== 'minimal') {
                var active = finaleP > 0.05;
                playerWrapper.classList.toggle('player-victory-cycle', active);
                playerWrapper.classList.toggle('player-finale-bounce', active);
            }
        },
        onEnter: function () { progressBarWrap.style.opacity = '1'; }, onLeave: function () { progressBarWrap.style.opacity = '0'; }, onLeaveBack: function () { progressBarWrap.style.opacity = '0'; }
    }
});

gsap.utils.toArray('.parallax-bg').forEach(function (bg) {
    var zoneWidth = parseInt(bg.getAttribute('data-width'), 10);
    var speed = parseFloat(bg.getAttribute('data-speed')) || 0.4;
    gsap.to(bg, { x: -(zoneWidth * speed) + "px", ease: "none", scrollTrigger: { trigger: ".horizontal-container", start: "top top", end: () => "+=" + horizontalSection.scrollWidth, scrub: 1 } });
});
gsap.to(player, { x: () => horizontalSection.scrollWidth - window.innerWidth - parseInt(player.style.left), ease: "none", scrollTrigger: { trigger: ".horizontal-container", start: "top top", end: () => "+=" + horizontalSection.scrollWidth, scrub: 1 } });

var keys = { left: false, right: false }; var isJumping = false, isDucking = false;
var jumpEase = THEME === 'minimal' ? "power2.out" : "power1.out";
var jumpHeight = isMobile ? -75 : -150;
var duckScale = THEME === 'minimal' ? 0.6 : 0.5;

function createJumpDust() {
    const dustCount = 3;
    const playerX = gsap.getProperty(player, "x");

    for (let i = 0; i < dustCount; i++) {
        const dustParticle = document.createElement('div');
        dustParticle.style.cssText = `position: absolute; width: 8px; height: 8px; background-color: white; bottom: 35vh; left: ${isMobile ? 75 : 150 + (player.offsetWidth / 2)}px; transform: translateX(${playerX}px);`;
        gameContainer.appendChild(dustParticle);

        gsap.to(dustParticle, {
            x: `+=${(Math.random() - 0.5) * 50}`, // relative to current transform
            y: -15 - Math.random() * 20,
            scale: Math.random() * 0.5 + 0.5,
            opacity: 0,
            duration: 0.5 + Math.random() * 0.3,
            ease: "power1.out",
            onComplete: () => {
                dustParticle.remove();
            }
        });
    }
}

window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase(); if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
    if (k === 'd' || k === 'arrowright') keys.right = true; if (k === 'a' || k === 'arrowleft') keys.left = true;
    if ((k === 'w' || k === 'arrowup') && !isJumping && !isDucking) {
        handleActionPress();
        isJumping = true;
        playSound(jumpBuffer);
        createJumpDust();
        gsap.to(player, {
            y: jumpHeight, duration: 0.35, yoyo: true, repeat: 1, ease: jumpEase, onComplete: () => {
                isJumping = false;
                createJumpDust();
            }
        });
    }
    if ((k === 's' || k === 'arrowdown') && !isJumping && !isDucking) {
        handleActionPress();
        isDucking = true;
        gsap.to(player, { scaleY: duckScale, transformOrigin: "bottom center", duration: 0.1 });
    }
});
window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'd' || k === 'arrowright') keys.right = false; if (k === 'a' || k === 'arrowleft') keys.left = false;
    if (k === 's' || k === 'arrowdown') gsap.to(player, { scaleY: 1, duration: 0.1, onComplete: () => isDucking = false });
});

function attachTouch(id, onDown, onUp) { var btn = document.getElementById(id); if (!btn) return; btn.addEventListener('pointerdown', onDown); btn.addEventListener('pointerup', onUp); btn.addEventListener('pointerleave', onUp); }
attachTouch('btn-left', function (e) { e.preventDefault(); keys.left = true; }, function (e) { e.preventDefault(); keys.left = false; });
attachTouch('btn-right', function (e) { e.preventDefault(); keys.right = true; }, function (e) { e.preventDefault(); keys.right = false; });
attachTouch('btn-jump', function (e) { e.preventDefault(); if (!isJumping && !isDucking) { handleActionPress(); isDucking = true; gsap.to(player, { scaleY: duckScale, transformOrigin: "bottom center", duration: 0.1 }); } }, function (e) { e.preventDefault(); gsap.to(player, { scaleY: 1, duration: 0.1, onComplete: () => isDucking = false }); });
attachTouch('btn-duck', function (e) { e.preventDefault(); if (!isJumping && !isDucking) { handleActionPress(); isJumping = true; playSound(jumpBuffer); createJumpDust(); gsap.to(player, { y: jumpHeight, duration: 0.35, yoyo: true, repeat: 1, ease: jumpEase, onComplete: () => { isJumping = false; createJumpDust(); } }); } }, function (e) { e.preventDefault(); });

var scrollSpeed = isMobile ? 16 : 24;

const locallyCollected = new Set();
const beingCollected = new Set();
const pendingCollectTimeouts = new Map();
let actionJustPressed = false;

function handleActionPress() {
    actionJustPressed = true;
    // "Perfect" 판정 타이밍 (ms). 숫자가 클수록 너그러워집니다.
    setTimeout(() => { actionJustPressed = false; }, 230);
}

function finalizeCollection(obstacle, didAction) {
    const dataId = parseInt(obstacle.getAttribute('data-id'), 10);
    if (!dataId || locallyCollected.has(dataId)) {
        return; // Already collected
    }

    // Score logic
    if (didAction) {
        totalScore += 500; // Perfect score
        perfectCount++;
    } else {
        totalScore += 100; // Normal score
    }

    triggerCollectEffect(obstacle, didAction);
    playSound(coinBuffer);

    locallyCollected.add(dataId);
    collectedIds.add(dataId);
    obstacle.classList.add('collected');

    // --- 튜토리얼 툴팁 제거 애니메이션 ---
    if (dataId === 1) {
        var tt = document.getElementById('tutorial-tooltip');
        if (tt) {
            gsap.to(tt, { opacity: 0, y: -20, duration: 0.3, ease: "power1.out" });
        }
    }

    // Update displays
    updateCounter();
    updateScoreDisplay();

    // Clean up
    pendingCollectTimeouts.delete(dataId);
    beingCollected.delete(dataId);

    if (didAction && typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(80); } catch (err) { }
    }
}


function triggerCollectEffect(obstacleEl, didAction = false) {
    var wave = document.createElement('div');
    wave.className = 'collect-shockwave';
    if (didAction) {
        wave.style.setProperty('--wave-color', 'gold');
    }
    obstacleEl.appendChild(wave);
    setTimeout(function () { wave.remove(); }, 500);

    if (didAction) {
        var score = document.createElement('div');
        score.className = 'score-popup-perfect'; // CSS 충돌 방지를 위한 새 클래스
        score.textContent = 'PERFECT!';

        const obsRect = obstacleEl.getBoundingClientRect();

        // position:fixed 를 사용하여 화면(viewport) 기준으로 위치를 잡습니다.
        score.style.position = 'fixed';
        score.style.left = obsRect.right + 'px'; // 장애물 오른쪽 끝의 화면상 X 좌표
        score.style.top = (obsRect.top + obsRect.height / 2) + 'px'; // 장애물 중앙의 화면상 Y 좌표

        // translateX 값을 조정하여 좌우 오프셋을 변경할 수 있습니다.
        score.style.transform = 'translateX(10px) translateY(-90%)';

        // 기타 스타일
        score.style.color = 'gold';
        score.style.fontWeight = 'bold';
        score.style.whiteSpace = 'nowrap';
        score.style.fontSize = '1.5em';
        score.style.zIndex = '100'; // 모든 요소 위에 표시되도록 매우 높은 z-index
        score.style.pointerEvents = 'none'; // 클릭 이벤트 통과

        document.body.appendChild(score); // 최상위인 document.body에 추가

        // GSAP 애니메이션
        gsap.fromTo(score,
            { opacity: 0, yPercent: 50 },
            {
                opacity: 1, yPercent: -50, duration: 0.3, ease: 'power2.out',
                onComplete: () => {
                    gsap.to(score, {
                        opacity: 0, yPercent: -100, duration: 0.5, delay: 0.5, ease: 'power1.in',
                        onComplete: () => score.remove()
                    });
                }
            }
        );

    } else {
        // No score popup for normal collection to prevent clutter, score is on HUD
    }
}

gsap.ticker.add((time, deltaTime) => {
    var move = scrollSpeed * (deltaTime / (1000 / 60)); // 60fps 기준으로 정규화
    if (keys.right) window.scrollBy({ top: move, left: 0, behavior: 'instant' });
    if (keys.left) window.scrollBy({ top: -move, left: 0, behavior: 'instant' });
    if (keys.right) playerInner.style.setProperty('--facing', '1'); else if (keys.left) playerInner.style.setProperty('--facing', '-1');
    playerInner.style.transform = 'scaleX(var(--facing, 1))';

    if (keys.right || keys.left) playerInner.classList.add('player-running'); else playerInner.classList.remove('player-running');

    const playerRect = player.getBoundingClientRect();
    let isAnythingOverlapping = false; // For the player glow effect

    obstacleElements.forEach(obstacle => {
        const obsRect = obstacle.getBoundingClientRect();
        // 히트박스 크기 조절. 숫자가 클수록 히트박스가 넓어집니다.
        var expand = 3;

        const isOverlappingNow = (playerRect.left < obsRect.right + expand && playerRect.right > obsRect.left - expand && playerRect.top < obsRect.bottom + expand && playerRect.bottom > obsRect.top - expand);

        if (isOverlappingNow) {
            isAnythingOverlapping = true;
        }

        const dataId = parseInt(obstacle.getAttribute('data-id'), 10);
        if (!dataId || locallyCollected.has(dataId) || beingCollected.has(dataId)) {
            return; // Skip collection logic if already processed
        }

        if (isOverlappingNow) {
            // IMMEDIATE collection on collision
            const didAction = actionJustPressed;
            finalizeCollection(obstacle, didAction); // Call synchronously
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                try { navigator.vibrate(didAction ? 80 : 40); } catch (err) { }
            }
        } else {
            const isPassed = (playerRect.left > obsRect.right + 150);
            if (isPassed) {
                // DELAYED collection for safety net
                beingCollected.add(dataId);
                const delay = 300 + Math.random() * 200;
                const timeoutId = setTimeout(() => {
                    finalizeCollection(obstacle, false);
                }, delay);
                pendingCollectTimeouts.set(dataId, timeoutId);
            }
        }
    });

    // Visual effect based on ANY overlap
    if (THEME === 'minimal') {
        playerInner.style.filter = isAnythingOverlapping ? 'drop-shadow(0 0 16px rgba(56,189,248,1)) brightness(1.2)' : 'drop-shadow(0 0 8px rgba(56,189,248,0.6)) drop-shadow(0 4px 8px rgba(0,0,0,0.5))';
    } else {
        playerInner.style.color = isAnythingOverlapping ? '#fff' : '#22D3EE';
        playerInner.style.filter = isAnythingOverlapping ? 'drop-shadow(0 0 16px #22D3EE)' : 'drop-shadow(0 0 8px #22D3EE)';
    }

    if (THEME === 'minimal') {
        var px = gsap.getProperty(player, 'x') || 0;
        var py = gsap.getProperty(player, 'y') || 0;
        posHistory.push({ x: px, y: py });
        if (posHistory.length > 30) posHistory.shift();

        var finaleP = currentFinaleP;
        ghostEls.forEach(function (g, i) {
            if (finaleP > 0.05) {
                var delay = (i + 1) * 7;
                var hist = posHistory[posHistory.length - 1 - delay];
                if (hist) {
                    g.style.opacity = String(0.22 - i * 0.06);
                    g.style.transform = 'translate(' + hist.x + 'px, ' + hist.y + 'px)';
                }
            } else {
                g.style.opacity = '0';
            }
        });
    }
});

// Insert zone-specific building overlays (run after DOM ready)
document.addEventListener('DOMContentLoaded', function () {
    const mapping = [
        { k: '장덕초등학교', cls: 'zone-building--small' },
        { k: '장덕중학교', cls: 'zone-building--medium' },
        { k: '광주진흥고등학교', cls: 'zone-building--large' },
        { k: '대학교', cls: 'zone-building--university' },
        { k: '일본 인턴십', cls: 'zone-building--tower', overlay: 'zone-overlay--scramble' }
    ];

    document.querySelectorAll('.zone').forEach(function (zone) {
        const title = zone.querySelector('.zone-title');
        if (!title) return;
        const text = (title.textContent || '').trim();
        // Treat sections that contain '학년' or '학기' as university-level only if not a seasonal/vacation entry
        if ((/학년|학기/.test(text)) && !(/여름|겨울|방학|휴학|방학/.test(text))) {
            const b = document.createElement('div'); b.className = 'zone-building zone-building--university'; zone.appendChild(b);
            return;
        }
        mapping.forEach(function (m) {
            if (m.k === '대학교') {
                if (text.indexOf('대학') !== -1 || text.indexOf('대학교') !== -1) {
                    const b = document.createElement('div'); b.className = 'zone-building ' + m.cls; zone.appendChild(b);
                }
            } else if (text.indexOf(m.k) !== -1) {
                const b = document.createElement('div'); b.className = 'zone-building ' + m.cls; zone.appendChild(b);
                if (m.overlay) { const o = document.createElement('div'); o.className = 'zone-overlay ' + m.overlay; zone.appendChild(o); }
            }
        });
    });
});

var termTyped = document.getElementById('term-typed');
if (termTyped) {
    var ti = 0;
    (function typeChar() {
        var text = window._termTypedText;
        if (ti <= text.length) { termTyped.innerHTML = text.slice(0, ti).replace(/\n/g, '<br>') + '<span class="term-cursor" id="term-cursor">█</span>'; ti++; setTimeout(typeChar, 30); }
        else { setTimeout(function () { ti = 0; typeChar(); }, 4000); }
    })();
}

var statNums = document.querySelectorAll('.stat-num:not(#final-rank)');

if (statNums.length && 'IntersectionObserver' in window) {
    var counted = false;
    var statObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting && !counted) {
                counted = true;
                statNums.forEach(function (el) {
                    var target = parseInt(el.getAttribute('data-target'), 10) || 0;
                    var current = 0;
                    var stepTime = Math.max(16, 900 / Math.max(target, 1));
                    var timer = setInterval(function () {
                        current++; el.textContent = current;
                        if (current >= target) clearInterval(timer);
                    }, stepTime);
                });

                // --- 랭크 시스템 산출 로직 추가 ---
                var finalRankEl = document.getElementById('final-rank');
                if (finalRankEl) {
                    var rank = 'C';
                    var rankColor = '#94a3b8'; // C 랭크 (회색)

                    // 최대 가능 점수: 13,500점 (27개 * Perfect 500점) 기준으로 산출
                    if (totalScore >= 12000) {
                        rank = 'S'; rankColor = '#fbbf24'; // 골드
                    } else if (totalScore >= 9000) {
                        rank = 'A'; rankColor = '#f87171'; // 레드
                    } else if (totalScore >= 5000) {
                        rank = 'B'; rankColor = '#60a5fa'; // 블루
                    }

                    // 약간의 딜레이 후 랭크 표시 (숫자 카운팅과 타이밍 맞춤)
                    setTimeout(function () {
                        finalRankEl.textContent = rank;
                        finalRankEl.style.color = rankColor;
                        finalRankEl.style.textShadow = `0 0 15px ${rankColor}`;
                        finalRankEl.classList.add('rank-animate');
                    }, 300);
                }
                // ---------------------------------

                var dossierDivider = document.getElementById('dossier-divider-section');
                if (dossierDivider) {
                    dossierDivider.style.display = 'block';
                    gsap.from(dossierDivider, {
                        opacity: 0,
                        y: 50,
                        duration: 0.8,
                        ease: 'power3.out'
                    });
                }
            }
        });
    }, { threshold: 0.4 });
    statObserver.observe(document.querySelector('.stat-grid'));
}

function resetAndGoToTop() {
    // Clear any pending collection timeouts to prevent ghost collections
    for (const timeoutId of pendingCollectTimeouts.values()) {
        clearTimeout(timeoutId);
    }
    pendingCollectTimeouts.clear();
    beingCollected.clear();

    gsap.to(window, {
        scrollTo: 0,
        duration: 1.5,
        ease: 'power2.inOut',
        onComplete: function () {
            locallyCollected.clear();
            collectedIds.clear();
            totalScore = 0;
            perfectCount = 0;
            obstacleElements.forEach(function (el) { el.classList.remove('collected'); });
            updateCounter();
            updateScoreDisplay();

            // --- 랭크 초기화 추가 ---
            var finalRankEl = document.getElementById('final-rank');
            if (finalRankEl) {
                finalRankEl.textContent = '-';
                finalRankEl.style.color = '';
                finalRankEl.style.textShadow = '';
                finalRankEl.classList.remove('rank-animate');
            }
            // --- 튜토리얼 툴팁 복구 로직 ---
            var tt = document.getElementById('tutorial-tooltip');
            if (tt) {
                gsap.killTweensOf(tt); // 진행 중인 페이드아웃 애니메이션 정지
                gsap.set(tt, { opacity: 1, y: 0 }); // 원래 위치와 투명도로 복구
            }

            // 게임 재시작 시 통계 애니메이션이 다시 실행될 수 있도록 카운팅 상태 초기화
            counted = false;
        }
    });
}

var restartBtn = document.getElementById('restart-btn');
if (restartBtn) {
    restartBtn.addEventListener('click', resetAndGoToTop);
}

var destSection = document.getElementById('dest-section');
if (skipGameBtn && destSection) {
    skipGameBtn.addEventListener('click', function () {
        if (isScrolledToEnd) {
            resetAndGoToTop();
        } else {
            obstacleElements.forEach(function (obs) {
                var dataId = parseInt(obs.getAttribute('data-id'), 10);
                if (dataId) {
                    locallyCollected.add(dataId);
                    collectedIds.add(dataId);
                    obs.classList.add('collected');
                }
            });
            updateCounter();
            gsap.to(window, { scrollTo: destSection, duration: 1.5, ease: 'power2.inOut' });
        }
    });
}

var resumeLink = document.querySelector('a[href="#resume-section"]');
if (resumeLink) {
    resumeLink.addEventListener('click', function (e) {
        e.preventDefault();
        gsap.to(window, { scrollTo: '#resume-section', duration: 1.5, ease: 'power2.inOut' });
    });
}
window.addEventListener('resize', function () { ScrollTrigger.refresh(); });

// Animation for Bento Grid Skill Bars
gsap.utils.toArray('.skill-card').forEach(function (card) {
    ScrollTrigger.create({
        trigger: card,
        start: 'top 80%',
        once: true,
        onEnter: function () {
            gsap.to(card.querySelectorAll('.xp-bar'), {
                width: function (index, bar) {
                    return bar.getAttribute('data-width');
                },
                duration: 1,
                ease: 'cubic-bezier(0.23, 1, 0.32, 1)',
                stagger: 0.1
            });
        }
    });
});

// Animation for About section
gsap.utils.toArray('#about-section .reveal-on-scroll').forEach(function (elem) {
    gsap.from(elem, {
        scrollTrigger: {
            trigger: elem,
            start: 'top 85%',
            end: 'bottom 15%',
            toggleActions: 'play none none none'
        },
        opacity: 0,
        y: 50,
        duration: 0.8,
        ease: 'power3.out'
    });
});

// --- UX Features for Recruiters ---

// 1. Create Progress Bar Markers
function createProgressMarkers() {
    const progressBar = document.getElementById('progress-bar');
    if (!progressBar || !window.obstaclesData) return;

    const totalWidth = horizontalSection.scrollWidth - window.innerWidth;

    obstaclesData.forEach(obstacle => {
        const marker = document.createElement('div');
        marker.className = 'progress-marker';
        // Calculate position as a percentage
        const position = (obstacle.pos / totalWidth) * 100;
        marker.style.left = `${position}%`;

        // Create and append tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'progress-tooltip';
        tooltip.textContent = getStr(obstacle.title, currentLang); // Use existing getStr function for localization
        marker.appendChild(tooltip);

        progressBar.appendChild(marker);
    });
}

// 2. Mode Switch & HUD Logic
document.addEventListener('DOMContentLoaded', () => {
    const gameModeBtn = document.getElementById('game-mode-btn');
    const resumeModeBtn = document.getElementById('resume-mode-btn');
    const hudOverlay = document.getElementById('hud-overlay');
    const topHeader = document.getElementById('top-header');

    // Mode Switch
    if (gameModeBtn && resumeModeBtn) {
        resumeModeBtn.addEventListener('click', () => {
            gsap.to(window, { scrollTo: '#resume-section', duration: 1.5, ease: 'power2.inOut' });
            gameModeBtn.classList.remove('active');
            resumeModeBtn.classList.add('active');
        });

        gameModeBtn.addEventListener('click', () => {
            resetAndGoToTop();
            resumeModeBtn.classList.remove('active');
            gameModeBtn.classList.add('active');
        });
    }

    // HUD Visibility & Positioning
    if (hudOverlay && topHeader) {
        // Adjust top position to be below the header
        const headerHeight = topHeader.offsetHeight;
        hudOverlay.style.top = `${headerHeight + 12}px`; // 12px margin below header

        // Initially hide the HUD
        gsap.set(hudOverlay, { autoAlpha: 0 });

        // Use ScrollTrigger to show HUD only in the game section
        ScrollTrigger.create({
            trigger: ".horizontal-container",
            start: "top top",
            end: () => "+=" + (document.querySelector('.horizontal-container').scrollWidth - window.innerWidth), // End after the entire horizontal scroll
            onEnter: () => gsap.to(hudOverlay, { autoAlpha: 1, duration: 0.3 }),
            onLeave: () => gsap.to(hudOverlay, { autoAlpha: 0, duration: 0.3 }),
            onEnterBack: () => gsap.to(hudOverlay, { autoAlpha: 1, duration: 0.3 }),
            onLeaveBack: () => gsap.to(hudOverlay, { autoAlpha: 0, duration: 0.3 }),
        });
    }

    // Call the function to create progress markers
    setTimeout(createProgressMarkers, 500);


});
document.addEventListener('DOMContentLoaded', () => {
    // Hamburger Menu Logic
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileNav = document.getElementById('mobile-nav');

    if (hamburgerBtn && mobileNav) {
        hamburgerBtn.addEventListener('click', () => {
            mobileNav.classList.toggle('is-active');
            hamburgerBtn.classList.toggle('is-active');
        });
    }

    // Sync mobile controls with desktop controls
    const gameModeBtnMobile = document.getElementById('game-mode-btn-mobile');
    const resumeModeBtnMobile = document.getElementById('resume-mode-btn-mobile');
    const langSelectorMobile = document.getElementById('lang-selector-mobile');
    const soundToggleBtnMobile = document.getElementById('sound-toggle-btn-mobile');

    const gameModeBtn = document.getElementById('game-mode-btn');
    const resumeModeBtn = document.getElementById('resume-mode-btn');
    const langSelector = document.getElementById('lang-selector');
    const soundToggleBtn = document.getElementById('sound-toggle-btn');

    if (gameModeBtnMobile && gameModeBtn) {
        gameModeBtnMobile.addEventListener('click', () => {
            gameModeBtn.click();
            mobileNav.classList.remove('is-active');
            hamburgerBtn.classList.remove('is-active');
        });
    }

    if (resumeModeBtnMobile && resumeModeBtn) {
        resumeModeBtnMobile.addEventListener('click', () => {
            resumeModeBtn.click();
            mobileNav.classList.remove('is-active');
            hamburgerBtn.classList.remove('is-active');
        });
    }

    if (langSelectorMobile && langSelector) {
        langSelectorMobile.addEventListener('change', (e) => {
            langSelector.value = e.target.value;
            langSelector.dispatchEvent(new Event('change'));
        });
    }

    if (soundToggleBtnMobile && soundToggleBtn) {
        soundToggleBtnMobile.addEventListener('click', () => {
            soundToggleBtn.click();
            soundToggleBtnMobile.textContent = soundToggleBtn.textContent;
        });

        // Keep text in sync
        if (soundToggleBtn) {
            const observer = new MutationObserver(() => {
                soundToggleBtnMobile.textContent = soundToggleBtn.textContent;
            });
            observer.observe(soundToggleBtn, { childList: true, subtree: true });
        }
    }
});