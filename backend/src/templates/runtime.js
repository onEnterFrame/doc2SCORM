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
    init: function () { return API ? API.LMSInitialize("") : "false"; },
    finish: function () { return API ? API.LMSFinish("") : "false"; },
    get: function (key) { return API ? API.LMSGetValue(key) : ""; },
    set: function (key, val) { return API ? API.LMSSetValue(key, String(val)) : "false"; },
    save: function () { return API ? API.LMSCommit("") : "false"; },
  };

  scorm.init();

  // ── State ──
  var course = null;
  var allScreens = [];
  var currentIndex = 0;
  var quizScores = {};
  var totalQuizQuestions = 0;
  var correctAnswers = 0;
  var transcriptVisible = false;

  // ── DOM refs ──
  var audioEl = document.getElementById("hidden-audio");
  var apPlayer = document.getElementById("audio-player");
  var apPlayBtn = document.getElementById("ap-play");
  var apIconPlay = document.getElementById("ap-icon-play");
  var apIconPause = document.getElementById("ap-icon-pause");
  var apFill = document.getElementById("ap-fill");
  var apThumb = document.getElementById("ap-thumb");
  var apTime = document.getElementById("ap-time");
  var apTrackHit = document.getElementById("ap-track-hit");
  var autoplayCheck = document.getElementById("autoplay-check");
  var transcriptBtn = document.getElementById("transcript-btn");
  var transcriptPanel = document.getElementById("transcript-panel");
  var transcriptText = document.getElementById("transcript-text");

  // ── Audio player logic ──
  var audioSeeking = false;

  function formatTime(sec) {
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function updateAudioUI() {
    var dur = audioEl.duration || 0;
    var cur = audioEl.currentTime || 0;
    var pct = dur > 0 ? (cur / dur) * 100 : 0;
    apFill.style.width = pct + "%";
    apThumb.style.left = pct + "%";
    apTime.textContent = formatTime(cur) + " / " + formatTime(dur);
  }

  audioEl.addEventListener("timeupdate", function () {
    if (!audioSeeking) updateAudioUI();
  });

  audioEl.addEventListener("loadedmetadata", updateAudioUI);

  audioEl.addEventListener("play", function () {
    apIconPlay.style.display = "none";
    apIconPause.style.display = "";
  });

  audioEl.addEventListener("pause", function () {
    apIconPlay.style.display = "";
    apIconPause.style.display = "none";
  });

  audioEl.addEventListener("ended", function () {
    audioEl.currentTime = 0;
    apIconPlay.style.display = "";
    apIconPause.style.display = "none";
    updateAudioUI();
  });

  // Seek by clicking the track
  function seekFromX(clientX) {
    var rect = apTrackHit.getBoundingClientRect();
    var ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    audioEl.currentTime = ratio * (audioEl.duration || 0);
    updateAudioUI();
  }

  apTrackHit.addEventListener("mousedown", function (e) {
    audioSeeking = true;
    seekFromX(e.clientX);
    function onMove(ev) { seekFromX(ev.clientX); }
    function onUp() {
      audioSeeking = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });

  apTrackHit.addEventListener("touchstart", function (e) {
    e.preventDefault();
    audioSeeking = true;
    seekFromX(e.touches[0].clientX);
    function onMove(ev) { ev.preventDefault(); seekFromX(ev.touches[0].clientX); }
    function onEnd() {
      audioSeeking = false;
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    }
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
  });

  window.toggleAudio = function () {
    if (audioEl.paused) {
      audioEl.play().catch(function () {});
    } else {
      audioEl.pause();
    }
  };

  window.toggleTranscript = function () {
    transcriptVisible = !transcriptVisible;
    transcriptPanel.style.display = transcriptVisible ? "" : "none";
    transcriptBtn.classList.toggle("active", transcriptVisible);
  };

  function stopAudio() {
    audioEl.pause();
    audioEl.currentTime = 0;
    audioEl.removeAttribute("src");
    apIconPlay.style.display = "";
    apIconPause.style.display = "none";
    updateAudioUI();
  }

  function loadAudio(file) {
    stopAudio();
    audioEl.src = "assets/" + encodeURIComponent(file);
    audioEl.load();
    apPlayer.style.display = "";

    if (autoplayCheck.checked) {
      var onReady = function () {
        audioEl.removeEventListener("canplay", onReady);
        audioEl.play().catch(function () {});
      };
      audioEl.addEventListener("canplay", onReady);
    }
  }

  function hideAudio() {
    stopAudio();
    apPlayer.style.display = "none";
  }

  // ── Restore suspend data ──
  var suspendRaw = scorm.get("cmi.suspend_data");
  var savedState = null;
  try { if (suspendRaw) savedState = JSON.parse(suspendRaw); } catch (e) {}

  // ── Load course ──
  fetch("course.json")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      course = data;
      buildScreenList();

      // Show UI
      document.getElementById("player-header").style.display = "";
      document.getElementById("progress-track").style.display = "";
      document.getElementById("bottom-bar").style.display = "";
      document.getElementById("course-title").textContent = course.title;

      if (savedState && savedState.currentIndex) {
        currentIndex = Math.min(savedState.currentIndex, allScreens.length - 1);
      }
      if (savedState && savedState.quizScores) quizScores = savedState.quizScores;
      if (savedState && savedState.correctAnswers) correctAnswers = savedState.correctAnswers;

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

  // ── Render ──
  function renderCurrentScreen() {
    var container = document.getElementById("course-content");
    var item = allScreens[currentIndex];
    if (!item) return;

    var html = "";

    if (item.isModuleStart || currentIndex === 0) {
      html += '<div class="module-banner">' + escapeHtml(item.moduleTitle) + "</div>";
    }

    if (item.isQuiz) {
      html += renderQuiz(item);
      hideAudio();
      transcriptBtn.style.display = "none";
      transcriptPanel.style.display = "none";
    } else {
      html += renderScreen(item);
      // Audio
      var scr = item.screen;
      if (scr.audio && scr.audio.file) {
        loadAudio(scr.audio.file);
      } else {
        hideAudio();
      }
      // Transcript
      if (scr.narration) {
        transcriptBtn.style.display = "";
        transcriptText.textContent = '"' + scr.narration + '"';
        if (transcriptVisible) transcriptPanel.style.display = "";
      } else {
        transcriptBtn.style.display = "none";
        transcriptPanel.style.display = "none";
      }
    }

    container.innerHTML = html;

    if (scorm.get("cmi.core.lesson_status") === "not attempted") {
      scorm.set("cmi.core.lesson_status", "incomplete");
      scorm.save();
    }
  }

  function renderScreen(item) {
    var s = item.screen;
    var html = '<div class="slide">';
    html += '<h2 class="screen-title">' + escapeHtml(s.title) + "</h2>";

    if (s.image && s.image.file) {
      html += '<img class="screen-image" src="assets/' +
        encodeURIComponent(s.image.file) + '" alt="' +
        escapeHtml(s.image.alt || "") + '" />';
    }

    html += '<div class="story-text">' + escapeHtml(s.storyText) + "</div>";

    if (s.onScreenText) {
      html += '<div class="on-screen-text">' + escapeHtml(s.onScreenText) + "</div>";
    }

    // Narration fallback (no audio)
    if (!s.audio && s.narration) {
      html += '<div class="narration-fallback">';
      html += '<span class="narration-label">Narration</span>';
      html += '<p class="narration-text-fallback">"' + escapeHtml(s.narration) + '"</p>';
      html += "</div>";
    }

    // Reflection
    if (s.interaction && s.interaction.type === "reflection") {
      html += '<div class="interaction-box">';
      html += '<span class="interaction-badge">Reflection</span>';
      html += '<div class="interaction-prompt">' + escapeHtml(s.interaction.prompt) + "</div>";
      html += "</div>";
    }

    // Decision
    if (s.interaction && s.interaction.type === "decision") {
      var sid = s.id;
      html += '<div class="interaction-box" id="decision-' + sid + '">';
      html += '<span class="interaction-badge">Decision Point</span>';
      html += '<div class="interaction-prompt">' + escapeHtml(s.interaction.prompt) + "</div>";
      if (s.interaction.options && s.interaction.options.length > 0) {
        html += '<div class="decision-options">';
        for (var oi = 0; oi < s.interaction.options.length; oi++) {
          var opt = s.interaction.options[oi];
          html += '<button class="decision-btn" data-screen="' + sid +
            '" data-option="' + oi +
            '" data-recommended="' + (opt.isRecommended ? "1" : "0") +
            '" data-feedback="' + escapeHtml(opt.feedback) +
            '" onclick="handleDecision(this)">' +
            escapeHtml(opt.label) + "</button>";
        }
        html += "</div>";
      }
      html += '<div id="decision-feedback-' + sid + '"></div>';
      html += "</div>";
    }

    html += "</div>";
    return html;
  }

  function renderQuiz(item) {
    var html = '<div class="slide quiz-slide">';
    html += '<h2 class="quiz-title">Knowledge Check: ' + escapeHtml(item.moduleTitle) + "</h2>";

    for (var q = 0; q < item.quiz.length; q++) {
      var question = item.quiz[q];
      html += '<div class="quiz-question" id="quiz-q-' + q + '">';
      html += '<p class="question-text">' + (q + 1) + ". " + escapeHtml(question.question) + "</p>";
      html += '<div class="choices">';
      for (var c = 0; c < question.choices.length; c++) {
        html += '<button class="choice-btn" data-question="' + q +
          '" data-choice="' + c +
          '" data-correct="' + question.answerIndex +
          '" onclick="handleQuizChoice(this)">' +
          '<span class="choice-indicator">' + "ABCD"[c] + "</span>" +
          escapeHtml(question.choices[c]) +
          "</button>";
      }
      html += "</div></div>";
    }

    html += "</div>";
    return html;
  }

  // ── Quiz handler ──
  window.handleQuizChoice = function (btn) {
    var questionIdx = parseInt(btn.getAttribute("data-question"));
    var choiceIdx = parseInt(btn.getAttribute("data-choice"));
    var correctIdx = parseInt(btn.getAttribute("data-correct"));

    var questionDiv = document.getElementById("quiz-q-" + questionIdx);
    var buttons = questionDiv.querySelectorAll(".choice-btn");

    for (var i = 0; i < buttons.length; i++) {
      buttons[i].disabled = true;
      buttons[i].classList.add("revealed");
      if (parseInt(buttons[i].getAttribute("data-choice")) === correctIdx) {
        buttons[i].classList.add("correct");
        buttons[i].querySelector(".choice-indicator").innerHTML =
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
      }
    }

    if (choiceIdx !== correctIdx) {
      btn.classList.add("incorrect");
      btn.querySelector(".choice-indicator").innerHTML =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    } else {
      correctAnswers++;
    }

    if (totalQuizQuestions > 0) {
      var pct = Math.round((correctAnswers / totalQuizQuestions) * 100);
      scorm.set("cmi.core.score.raw", String(pct));
      scorm.set("cmi.core.score.min", "0");
      scorm.set("cmi.core.score.max", "100");
      scorm.save();
    }
  };

  // ── Decision handler ──
  window.handleDecision = function (btn) {
    var screenId = btn.getAttribute("data-screen");
    var isRecommended = btn.getAttribute("data-recommended") === "1";
    var feedback = btn.getAttribute("data-feedback");

    var container = document.getElementById("decision-" + screenId);
    var buttons = container.querySelectorAll(".decision-btn");

    for (var i = 0; i < buttons.length; i++) {
      buttons[i].disabled = true;
      if (buttons[i].getAttribute("data-recommended") === "1") {
        buttons[i].classList.add("recommended");
      } else if (buttons[i] !== btn) {
        buttons[i].classList.add("unchosen");
      }
    }
    btn.classList.add("chosen");
    if (!isRecommended) btn.classList.remove("unchosen");

    // Find recommended label
    var recLabel = "";
    for (var j = 0; j < buttons.length; j++) {
      if (buttons[j].getAttribute("data-recommended") === "1") {
        recLabel = buttons[j].textContent;
        break;
      }
    }

    var feedbackDiv = document.getElementById("decision-feedback-" + screenId);
    var html = '<div class="feedback-panel"><div class="feedback-text">' + escapeHtml(feedback) + "</div>";
    if (!isRecommended) {
      html += '<div class="feedback-hint">The recommended choice was: <strong>' + escapeHtml(recLabel) + "</strong></div>";
    }
    html += "</div>";
    feedbackDiv.innerHTML = html;
  };

  // ── Navigation ──
  window.prevScreen = function () {
    if (currentIndex > 0) {
      stopAudio();
      currentIndex--;
      renderCurrentScreen();
      updateNav();
      saveProgress();
    }
  };

  window.nextScreen = function () {
    if (currentIndex < allScreens.length - 1) {
      stopAudio();
      currentIndex++;
      renderCurrentScreen();
      updateNav();
      saveProgress();
    } else {
      scorm.set("cmi.core.lesson_status", "completed");
      scorm.save();
      showCompletion();
    }
  };

  function updateNav() {
    var prevBtn = document.getElementById("btn-prev");
    var nextBtn = document.getElementById("btn-next");
    var progressFill = document.getElementById("progress-fill");
    var playerMeta = document.getElementById("player-meta");

    prevBtn.disabled = currentIndex === 0;

    var isLast = currentIndex === allScreens.length - 1;
    nextBtn.innerHTML = isLast
      ? 'Complete <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>'
      : 'Next <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
    nextBtn.className = "nav-btn " + (isLast ? "btn-finish" : "btn-next");

    var pct = ((currentIndex + 1) / allScreens.length) * 100;
    playerMeta.textContent = (currentIndex + 1) + " / " + allScreens.length;
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
      scoreText = "<p>Quiz Score: " + correctAnswers + "/" + totalQuizQuestions + " (" + pct + "%)</p>";
    }
    container.innerHTML =
      '<div class="completion-message"><h2>Course Complete!</h2>' +
      scoreText +
      "<p>You have completed this training course.</p></div>";
    hideAudio();
    transcriptBtn.style.display = "none";
    transcriptPanel.style.display = "none";
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  window.addEventListener("beforeunload", function () {
    saveProgress();
    scorm.finish();
  });
})();
