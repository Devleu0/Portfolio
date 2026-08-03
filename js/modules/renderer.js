import { state } from './config.js';

let resumeData = null;

function getLocalized(data, lang) {
    if (!data) return '';
    return data[lang] || data['en'] || data['ko'] || '';
}

function renderPortfolio(lang) {
    const container = document.querySelector('#portfolio-list');
    if (!container || !resumeData.portfolio) return;

    container.innerHTML = resumeData.portfolio.map(item => `
        <li>
            <div class="tr-item-content">
                <strong class="lang-text">${getLocalized(item.title, lang)}</strong>
                <span class="tr-desc lang-text">${getLocalized(item.description, lang)}</span>
            </div>
            <div class="tr-item-media tr-item-link">
                <a href="${item.link}" target="_blank" rel="noopener noreferrer">
                    <img src="${item.image}" alt="${getLocalized(item.alt, lang)}"
                        style="max-width: 100%; border-radius: 8px; display: block;" loading="lazy">
                </a>
            </div>
        </li>
    `).join('');
}

function renderCertifications(lang) {
    const container = document.querySelector('#certifications-list');
    if (!container || !resumeData.certifications) return;

    container.innerHTML = resumeData.certifications.map(item => `
        <li>
            <div class="tr-item-content">
                <strong class="lang-text">${getLocalized(item.title, lang)}</strong>
                <span class="tr-desc lang-text">${getLocalized(item.description, lang)}</span>
            </div>
            <div class="tr-item-media tr-item-link">
                <a href="${item.link}" target="_blank" rel="noopener noreferrer" style="color:var(--accent); font-size:13px; text-decoration:underline;">
                    <span class="lang-text" data-ko="[링크]" data-en="[Link]" data-ja="[リンク]">[${getLocalized({ ko: '링크', en: 'Link', ja: 'リンク' }, lang)}]</span>
                </a>
            </div>
        </li>
    `).join('');
}

function renderExperience(lang) {
    const container = document.querySelector('#experience-list');
    if (!container || !resumeData.experience) return;

    container.innerHTML = resumeData.experience.map(item => `
        <li>
            <div class="tr-item-content">
                <strong class="lang-text">${getLocalized(item.title, lang)}</strong>
                <span class="tr-desc lang-text">${getLocalized(item.description, lang)}</span>
            </div>
        </li>
    `).join('');
}

function renderSkills(lang) {
    const container = document.querySelector('#skills-grid');
    if (!container || !resumeData.skills) return;

    container.innerHTML = resumeData.skills.map(skillCategory => `
        <div class="skill-card ${skillCategory.layout} reveal-on-scroll">
            <h3>${getLocalized(skillCategory.category, lang)}</h3>
            <span class="exp-popup">+${Math.floor(Math.random() * 20) + 5} EXP</span>
            <ul>
                ${skillCategory.items.map(skill => `
                    <li>
                        <span class="skill-name">${skill.name}</span>
                        <span class="skill-level">Lv. ${skill.level}</span>
                        <div class="xp-bar-container">
                            <div class="xp-bar" data-width="${skill.width}"></div>
                        </div>
                    </li>
                `).join('')}
            </ul>
        </div>
    `).join('');
}

function renderAll(lang) {
    if (!resumeData) return;
    renderPortfolio(lang);
    renderCertifications(lang);
    renderExperience(lang);
    renderSkills(lang);
}

export async function init() {
    try {
        const response = await fetch('./js/data/resume-data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        resumeData = await response.json();

        // Update certificates count
        if (resumeData.certifications) {
            const certificatesStatEl = document.getElementById('certificates-stat');
            if (certificatesStatEl) {
                certificatesStatEl.dataset.target = resumeData.certifications.length;
            }
        }

        renderAll(state.currentLang);
    } catch (error) {
        console.error("Failed to load or render resume data:", error);
    }
}

export function update(lang) {
    renderAll(lang);
}
