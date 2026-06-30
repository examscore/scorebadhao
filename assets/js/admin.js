/**
 * SCOREBADHAO PHASE 2.2 — Admin Dashboard Upgrade
 */
const AdminApp = (() => {
  let admin = null;
  async function login() {
    try {
      Toast.loading("Checking admin login...");
      const Email = document.getElementById("adminEmail").value.trim();
      const Password = document.getElementById("adminPassword").value.trim();
      const data = await ScoreAPI.call("loginAdmin", { Email, Password });
      admin = data.admin;
      Toast.success("Admin login successful");
      Router.show("adminDashboardView");
      if (window.QuestionManager && QuestionManager.init) QuestionManager.init();
    } catch (err) { Toast.error(err.message); }
  }
  async function ping() {
    try {
      const data = await ScoreAPI.call("ping");
      document.getElementById("adminStatus").textContent = JSON.stringify(data, null, 2);
      Toast.success("API connected");
    } catch (err) { Toast.error(err.message); }
  }
  function initTabs() {
    document.querySelectorAll("[data-admin-tab]").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".admin-tab").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".admin-panel").forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(btn.dataset.adminTab)?.classList.add("active");
      });
    });
  }
  document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    document.getElementById("btnAdminLogin")?.addEventListener("click", login);
    document.getElementById("btnPingApi")?.addEventListener("click", ping);
  });
  return { getAdmin: () => admin };
})();
