// auth-lab UI mock helpers — mock-only behaviour, NOT a reference for the real app.
// - State switcher: buttons [data-set-state] in the mock bar show/hide elements with [data-show="a b"].
//   The current state is mirrored to the URL hash so a state can be linked (e.g. login.html#locked).
// - Theme toggle: cycles system → light → dark.
// - Small UX niceties: reveal password, OTP auto-advance, block real form submits.
(function () {
  "use strict";

  // ── states ──
  const chips = Array.from(document.querySelectorAll("[data-set-state]"));
  const states = chips.map((c) => c.dataset.setState);

  function setState(name) {
    if (!states.includes(name)) name = states[0];
    if (!name) return;
    chips.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.setState === name)));
    document.querySelectorAll("[data-show]").forEach((el) => {
      el.hidden = !el.dataset.show.split(/\s+/).includes(name);
    });
    if (location.hash.slice(1) !== name) history.replaceState(null, "", "#" + name);
  }
  chips.forEach((c) => c.addEventListener("click", () => setState(c.dataset.setState)));
  window.addEventListener("hashchange", () => setState(location.hash.slice(1)));
  setState(location.hash.slice(1));

  // ── theme ──
  const root = document.documentElement;
  const order = ["system", "light", "dark"];
  let theme = "system";
  try { theme = localStorage.getItem("authlab-mock-theme") || "system"; } catch (e) { /* storage blocked */ }
  function applyTheme() {
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
    document.querySelectorAll(".theme-toggle").forEach((b) => (b.textContent = "Theme: " + theme));
  }
  document.querySelectorAll(".theme-toggle").forEach((b) =>
    b.addEventListener("click", () => {
      theme = order[(order.indexOf(theme) + 1) % order.length];
      try { localStorage.setItem("authlab-mock-theme", theme); } catch (e) { /* ignore */ }
      applyTheme();
    })
  );
  applyTheme();

  // ── forms never submit in the mock ──
  document.addEventListener("submit", (e) => e.preventDefault());

  // ── reveal password ──
  document.querySelectorAll("[data-reveal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.reveal);
      if (!input) return;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.textContent = show ? "Hide" : "Show";
      btn.setAttribute("aria-pressed", String(show));
    });
  });

  // ── OTP: digits only, auto-advance, paste fills all boxes ──
  document.querySelectorAll(".otp").forEach((group) => {
    const boxes = Array.from(group.querySelectorAll("input"));
    boxes.forEach((box, i) => {
      box.addEventListener("input", () => {
        box.value = box.value.replace(/\D/g, "").slice(-1);
        if (box.value && boxes[i + 1]) boxes[i + 1].focus();
      });
      box.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !box.value && boxes[i - 1]) boxes[i - 1].focus();
      });
      box.addEventListener("paste", (e) => {
        const digits = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, boxes.length);
        if (!digits) return;
        e.preventDefault();
        boxes.forEach((b, j) => (b.value = digits[j] || ""));
        (boxes[digits.length] || boxes[boxes.length - 1]).focus();
      });
    });
  });
})();
