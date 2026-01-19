// Configurações de Áudio
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

// Frequências das cordas soltas (E2, A2, D3, G3, B3, E4)
const stringBaseFreqs = {
    "E_low": 82.41,
    "A": 110.00,
    "D": 146.83,
    "G": 196.00,
    "B": 246.94,
    "e_high": 329.63
};

// Função para calcular a frequência de qualquer traste
// Fórmula: f = f0 * 2^(n/12)
function getFretFrequency(baseFreq, fret) {
    return baseFreq * Math.pow(2, fret / 12);
}

function playSound(frequency) {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;

    // Criamos o som de piano combinando harmónicas na frequência específica do traste
    createTone(frequency, 0.4, 1.2);      // Tom fundamental
    createTone(frequency * 2, 0.1, 0.8);  // 1ª Oitava (brilho)
    createTone(frequency * 3, 0.05, 0.4); // 2ª Oitava (detalhe)
}

function createTone(freq, volume, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const now = audioCtx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.02); 
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(now + duration);
}

// --- Lógica do Jogo ---

const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const stringInits = [
    { n: "e", start: "E", base: stringBaseFreqs.e_high, thickness: "1px" },
    { n: "B", start: "B", base: stringBaseFreqs.B, thickness: "1.5px" },
    { n: "G", start: "G", base: stringBaseFreqs.G, thickness: "2px" },
    { n: "D", start: "D", base: stringBaseFreqs.D, thickness: "2.5px" },
    { n: "A", start: "A", base: stringBaseFreqs.A, thickness: "3px" },
    { n: "E", start: "E", base: stringBaseFreqs.E_low, thickness: "3.5px" }
];

let targetNote = "";
let score = 0;
let attempts = 0;

function init() {
    const board = document.getElementById('fretboard');
    board.innerHTML = ''; 

    stringInits.forEach((str, sIdx) => {
        const row = document.createElement('div');
        row.className = 'string';
        row.style.setProperty('--thickness', str.thickness);

        let noteIdx = notes.indexOf(str.start);

        for (let f = 0; f <= 22; f++) {
            const fret = document.createElement('div');
            fret.className = 'fret';
            
            // Calculamos a nota e a frequência específica deste traste
            const noteName = notes[noteIdx % 12];
            const fretFreq = getFretFrequency(str.base, f);
            
            fret.dataset.note = noteName;
            fret.dataset.freq = fretFreq;

            // Inlays (bolinhas)
            if (sIdx === 2 && [3, 5, 7, 9, 15].includes(f)) {
                const dot = document.createElement('div');
                dot.className = 'inlay';
                fret.appendChild(dot);
            }
            if (f === 12 && (sIdx === 1 || sIdx === 3)) {
                const dot = document.createElement('div');
                dot.className = 'inlay';
                fret.appendChild(dot);
            }

            fret.onclick = () => handlePick(fret);
            row.appendChild(fret);
            noteIdx++;
        }
        board.appendChild(row);
    });
    nextNote();
}

function handlePick(el) {
    const note = el.dataset.note;
    const freq = parseFloat(el.dataset.freq);
    attempts++;
    
    playSound(freq); // Toca a frequência real do traste!

    const marker = document.createElement('div');
    marker.className = 'note-hit';
    marker.textContent = note;

    if (note === targetNote) {
        marker.classList.add('correct');
        score++;
        document.getElementById('msg').textContent = "Acertou!";
        document.getElementById('msg').style.color = "#2ecc71";
        setTimeout(nextNote, 1000);
    } else {
        marker.classList.add('wrong');
        document.getElementById('msg').textContent = `Errou, é um ${note}`;
        document.getElementById('msg').style.color = "#e74c3c";
    }

    el.appendChild(marker);
    setTimeout(() => marker.remove(), 800);
    updateStats();
}

function nextNote() {
    targetNote = notes[Math.floor(Math.random() * notes.length)];
    document.getElementById('target').textContent = targetNote;
    document.getElementById('msg').textContent = "";
}

function updateStats() {
    document.getElementById('score').textContent = score;
    const acc = attempts === 0 ? 0 : Math.round((score / attempts) * 100);
    document.getElementById('accuracy').textContent = acc + "%";
}

function resetStats() {
    score = 0;
    attempts = 0;
    updateStats();
    nextNote();
}

window.onload = init;