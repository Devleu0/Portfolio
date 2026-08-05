// =================================================================================
// Web Audio API를 사용한 오디오 관리 모듈
// =================================================================================

let audioCtx; // AudioContext 인스턴스
let isMuted = true; // 초기 상태는 음소거
let soundBuffers = new Map(); // 디코딩된 오디오 데이터를 캐시하는 맵

/**
 * 사운드 파일을 비동기적으로 로드하고 디코딩하여 버퍼에 저장합니다.
 * @param {string} url - 로드할 사운드 파일의 경로
 * @returns {Promise<AudioBuffer|null>} 디코딩된 오디오 버퍼 또는 실패 시 null
 */
async function loadSound(url) {
    if (!audioCtx) return null; // AudioContext가 없으면 중단
    if (soundBuffers.has(url)) return soundBuffers.get(url); // 이미 캐시된 사운드는 즉시 반환

    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        soundBuffers.set(url, audioBuffer); // 성공적으로 디코딩되면 맵에 캐시
        return audioBuffer;
    } catch (error) {
        console.error(`사운드 로딩 오류: ${url}`, error);
        return null;
    }
}

/**
 * 캐시된 사운드를 재생합니다.
 * @param {string} url - 재생할 사운드 파일의 경로
 */
export function playSound(url) {
    // 음소거 상태이거나, 사운드가 캐시되지 않았거나, AudioContext가 준비되지 않으면 재생하지 않음
    if (isMuted || !soundBuffers.has(url) || !audioCtx || audioCtx.state !== 'running') return;
    
    const buffer = soundBuffers.get(url);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0); // 즉시 재생
}

/**
 * AudioContext를 설정하고, 브라우저 자동 재생 정책에 대응합니다.
 * 또한, 필요한 사운드를 미리 로드합니다.
 */
async function setupAudio() {
    if (window.AudioContext || window.webkitAudioContext) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        // 브라우저는 사용자 상호작용 없이는 오디오 자동 재생을 막는 경우가 많습니다.
        // 'suspended' 상태일 경우, 사용자의 첫 클릭/키입력 시 오디오 컨텍스트를 활성화(resume)합니다.
        const resumeAudio = () => {
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            // 한 번 실행된 후에는 리스너를 제거합니다.
            document.body.removeEventListener('click', resumeAudio);
            document.body.removeEventListener('keydown', resumeAudio);
        };
        document.body.addEventListener('click', resumeAudio);
        document.body.addEventListener('keydown', resumeAudio);

        // 게임에 필요한 주요 사운드를 미리 로드하여 지연을 줄입니다.
        await loadSound('./audio/jump.mp3');
        await loadSound('./audio/coin.mp3');
    }
}

/**
 * 음소거 상태를 토글하고 버튼의 텍스트를 업데이트합니다.
 * @param {HTMLElement} soundBtn - 클릭된 사운드 버튼 요소
 */
function toggleMute(soundBtn) {
    // 음소거 해제 시 오디오 컨텍스트가 멈춰있다면 재개합니다.
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    isMuted = !isMuted;
    soundBtn.textContent = isMuted ? 'SOUND OFF' : 'SOUND ON';
    
    // 모바일용 버튼이 있다면 텍스트를 동기화합니다.
    const mobileBtn = document.getElementById('sound-toggle-btn-mobile');
    if (mobileBtn) {
        mobileBtn.textContent = soundBtn.textContent;
    }
}

/**
 * 오디오 시스템을 초기화하고, 사운드 토글 버튼에 이벤트 리스너를 추가합니다.
 */
export function initAudio() {
    const soundBtn = document.getElementById('sound-toggle-btn');
    if (soundBtn) {
        soundBtn.textContent = 'SOUND OFF'; // 초기 버튼 텍스트 설정

        soundBtn.addEventListener('click', () => {
            // 첫 클릭 시에만 AudioContext를 설정합니다.
            if (!audioCtx) {
                setupAudio().then(() => {
                    toggleMute(soundBtn);
                    // 첫 음소거 해제 시 피드백 사운드를 재생합니다.
                    if (!isMuted) playSound('./audio/coin.mp3'); 
                });
            } else {
                // 이후 클릭부터는 음소거 상태만 토글합니다.
                toggleMute(soundBtn);
            }
        });
    }
}
