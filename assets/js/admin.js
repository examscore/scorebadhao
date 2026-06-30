/**
 * Admin login and dashboard.
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
    } catch (err) {
      Toast.error(err.message);
    }
  }

  async function ping() {
    try {
      const data = await ScoreAPI.call("ping");
      document.getElementById("adminStatus").textContent = JSON.stringify(data, null, 2);
      Toast.success("API connected");
    } catch (err) {
      Toast.error(err.message);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btnAdminLogin")?.addEventListener("click", login);
    document.getElementById("btnPingApi")?.addEventListener("click", ping);
  });

  return { getAdmin: () => admin };
})();
