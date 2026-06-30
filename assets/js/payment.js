/**
 * Payment and package connector.
 * Phase 5 will connect Razorpay/UPI/subscriptions.
 */

const Payment = (() => {
  async function getPackages() {
    return ScoreAPI.call("getPackages", {}, { cache: true });
  }

  async function loadPackagesToAdmin() {
    try {
      const data = await getPackages();
      const box = document.getElementById("packageList");
      if (!box) return;
      box.innerHTML = "";
      data.packages.forEach(p => {
        const div = document.createElement("div");
        div.className = "list-item";
        div.textContent = `${p.Package_Name || p.Name} - ₹${p.Price || 0}`;
        box.appendChild(div);
      });
      if (!data.packages.length) box.textContent = "No packages found";
      Toast.success("Packages loaded");
    } catch (err) {
      Toast.error(err.message);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btnLoadPackages")?.addEventListener("click", loadPackagesToAdmin);
  });

  return { getPackages };
})();
