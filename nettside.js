const canvas = document.getElementById('snow');
const ctx = canvas.getContext('2d');

function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
}

resize();
window.addEventListener('resize', resize);

const flakes = Array.from({ length: 65 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 3 + 1,
    speed: Math.random() * 0.8 + 0.4
}));

function drawSnow() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';

    flakes.forEach(f => {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();

        f.y += f.speed;

        if (f.y > canvas.height) {
            f.y = -10;
            f.x = Math.random() * canvas.width;
        }
    });

    requestAnimationFrame(drawSnow);
}

drawSnow();

const MAX_BUDGET = 800;
const checkboxes = document.querySelectorAll('[name="gear"]');
const budgetText = document.getElementById('budgetText');

function updateBudget() {
    const total = [...checkboxes]
        .filter(cb => cb.checked)
        .reduce((sum, cb) => sum + Number(cb.dataset.price || 0), 0);

    const remaining = MAX_BUDGET - total;

    budgetText.textContent = `${remaining} / ${MAX_BUDGET} kr`;

    budgetText.classList.toggle('exceeded', remaining < 0);

    checkboxes.forEach(cb => {
        cb.disabled = !cb.checked &&
            total + Number(cb.dataset.price || 0) > MAX_BUDGET;
    });
}

checkboxes.forEach(cb => {
    cb.addEventListener('change', updateBudget);
});

function playJingle() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const audio = new AudioCtx();
    const notes = [523, 659, 784, 1047];

    notes.forEach((freq, i) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();

        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, audio.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(
            0.001, audio.currentTime + i * 0.12 + 0.4
        );

        osc.connect(gain);
        gain.connect(audio.destination);

        osc.start(audio.currentTime + i * 0.12);
        osc.stop(audio.currentTime + i * 0.12 + 0.4);
    });
}


const form = document.getElementById('surveyForm');
const resultBox = document.getElementById('resultBox');
const submitBtn = document.getElementById('submitBtn');

function showResults(data, restored = false) {
    document.getElementById('sumGear').textContent =
        data.gear.join(', ') || 'Ingenting (Bare 800 kr)';

    document.getElementById('sumDest').textContent = data.destination;

    if (restored) {
        resultBox.querySelector('h3').textContent =
            'Du har allerede sendt inn! 🎅';
    }

    form.classList.add('hidden');
    resultBox.style.display = 'block';
}


const savedData = localStorage.getItem('survey_result');

if (savedData) {
    showResults(JSON.parse(savedData), true);
}


form.addEventListener('submit', async event => {
    event.preventDefault();

    const data = {
        gear: [...checkboxes]
            .filter(cb => cb.checked)
            .map(cb => cb.value),

        destination: document.getElementById('destination').value
    };

    submitBtn.disabled = true;

    try {
        const response = await fetch('/api/survey/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Kunne ikke sende data');
        }

        const result = await response.json();

        localStorage.setItem('survey_result', JSON.stringify(data));

        playJingle();
        showResults(data);

    } catch (error) {
        alert('Noe gikk galt! Prøv igjen.');
        console.error(error);

    } finally {
        submitBtn.disabled = false;
    }
});
