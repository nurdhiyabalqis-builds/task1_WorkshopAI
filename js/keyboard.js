// ICT Quest — Mission 2: Keyboard & Mouse skills (Mission Card 04)
(function () {
  var view = document.getElementById("km-view");
  var home = document.getElementById("home-view");
  var progressEl = document.getElementById("km-progress");
  var headingEl = document.getElementById("km-heading");
  var keyboardRound = document.getElementById("km-keyboard-round");
  var mouseRound = document.getElementById("km-mouse-round");
  var targetKeyEl = document.getElementById("km-target-key");
  var keyHintEl = document.getElementById("km-key-hint");
  var feedbackEl = document.getElementById("km-feedback");
  var arena = document.getElementById("km-arena");
  var arenaStart = document.getElementById("km-arena-start");
  var resultEl = document.getElementById("km-result");
  var resultText = document.getElementById("km-result-text");
  var starsEl = document.getElementById("km-stars");

  var KEYS = [
    { key: "a", label: "A" },
    { key: "s", label: "S" },
    { key: "d", label: "D" },
    { key: "f", label: "F" },
    { key: "j", label: "J" },
    { key: "k", label: "K" },
    { key: "l", label: "L" },
    { key: "Enter", label: "Enter" },
    { key: " ", label: "Space" }
  ];
  var KEY_TARGETS = 4;
  var MOUSE_TARGETS = 5;

  var round = 0; // 0 = keyboard, 1 = mouse
  var score = 0;
  var keyHits = 0;
  var keyMisses = 0;
  var currentKey = null;
  var mouseHits = 0;
  var mouseClicks = 0;
  var listening = false;

  function show() {
    home.hidden = true;
    view.hidden = false;
    round = 0;
    score = 0;
    keyHits = 0;
    keyMisses = 0;
    mouseHits = 0;
    mouseClicks = 0;
    resultEl.hidden = true;
    startKeyboardRound();
  }

  function hide() {
    listening = false;
    view.hidden = true;
    home.hidden = false;
    renderHome();
  }

  // ---------- Round 1: keyboard ----------
  function startKeyboardRound() {
    keyHits = 0;
    keyMisses = 0;
    keyboardRound.hidden = false;
    mouseRound.hidden = true;
    headingEl.textContent = "Round 1 · Keyboard keys";
    buildOnScreenKeys();
    nextKey();
    listening = true;
  }

  // On-screen keys: lets phone users play without a physical keyboard.
  function buildOnScreenKeys() {
    var pad = document.getElementById("km-keypad");
    pad.innerHTML = "";
    KEYS.forEach(function (k) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "km-padkey";
      btn.textContent = k.label;
      btn.setAttribute("aria-label", "Key " + k.label);
      btn.addEventListener("click", function () { tryKey(k); });
      pad.appendChild(btn);
    });
  }

  function tryKey(k) {
    if (k.key === currentKey.key) {
      keyHits++;
      feedbackEl.textContent = "Yes! " + currentKey.label + " found.";
      if (keyHits >= KEY_TARGETS) {
        score += Math.max(20 - keyMisses * 5, 5);
        round = 1;
        listening = false;
        feedbackEl.textContent = "";
        setTimeout(startMouseRound, 700);
      } else {
        setTimeout(nextKey, 500);
      }
    } else {
      keyMisses++;
      keyHintEl.textContent = "Not quite — look for the " + currentKey.label + " key and try again.";
    }
  }

  function nextKey() {
    currentKey = KEYS[Math.floor(Math.random() * KEYS.length)];
    targetKeyEl.textContent = currentKey.label;
    keyHintEl.textContent = "";
    progressEl.textContent = "Round 1 of 2 · Keys found: " + keyHits + "/" + KEY_TARGETS;
  }

  function keyHandler(event) {
    if (!listening || round !== 0 || view.hidden) return;
    var pressed = event.key === " " ? " " : event.key.toLowerCase();
    var match = KEYS.find(function (k) { return k.key === pressed; });
    if (match) tryKey(match);
  }

  // ---------- Round 2: mouse clicking ----------
  function startMouseRound() {
    listening = false;
    keyboardRound.hidden = true;
    mouseRound.hidden = false;
    headingEl.textContent = "Round 2 · Mouse clicking";
    mouseHits = 0;
    mouseClicks = 0;
    progressEl.textContent = "Round 2 of 2 · Targets caught: 0/" + MOUSE_TARGETS;
    arenaStart.hidden = false;
    arenaStart.textContent = "Get ready…";
    setTimeout(spawnTarget, 1200);
  }

  function spawnTarget() {
    arenaStart.hidden = true;
    var dot = document.createElement("button");
    dot.type = "button";
    dot.className = "km-target";
    dot.setAttribute("aria-label", "Target to click");
    var maxX = arena.clientWidth - 50;
    var maxY = arena.clientHeight - 50;
    dot.style.left = 10 + Math.random() * Math.max(maxX - 10, 10) + "px";
    dot.style.top = 10 + Math.random() * Math.max(maxY - 10, 10) + "px";
    dot.addEventListener("click", function () {
      mouseHits++;
      mouseClicks++;
      dot.remove();
      progressEl.textContent = "Round 2 of 2 · Targets caught: " + mouseHits + "/" + MOUSE_TARGETS;
      if (mouseHits >= MOUSE_TARGETS) {
        score += mouseClicks === MOUSE_TARGETS ? 20 : Math.max(15 - (mouseClicks - MOUSE_TARGETS) * 2, 8);
        finish();
      } else {
        spawnTarget();
      }
    });
    arena.appendChild(dot);
  }

  function finish() {
    var max = 40;
    var stars = score >= max * 0.9 ? 3 : score >= max * 0.6 ? 2 : 1;
    keyboardRound.hidden = true;
    mouseRound.hidden = true;
    headingEl.textContent = "";
    resultText.textContent =
      "Great work! You found " + KEY_TARGETS + " keys and caught " + MOUSE_TARGETS +
      " targets for " + score + " points.";
    var starsText = "";
    for (var i = 0; i < 3; i++) starsText += i < stars ? "★" : "☆";
    starsEl.textContent = starsText;
    resultEl.hidden = false;
    progressEl.textContent = "All rounds done · Score: " + score;

    if (!save.missions["keyboard-mouse"]) save.missions["keyboard-mouse"] = {};
    var record = save.missions["keyboard-mouse"];
    record.completed = true;
    if ((record.stars || 0) < stars) record.stars = stars;
    save.totalPoints = (save.totalPoints || 0) + score;
    persistSave(save);
  }

  // Wiring
  var backBtn = document.getElementById("km-back");
  var homeBtn = document.getElementById("km-home");
  backBtn.addEventListener("click", hide);
  homeBtn.addEventListener("click", hide);
  document.addEventListener("keydown", keyHandler);

  // Extend the mission opener
  var previousOpener = window.openMission;
  window.openMission = function (missionId) {
    if (missionId === "keyboard-mouse") show();
    else if (typeof previousOpener === "function") previousOpener(missionId);
  };
})();
