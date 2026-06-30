/**
 * Student auth.
 */

const Auth = (() => {
  const KEY = "scorebadhao_student";

  function getStudent() {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); }
    catch { return null; }
  }

  function setStudent(student) {
    localStorage.setItem(KEY, JSON.stringify(student));
    updateAuthUI();
  }

  function logout() {
    localStorage.removeItem(KEY);
    updateAuthUI();
    Router.show("homeView");
    Toast.info("Logged out");
  }

  function updateAuthUI() {
    const btn = document.getElementById("btnStudentLogout");
    if (btn) btn.hidden = !getStudent();
  }

  async function login() {
    try {
      Toast.loading("Checking login...");
      const Phone = document.getElementById("loginPhone").value.trim();
      const Password = document.getElementById("loginPassword").value.trim();
      const data = await ScoreAPI.call("loginStudent", { Phone, Password });
      setStudent(data.student);
      Toast.success("Login successful");
      Router.show("examView");
      Student.loadBoards();
    } catch (err) {
      Toast.error(err.message);
    }
  }

  async function register() {
    try {
      Toast.loading("Creating account...");
      const payload = {
        Name: document.getElementById("regName").value.trim(),
        Phone: document.getElementById("regPhone").value.trim(),
        Email: document.getElementById("regEmail").value.trim(),
        Password: document.getElementById("regPassword").value.trim()
      };
      const data = await ScoreAPI.call("registerStudent", payload);
      setStudent(data.student);
      Toast.success("Registration successful");
      Router.show("examView");
      Student.loadBoards();
    } catch (err) {
      Toast.error(err.message);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    updateAuthUI();
    document.getElementById("btnStudentLogin")?.addEventListener("click", login);
    document.getElementById("btnStudentRegister")?.addEventListener("click", register);
    document.getElementById("btnStudentLogout")?.addEventListener("click", logout);
  });

  return { getStudent, logout };
})();
