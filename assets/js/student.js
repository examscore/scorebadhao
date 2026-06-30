/**
 * Dynamic student exam flow:
 * Board → Exam → Subject → Topic → Test → Questions
 */

const Student = (() => {
  const state = {
    board: null,
    exam: null,
    subject: null,
    topic: null
  };

  function item(label, onClick) {
    const div = document.createElement("div");
    div.className = "list-item";
    div.textContent = label;
    div.addEventListener("click", onClick);
    return div;
  }

  function clearBelow(level) {
    const map = {
      board: ["examList", "subjectList", "topicList", "testList"],
      exam: ["subjectList", "topicList", "testList"],
      subject: ["topicList", "testList"],
      topic: ["testList"]
    };
    (map[level] || []).forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.className = id === "testList" ? "test-list muted" : "list muted";
        el.textContent = level === "topic" ? "Select topic to load tests" : "Select previous option first";
      }
    });
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
      data.boards.forEach(b => {
        box.appendChild(item(b.Board_Name || b.Name || b.Code || "Board", () => {
          state.board = b;
          clearBelow("board");
          loadExams(b.Board_ID);
        }));
      });
      if (!data.boards.length) box.textContent = "No boards found";
    } catch (err) {
      box.className = "list";
      box.textContent = "Unable to load boards";
      Toast.error(err.message);
    }
  }

  async function loadExams(Board_ID) {
    const box = document.getElementById("examList");
    box.className = "list skeleton-box";
    box.textContent = "Loading exams...";
    try {
      const data = await ScoreAPI.call("getExams", { Board_ID }, { cache: true });
      box.className = "list";
      box.innerHTML = "";
      data.exams.forEach(ex => {
        box.appendChild(item(ex.Exam_Name || ex.Name || ex.Code || "Exam", () => {
          state.exam = ex;
          clearBelow("exam");
          loadSubjects(ex.Exam_ID);
        }));
      });
      if (!data.exams.length) box.textContent = "No exams found";
    } catch (err) {
      Toast.error(err.message);
    }
  }

  async function loadSubjects(Exam_ID) {
    const box = document.getElementById("subjectList");
    box.className = "list skeleton-box";
    box.textContent = "Loading subjects...";
    try {
      const data = await ScoreAPI.call("getSubjects", { Exam_ID }, { cache: true });
      box.className = "list";
      box.innerHTML = "";
      data.subjects.forEach(s => {
        box.appendChild(item(s.Subject_Name || s.Name || s.Code || "Subject", () => {
          state.subject = s;
          clearBelow("subject");
          loadTopics(s.Subject_ID);
        }));
      });
      if (!data.subjects.length) box.textContent = "No subjects found";
    } catch (err) {
      Toast.error(err.message);
    }
  }

  async function loadTopics(Subject_ID) {
    const box = document.getElementById("topicList");
    box.className = "list skeleton-box";
    box.textContent = "Loading topics...";
    try {
      const data = await ScoreAPI.call("getTopics", { Subject_ID }, { cache: true });
      box.className = "list";
      box.innerHTML = "";
      data.topics.forEach(t => {
        box.appendChild(item(t.Topic_Name || t.Name || t.Code || "Topic", () => {
          state.topic = t;
          clearBelow("topic");
          loadTests(t.Topic_ID);
        }));
      });
      if (!data.topics.length) box.textContent = "No topics found";
    } catch (err) {
      Toast.error(err.message);
    }
  }

  async function loadTests(Topic_ID) {
    const box = document.getElementById("testList");
    box.className = "test-list skeleton-box";
    box.textContent = "Loading tests...";
    try {
      const data = await ScoreAPI.call("getTests", { Topic_ID }, { cache: true });
      box.className = "test-list";
      box.innerHTML = "";
      data.tests.forEach(t => {
        const div = document.createElement("div");
        div.className = "test-item";
        div.innerHTML = `<strong>${t.Test_Name || t.Name || "Test"}</strong><br><span class="muted">${t.Duration || 15} min</span>`;
        div.addEventListener("click", () => TestEngine.start(t, state));
        box.appendChild(div);
      });
      if (!data.tests.length) box.textContent = "No tests found";
    } catch (err) {
      Toast.error(err.message);
    }
  }

  document.addEventListener("DOMContentLoaded", loadBoards);

  return { loadBoards };
})();
