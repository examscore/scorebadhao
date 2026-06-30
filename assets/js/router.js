/**
 * Single page style navigation.
 */

const Router = (() => {
  function show(viewId) {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    const view = document.getElementById(viewId);
    if (view) view.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  document.addEventListener("click", (e) => {
    const route = e.target.closest("[data-route]");
    if (route) show(route.dataset.route);
  });

  return { show };
})();
