/**
 * Analytics placeholder.
 * Phase 4 will add graphs, weak topic analysis, mistake book, and progress tracking.
 */

const Analytics = (() => {
  async function loadProgress(Student_ID) {
    return ScoreAPI.call("getStudentProgress", { Student_ID });
  }
  return { loadProgress };
})();
