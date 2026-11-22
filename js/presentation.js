// ICT Quest — Mission 5: Presentation skills (Mission Card 06)
(function () {
  var view = document.getElementById("pp-view");
  var home = document.getElementById("home-view");
  var progressEl = document.getElementById("pp-progress");
  var headingEl = document.getElementById("pp-heading");
  var storyEl = document.getElementById("pp-story");
  var choicesEl = document.getElementById("pp-choices");
  var feedbackEl = document.getElementById("pp-feedback");
  var resultEl = document.getElementById("pp-result");
  var resultText = document.getElementById("pp-result-text");
  var starsEl = document.getElementById("pp-stars");

  // A 5-slide story: pick the next slide in order.
  var STORY = [
    { id: "title", text: "Slide: 🐱 “My Cat’s Day” (title slide)" },
    { id: "morning", text: "Slide: 🌅 In the morning, the cat wakes up." },
    { id: "play", text: "Slide: 🎾 Then it plays with a ball." },
    { id: "eat", text: "Slide: 🍚 After that, it eats its food." },
    { id: "end", text: "Slide: 🌙 At night, it sleeps. The End." }
  ];

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
    storyEl.innerHTML = "";
    renderChoices();
  }

  function hide() {
    view.hidden = true;
    home.hidden = false;
    renderHome();
  }

  function renderChoices() {
    wrongCount = 0;
    feedbackEl.textContent = "";
    progressEl.textContent = "Slide " + (current + 1) + " of " + STORY.length + " · Points: " + points;
    choicesEl.innerHTML = "";
    // Shuffle the remaining slides
    var remaining = STORY.slice(current);
    remaining.sort(function () { return Math.random() - 0.5; });
    remaining.forEach(function (slide) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pp-slide";
      btn.textContent = slide.text;
      btn.addEventListener("click", function () { pick(slide, btn); });
      choicesEl.appendChild(btn);
    });
  }

  function pick(slide, btn) {
    var expected = STORY[current];
    if (slide.id === expected.id) {
      points += wrongCount === 0 ? 20 : 10;
      var li = document.createElement("li");
      li.textContent = slide.text;
      storyEl.appendChild(li);
      feedbackEl.textContent = "Good choice! +" + (wrongCount === 0 ? 20 : 10) + " points.";
      current++;
      if (current < STORY.length) {
        setTimeout(renderChoices, 800);
      } else {
        setTimeout(finish, 800);
      }
    } else {
      wrongCount++;
      btn.disabled = true;
      feedbackEl.textContent = "Hint: a good story goes: title first, then what happens from morning to night in order.";
    }
  }

  function finish() {
    var max = STORY.length * 20;
    var stars = points >= max * 0.9 ? 3 : points >= max * 0.6 ? 2 : 1;
    headingEl.textContent = "";
    choicesEl.innerHTML = "";
    resultText.textContent =
      "You ordered all " + STORY.length + " slides for " + points + " out of " + max +
      " points. A presentation tells its story step by step!";
    var starsText = "";
    for (var i = 0; i < 3; i++) starsText += i < stars ? "★" : "☆";
    starsEl.textContent = starsText;
    resultEl.hidden = false;
    progressEl.textContent = "Story complete · Points: " + points;

    if (!save.missions["presentation"]) save.missions["presentation"] = {};
    var record = save.missions["presentation"];
    record.completed = true;
    if ((record.stars || 0) < stars) record.stars = stars;
    save.totalPoints = (save.totalPoints || 0) + points;
    persistSave(save);
  }

  document.getElementById("pp-back").addEventListener("click", hide);
  document.getElementById("pp-home").addEventListener("click", hide);

  var previousOpener = window.openMission;
  window.openMission = function (missionId) {
    if (missionId === "presentation") show();
    else if (typeof previousOpener === "function") previousOpener(missionId);
  };
})();
