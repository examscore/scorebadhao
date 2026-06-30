/** Dynamic student flow: Board → Exam → Subject → Topic → Test. */
const Student = (() => {
  const state = { board: null, exam: null, subject: null, topic: null };

  function item(label, onClick) {
    const div = document.createElement("div");
    div.className = "list-item";
    div.textContent = label;
    div.addEventListener("click", onClick);
    return div;
  }

  function setBox(id, className, text) {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = className;
    el.textContent = text;
  }

  function clearBelow(level) {
    const map = {
      board: [["examList","list muted","Select board first"],["subjectList","list muted","Select exam first"],["topicList","list muted","Select subject first"],["testList","test-list muted","Select topic to load tests"]],
      exam: [["subjectList","list muted","Select exam first"],["topicList","list muted","Select subject first"],["testList","test-list muted","Select topic to load tests"]],
      subject: [["topicList","list muted","Select subject first"],["testList","test-list muted","Select topic to load tests"]],
      topic: [["testList","test-list muted","Select topic to load tests"]]
    };
    (map[level] || []).forEach(x => setBox(...x));
  }

  async function loadBoards() {
    const box = document.getElementById("boardList");
    if (!box) return;
    box.className = "list skeleton-box";
    box.textContent = "Loading boards...";
    try {
      const data = await ScoreAPI.call("getBoards", {}, { cache: true });
      box.className = "list";
      box.innerHTML = "";
      data.boards.forEach(b => box.appendChild(item(b.Board_Name || b.Board_Code || b.Board_ID, () => {
        state.board = b; clearBelow("board"); loadExams(b.Board_ID);
      })));
      if (!data.boards.length) box.textContent = "No boards found";
    } catch (err) { box.className = "list"; box.textContent = "Unable to load boards"; Toast.error(err.message); }
  }

  async function loadExams(Board_ID) {
    const box = document.getElementById("examList");
    box.className = "list skeleton-box"; box.textContent = "Loading exams...";
    try {
      const data = await ScoreAPI.call("getExams", { Board_ID }, { cache: true });
      box.className = "list"; box.innerHTML = "";
      data.exams.forEach(ex => box.appendChild(item(ex.Exam_Name || ex.Exam_Code || ex.Exam_ID, () => {
        state.exam = ex; clearBelow("exam"); loadSubjects(ex.Exam_ID);
      })));
      if (!data.exams.length) box.textContent = "No exams found";
    } catch (err) { Toast.error(err.message); }
  }

  async function loadSubjects(Exam_ID) {
    const box = document.getElementById("subjectList");
    box.className = "list skeleton-box"; box.textContent = "Loading subjects...";
    try {
      const data = await ScoreAPI.call("getSubjects", { Exam_ID }, { cache: true });
      box.className = "list"; box.innerHTML = "";
      data.subjects.forEach(s => box.appendChild(item(s.Subject_Name || s.Subject_Code || s.Subject_ID, () => {
        state.subject = s; clearBelow("subject"); loadTopics(s.Subject_ID);
      })));
      if (!data.subjects.length) box.textContent = "No subjects found";
    } catch (err) { Toast.error(err.message); }
  }

  async function loadTopics(Subject_ID) {
    const box = document.getElementById("topicList");
    box.className = "list skeleton-box"; box.textContent = "Loading topics...";
    try {
      const data = await ScoreAPI.call("getTopics", { Subject_ID }, { cache: true });
      box.className = "list"; box.innerHTML = "";
      data.topics.forEach(t => box.appendChild(item(t.Topic_Name || t.Topic_Code || t.Topic_ID, () => {
        state.topic = t; clearBelow("topic"); loadTests(t.Topic_ID);
      })));
      if (!data.topics.length) box.textContent = "No topics found";
    } catch (err) { Toast.error(err.message); }
  }

  async function loadTests(Topic_ID) {
    const box = document.getElementById("testList");
    box.className = "test-list skeleton-box"; box.textContent = "Loading tests...";
    try {
      const data = await ScoreAPI.call("getTests", { Topic_ID }, { cache: true });
      box.className = "test-list"; box.innerHTML = "";
      data.tests.forEach(t => {
        const div = document.createElement("div");
        div.className = "test-item";
        div.innerHTML = `<strong>${t.Test_Name || t.Test_ID}</strong><br><span class="muted">${t.Duration_Minutes || t.Duration || 15} min</span>`;
        div.addEventListener("click", () => TestEngine.start(t, state));
        box.appendChild(div);
      });
      if (!data.tests.length) box.textContent = "No tests found";
    } catch (err) { Toast.error(err.message); }
  }

  document.addEventListener("DOMContentLoaded", loadBoards);
  return { loadBoards };
})();
