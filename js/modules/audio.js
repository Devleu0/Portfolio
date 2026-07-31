
let audioCtx;
let isMuted = true; // Initially muted
let soundBuffers = new Map();

async function loadSound(url) {
    if (!audioCtx) return null;
    if (soundBuffers.has(url)) return soundBuffers.get(url);

    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        soundBuffers.set(url, audioBuffer);
        return audioBuffer;
    } catch (error) {
        console.error(`Error loading sound: ${url}`, error);
        return null;
    }
}

export function playSound(url) {
    if (isMuted || !soundBuffers.has(url) || !audioCtx || audioCtx.state !== 'running') return;
    const buffer = soundBuffers.get(url);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
}

async function setupAudio() {
    if (window.AudioContext || window.webkitAudioContext) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        const resumeAudio = () => {
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            document.body.removeEventListener('click', resumeAudio);
            document.body.removeEventListener('keydown', resumeAudio);
        };
        document.body.addEventListener('click', resumeAudio);
        document.body.addEventListener('keydown', resumeAudio);

        // Preload sounds
        await loadSound('./audio/jump.mp3');
        await loadSound('./audio/coin.mp3');
    }
}

function toggleMute(soundBtn) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    isMuted = !isMuted;
    soundBtn.textContent = isMuted ? 'SOUND OFF' : 'SOUND ON';
    // Sync mobile button if it exists
    const mobileBtn = document.getElementById('sound-toggle-btn-mobile');
    if (mobileBtn) {
        mobileBtn.textContent = soundBtn.textContent;
    }
}

export function initAudio() {
    const soundBtn = document.getElementById('sound-toggle-btn');
    if (soundBtn) {
        soundBtn.textContent = 'SOUND OFF'; // Initial state

        soundBtn.addEventListener('click', () => {
            if (!audioCtx) {
                setupAudio().then(() => {
                    toggleMute(soundBtn);
                    if (!isMuted) playSound('./audio/coin.mp3'); // Play a sound on first unmute
                });
            } else {
                toggleMute(soundBtn);
            }
        });
    }
}
