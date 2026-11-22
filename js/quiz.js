// ICT Quest — Mission 1: Computer Basics quiz (Mission Card 02)
(function () {
  var QUESTIONS = [
    {
      question: "Which part of the computer is the \"brain\" that does the thinking?",
      options: ["Monitor", "CPU (processor)", "Mouse", "Printer"],
      answer: 1,
      hint: "It is a small chip inside the computer case. CPU stands for Central Processing Unit."
    },
    {
      question: "Which device do you use to point and click on the screen?",
      options: ["Keyboard", "Speaker", "Mouse", "Scanner"],
      answer: 2,
      hint: "It is named after a small animal with a tail — it fits under your hand."
    },
    {
      question: "What does the monitor do?",
      options: ["Prints on paper", "Stores files forever", "Shows pictures and text", "Cools the computer"],
      answer: 2,
      hint: "It is the screen you are looking at right now."
    },
    {
      question: "Which key moves the cursor to the next line when typing?",
      options: ["Enter", "Shift", "Escape", "Tab"],
      answer: 0,
      hint: "It is also called Return — you press it after finishing a paragraph."
    },
    {
      question: "Where should you save your work so you can open it again later?",
      options: ["In your hands", "On the hard drive (or cloud)", "On the screen only", "In the mouse"],
      answer: 1,
      hint: "Files are stored on a disk inside the computer, or in the cloud over the internet."
    }
  ];

  var view = document.getElementById("quiz-view");
  var home = document.getElementById("home-view");
  var progressEl = document.getElementById("quiz-progress");
  var questionEl = document.getElementById("quiz-heading");
  var optionsEl = document.getElementById("quiz-options");
  var hintEl = document.getElementById("quiz-hint");
  var resultEl = document.getElementById("quiz-result");
  var resultTitle = document.getElementById("quiz-result-title");
  var resultText = document.getElementById("quiz-result-text");
  var starsEl = document.getElementById("quiz-stars");

  var current = 0;
  var points = 0;
  var wrongCount = 0;
  var answered = false;

  function show() {
    home.hidden = true;
    view.hidden = false;
    current = 0;
    points = 0;
    wrongCount = 0;
    resultEl.hidden = true;
    renderQuestion();
  }

  function hide() {
    view.hidden = true;
    home.hidden = false;
    renderHome();
  }

  function renderQuestion() {
    answered = false;
    var q = QUESTIONS[current];
    progressEl.textContent =
      "Question " + (current + 1) + " of " + QUESTIONS.length + " · Points: " + points;
    questionEl.textContent = q.question;
    hintEl.textContent = "";
    optionsEl.innerHTML = "";
    q.options.forEach(function (option, index) {
      var li = document.createElement("li");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-option";
      btn.textContent = option;
      btn.addEventListener("click", function () { answer(index, btn); });
      li.appendChild(btn);
      optionsEl.appendChild(li);
    });
  }

  function answer(index, btn) {
    if (answered) return;
    var q = QUESTIONS[current];
    if (index === q.answer) {
      answered = true;
      btn.classList.add("correct");
      points += wrongCount === 0 ? 20 : 10; // full points on first try, half after a miss
      hintEl.textContent = "Great job! +" + (wrongCount === 0 ? 20 : 10) + " points.";
      setTimeout(next, 900);
    } else {
      wrongCount++;
      btn.classList.add("wrong");
      btn.disabled = true;
      hintEl.textContent = "Hint: " + q.hint;
    }
  }

  function next() {
    current++;
    if (current < QUESTIONS.length) {
      renderQuestion();
    } else {
      finish();
    }
  }

  function finish() {
    var max = QUESTIONS.length * 20;
    var stars = points >= max * 0.9 ? 3 : points >= max * 0.6 ? 2 : 1;
    resultTitle.textContent = "Mission complete!";
    resultText.textContent =
      "You scored " + points + " out of " + max + " points. " +
      "Missed questions give hints so you can learn and try again.";
    var starsText = "";
    for (var i = 0; i < 3; i++) starsText += i < stars ? "★" : "☆";
    starsEl.textContent = starsText;

    // Save progress (Mission 03 save rules)
    if (!save.missions["computer-basics"]) save.missions["computer-basics"] = {};
    var record = save.missions["computer-basics"];
    record.completed = true;
    if ((record.stars || 0) < stars) record.stars = stars;
    save.totalPoints = Math.max(save.totalPoints || 0, (save.totalPoints || 0) + points);
    persistSave(save);

    resultEl.hidden = false;
    questionEl.textContent = "";
    optionsEl.innerHTML = "";
    hintEl.textContent = "";
    progressEl.textContent = "All " + QUESTIONS.length + " questions done · Points: " + points;
  }

  // Wire the mission card and buttons
  var backBtn = document.getElementById("quiz-back");
  var homeBtn = document.getElementById("quiz-home");
  var againBtn = document.getElementById("quiz-again");
  backBtn.addEventListener("click", hide);
  homeBtn.addEventListener("click", hide);
  againBtn.addEventListener("click", show);

  window.openMission = function (missionId) {
    if (missionId === "computer-basics") show();
    // Other missions are built in later Missions.
  };
})();
