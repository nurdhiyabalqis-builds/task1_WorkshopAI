// test.js — acceptance tests. Run: node test.js (starts its own server on port 3100)
const http = require('http');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// use a scratch data dir so tests never touch real user data
process.env.PORT = '3100';
process.env.DATA_DIR = path.join(__dirname, 'data-test');
const DATA_DIR = process.env.DATA_DIR;
const serverModule = require('./server.js');

const BASE = 'http://localhost:3100';
let passed = 0, failed = 0;

function request(method, urlPath, body, cookie) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(BASE + urlPath, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
    }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(raw); } catch {}
        resolve({ status: res.statusCode, json, headers: res.headers, raw });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function getCookie(res) {
  const set = res.headers['set-cookie'];
  if (!set) return null;
  const m = set[0].match(/session=([a-f0-9]+)/);
  return m ? 'session=' + m[1] : null;
}

async function test(name, fn) {
  try { await fn(); passed++; console.log(`  ✅ PASS: ${name}`); }
  catch (err) { failed++; console.log(`  ❌ FAIL: ${name}\n     ${err.message}`); }
}

(async () => {
  await new Promise(r => serverModule.server.listen(3100, r));

  console.log('\n— Acceptance tests —');

  await test('home page loads (HTML served)', async () => {
    const res = await request('GET', '/');
    assert.strictEqual(res.status, 200);
    assert.ok(res.raw.includes('ICT Quest'));
  });

  await test('student can register', async () => {
    const res = await request('POST', '/api/register', { username: 'amina', password: 'pass1234', role: 'student' });
    assert.strictEqual(res.status, 201);
  });

  await test('duplicate username is rejected (409)', async () => {
    const res = await request('POST', '/api/register', { username: 'amina', password: 'pass1234' });
    assert.strictEqual(res.status, 409);
  });

  await test('short password is rejected (400)', async () => {
    const res = await request('POST', '/api/register', { username: 'bola', password: 'abc' });
    assert.strictEqual(res.status, 400);
  });

  await test('wrong password cannot log in (401)', async () => {
    const res = await request('POST', '/api/login', { username: 'amina', password: 'wrong' });
    assert.strictEqual(res.status, 401);
  });

  let studentCookie, teacherCookie;
  await test('student can log in', async () => {
    const res = await request('POST', '/api/login', { username: 'amina', password: 'pass1234' });
    assert.strictEqual(res.status, 200);
    studentCookie = getCookie(res);
    assert.ok(studentCookie);
  });

  await test('quiz list is available', async () => {
    const res = await request('GET', '/api/quizzes');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json.quizzes.length, 5);
  });

  await test('playing a quiz requires login (401)', async () => {
    const res = await request('GET', '/api/quizzes/word');
    assert.strictEqual(res.status, 401);
  });

  let quiz;
  await test('logged-in student gets quiz questions', async () => {
    const res = await request('GET', '/api/quizzes/word', null, studentCookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json.questions.length, 5);
    assert.ok(!('answer' in res.json.questions[0]), 'answers must not be sent to the browser');
    quiz = res.json;
  });

  await test('submitting answers returns a score and saves progress', async () => {
    // answer every question with the real correct answer: option index 0 is always correct in our content
    const answers = quiz.questions.map(() => 0);
    const res = await request('POST', '/api/quizzes/word/submit', { answers }, studentCookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json.score, 100);
    assert.strictEqual(res.json.best, 100);
  });

  await test('wrong answer count is rejected (400)', async () => {
    const res = await request('POST', '/api/quizzes/word/submit', { answers: [0] }, studentCookie);
    assert.strictEqual(res.status, 400);
  });

  await test('student sees own progress', async () => {
    const res = await request('GET', '/api/progress', null, studentCookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.json.scores.word, 100);
  });

  await test('second student cannot see first student’s data (permission check)', async () => {
    await request('POST', '/api/register', { username: 'chidi', password: 'pass1234' });
    const login = await request('POST', '/api/login', { username: 'chidi', password: 'pass1234' });
    const chidiCookie = getCookie(login);
    const res = await request('GET', '/api/progress', null, chidiCookie);
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(res.json.scores, {}, 'chidi must see an empty progress, not amina’s');
    assert.ok(!JSON.stringify(res.json).includes('word'), 'amina’s scores must not leak to chidi');
  });

  await test('teacher can register and log in', async () => {
    await request('POST', '/api/register', { username: 'mrjames', password: 'teach123', role: 'teacher' });
    const res = await request('POST', '/api/login', { username: 'mrjames', password: 'teach123' });
    assert.strictEqual(res.status, 200);
    teacherCookie = getCookie(res);
  });

  await test('teacher sees whole-class progress (sees amina)', async () => {
    const res = await request('GET', '/api/progress', null, teacherCookie);
    assert.strictEqual(res.status, 200);
    const names = res.json.students.map(s => s.student);
    assert.ok(names.includes('amina'), 'teacher should see amina’s scores');
    assert.ok(!JSON.stringify(res.json).includes('passwordHash'), 'no password data may be exposed');
  });

  await test('student cannot see teacher view (role enforced)', async () => {
    const res = await request('GET', '/api/progress', null, studentCookie);
    assert.strictEqual(res.json.role, 'student');
    assert.ok(!res.json.students, 'students must not receive the class list');
  });

  await test('logout invalidates the session', async () => {
    await request('POST', '/api/logout', null, studentCookie);
    const res = await request('GET', '/api/me', null, studentCookie);
    assert.strictEqual(res.status, 401);
  });

  await test('passwords are stored hashed, never as plain text', async () => {
    const users = JSON.parse(fs.readFileSync(serverModule.USERS_FILE, 'utf8'));
    const stored = JSON.stringify(users);
    assert.ok(!stored.includes('pass1234') && !stored.includes('teach123'), 'plain passwords found in storage!');
    assert.ok(stored.includes('scrypt') || /:[a-f0-9]{64}/.test(stored), 'expected salted hash format');
  });

  console.log(`\nResult: ${passed} passed, ${failed} failed`);
  serverModule.server.close();
  fs.rmSync(DATA_DIR, { recursive: true, force: true });
  process.exit(failed === 0 ? 0 : 1);
})();
