// SCORM 1.2 API Discovery and Wrapper
(function () {
  "use strict";

  function findAPI(win) {
    var attempts = 0;
    while (!win.API && win.parent && win.parent !== win && attempts < 10) {
      win = win.parent;
      attempts++;
    }
    if (!win.API && win.opener) {
      return findAPI(win.opener);
    }
    return win.API || null;
  }

  var API = findAPI(window);

  var scorm = {
    init: function () {
      return API ? API.LMSInitialize("") : "false";
    },
    finish: function () {
      return API ? API.LMSFinish("") : "false";
    },
    get: function (key) {
      return API ? API.LMSGetValue(key) : "";
    },
    set: function (key, val) {
      return API ? API.LMSSetValue(key, String(val)) : "false";
    },
    save: function () {
      return API ? API.LMSCommit("") : "false";
    },
  };

  // Initialize SCORM
  scorm.init();

  // State
  var course = null;
  var allScreens = []; // Flat list: { moduleIndex, screenIndex, screen, isQuiz, quiz }
  var currentIndex = 0;
  var quizScores = {};
  var totalQuizQuestions = 0;
  var correctAnswers = 0;

  // Restore suspend data
  var suspendRaw = scorm.get("cmi.suspend_data");
  var savedState = null;
  try {
    if (suspendRaw) savedState = JSON.parse(suspendRaw);
  } catch (e) {}

  // Load course
  fetch("course.json")
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      course = data;
      buildScreenList();
      if (savedState && savedState.currentIndex) {
        currentIndex = Math.min(savedState.currentIndex, allScreens.length - 1);
      }
      if (savedState && savedState.quizScores) {
        quizScores = savedState.quizScores;
      }
      renderCurrentScreen();
      updateNav();
    });

  function buildScreenList() {
    allScreens = [];
    for (var m = 0; m < course.modules.length; m++) {
      var mod = course.modules[m];
      for (var s = 0; s < mod.screens.length; s++) {
        allScreens.push({
          moduleIndex: m,
          screenIndex: s,
          screen: mod.screens[s],
          isQuiz: false,
          isModuleStart: s === 0,
          moduleTitle: mod.title,
        });
      }
      if (mod.quiz && mod.quiz.length > 0) {
        allScreens.push({
          moduleIndex: m,
          isQuiz: true,
          quiz: mod.quiz,
          moduleTitle: mod.title,
        });
        totalQuizQuestions += mod.quiz.length;
      }
    }
  }

  function renderCurrentScreen() {
    var container = document.getElementById("course-content");
    var item = allScreens[currentIndex];

    if (!item) return;

    var html = "";

    if (item.isModuleStart || currentIndex === 0) {
      html += '<div class="module-header">' + escapeHtml(item.moduleTitle) + "</div>";
    }

    if (item.isQuiz) {
      html += renderQuiz(item);
    } else {
      html += renderScreen(item);
    }

    container.innerHTML = html;

    // Set lesson status to incomplete on first view
    if (scorm.get("cmi.core.lesson_status") === "not attempted") {
      scorm.set("cmi.core.lesson_status", "incomplete");
      scorm.save();
    }
  }

  function renderScreen(item) {
    var s = item.screen;
    var html = '<div class="screen">';
    html += '<h2 class="screen-title">' + escapeHtml(s.title) + "</h2>";

    if (s.image && s.image.file) {
      html +=
        '<img class="screen-image" src="assets/' +
        encodeURIComponent(s.image.file) +
        '" alt="' +
        escapeHtml(s.image.alt || "") +
        '" />';
    }

    html += '<div class="story-text">' + escapeHtml(s.storyText) + "</div>";

    if (s.onScreenText) {
      html += '<div class="on-screen-text">' + escapeHtml(s.onScreenText) + "</div>";
    }

    if (s.narration) {
      html += '<p class="narration-text">"' + escapeHtml(s.narration) + '"</p>';
    }

    if (s.audio && s.audio.file) {
      html +=
        '<audio class="audio-player" controls src="assets/' +
        encodeURIComponent(s.audio.file) +
        '"></audio>';
    }

    if (s.interaction && s.interaction.type === "reflection") {
      html += '<div class="interaction">';
      html += '<div class="interaction-label">Reflection</div>';
      html += '<div class="interaction-prompt">' + escapeHtml(s.interaction.prompt) + "</div>";
      html += "</div>";
    }

    if (s.interaction && s.interaction.type === "decision") {
      var screenId = s.id;
      html += '<div class="interaction decision-box" id="decision-' + screenId + '">';
      html += '<div class="interaction-label">Decision Point</div>';
      html += '<div class="interaction-prompt">' + escapeHtml(s.interaction.prompt) + "</div>";
      if (s.interaction.options && s.interaction.options.length > 0) {
        html += '<div class="decision-options">';
        for (var oi = 0; oi < s.interaction.options.length; oi++) {
          var opt = s.interaction.options[oi];
          html += '<button class="decision-btn" data-screen="' + screenId +
            '" data-option="' + oi +
            '" data-recommended="' + (opt.isRecommended ? '1' : '0') +
            '" data-feedback="' + escapeHtml(opt.feedback) +
            '" onclick="handleDecision(this)">' +
            escapeHtml(opt.label) + '</button>';
        }
        html += '</div>';
      }
      html += '<div id="decision-feedback-' + screenId + '"></div>';
      html += "</div>";
    }

    html += "</div>";
    return html;
  }

  function renderQuiz(item) {
    var html = '<div class="quiz-container">';
    html += '<h2 class="quiz-title">Knowledge Check: ' + escapeHtml(item.moduleTitle) + "</h2>";

    for (var q = 0; q < item.quiz.length; q++) {
      var question = item.quiz[q];
      html += '<div class="quiz-question" id="quiz-q-' + q + '">';
      html +=
        "<p>" + (q + 1) + ". " + escapeHtml(question.question) + "</p>";

      for (var c = 0; c < question.choices.length; c++) {
        html +=
          '<button class="quiz-choice" data-question="' +
          q +
          '" data-choice="' +
          c +
          '" data-correct="' +
          question.answerIndex +
          '" onclick="handleQuizChoice(this)">' +
          escapeHtml(question.choices[c]) +
          "</button>";
      }
      html += "</div>";
    }

    html += "</div>";
    return html;
  }

  // Global quiz handler
  window.handleQuizChoice = function (btn) {
    var questionIdx = parseInt(btn.getAttribute("data-question"));
    var choiceIdx = parseInt(btn.getAttribute("data-choice"));
    var correctIdx = parseInt(btn.getAttribute("data-correct"));

    var questionDiv = document.getElementById("quiz-q-" + questionIdx);
    var buttons = questionDiv.querySelectorAll(".quiz-choice");

    // Disable all buttons
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].classList.add("disabled");
      if (parseInt(buttons[i].getAttribute("data-choice")) === correctIdx) {
        buttons[i].classList.add("correct");
      }
    }

    if (choiceIdx !== correctIdx) {
      btn.classList.add("incorrect");
    } else {
      correctAnswers++;
    }

    // Update score
    if (totalQuizQuestions > 0) {
      var pct = Math.round((correctAnswers / totalQuizQuestions) * 100);
      scorm.set("cmi.core.score.raw", String(pct));
      scorm.set("cmi.core.score.min", "0");
      scorm.set("cmi.core.score.max", "100");
      scorm.save();
    }
  };

  // Global decision handler
  window.handleDecision = function (btn) {
    var screenId = btn.getAttribute("data-screen");
    var isRecommended = btn.getAttribute("data-recommended") === "1";
    var feedback = btn.getAttribute("data-feedback");

    var container = document.getElementById("decision-" + screenId);
    var buttons = container.querySelectorAll(".decision-btn");

    for (var i = 0; i < buttons.length; i++) {
      buttons[i].disabled = true;
      buttons[i].style.opacity = "0.4";
      buttons[i].style.cursor = "default";
      if (buttons[i].getAttribute("data-recommended") === "1") {
        buttons[i].style.borderColor = "#28a745";
        buttons[i].style.opacity = "1";
        buttons[i].style.background = "#1a2e1a";
        buttons[i].style.color = "#4caf50";
      }
    }
    btn.style.opacity = "1";
    btn.style.borderColor = isRecommended ? "#28a745" : "#ffc107";
    btn.style.background = isRecommended ? "#1a2e1a" : "#2e2a1a";
    btn.style.color = isRecommended ? "#4caf50" : "#ffcc80";

    var feedbackDiv = document.getElementById("decision-feedback-" + screenId);
    var bgColor = isRecommended ? "#1a2e1a" : "#2e2a1a";
    var borderColor = isRecommended ? "#2d5a2d" : "#5a4a2d";
    var textColor = isRecommended ? "#81c784" : "#ffcc80";
    feedbackDiv.innerHTML =
      '<div style="margin-top:12px;padding:14px;border-radius:8px;background:' + bgColor +
      ';border:1px solid ' + borderColor + '"><p style="color:' + textColor + ';line-height:1.5">' +
      escapeHtml(feedback) + '</p></div>';
  };

  // Navigation
  window.prevScreen = function () {
    if (currentIndex > 0) {
      currentIndex--;
      renderCurrentScreen();
      updateNav();
      saveProgress();
    }
  };

  window.nextScreen = function () {
    if (currentIndex < allScreens.length - 1) {
      currentIndex++;
      renderCurrentScreen();
      updateNav();
      saveProgress();
    } else {
      // Course complete
      scorm.set("cmi.core.lesson_status", "completed");
      scorm.save();
      showCompletion();
    }
  };

  function updateNav() {
    var prevBtn = document.getElementById("btn-prev");
    var nextBtn = document.getElementById("btn-next");
    var progressText = document.getElementById("progress-text");
    var progressFill = document.getElementById("progress-fill");

    prevBtn.disabled = currentIndex === 0;
    nextBtn.textContent =
      currentIndex === allScreens.length - 1 ? "Complete" : "Next";

    var pct = ((currentIndex + 1) / allScreens.length) * 100;
    progressText.textContent =
      "Screen " + (currentIndex + 1) + " of " + allScreens.length;
    progressFill.style.width = pct + "%";
  }

  function saveProgress() {
    var state = {
      currentIndex: currentIndex,
      quizScores: quizScores,
      correctAnswers: correctAnswers,
    };
    scorm.set("cmi.suspend_data", JSON.stringify(state));
    scorm.save();
  }

  function showCompletion() {
    var container = document.getElementById("course-content");
    var scoreText = "";
    if (totalQuizQuestions > 0) {
      var pct = Math.round((correctAnswers / totalQuizQuestions) * 100);
      scoreText =
        "<p>Quiz Score: " +
        correctAnswers +
        "/" +
        totalQuizQuestions +
        " (" +
        pct +
        "%)</p>";
    }
    container.innerHTML =
      '<div class="completion-message"><h2>Course Complete!</h2>' +
      scoreText +
      "<p>You have completed this training course.</p></div>";
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Cleanup on unload
  window.addEventListener("beforeunload", function () {
    saveProgress();
    scorm.finish();
  });
})();
