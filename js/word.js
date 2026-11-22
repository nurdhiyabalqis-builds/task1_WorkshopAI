// ICT Quest — Mission 3: Word Processor skills (Mission Card 05)
(function () {
  var view = document.getElementById("wp-view");
  var home = document.getElementById("home-view");
  var progressEl = document.getElementById("wp-progress");
  var headingEl = document.getElementById("wp-heading");
  var docEl = document.getElementById("wp-doc");
  var titleLine = document.getElementById("wp-line-title");
  var bodyLine = document.getElementById("wp-line-body");
  var instructionEl = document.getElementById("wp-instruction");
  var toolsEl = document.getElementById("wp-tools");
  var feedbackEl = document.getElementById("wp-feedback");
  var resultEl = document.getElementById("wp-result");
  var resultText = document.getElementById("wp-result-text");
  var starsEl = document.getElementById("wp-stars");

  // Each task: question, tools (label + effect), correct tool id.
  var TASKS = [
    {
      question: "Task 1: The title should stand out. Which tool makes text bold?",
      tools: [
        { id: "bold", label: "B — Bold", titleClass: "wp-bold" },
        { id: "italic", label: "I — Italic", titleClass: "wp-italic" },
        { id: "underline", label: "U — Underline", titleClass: "wp-underline" }
      ],
      correct: "bold",
      target: "title"
    },
    {
      question: "Task 2: A title belongs in the middle. Which button centers the title?",
      tools: [
        { id: "align-left", label: "Align left" },
        { id: "align-center", label: "Center" },
        { id: "align-right", label: "Align right" }
      ],
      correct: "align-center",
      target: "title"
    },
    {
      question: "Task 3: \"it\" should start with a capital I. Which tool fixes letters like this?",
      tools: [
        { id: "spellcheck", label: "Spell check" },
        { id: "find", label: "Find" },
        { id: "print", label: "Print" }
      ],
      correct: "spellcheck",
      target: "body",
      apply: function () {
        bodyLine.textContent = "The cat sleeps on the sofa every day. It likes sunny spots.";
      }
    },
    {
      question: "Task 4: You finished your work! What do you do so it is safe tomorrow?",
      tools: [
        { id: "save", label: "Save" },
        { id: "close", label: "Close without saving" },
        { id: "newdoc", label: "New document" }
      ],
      correct: "save",
      target: "none"
    }
  ];

  var current = 0;
  var points = 0;
  var wrongCount = 0;
  var done = false;

  function show() {
    home.hidden = true;
    view.hidden = false;
    // Reset document
    titleLine.textContent = "my favorite animal";
    titleLine.className = "";
    docEl.className = "wp-doc";
    bodyLine.textContent = "The cat sleeps on the sofa every day. it likes sunny spots.";
    current = 0;
    points = 0;
    wrongCount = 0;
    done = false;
    resultEl.hidden = true;
    renderTask();
  }

  function hide() {
    view.hidden = true;
    home.hidden = false;
    renderHome();
  }

  function renderTask() {
    var task = TASKS[current];
    progressEl.textContent = "Task " + (current + 1) + " of " + TASKS.length + " · Points: " + points;
    headingEl.textContent = task.question;
    feedbackEl.textContent = "";
    toolsEl.innerHTML = "";
    task.tools.forEach(function (tool) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wp-tool";
      btn.textContent = tool.label;
      btn.addEventListener("click", function () { answer(task, tool, btn); });
      toolsEl.appendChild(btn);
    });
  }

  function answer(task, tool, btn) {
    if (tool.id === task.correct) {
      points += wrongCount === 0 ? 20 : 10;
      // Apply the visual effect to the document
      if (task.target === "title") {
        var chosen = task.tools.find(function (t) { return t.id === tool.id; });
        if (chosen.titleClass) titleLine.className = chosen.titleClass;
        if (tool.id === "align-center") titleLine.style.textAlign = "center";
      } else if (typeof task.apply === "function") {
        task.apply();
      }
      feedbackEl.textContent = "Correct! The document is looking better. +" + (wrongCount === 0 ? 20 : 10) + " points.";
      current++;
      if (current < TASKS.length) {
        setTimeout(renderTask, 900);
      } else {
        setTimeout(finish, 900);
      }
    } else {
      wrongCount++;
      btn.disabled = true;
      feedbackEl.textContent = wrongHint(task, tool.id);
    }
  }

  function wrongHint(task, toolId) {
    var hints = {
      bold: "Italic slants the letters. Bold makes them thick and strong — try B.",
      italic: "Underline draws a line under words. Bold makes them thick — try B.",
      underline: "Italic slants letters. Bold makes them thick — try B.",
      "align-left": "Left is where the text already is. Titles usually sit in the middle.",
      "align-right": "Right pushes text to the edge. Titles usually sit in the middle.",
      spellcheck: "Find only searches for words. The tool that fixes letters is the spelling one.",
      find: "Printing puts it on paper. The tool that fixes letters is the spelling one.",
      print: "Finding only searches. The tool that fixes letters is the spelling one.",
      close: "Careful! Closing without saving loses your work. Keep it safe.",
      newdoc: "A new document starts empty — you would lose this one. Keep it safe."
    };
    return "Hint: " + (hints[toolId] || "Try another tool.");
  }

  function finish() {
    var max = TASKS.length * 20;
    var stars = points >= max * 0.9 ? 3 : points >= max * 0.6 ? 2 : 1;
    headingEl.textContent = "";
    toolsEl.innerHTML = "";
    instructionEl.hidden = true;
    resultText.textContent =
      "You fixed the whole document for " + points + " out of " + max + " points. " +
      "Now you know bold, center, spell check, and save!";
    var starsText = "";
    for (var i = 0; i < 3; i++) starsText += i < stars ? "★" : "☆";
    starsEl.textContent = starsText;
    resultEl.hidden = false;
    progressEl.textContent = "All tasks done · Points: " + points;

    if (!save.missions["word-processor"]) save.missions["word-processor"] = {};
    var record = save.missions["word-processor"];
    record.completed = true;
    if ((record.stars || 0) < stars) record.stars = stars;
    save.totalPoints = (save.totalPoints || 0) + points;
    persistSave(save);
    done = true;
  }

  var backBtn = document.getElementById("wp-back");
  var homeBtn = document.getElementById("wp-home");
  backBtn.addEventListener("click", hide);
  homeBtn.addEventListener("click", hide);

  var previousOpener = window.openMission;
  window.openMission = function (missionId) {
    if (missionId === "word-processor") show();
    else if (typeof previousOpener === "function") previousOpener(missionId);
  };
})();
