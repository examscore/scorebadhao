/**
 * Global Toast System
 * Never use alert().
 */

const Toast = (() => {
  function show(message, type = "info", timeout = 2600) {
    const root = document.getElementById("toastRoot");
    if (!root) return console.log(`[${type}] ${message}`);

    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = message;
    root.appendChild(el);

    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateY(-6px)";
      setTimeout(() => el.remove(), 180);
    }, timeout);
  }

  return {
    success: msg => show(msg, "success"),
    error: msg => show(msg, "error", 4000),
    warning: msg => show(msg, "warning", 3500),
    info: msg => show(msg, "info"),
    loading: msg => show(msg, "info", 1800)
  };
})();
