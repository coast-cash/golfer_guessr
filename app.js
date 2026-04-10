const MAX_GUESSES = 4;

const hintsEl = document.getElementById('hints');
const formEl = document.getElementById('guess-form');
const inputEl = document.getElementById('guess-input');
const statusEl = document.getElementById('status');
const attemptsEl = document.getElementById('attempts');
const newGameBtn = document.getElementById('new-game');
const winDialog = document.getElementById('win-dialog');
const winTitle = document.getElementById('win-title');
const winnerImage = document.getElementById('winner-image');
const winnerMeta = document.getElementById('winner-meta');
const shareBtn = document.getElementById('share-btn');
const closeDialogBtn = document.getElementById('close-dialog');

let golfers = [];
let target;
let guesses = [];

function normalize(value) {
  return value.toLowerCase().replace(/[^a-z]/g, '');
}

function majorCounts(wins) {
  return wins.reduce((acc, win) => {
    acc[win.tournament] = (acc[win.tournament] || 0) + 1;
    return acc;
  }, {});
}

function renderAttempts() {
  attemptsEl.innerHTML = '';
  for (let i = 0; i < MAX_GUESSES; i += 1) {
    const dot = document.createElement('div');
    dot.className = 'dot';
    if (i < guesses.length) dot.classList.add('used');
    attemptsEl.appendChild(dot);
  }
}

function buildHints() {
  const counts = majorCounts(target.wins);
  const showCourses = guesses.length >= 1;
  const showYears = guesses.length >= 2;
  const showCountry = guesses.length >= 3;

  const sortedWins = [...target.wins].sort((a, b) => a.year - b.year);

  let html = '<h2 class="hint-title">Major wins only</h2><ul>';
  html += Object.entries(counts)
    .map(([major, count]) => `<li><strong>${major}</strong>: ${count}</li>`)
    .join('');
  html += '</ul>';

  if (showCourses) {
    html += '<h2 class="hint-title">Now showing courses</h2><ul>';
    html += sortedWins.map((w) => `<li>${w.tournament} — ${w.course}</li>`).join('');
    html += '</ul>';
  }

  if (showYears) {
    html += '<h2 class="hint-title">Now showing years</h2><ul>';
    html += sortedWins.map((w) => `<li>${w.tournament} — ${w.year}</li>`).join('');
    html += '</ul>';
  }

  if (showCountry) {
    html += `<h2 class="hint-title">Final hint: country</h2><p>${target.country}</p>`;
  }

  hintsEl.innerHTML = html;
}

function loseGame() {
  statusEl.textContent = `Out of guesses. The answer was ${target.name}.`;
  statusEl.classList.remove('shake');
  formEl.querySelector('button').disabled = true;
}

function winGame() {
  const attempts = guesses.length;
  statusEl.textContent = `Correct in ${attempts} ${attempts === 1 ? 'attempt' : 'attempts'}!`;
  formEl.querySelector('button').disabled = true;

  winTitle.textContent = `Correct! It took you ${attempts} attempts!`;
  winnerImage.src = target.photo;
  winnerMeta.textContent = `${target.name} • ${target.country}`;
  winDialog.showModal();
  const dots = attemptsEl.querySelectorAll('.dot');
  for (let i = 0; i < attempts; i += 1) dots[i]?.classList.add('correct');
}

function startGame() {
  target = golfers[Math.floor(Math.random() * golfers.length)];
  guesses = [];
  formEl.reset();
  formEl.querySelector('button').disabled = false;
  statusEl.textContent = 'Start with the majors-only clue.';
  statusEl.classList.remove('shake');
  renderAttempts();
  buildHints();
}

function wrongAnimation(message) {
  statusEl.textContent = message;
  statusEl.classList.remove('shake');
  requestAnimationFrame(() => statusEl.classList.add('shake'));
}

formEl.addEventListener('submit', (e) => {
  e.preventDefault();
  const guess = inputEl.value.trim();
  if (!guess) return;

  guesses.push(guess);
  renderAttempts();

  if (normalize(guess) === normalize(target.name)) {
    winGame();
    return;
  }

  if (guesses.length >= MAX_GUESSES) {
    loseGame();
    buildHints();
    return;
  }

  wrongAnimation('Not that golfer — new hint unlocked.');
  buildHints();
  formEl.reset();
});

newGameBtn.addEventListener('click', startGame);
closeDialogBtn.addEventListener('click', () => {
  winDialog.close();
  startGame();
});

shareBtn.addEventListener('click', async () => {
  const text = `I guessed ${target.name} in ${guesses.length}/${MAX_GUESSES} tries on Major Mystery!`;
  if (navigator.share) {
    await navigator.share({ text });
  } else {
    await navigator.clipboard.writeText(text);
    statusEl.textContent = 'Result copied to clipboard.';
  }
});

fetch('./data/golfers.json')
  .then((res) => res.json())
  .then((data) => {
    golfers = data;
    startGame();
  })
  .catch(() => {
    statusEl.textContent = 'Could not load golfer data.';
  });
