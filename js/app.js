// ICT Quest — shared save + home screen (Missions 01–03)
// Save format is documented in docs/savefile.md

var SAVE_KEY = "ictquest_save_v1";

var DEFAULT_SAVE = {
  playerName: "",
  totalPoints: 0,
  missions: {},
  lastPlayed: null
};

function loadSave() {
  var raw = null;
  try {
    raw = localStorage.getItem(SAVE_KEY);
  } catch (err) {
    return Object.assign({}, DEFAULT_SAVE);
  }
  if (!raw) return Object.assign({}, DEFAULT_SAVE);
  try {
    var parsed = JSON.parse(raw);
    return Object.assign({}, DEFAULT_SAVE, parsed);
  } catch (err) {
    // Broken save: start fresh instead of showing an error.
    return Object.assign({}, DEFAULT_SAVE);
  }
}

function persistSave(save) {
  save.lastPlayed = new Date().toISOString();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch (err) {
    // Storage unavailable: the app still works, progress just won't persist.
  }
}

// ---------- Shared save state ----------
var save = loadSave();

// Mission unlock order: each mission unlocks when the previous one is completed.
var MISSION_ORDER = [
  "computer-basics",
  "keyboard-mouse",
  "word-processor",
  "spreadsheet",
  "presentation"
];

function isMissionUnlocked(missionId) {
  var index = MISSION_ORDER.indexOf(missionId);
  if (index <= 0) return true; // first mission always unlocked
  var previous = MISSION_ORDER[index - 1];
  return !!(save.missions[previous] && save.missions[previous].completed);
}

// ---------- Home screen ----------
function renderHome() {
  var tagline = document.getElementById("tagline");
  if (save.playerName) {
    tagline.textContent = "Welcome back, " + save.playerName + "! Pick a mission and start learning.";
  } else {
    tagline.textContent = "Hello, future ICT star! Pick a mission and start learning.";
  }

  var pointsLine = document.getElementById("points-line");
  if (pointsLine) pointsLine.textContent = "Points: " + (save.totalPoints || 0);

  var cards = document.querySelectorAll(".mission-card");
  cards.forEach(function (card) {
    var missionId = card.getAttribute("data-mission");
    var state = card.querySelector(".mission-state");
    var record = save.missions[missionId];
    card.classList.remove("locked", "completed");
    card.classList.add("unlocked");

    if (record && record.completed) {
      card.classList.add("completed");
      var stars = "";
      for (var i = 0; i < 3; i++) stars += i < (record.stars || 0) ? "★" : "☆";
      state.textContent = stars + " Done — play again";
    } else if (isMissionUnlocked(missionId)) {
      state.textContent = record && record.currentLevel ? "▶ Continue" : "▶ Start";
    } else {
      card.classList.remove("unlocked");
      card.classList.add("locked");
      state.textContent = "🔒 Locked";
    }
  });
}

var nameInput = document.getElementById("player-name");
var saveNameBtn = document.getElementById("save-name");
var nameStatus = document.getElementById("name-status");

saveNameBtn.addEventListener("click", function () {
  var name = nameInput.value.trim();
  save.playerName = name;
  persistSave(save);
  renderHome();
  nameStatus.textContent = name
    ? "Saved! Nice to meet you, " + name + "."
    : "Saved. You can add your name anytime.";
});

nameInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") saveNameBtn.click();
});

var resetBtn = document.getElementById("reset-progress");
resetBtn.addEventListener("click", function () {
  var really = confirm("Reset all progress? Your points and completed missions will be erased.");
  if (really) {
    save = Object.assign({}, DEFAULT_SAVE);
    persistSave(save);
    nameInput.value = "";
    renderHome();
    nameStatus.textContent = "Progress has been reset.";
  }
});

// Mission card clicks open the matching game (wired by each game's script).
document.querySelectorAll(".mission-card").forEach(function (card) {
  card.addEventListener("click", function () {
    var missionId = card.getAttribute("data-mission");
    if (!isMissionUnlocked(missionId)) return;
    if (typeof openMission === "function") openMission(missionId);
  });
});

nameInput.value = save.playerName || "";
renderHome();
