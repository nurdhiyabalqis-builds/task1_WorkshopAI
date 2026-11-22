// ICT Quest — Mission 4: Spreadsheet skills (Mission Card 06)
(function () {
  var view = document.getElementById("ss-view");
  var home = document.getElementById("home-view");
  var progressEl = document.getElementById("ss-progress");
  var headingEl = document.getElementById("ss-heading");
  var gridEl = document.getElementById("ss-grid");
  var feedbackEl = document.getElementById("ss-feedback");
  var resultEl = document.getElementById("ss-result");
  var resultText = document.getElementById("ss-result-text");
  var starsEl = document.getElementById("ss-stars");

  var COLS = ["A", "B", "C", "D"];
  var ROWS = 4;
  var TASKS = ["B2", "A1", "D3", "C4", "A3"];
  var TASK_COUNT = TASKS.length;

  var current = 0;
  var points = 0;
  var wrongCount = 0;

  function show() {
    home.hidden = true;
    view.hidden = false;
    current = 0;
    points = 0;
    wrongCount = 0;
    resultEl.hidden = true;
    buildGrid();
    renderTask();
  }

  function hide() {
    view.hidden = true;
    home.hidden = false;
    renderHome();
  }

  function buildGrid() {
    gridEl.innerHTML = "";
    // Corner cell
    var corner = document.createElement("div");
    corner.className = "ss-corner";
    gridEl.appendChild(corner);
    COLS.forEach(function (col) {
      var c = document.createElement("div");
      c.className = "ss-colhead";
      c.textContent = col;
      gridEl.appendChild(c);
    });
    for (let row = 1; row <= ROWS; row++) {
      var rh = document.createElement("div");
      rh.className = "ss-rowhead";
      rh.textContent = row;
      gridEl.appendChild(rh);
      COLS.forEach(function (col) {
        // `let` here matters: `var` would leave every closure seeing the last row.
        const cellName = col + row;
        var cell = document.createElement("button");
        cell.type = "button";
        cell.className = "ss-cell";
        cell.setAttribute("aria-label", "Cell " + cellName);
        cell.dataset.cell = cellName;
        cell.addEventListener("click", function () { pick(cellName, cell); });
        gridEl.appendChild(cell);
      });
    }
  }

  function renderTask() {
    wrongCount = 0;
    progressEl.textContent = "Task " + (current + 1) + " of " + TASK_COUNT + " · Points: " + points;
    var target = TASKS[current];
    headingEl.textContent = "Click cell " + target + ".";
    feedbackEl.textContent = "";
    gridEl.querySelectorAll(".ss-cell").forEach(function (cell) {
      cell.classList.remove("ss-picked", "ss-correct", "ss-wrong");
      cell.disabled = false;
    });
  }

  function pick(cellName, cellEl) {
    var target = TASKS[current];
    if (cellName === target) {
      cellEl.classList.add("ss-correct");
      points += wrongCount === 0 ? 20 : 10;
      feedbackEl.textContent = "Yes! That is cell " + target + ". +" + (wrongCount === 0 ? 20 : 10) + " points.";
      current++;
      if (current < TASK_COUNT) {
        setTimeout(renderTask, 900);
      } else {
        setTimeout(finish, 900);
      }
    } else {
      wrongCount++;
      cellEl.classList.add("ss-wrong");
      feedbackEl.textContent = "Hint: the letter is the column (across), the number is the row (down). " +
        "Cell " + target + " means column " + target.charAt(0) + ", row " + target.charAt(1) + ".";
    }
  }

  function finish() {
    var max = TASK_COUNT * 20;
    var stars = points >= max * 0.9 ? 3 : points >= max * 0.6 ? 2 : 1;
    headingEl.textContent = "";
    resultText.textContent =
      "You found every cell for " + points + " out of " + max + " points. " +
      "Columns go across (A, B, C), rows go down (1, 2, 3) — that is how Excel works!";
    var starsText = "";
    for (var i = 0; i < 3; i++) starsText += i < stars ? "★" : "☆";
    starsEl.textContent = starsText;
    resultEl.hidden = false;
    progressEl.textContent = "All tasks done · Points: " + points;

    if (!save.missions["spreadsheet"]) save.missions["spreadsheet"] = {};
    var record = save.missions["spreadsheet"];
    record.completed = true;
    if ((record.stars || 0) < stars) record.stars = stars;
    save.totalPoints = (save.totalPoints || 0) + points;
    persistSave(save);
  }

  document.getElementById("ss-back").addEventListener("click", hide);
  document.getElementById("ss-home").addEventListener("click", hide);

  var previousOpener = window.openMission;
  window.openMission = function (missionId) {
    if (missionId === "spreadsheet") show();
    else if (typeof previousOpener === "function") previousOpener(missionId);
  };
})();
