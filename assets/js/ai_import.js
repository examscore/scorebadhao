/**
 * AI Import placeholder.
 * Rule: AI questions must never publish directly.
 * They must go to DRAFT_QUESTIONS first.
 */

const AiImport = (() => {
  async function saveAiDrafts(questions, source = "AI extraction") {
    return ScoreAPI.call("adminBulkDraftQuestions", {
      Method: "ai_automated_import",
      Source: source,
      questions
    });
  }

  return { saveAiDrafts };
})();
