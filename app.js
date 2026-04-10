const MAX_GUESSES = 4;
const FALLBACK_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Portrait_Placeholder.png/480px-Portrait_Placeholder.png';

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
const golferOptionsEl = document.getElementById('golfer-options');
const wrongGuessesWrapEl = document.getElementById('wrong-guesses-wrap');
const wrongGuessesEl = document.getElementById('wrong-guesses');

let golfers = [];
let target;
let guesses = [];
let wrongGuesses = [];
let validNames = new Set();

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

function renderWrongGuesses() {
  wrongGuessesEl.innerHTML = wrongGuesses.map((guess) => `<li>${guess}</li>`).join('');
  wrongGuessesWrapEl.classList.toggle('hidden', wrongGuesses.length === 0);
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
  winnerImage.src = target.photo || FALLBACK_IMAGE;
  winnerMeta.textContent = `${target.name} • ${target.country}`;
  winDialog.showModal();
  const dots = attemptsEl.querySelectorAll('.dot');
  for (let i = 0; i < attempts; i += 1) dots[i]?.classList.add('correct');
}

function startGame() {
  target = golfers[Math.floor(Math.random() * golfers.length)];
  guesses = [];
  wrongGuesses = [];
  formEl.reset();
  formEl.querySelector('button').disabled = false;
  statusEl.textContent = 'Start with the majors-only clue.';
  statusEl.classList.remove('shake');
  renderAttempts();
  renderWrongGuesses();
  buildHints();
}

function wrongAnimation(message) {
  statusEl.textContent = message;
  statusEl.classList.remove('shake');
  requestAnimationFrame(() => statusEl.classList.add('shake'));
}

function parseTSV(tsvText) {
  const rows = tsvText.trim().split('\n').slice(1);
  const byName = new Map();

  for (const row of rows) {
    const [tournament, year, winner, course, country] = row.split('\t').map((value) => value?.trim());
    if (!winner) continue;

    if (!byName.has(winner)) {
      byName.set(winner, {
        name: winner,
        country: country || 'Unknown',
        photo: FALLBACK_IMAGE,
        wins: [],
      });
    }

    byName.get(winner).wins.push({
      tournament,
      year: Number(year),
      course,
    });

    if (country) {
      byName.get(winner).country = country;
    }
  }

  return [...byName.values()];
}

function mergeProfiles(tsvGolfers, jsonGolfers) {
  const merged = new Map(tsvGolfers.map((golfer) => [golfer.name, golfer]));

  for (const golfer of jsonGolfers) {
    if (!merged.has(golfer.name)) {
      merged.set(golfer.name, golfer);
      continue;
    }

    const current = merged.get(golfer.name);
    const existingWins = new Set(current.wins.map((win) => `${win.tournament}|${win.year}|${win.course}`));
    for (const win of golfer.wins) {
      const signature = `${win.tournament}|${win.year}|${win.course}`;
      if (!existingWins.has(signature)) {
        current.wins.push(win);
      }
    }

    if (golfer.photo) current.photo = golfer.photo;
    if (golfer.country) current.country = golfer.country;
  }

  return [...merged.values()].filter((golfer) => golfer.wins.length > 0);
}

function buildAutoSuggestNames() {
  validNames = new Set(golfers.map((golfer) => golfer.name));
  golferOptionsEl.innerHTML = [...validNames]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => `<option value="${name}"></option>`)
    .join('');
}

formEl.addEventListener('submit', (e) => {
  e.preventDefault();
  const guess = inputEl.value.trim();
  if (!guess) return;

  if (!validNames.has(guess)) {
    wrongAnimation('Please select a valid golfer from the suggestions list.');
    return;
  }

  guesses.push(guess);
  renderAttempts();

  if (normalize(guess) === normalize(target.name)) {
    winGame();
    return;
  }

  wrongGuesses.push(guess);
  renderWrongGuesses();

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

Promise.all([
  fetch('./data/major_championships_raw.tsv').then((res) => res.text()),
  fetch('./data/golfers.json').then((res) => res.json()),
])
  .then(([tsvText, jsonGolfers]) => {
    const tsvGolfers = parseTSV(tsvText);
    golfers = mergeProfiles(tsvGolfers, jsonGolfers);
    buildAutoSuggestNames();
    startGame();
  })
  .catch(() => {
    statusEl.textContent = 'Could not load golfer data.';
  });
