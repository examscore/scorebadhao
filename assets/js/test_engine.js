/**
 * SCOREBADHAO PHASE 2.1 — MCQ Test Engine Upgrade
 * Features:
 * - Exam-style palette
 * - Instant local answer save
 * - Mark review / unmark review
 * - Bookmark support
 * - Sticky timer + auto submit
 * - Submit confirmation modal
 * - Result page upgrade
 * - Explanation review
 */

const TestEngine = (() => {
  let questions = [];
  let current = 0;
  let answers = {};
  let reviewMarks = {};
  let test = null;
  let context = {};
  let timerId = null;
  let remainingSeconds = 0;
  let totalSeconds = 0;
  let submitted = false;
  let lastResult = null;

  async function start(selectedTest, selectedContext = {}) {
    try {
      submitted = false;
      test = selectedTest;
      context = selectedContext || {};
      questions = [];
      current = 0;
      answers = {};
      reviewMarks = {};
      lastResult = null;

      Toast.loading("Loading test questions...");
      const data = await ScoreAPI.call("getQuestionsForTest", { Test_ID: test.Test_ID });
      questions = (data.questions || []).map(normalizeQuestion);

      if (!questions.length) {
        Toast.warning("No questions found for this test");
        return;
      }

      document.getElementById("testTitle").textContent = test.Test_Name || "ScoreBadhao Test";
      document.getElementById("testMeta").textContent = `${questions.length} Questions • ${test.Duration || test.Duration_Minutes || 15} Minutes`;

      Router.show("testView");
      buildPalette();
      renderQuestion();
      startTimer(Number(test.Duration || test.Duration_Minutes || 15) * 60);
      updateMiniStats();

      Toast.success("Test started");
    } catch (err) {
      Toast.error(err.message);
    }
  }

  function normalizeQuestion(q) {
    return {
      ...q,
      Question_ID: q.Question_ID,
      Question: q.Question || q.Question_Text || "",
      A: q.A || q.Option_A || "",
      B: q.B || q.Option_B || "",
      C: q.C || q.Option_C || "",
      D: q.D || q.Option_D || "",
      Answer: String(q.Answer || q.Correct_Answer || "").trim().toUpperCase(),
      Explanation: q.Explanation || ""
    };
  }

  function startTimer(seconds) {
    clearInterval(timerId);
    totalSeconds = seconds;
    remainingSeconds = seconds;
    updateTimer();

    timerId = setInterval(() => {
      if (submitted) {
        clearInterval(timerId);
        return;
      }

      remainingSeconds--;
      updateTimer();

      if (remainingSeconds <= 0) {
        clearInterval(timerId);
        Toast.warning("Time over. Submitting test.");
        submitFinal();
      }
    }, 1000);
  }

  function updateTimer() {
    const safe = Math.max(0, remainingSeconds);
    const min = String(Math.floor(safe / 60)).padStart(2, "0");
    const sec = String(safe % 60).padStart(2, "0");
    const box = document.getElementById("timerBox");
    if (box) box.textContent = `${min}:${sec}`;
  }

  function renderQuestion() {
    const q = questions[current];
    const box = document.getElementById("questionBox");
    if (!q || !box) return;

    const selected = answers[q.Question_ID];

    box.innerHTML = `
      <span class="question-no-pill">Question ${current + 1} of ${questions.length}</span>
      <h3>${escapeHtml(q.Question)}</h3>
      ${["A","B","C","D"].map(opt => `
        <label class="option ${selected === opt ? "selected" : ""}">
          <input type="radio" name="answer" value="${opt}" ${selected === opt ? "checked" : ""} />
          <strong>${opt}.</strong> ${escapeHtml(q[opt] || "")}
        </label>
      `).join("")}
    `;

    box.querySelectorAll("input[name='answer']").forEach(input => {
      input.addEventListener("change", () => {
        answers[q.Question_ID] = input.value;
        buildPalette();
        updateMiniStats();
        renderQuestion();
        Toast.success("Answer saved");
      });
    });

    const reviewBtn = document.getElementById("btnReview");
    if (reviewBtn) {
      reviewBtn.textContent = reviewMarks[q.Question_ID] ? "Unmark Review" : "Mark Review";
    }

    buildPalette();
    updateMiniStats();
  }

  function buildPalette() {
    const pal = document.getElementById("questionPalette");
    if (!pal) return;
    pal.innerHTML = "";

    questions.forEach((q, i) => {
      const btn = document.createElement("button");
      const isCurrent = i === current;
      const isAnswered = !!answers[q.Question_ID];
      const isReview = !!reviewMarks[q.Question_ID];

      btn.textContent = i + 1;
      btn.className = [
        isCurrent ? "current active" : "",
        isAnswered ? "answered" : "",
        isReview ? "review" : ""
      ].join(" ").trim();

      btn.title = isAnswered ? "Answered" : "Not answered";
      if (isReview) btn.title += " • Marked review";

      btn.addEventListener("click", () => {
        current = i;
        renderQuestion();
      });

      pal.appendChild(btn);
    });
  }

  function updateMiniStats() {
    const summary = getSummary();
    const answered = document.getElementById("miniAnswered");
    const review = document.getElementById("miniReview");

    if (answered) answered.textContent = `Answered: ${summary.answered}`;
    if (review) review.textContent = `Review: ${summary.review}`;
  }

  function getSummary() {
    const total = questions.length;
    const answered = questions.filter(q => !!answers[q.Question_ID]).length;
    const review = questions.filter(q => !!reviewMarks[q.Question_ID]).length;
    const skipped = total - answered;

    return { total, answered, skipped, review };
  }

  function next() {
    if (current < questions.length - 1) {
      current++;
      renderQuestion();
    } else {
      Toast.info("This is the last question");
    }
  }

  function prev() {
    if (current > 0) {
      current--;
      renderQuestion();
    } else {
      Toast.info("This is the first question");
    }
  }

  function toggleReview() {
    const q = questions[current];
    if (!q) return;

    reviewMarks[q.Question_ID] = !reviewMarks[q.Question_ID];

    if (reviewMarks[q.Question_ID]) Toast.info("Marked for review");
    else Toast.info("Review mark removed");

    buildPalette();
    updateMiniStats();
    renderQuestion();
  }

  async function bookmark() {
    const student = Auth.getStudent && Auth.getStudent();
    const q = questions[current];

    if (!student) {
      Toast.warning("Login required for bookmark");
      return;
    }

    try {
      await ScoreAPI.call("saveBookmark", {
        Student_ID: student.Student_ID,
        Question_ID: q.Question_ID,
        Subject_ID: q.Subject_ID || "",
        Topic_ID: q.Topic_ID || "",
        Note: "Bookmarked during test"
      });
      Toast.success("Bookmark saved");
    } catch (err) {
      Toast.error(err.message);
    }
  }

  function openSubmitModal() {
    if (!questions.length) return;

    const modal = document.getElementById("submitModal");
    const box = document.getElementById("submitSummary");
    if (!modal || !box) {
      submitFinal();
      return;
    }

    const summary = getSummary();

    box.innerHTML = `
      <div class="summary-tile"><span>Total</span><strong>${summary.total}</strong></div>
      <div class="summary-tile"><span>Answered</span><strong>${summary.answered}</strong></div>
      <div class="summary-tile"><span>Skipped</span><strong>${summary.skipped}</strong></div>
      <div class="summary-tile"><span>Marked Review</span><strong>${summary.review}</strong></div>
    `;

    modal.hidden = false;
  }

  function closeSubmitModal() {
    const modal = document.getElementById("submitModal");
    if (modal) modal.hidden = true;
  }

  async function submitFinal() {
    if (submitted) return;
    submitted = true;
    closeSubmitModal();
    clearInterval(timerId);

    try {
      const student = Auth.getStudent && Auth.getStudent();

      let correct = 0;
      let wrong = 0;
      let skipped = 0;

      questions.forEach(q => {
        const selected = answers[q.Question_ID];
        if (!selected) skipped++;
        else if (selected === q.Answer) correct++;
        else wrong++;
      });

      const total = questions.length;
      const attempted = total - skipped;
      const score = correct;
      const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;
      const timeTaken = Math.max(0, totalSeconds - remainingSeconds);

      lastResult = {
        total,
        attempted,
        correct,
        wrong,
        skipped,
        score,
        accuracy,
        timeTaken
      };

      if (student) {
        await ScoreAPI.call("submitTestResult", {
          Student_ID: student.Student_ID,
          Test_ID: test.Test_ID,
          Exam_ID: context.exam?.Exam_ID || "",
          Subject_ID: context.subject?.Subject_ID || "",
          Total_Questions: total,
          Attempted: attempted,
          Correct: correct,
          Wrong: wrong,
          Skipped: skipped,
          Score: score,
          Accuracy: accuracy,
          Time_Taken_Seconds: timeTaken
        });
      } else {
        Toast.warning("Result shown locally. Login to save result.");
      }

      renderResult();
      renderExplanationReview();
      Router.show("resultView");
      Toast.success("Test submitted");
    } catch (err) {
      submitted = false;
      Toast.error(err.message);
    }
  }

  function renderResult() {
    const box = document.getElementById("resultBox");
    if (!box || !lastResult) return;

    box.innerHTML = `
      <div class="result-grid">
        <div class="result-tile"><span>Total</span><strong>${lastResult.total}</strong></div>
        <div class="result-tile"><span>Score</span><strong>${lastResult.score}</strong></div>
        <div class="result-tile"><span>Accuracy</span><strong>${lastResult.accuracy}%</strong></div>
        <div class="result-tile"><span>Correct</span><strong>${lastResult.correct}</strong></div>
        <div class="result-tile"><span>Wrong</span><strong>${lastResult.wrong}</strong></div>
        <div class="result-tile"><span>Skipped</span><strong>${lastResult.skipped}</strong></div>
      </div>
      <p class="muted">Time Taken: ${formatSeconds(lastResult.timeTaken)}</p>
      <button class="btn secondary" id="btnReviewAnswers">Review Explanations</button>
    `;

    document.getElementById("btnReviewAnswers")?.addEventListener("click", () => {
      Router.show("reviewView");
    });
  }

  function renderExplanationReview() {
    const box = document.getElementById("reviewBox");
    if (!box) return;

    box.innerHTML = questions.map((q, i) => {
      const selected = answers[q.Question_ID] || "";
      const isSkipped = !selected;
      const isCorrect = selected && selected === q.Answer;
      const status = isSkipped ? "skipped" : isCorrect ? "correct" : "wrong";

      return `
        <div class="review-card ${status}">
          <span class="question-no-pill">Question ${i + 1}</span>
          <h3>${escapeHtml(q.Question)}</h3>
          ${["A","B","C","D"].map(opt => {
            const cls = [
              "option",
              opt === q.Answer ? "correct-review" : "",
              selected === opt && selected !== q.Answer ? "wrong-review" : ""
            ].join(" ");
            return `<div class="${cls}"><strong>${opt}.</strong> ${escapeHtml(q[opt] || "")}</div>`;
          }).join("")}
          <div class="explanation-box">
            <p><strong>Your Answer:</strong> ${selected || "Skipped"}</p>
            <p><strong>Correct Answer:</strong> ${q.Answer}</p>
            <p><strong>Explanation:</strong> ${escapeHtml(q.Explanation || "Explanation not available.")}</p>
          </div>
        </div>
      `;
    }).join("");
  }

  function formatSeconds(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}m ${sec}s`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btnNext")?.addEventListener("click", next);
    document.getElementById("btnPrev")?.addEventListener("click", prev);
    document.getElementById("btnBookmark")?.addEventListener("click", bookmark);
    document.getElementById("btnReview")?.addEventListener("click", toggleReview);
    document.getElementById("btnSubmitTest")?.addEventListener("click", openSubmitModal);
    document.getElementById("btnCancelSubmit")?.addEventListener("click", closeSubmitModal);
    document.getElementById("btnConfirmSubmit")?.addEventListener("click", submitFinal);
  });

  return { start };
})();
        
