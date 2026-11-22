// app.js — the game interface. Talks to the server API, keeps no game state hidden from it.
const $ = id => document.getElementById(id);
const screens = ['home-screen', 'levels-screen', 'quiz-screen', 'result-screen', 'progress-screen'];
let currentUser = null;
let currentQuiz = null;      // { id, title, questions }
let currentQuestion = 0;
let answers = [];

function show(screenId) {
  screens.forEach(s => $(s).hidden = s !== screenId);
  window.scrollTo(0, 0);
}

function showMessage(text, type = 'error') {
  const el = $('message');
  el.textContent = text;
  el.className = 'message ' + type;
  el.hidden = false;
}
function hideMessage() { $('message').hidden = true; }

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options,
  });
  const data = await res.json().catch(() => ({ error: 'Bad response from server.' }));
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

// --- auth ---
$('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  hideMessage();
  showMessage('Logging in…', 'loading');
  try {
    const data = await api('/api/login', { method: 'POST', body: JSON.stringify({ username: $('login-username').value, password: $('login-password').value }) });
    currentUser = { username: data.username, role: data.role };
    hideMessage();
    enterGame();
  } catch (err) { showMessage(err.message, 'error'); }
});

$('register-form').addEventListener('submit', async e => {
  e.preventDefault();
  hideMessage();
  showMessage('Creating your account…', 'loading');
  try {
    await api('/api/register', { method: 'POST', body: JSON.stringify({ username: $('reg-username').value, password: $('reg-password').value, role: $('reg-role').value }) });
    hideMessage();
    showMessage('Account created! Now log in.', 'success');
    document.querySelector('[data-tab="login"]').click();
    $('login-username').value = $('reg-username').value;
  } catch (err) { showMessage(err.message, 'error'); }
});

document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
  $('login-form').hidden = tab.dataset.tab !== 'login';
  $('register-form').hidden = tab.dataset.tab !== 'register';
}));

$('logout-btn').addEventListener('click', async () => {
  await api('/api/logout', { method: 'POST' });
  currentUser = null;
  updateNav();
  show('home-screen');
});

function updateNav() {
  $('user-label').hidden = !currentUser;
  $('logout-btn').hidden = !currentUser;
  $('progress-btn').hidden = !currentUser;
  if (currentUser) $('user-label').textContent = `👋 ${currentUser.username} (${currentUser.role})`;
}

function enterGame() {
  updateNav();
  loadLevels();
  show('levels-screen');
}

// --- levels ---
async function loadLevels() {
  $('levels-title').textContent = currentUser.role === 'teacher' ? 'Levels (preview as teacher)' : 'Pick a level';
  let progressScores = {};
  try {
    if (currentUser.role === 'student') {
      const p = await api('/api/progress');
      progressScores = p.scores || {};
    }
  } catch { /* empty state: no progress yet */ }
  const quizzes = (await api('/api/quizzes')).quizzes;
  const grid = $('level-grid');
  grid.innerHTML = '';
  quizzes.forEach(q => {
    const btn = document.createElement('button');
    btn.className = 'level-btn';
    const best = progressScores[q.id];
    btn.innerHTML = `<span class="icon">${q.icon}</span><span>${q.title}</span>` +
      (best !== undefined ? `<span class="best">Best: ${best}% ${best >= 80 ? '⭐' : ''}</span>` : `<span class="best">Not played yet</span>`);
    btn.addEventListener('click', () => startQuiz(q.id));
    grid.appendChild(btn);
  });
}

// --- quiz play: one question at a time, pick an answer, next ---
async function startQuiz(quizId) {
  hideMessage();
  showMessage('Loading level…', 'loading');
  show('quiz-screen');
  try {
    currentQuiz = await api(`/api/quizzes/${quizId}`);
  } catch (err) {
    showMessage(err.message, 'error');
    show('levels-screen');
    return;
  }
  hideMessage();
  currentQuestion = 0;
  answers = [];
  $('quiz-title').textContent = `${currentQuiz.icon} ${currentQuiz.title}`;
  renderQuestion();
}

function renderQuestion() {
  const q = currentQuiz.questions[currentQuestion];
  $('quiz-progress').style.width = `${(currentQuestion / currentQuiz.questions.length) * 100}%`;
  const body = $('quiz-body');
  body.innerHTML = `<p class="question">Question ${currentQuestion + 1} of ${currentQuiz.questions.length}: ${q.q}</p>
    <div class="options"></div>`;
  const optionsDiv = body.querySelector('.options');
  let selected = answers[currentQuestion] ?? null;
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.textContent = opt;
    if (selected === i) btn.classList.add('selected');
    btn.addEventListener('click', () => {
      answers[currentQuestion] = i;
      optionsDiv.querySelectorAll('button').forEach((b, j) => b.classList.toggle('selected', j === i));
    });
    optionsDiv.appendChild(btn);
  });
  const navBtn = document.createElement('button');
  navBtn.className = 'primary';
  navBtn.textContent = currentQuestion === currentQuiz.questions.length - 1 ? 'Finish ✅' : 'Next ➡️';
  navBtn.addEventListener('click', () => {
    if (answers[currentQuestion] === undefined) {
      showMessage('Please choose an answer first.', 'error');
      return;
    }
    hideMessage();
    if (currentQuestion === currentQuiz.questions.length - 1) submitQuiz();
    else { currentQuestion++; renderQuestion(); }
  });
  body.appendChild(navBtn);
}

async function submitQuiz() {
  showMessage('Checking your answers…', 'loading');
  try {
    const result = await api(`/api/quizzes/${currentQuiz.id}/submit`, { method: 'POST', body: JSON.stringify({ answers }) });
    hideMessage();
    renderResult(result);
  } catch (err) {
    showMessage(err.message, 'error');
    show('levels-screen');
  }
}

function renderResult(result) {
  show('result-screen');
  const stars = result.best >= 80 ? '⭐⭐⭐' : result.best >= 50 ? '⭐⭐' : result.best >= 20 ? '⭐' : '💪 Try again!';
  const reviewHtml = result.review.filter(r => !r.ok).map(r =>
    `<div class="review-item"><strong>${r.q}</strong><br>Correct answer: ${currentQuiz.questions[result.review.indexOf(r)].options[r.correct]}</div>`
  ).join('');
  $('result-card').innerHTML = `
    <div class="result-score">${result.score}%</div>
    <p style="text-align:center">${result.correct} of ${result.total} correct — ${stars}</p>
    <p style="text-align:center">Best score for this level: <strong>${result.best}%</strong></p>
    ${reviewHtml ? '<h3>Review what you missed:</h3>' + reviewHtml : '<p style="text-align:center;color:var(--success)">Perfect! Every answer correct! 🎉</p>'}`;
}

$('back-to-levels').addEventListener('click', () => { loadLevels(); show('levels-screen'); });

// --- progress ---
$('progress-btn').addEventListener('click', async () => {
  showMessage('Loading progress…', 'loading');
  show('progress-screen');
  try {
    const p = await api('/api/progress');
    hideMessage();
    if (p.role === 'teacher') {
      $('progress-title').textContent = 'Class progress (all students)';
      $('progress-body').innerHTML = p.students.length === 0
        ? '<p>No students have played yet. Ask your class to log in and play!</p>'
        : `<table><tr><th>Student</th><th>Level</th><th>Best</th></tr>` +
          p.students.flatMap(s => Object.entries(s.scores).map(([k, v]) => `<tr><td>${s.student}</td><td>${k}</td><td>${v}%</td></tr>`)).join('') +
          `</table>`;
    } else {
      $('progress-title').textContent = 'My progress';
      const entries = Object.entries(p.scores);
      $('progress-body').innerHTML = entries.length === 0
        ? '<p>You have not played any level yet. Go pick one — it is fun! 🎮</p>'
        : `<table><tr><th>Level</th><th>Best score</th></tr>` +
          entries.map(([k, v]) => `<tr><td>${k}</td><td>${v}%</td></tr>`).join('') + `</table>`;
    }
  } catch (err) { showMessage(err.message, 'error'); show('home-screen'); }
});

$('progress-back').addEventListener('click', () => { if (currentUser) { loadLevels(); show('levels-screen'); } else show('home-screen'); });

// --- on page load: check existing session ---
(async () => {
  try {
    const me = await api('/api/me');
    currentUser = { username: me.username, role: me.role };
    enterGame();
  } catch { show('home-screen'); }
})();
