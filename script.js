const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// --- Volumen Maestro ---
const masterGainNode = audioContext.createGain();
masterGainNode.gain.value = 0.7; // Volumen inicial 70%
masterGainNode.connect(audioContext.destination);
// -----------------------

let activeSource = null;
let activeGainNode = null;
let fadeTime = 1.5;
let currentlyPlayingNote = null; // Para saber qué nota suena

const fadeSlider = document.getElementById('fadeSlider');
const fadeValueDisplay = document.getElementById('fadeValue');
const volumeSlider = document.getElementById('volumeSlider');
const buttons = document.querySelectorAll('.pad-button');

// Slider de Fade
fadeSlider.addEventListener('input', (event) => {
    fadeTime = parseFloat(event.target.value);
    fadeValueDisplay.textContent = fadeTime + 's';
});

// Slider de Volumen Maestro
volumeSlider.addEventListener('input', (event) => {
    masterGainNode.gain.value = parseFloat(event.target.value);
});

async function playSound(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const nextSource = audioContext.createBufferSource();
    nextSource.buffer = audioBuffer;
    nextSource.loop = true;

    const nextGainNode = audioContext.createGain();
    nextGainNode.gain.value = 0;

    // Conectar: Nuevo Sonido -> Nuevo Volumen -> Volumen Maestro -> Altavoces
    nextSource.connect(nextGainNode);
    nextGainNode.connect(masterGainNode);

    const now = audioContext.currentTime;

    // Fade In
    nextGainNode.gain.setValueAtTime(0, now);
    nextGainNode.gain.linearRampToValueAtTime(1, now + fadeTime);
    nextSource.start(0);

    // Fade Out
    if (activeSource && activeGainNode) {
        activeGainNode.gain.setValueAtTime(1, now);
        activeGainNode.gain.linearRampToValueAtTime(0, now + fadeTime);
        activeSource.stop(now + fadeTime);
    }

    activeSource = nextSource;
    activeGainNode = nextGainNode;
}

// Función para detener el sonido actual
function stopSound() {
    if (activeSource && activeGainNode) {
        const now = audioContext.currentTime;
        activeGainNode.gain.setValueAtTime(1, now);
        activeGainNode.gain.linearRampToValueAtTime(0, now + fadeTime);
        activeSource.stop(now + fadeTime);
        activeSource = null;
        activeGainNode = null;
    }
}

// Lógica de botones
buttons.forEach(button => {
    button.addEventListener('click', () => {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const note = button.dataset.note;
        const type = button.dataset.type;
        const soundUrl = `sounds/${type}_${note}.wav`; 

        // --- Lógica de Toggle ---
        if (currentlyPlayingNote === note) {
            // Si toco el botón que ya suena, apago
            stopSound();
            button.classList.remove('active');
            currentlyPlayingNote = null;
        } else {
            // Si toco otro botón o no suena nada, reproduzco
            playSound(soundUrl);
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentlyPlayingNote = note;
        }
        // -------------------------
    });
});