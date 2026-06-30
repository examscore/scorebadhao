/**
 * Admin question manager.
 */

const QuestionManager = (() => {
  async function saveQuestion() {
    try {
      const payload = {
        Board: document.getElementById("qBoard").value.trim() || "GOVT",
        Subject: document.getElementById("qSubject").value.trim() || "GEN",
        Topic: document.getElementById("qTopic").value.trim() || "MIX",
        Difficulty: document.getElementById("qLevel").value,
        Question: document.getElementById("qText").value.trim(),
        A: document.getElementById("qA").value.trim(),
        B: document.getElementById("qB").value.trim(),
        C: document.getElementById("qC").value.trim(),
        D: document.getElementById("qD").value.trim(),
        Answer: document.getElementById("qAnswer").value.trim().toUpperCase(),
        Explanation: document.getElementById("qExplanation").value.trim()
      };

      const data = await ScoreAPI.call("adminAddQuestion", payload);
      Toast.success("Question saved: " + data.question.Question_ID);
    } catch (err) {
      Toast.error(err.message);
    }
  }

  async function saveDrafts() {
    try {
      const raw = document.getElementById("draftJson").value.trim();
      const questions = JSON.parse(raw);
      if (!Array.isArray(questions)) throw new Error("JSON must be an array");

      const data = await ScoreAPI.call("adminBulkDraftQuestions", {
        Method: "admin_bulk_json",
        Source: "Admin pasted JSON",
        questions
      });

      Toast.success(`${data.count} draft questions saved`);
    } catch (err) {
      Toast.error(err.message);
    }
  }

  async function loadDrafts() {
    try {
      const data = await ScoreAPI.call("adminGetDraftQuestions", { Review_Status: "pending" });
      const box = document.getElementById("draftList");
      box.innerHTML = "";
      data.drafts.forEach(d => {
        const div = document.createElement("div");
        div.className = "list-item";
        div.textContent = d.Question || d.Raw_Text || d.Draft_ID;
        box.appendChild(div);
      });
      if (!data.drafts.length) box.textContent = "No pending drafts";
      Toast.success("Drafts loaded");
    } catch (err) {
      Toast.error(err.message);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btnSaveQuestion")?.addEventListener("click", saveQuestion);
    document.getElementById("btnSaveDrafts")?.addEventListener("click", saveDrafts);
    document.getElementById("btnLoadDrafts")?.addEventListener("click", loadDrafts);
  });

  return { saveQuestion, saveDrafts, loadDrafts };
})();
