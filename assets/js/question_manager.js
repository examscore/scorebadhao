/**
 * SCOREBADHAO PHASE 2.2 — Admin Question Manager
 */
const QuestionManager = (() => {
  let initialized = false;

  async function init() {
    if (initialized) return;
    initialized = true;
    bindEvents();
    await loadBoardsForBothPanels();
  }

  function bindEvents() {
    byId("adminBoardSelect")?.addEventListener("change", () => loadExams("admin"));
    byId("adminExamSelect")?.addEventListener("change", () => loadSubjects("admin"));
    byId("adminSubjectSelect")?.addEventListener("change", () => loadTopics("admin"));

    byId("draftBoardSelect")?.addEventListener("change", () => loadExams("draft"));
    byId("draftExamSelect")?.addEventListener("change", () => loadSubjects("draft"));
    byId("draftSubjectSelect")?.addEventListener("change", () => loadTopics("draft"));

    byId("btnSaveQuestion")?.addEventListener("click", saveQuestion);
    byId("btnSaveDrafts")?.addEventListener("click", saveDrafts);
    byId("btnLoadDrafts")?.addEventListener("click", loadDrafts);
  }

  async function loadBoardsForBothPanels() {
    try {
      Toast.loading("Loading admin master data...");
      const data = await ScoreAPI.call("getBoards", {}, { cache: true });
      const boards = data.boards || [];
      fillSelect("adminBoardSelect", boards, "Board_ID", "Board_Name", "Select Board");
      fillSelect("draftBoardSelect", boards, "Board_ID", "Board_Name", "Select Board");
      await loadExams("admin");
      await loadExams("draft");
      Toast.success("Admin data loaded");
    } catch (err) { Toast.error(err.message); }
  }

  async function loadExams(prefix) {
    const boardId = value(prefix + "BoardSelect");
    fillSelect(prefix + "ExamSelect", [], "Exam_ID", "Exam_Name", "Select Exam");
    fillSelect(prefix + "SubjectSelect", [], "Subject_ID", "Subject_Name", "Select Subject");
    fillSelect(prefix + "TopicSelect", [], "Topic_ID", "Topic_Name", "Select Topic");
    if (!boardId) return;
    try {
      const data = await ScoreAPI.call("getExams", { Board_ID: boardId }, { cache: true });
      fillSelect(prefix + "ExamSelect", data.exams || [], "Exam_ID", "Exam_Name", "Select Exam");
      await loadSubjects(prefix);
    } catch (err) { Toast.error(err.message); }
  }

  async function loadSubjects(prefix) {
    const examId = value(prefix + "ExamSelect");
    fillSelect(prefix + "SubjectSelect", [], "Subject_ID", "Subject_Name", "Select Subject");
    fillSelect(prefix + "TopicSelect", [], "Topic_ID", "Topic_Name", "Select Topic");
    if (!examId) return;
    try {
      const data = await ScoreAPI.call("getSubjects", { Exam_ID: examId }, { cache: true });
      fillSelect(prefix + "SubjectSelect", data.subjects || [], "Subject_ID", "Subject_Name", "Select Subject");
      await loadTopics(prefix);
    } catch (err) { Toast.error(err.message); }
  }

  async function loadTopics(prefix) {
    const subjectId = value(prefix + "SubjectSelect");
    fillSelect(prefix + "TopicSelect", [], "Topic_ID", "Topic_Name", "Select Topic");
    if (!subjectId) return;
    try {
      const data = await ScoreAPI.call("getTopics", { Subject_ID: subjectId }, { cache: true });
      fillSelect(prefix + "TopicSelect", data.topics || [], "Topic_ID", "Topic_Name", "Select Topic");
    } catch (err) { Toast.error(err.message); }
  }

  async function saveQuestion() {
    try {
      const payload = {
        Board_ID: value("adminBoardSelect"),
        Subject_ID: value("adminSubjectSelect"),
        Topic_ID: value("adminTopicSelect"),
        Difficulty: value("qLevel"),
        Language: value("qLanguage"),
        Question_Text: byId("qText").value.trim(),
        Option_A: byId("qA").value.trim(),
        Option_B: byId("qB").value.trim(),
        Option_C: byId("qC").value.trim(),
        Option_D: byId("qD").value.trim(),
        Correct_Answer: value("qAnswer"),
        Explanation: byId("qExplanation").value.trim(),
        Created_By: AdminApp.getAdmin()?.Admin_ID || "ADMIN"
      };

      if (!payload.Board_ID || !payload.Subject_ID || !payload.Topic_ID) {
        Toast.warning("Please select Board, Subject and Topic");
        return;
      }
      if (!payload.Question_Text || !payload.Option_A || !payload.Option_B || !payload.Option_C || !payload.Option_D) {
        Toast.warning("Please fill question and all four options");
        return;
      }

      Toast.loading("Saving question...");
      const data = await ScoreAPI.call("adminAddQuestion", payload);
      byId("questionSaveStatus").textContent = JSON.stringify(data.question, null, 2);
      Toast.success("Question saved: " + data.question.Question_ID);
      clearManualQuestionFields();
    } catch (err) { Toast.error(err.message); }
  }

  async function saveDrafts() {
    try {
      const raw = byId("draftJson").value.trim();
      if (!raw) { Toast.warning("Paste JSON questions first"); return; }
      const questions = JSON.parse(raw);
      if (!Array.isArray(questions)) throw new Error("JSON must be an array");

      const data = await ScoreAPI.call("adminBulkDraftQuestions", {
        Method: "admin_bulk_json",
        Source: "Admin pasted JSON",
        Admin_ID: AdminApp.getAdmin()?.Admin_ID || "",
        Board_ID: value("draftBoardSelect"),
        Exam_ID: value("draftExamSelect"),
        Subject_ID: value("draftSubjectSelect"),
        Topic_ID: value("draftTopicSelect"),
        questions
      });
      Toast.success(`${data.count} draft questions saved`);
      byId("draftJson").value = "";
      await loadDrafts();
    } catch (err) { Toast.error(err.message); }
  }

  async function loadDrafts() {
    try {
      Toast.loading("Loading drafts...");
      const data = await ScoreAPI.call("adminGetDraftQuestions", { Review_Status: "pending" });
      const box = byId("draftList");
      box.innerHTML = "";
      const drafts = data.drafts || [];

      drafts.forEach(d => {
        const card = document.createElement("div");
        card.className = "draft-card";
        card.innerHTML = `
          <div>
            <strong>${escapeHtml(d.Question || d.Question_Text || "Draft Question")}</strong>
            <p class="muted">Draft ID: ${escapeHtml(d.Draft_ID || "")}</p>
            <p><b>A.</b> ${escapeHtml(d.A || d.Option_A || "")}</p>
            <p><b>B.</b> ${escapeHtml(d.B || d.Option_B || "")}</p>
            <p><b>C.</b> ${escapeHtml(d.C || d.Option_C || "")}</p>
            <p><b>D.</b> ${escapeHtml(d.D || d.Option_D || "")}</p>
            <p><b>Answer:</b> ${escapeHtml(d.Answer || d.Correct_Answer || "")}</p>
          </div>
          <button class="btn primary" data-publish-draft="${escapeAttr(d.Draft_ID || "")}">Publish</button>
        `;
        box.appendChild(card);
      });

      if (!drafts.length) box.innerHTML = `<p class="muted">No pending drafts</p>`;
      box.querySelectorAll("[data-publish-draft]").forEach(btn => {
        btn.addEventListener("click", () => publishDraft(btn.dataset.publishDraft));
      });
      Toast.success("Drafts loaded");
    } catch (err) { Toast.error(err.message); }
  }

  async function publishDraft(Draft_ID) {
    try {
      Toast.loading("Publishing draft...");
      const data = await ScoreAPI.call("adminPublishDraftQuestion", {
        Draft_ID,
        Admin_ID: AdminApp.getAdmin()?.Admin_ID || ""
      });
      Toast.success("Draft published: " + data.Question_ID);
      await loadDrafts();
    } catch (err) { Toast.error(err.message); }
  }

  function clearManualQuestionFields() {
    ["qText", "qA", "qB", "qC", "qD", "qExplanation"].forEach(id => { const el = byId(id); if (el) el.value = ""; });
    if (byId("qAnswer")) byId("qAnswer").value = "A";
    if (byId("qLevel")) byId("qLevel").value = "E";
  }

  function fillSelect(id, rows, valueKey, labelKey, placeholder) {
    const el = byId(id);
    if (!el) return;
    el.innerHTML = "";
    const first = document.createElement("option");
    first.value = "";
    first.textContent = placeholder;
    el.appendChild(first);
    rows.forEach(row => {
      const option = document.createElement("option");
      option.value = row[valueKey] || "";
      option.textContent = row[labelKey] || row.Name || row.Code || row[valueKey] || "Item";
      el.appendChild(option);
    });
    if (rows.length === 1) {
      el.value = rows[0][valueKey] || "";
      setTimeout(() => el.dispatchEvent(new Event("change")), 0);
    }
  }

  function byId(id) { return document.getElementById(id); }
  function value(id) { return byId(id)?.value || ""; }
  function escapeHtml(value) {
    return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }
  function escapeAttr(value) { return escapeHtml(value).replaceAll("`","&#096;"); }

  return { init, loadDrafts };
})();
window.QuestionManager = QuestionManager;                 
