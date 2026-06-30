/** Admin question manager. */
const QuestionManager = (() => {
  async function saveQuestion() {
    try {
      const payload = {
        Board_ID: document.getElementById("qBoard").value.trim(),
        Subject_ID: document.getElementById("qSubject").value.trim(),
        Topic_ID: document.getElementById("qTopic").value.trim(),
        Difficulty: document.getElementById("qLevel").value,
        Question_Text: document.getElementById("qText").value.trim(),
        Option_A: document.getElementById("qA").value.trim(),
        Option_B: document.getElementById("qB").value.trim(),
        Option_C: document.getElementById("qC").value.trim(),
        Option_D: document.getElementById("qD").value.trim(),
        Correct_Answer: document.getElementById("qAnswer").value.trim().toUpperCase(),
        Explanation: document.getElementById("qExplanation").value.trim()
      };
      const data = await ScoreAPI.call("adminAddQuestion", payload);
      Toast.success("Question saved: " + data.question.Question_ID);
    } catch (err) { Toast.error(err.message); }
  }

  async function saveDrafts() {
    try {
      const questions = JSON.parse(document.getElementById("draftJson").value.trim());
      if (!Array.isArray(questions)) throw new Error("JSON must be an array");
      const data = await ScoreAPI.call("adminBulkDraftQuestions", { Import_Method: "admin_bulk_json", Source_Type: "Admin pasted JSON", questions });
      Toast.success(`${data.count} draft questions saved`);
    } catch (err) { Toast.error(err.message); }
  }

  async function loadDrafts() {
    try {
      const data = await ScoreAPI.call("adminGetDraftQuestions", { Review_Status: "pending" });
      const box = document.getElementById("draftList");
      box.innerHTML = "";
      data.drafts.forEach(d => {
        const div = document.createElement("div");
        div.className = "list-item";
        div.textContent = d.Question_Text || d.Question || d.Draft_ID;
        box.appendChild(div);
      });
      if (!data.drafts.length) box.textContent = "No pending drafts";
      Toast.success("Drafts loaded");
    } catch (err) { Toast.error(err.message); }
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btnSaveQuestion")?.addEventListener("click", saveQuestion);
    document.getElementById("btnSaveDrafts")?.addEventListener("click", saveDrafts);
    document.getElementById("btnLoadDrafts")?.addEventListener("click", loadDrafts);
  });
  return { saveQuestion, saveDrafts, loadDrafts };
})();
