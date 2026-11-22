// server.js — the whole backend: HTTP server + API + file storage.
// Uses only Node.js built-in modules so the app runs offline with no npm install.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
for (const f of [USERS_FILE, PROGRESS_FILE]) {
  if (!fs.existsSync(f)) fs.writeFileSync(f, '{}');
}

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return {}; }
}
function writeJSON(file, obj) {
  // atomic-ish write: write temp then rename, so a crash can't corrupt the file
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, file);
}

// --- password hashing (built-in crypto, no dependencies) ---
function hashPassword(password, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 32).toString('hex');
  return salt + ':' + hash;
}
function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const candidate = crypto.scryptSync(password, salt, 32).toString('hex');
  // timingSafeEqual prevents timing attacks on password comparison
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'));
}

// --- sessions: token -> { userId, role } kept in memory + persisted to disk ---
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
if (!fs.existsSync(SESSIONS_FILE)) fs.writeFileSync(SESSIONS_FILE, '{}');
function readSessions() { return readJSON(SESSIONS_FILE); }
function writeSessions(s) { writeJSON(SESSIONS_FILE, s); }

function getUserFromRequest(req) {
  const cookies = req.headers.cookie || '';
  const match = cookies.match(/session=([a-f0-9]+)/);
  if (!match) return null;
  const sessions = readSessions();
  const session = sessions[match[1]];
  if (!session) return null;
  const users = readJSON(USERS_FILE);
  return users[session.userId] ? { userId: session.userId, role: users[session.userId].role } : null;
}

function sendJSON(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 10000) { reject(new Error('Body too large')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); } catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

// --- quiz content: the lessons students play through ---
const QUIZZES = {
  basics: {
    title: 'Computer Basics',
    icon: '🖥️',
    questions: [
      { q: 'What does the mouse pointer do on the screen?', options: ['Points at things so you can click them', 'Prints documents', 'Stores files'], answer: 0 },
      { q: 'Which key do you press to save with Ctrl+S?', options: ['S', 'P', 'Delete'], answer: 0 },
      { q: 'Where do you put files you no longer need?', options: ['The Recycle Bin / Trash', 'The keyboard', 'The mouse'], answer: 0 },
      { q: 'What is a folder used for?', options: ['Organising files', 'Playing music only', 'Charging the computer'], answer: 0 },
      { q: 'Which one is an operating system?', options: ['Windows', 'Microsoft Word', 'A mouse'], answer: 0 },
    ],
  },
  word: {
    title: 'Word (Writing Documents)',
    icon: '📝',
    questions: [
      { q: 'Which program do you use to write an essay?', options: ['Microsoft Word', 'Microsoft Excel', 'Calculator'], answer: 0 },
      { q: 'Ctrl+B makes text…', options: ['Bold', 'Blue', 'Bigger'], answer: 0 },
      { q: 'How do you make text bigger?', options: ['Increase the font size', 'Press harder on keys', 'Zoom the screen'], answer: 0 },
      { q: 'Which alignment centres text on the page?', options: ['Centre align', 'Left align', 'It does not exist'], answer: 0 },
      { q: 'Ctrl+C and Ctrl+V do…', options: ['Copy and paste', 'Cut the document', 'Close Word'], answer: 0 },
    ],
  },
  excel: {
    title: 'Excel (Spreadsheets)',
    icon: '📊',
    questions: [
      { q: 'Excel organises data in…', options: ['Rows and columns', 'Sentences', 'Slides'], answer: 0 },
      { q: 'What symbol starts a formula?', options: ['=', '!', '#'], answer: 0 },
      { q: '=SUM(A1:A5) will…', options: ['Add up cells A1 to A5', 'Delete those cells', 'Spell-check them'], answer: 0 },
      { q: 'What is a cell reference like B2 used for?', options: ['Pointing to one box of data', 'Naming the file', 'Changing colours'], answer: 0 },
      { q: 'Which is best for recording marks of 40 students?', options: ['A spreadsheet', 'A poster', 'A text message'], answer: 0 },
    ],
  },
  powerpoint: {
    title: 'PowerPoint (Presentations)',
    icon: '📽️',
    questions: [
      { q: 'PowerPoint is used to make…', options: ['Slides for presentations', 'Long documents', 'Spreadsheets'], answer: 0 },
      { q: 'What is one page of a presentation called?', options: ['A slide', 'A cell', 'A sheet'], answer: 0 },
      { q: 'F5 or "Slide Show" starts…', options: ['Presenting full screen', 'Printing slides', 'Saving'], answer: 0 },
      { q: 'A good slide has…', options: ['Short points, not full paragraphs', 'Everything you will say, word for word', 'Only pictures'], answer: 0 },
      { q: 'To add a picture to a slide you use…', options: ['Insert > Pictures', 'Ctrl+S', 'The recycle bin'], answer: 0 },
    ],
  },
  internet: {
    title: 'Internet & Email',
    icon: '🌐',
    questions: [
      { q: 'What do you need to visit a website?', options: ['A browser and internet connection', 'A printer', 'PowerPoint'], answer: 0 },
      { q: 'Which is an email address?', options: ['name@example.com', 'www.example.com', 'C:\\My Files'], answer: 0 },
      { q: 'A strong password is…', options: ['Long and mixes letters, numbers, symbols', 'Your name', '123456'], answer: 0 },
      { q: 'An email from a stranger asking for your password is…', options: ['Suspicious — do not reply', 'Safe to answer', 'From your teacher for sure'], answer: 0 },
      { q: 'What does a search engine like Google do?', options: ['Finds websites about your topic', 'Saves your files', 'Prints documents'], answer: 0 },
    ],
  },
};

// --- API routing ---
async function handleAPI(req, res, url) {
  const body = await readBody(req).catch(() => ({}));

  // POST /api/register — create student or teacher account
  if (url.pathname === '/api/register' && req.method === 'POST') {
    const { username, password, role } = body;
    if (!username || typeof username !== 'string' || username.trim().length < 3)
      return sendJSON(res, 400, { error: 'Username must be at least 3 characters.' });
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      return sendJSON(res, 400, { error: 'Username can only use letters, numbers and underscore.' });
    if (!password || password.length < 4)
      return sendJSON(res, 400, { error: 'Password must be at least 4 characters.' });
    const users = readJSON(USERS_FILE);
    const key = username.toLowerCase();
    if (users[key]) return sendJSON(res, 409, { error: 'That username is already taken.' });
    const finalRole = role === 'teacher' ? 'teacher' : 'student';
    users[key] = { username: username.trim(), passwordHash: hashPassword(password), role: finalRole, createdAt: new Date().toISOString() };
    writeJSON(USERS_FILE, users);
    return sendJSON(res, 201, { ok: true, message: 'Account created. Please log in.' });
  }

  // POST /api/login — returns session cookie
  if (url.pathname === '/api/login' && req.method === 'POST') {
    const { username, password } = body;
    const users = readJSON(USERS_FILE);
    const user = users[(username || '').toLowerCase()];
    if (!user || !verifyPassword(password || '', user.passwordHash))
      return sendJSON(res, 401, { error: 'Wrong username or password.' });
    const token = crypto.randomBytes(24).toString('hex');
    const sessions = readSessions();
    sessions[token] = { userId: user.username.toLowerCase(), role: user.role, createdAt: Date.now() };
    writeSessions(sessions);
    res.setHeader('Set-Cookie', `session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800`);
    return sendJSON(res, 200, { ok: true, role: user.role, username: user.username });
  }

  // POST /api/logout
  if (url.pathname === '/api/logout' && req.method === 'POST') {
    const cookies = req.headers.cookie || '';
    const match = cookies.match(/session=([a-f0-9]+)/);
    if (match) {
      const sessions = readSessions();
      delete sessions[match[1]];
      writeSessions(sessions);
    }
    res.setHeader('Set-Cookie', 'session=; HttpOnly; Path=/; Max-Age=0');
    return sendJSON(res, 200, { ok: true });
  }

  // GET /api/me — who am I logged in as
  if (url.pathname === '/api/me' && req.method === 'GET') {
    const auth = getUserFromRequest(req);
    if (!auth) return sendJSON(res, 401, { error: 'Not logged in.' });
    const users = readJSON(USERS_FILE);
    return sendJSON(res, 200, { username: users[auth.userId].username, role: auth.role });
  }

  // GET /api/quizzes — list of topics (public)
  if (url.pathname === '/api/quizzes' && req.method === 'GET') {
    const list = Object.entries(QUIZZES).map(([id, q]) => ({ id, title: q.title, icon: q.icon, count: q.questions.length }));
    return sendJSON(res, 200, { quizzes: list });
  }

  // GET /api/quizzes/:id — questions without marking the answers
  const quizMatch = url.pathname.match(/^\/api\/quizzes\/([\w-]+)$/);
  if (quizMatch && req.method === 'GET') {
    const quiz = QUIZZES[quizMatch[1]];
    if (!quiz) return sendJSON(res, 404, { error: 'Quiz not found.' });
    const auth = getUserFromRequest(req);
    if (!auth) return sendJSON(res, 401, { error: 'Please log in to play.' });
    return sendJSON(res, 200, { id: quizMatch[1], title: quiz.title, icon: quiz.icon, questions: quiz.questions.map(q => ({ q: q.q, options: q.options })) });
  }

  // POST /api/quizzes/:id/submit — grade answers, store progress
  const submitMatch = url.pathname.match(/^\/api\/quizzes\/([\w-]+)\/submit$/);
  if (submitMatch && req.method === 'POST') {
    const auth = getUserFromRequest(req);
    if (!auth) return sendJSON(res, 401, { error: 'Please log in to play.' });
    const quiz = QUIZZES[submitMatch[1]];
    if (!quiz) return sendJSON(res, 404, { error: 'Quiz not found.' });
    const answers = Array.isArray(body.answers) ? body.answers : [];
    if (answers.length !== quiz.questions.length)
      return sendJSON(res, 400, { error: `Expected ${quiz.questions.length} answers.` });
    let correct = 0;
    const review = quiz.questions.map((question, i) => {
      const ok = answers[i] === question.answer;
      if (ok) correct++;
      return { q: question.q, chosen: answers[i], correct: question.answer, ok };
    });
    const score = Math.round((correct / quiz.questions.length) * 100);
    const progress = readJSON(PROGRESS_FILE);
    const userProgress = progress[auth.userId] = progress[auth.userId] || { scores: {}, history: [] };
    const previous = userProgress.scores[submitMatch[1]] || 0;
    if (score > previous) userProgress.scores[submitMatch[1]] = score;
    userProgress.history.push({ quiz: submitMatch[1], score, at: new Date().toISOString() });
    writeJSON(PROGRESS_FILE, progress);
    return sendJSON(res, 200, { score, correct, total: quiz.questions.length, best: Math.max(score, previous), review });
  }

  // GET /api/progress — my own progress (or a teacher's whole-class view)
  if (url.pathname === '/api/progress' && req.method === 'GET') {
    const auth = getUserFromRequest(req);
    if (!auth) return sendJSON(res, 401, { error: 'Not logged in.' });
    const progress = readJSON(PROGRESS_FILE);
    if (auth.role === 'teacher') {
      // teachers see every student's best scores, but never passwords
      const users = readJSON(USERS_FILE);
      const rows = Object.keys(progress).map(key => ({
        student: users[key] ? users[key].username : key,
        scores: progress[key].scores,
      })).filter(r => Object.keys(r.scores).length > 0);
      return sendJSON(res, 200, { role: 'teacher', students: rows });
    }
    const mine = progress[auth.userId];
    return sendJSON(res, 200, { role: 'student', scores: mine ? mine.scores : {}, history: mine ? mine.history.slice(-20) : [] });
  }

  return sendJSON(res, 404, { error: 'Unknown API path.' });
}

// --- static files (the HTML/CSS/JS interface) ---
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
function serveStatic(req, res, url) {
  let filePath = path.join(PUBLIC_DIR, url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname));
  // prevent ../ path traversal outside public/
  if (!filePath.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith('/api/')) return await handleAPI(req, res, url);
    return serveStatic(req, res, url);
  } catch (err) {
    return sendJSON(res, 500, { error: 'Server error. Please try again.' });
  }
});

if (require.main === module) {
  server.listen(PORT, () => console.log(`ICT Quest running at http://localhost:${PORT}`));
}
module.exports = { server, QUIZZES, hashPassword, verifyPassword, readJSON, writeJSON, USERS_FILE, PROGRESS_FILE };
