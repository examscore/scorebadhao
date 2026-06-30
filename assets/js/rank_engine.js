/**
 * Smart Rank Engine frontend connector.
 * Phase 6 premium feature.
 */

const RankEngine = (() => {
  async function getRank(Student_ID, Exam) {
    return ScoreAPI.call("getSmartRank", { Student_ID, Exam });
  }
  return { getRank };
})();
