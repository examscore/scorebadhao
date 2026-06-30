/** MCQ Test Engine — loads active test questions only. */
const TestEngine = (() => {
  let questions = [], current = 0, answers = {}, test = null, context = {}, timerId = null, remainingSeconds = 0;

  async function start(selectedTest, selectedContext = {}) {
    try {
      test = selectedTest; context = selectedContext; current = 0; answers = {};
      Toast.loading("Loading test questions...");
      const data = await ScoreAPI.call("getQuestionsForTest", { Test_ID: test.Test_ID });
      questions = data.questions || [];
      if (!questions.length) return Toast.warning("No questions found for this test");
      document.getElementById("testTitle").textContent = test.Test_Name || "ScoreBadhao Test";
      document.getElementById("testMeta").textContent = `${questions.length} Questions`;
      Router.show("testView"); buildPalette(); renderQuestion();
      startTimer(Number(test.Duration_Minutes || test.Duration || 15) * 60);
      Toast.success("Test started");
    } catch (err) { Toast.error(err.message); }
  }

  function startTimer(seconds) {
    clearInterval(timerId); remainingSeconds = seconds; updateTimer();
    timerId = setInterval(() => { remainingSeconds--; updateTimer(); if (remainingSeconds <= 0) { clearInterval(timerId); Toast.warning("Time over. Submitting test."); submit(); } }, 1000);
  }

  function updateTimer() {
    const min = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
    const sec = String(remainingSeconds % 60).padStart(2, "0");
    document.getElementById("timerBox").textContent = `${min}:${sec}`;
  }

  function answerOf(q) { return q.Correct_Answer || q.Answer || ""; }
  function textOf(q) { return q.Question_Text || q.Question || ""; }
  function optionOf(q, opt) { return q[`Option_${opt}`] || q[opt] || ""; }

  function renderQuestion() {
    const q = questions[current];
    const selected = answers[q.Question_ID];
    document.getElementById("questionBox").innerHTML = `
      <p class="muted">Question ${current + 1} of ${questions.length}</p>
      <h3>${textOf(q)}</h3>
      ${["A","B","C","D"].map(opt => `
        <label class="option ${selected === opt ? "selected" : ""}">
          <input type="radio" name="answer" value="${opt}" ${selected === opt ? "checked" : ""} />
          <strong>${opt}.</strong> ${optionOf(q, opt)}
        </label>
      `).join("")}
    `;
    document.querySelectorAll("input[name='answer']").forEach(input => input.addEventListener("change", () => {
      answers[q.Question_ID] = input.value; buildPalette(); renderQuestion(); Toast.success("Answer saved");
    }));
    buildPalette();
  }

  function buildPalette() {
    const pal = document.getElementById("questionPalette"); if (!pal) return;
    pal.innerHTML = "";
    questions.forEach((q, i) => {
      const btn = document.createElement("button");
      btn.textContent = i + 1;
      btn.className = [i === current ? "active" : "", answers[q.Question_ID] ? "answered" : ""].join(" ");
      btn.addEventListener("click", () => { current = i; renderQuestion(); });
      pal.appendChild(btn);
    });
  }

  function next() { if (current < questions.length - 1) { current++; renderQuestion(); } }
  function prev() { if (current > 0) { current--; renderQuestion(); } }

  function bookmark() {
    const student = Auth.getStudent(); const q = questions[current];
    if (!student) return Toast.warning("Login required for bookmark");
    ScoreAPI.call("saveBookmark", { Student_ID: student.Student_ID, Question_ID: q.Question_ID })
      .then(() => Toast.success("Bookmark saved")).catch(err => Toast.error(err.message));
  }

  function markReview() { Toast.info("Marked for review"); }

  async function submit() {
    try {
      clearInterval(timerId);
      const student = Auth.getStudent();
      let correct = 0, wrong = 0, skipped = 0;
      questions.forEach(q => {
        const selected = answers[q.Question_ID];
        if (!selected) skipped++;
        else if (String(selected).toUpperCase() === String(answerOf(q)).toUpperCase()) correct++;
        else wrong++;
      });
      const attempted = correct + wrong;
      const score = correct;
      const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;
      if (student) await ScoreAPI.call("submitTestResult", {
        Student_ID: student.Student_ID,
        Test_ID: test.Test_ID,
        Exam_ID: context.exam?.Exam_ID || test.Exam_ID || "",
        Subject_ID: context.subject?.Subject_ID || test.Subject_ID || "",
        Total_Questions: questions.length,
        Attempted: attempted,
        Correct: correct,
        Wrong: wrong,
        Skipped: skipped,
        Score: score,
        Accuracy: accuracy,
        Time_Taken_Seconds: Number(test.Duration_Minutes || test.Duration || 15) * 60 - remainingSeconds
      });
      document.getElementById("resultBox").innerHTML = `
        <div class="grid two">
          <div class="card"><h3>Score</h3><p>${score}/${questions.length}</p></div>
          <div class="card"><h3>Accuracy</h3><p>${accuracy}%</p></div>
          <div class="card"><h3>Correct</h3><p>${correct}</p></div>
          <div class="card"><h3>Wrong / Skipped</h3><p>${wrong} / ${skipped}</p></div>
        </div>`;
      Router.show("resultView"); Toast.success("Test submitted");
    } catch (err) { Toast.error(err.message); }
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btnNext")?.addEventListener("click", next);
    document.getElementById("btnPrev")?.addEventListener("click", prev);
    document.getElementById("btnBookmark")?.addEventListener("click", bookmark);
    document.getElementById("btnReview")?.addEventListener("click", markReview);
    document.getElementById("btnSubmitTest")?.addEventListener("click", submit);
  });
  return { start };
})();
