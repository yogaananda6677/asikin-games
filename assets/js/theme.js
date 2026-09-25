window.AsikinTheme = {
  STORAGE_KEY: "asikin-color-scheme",
  getTheme() {
    return document.documentElement.getAttribute("data-theme") || "light";
  },
  setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.setAttribute("content", theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
    this.updateToggleIcon();
  },
  toggle() {
    const next = this.getTheme() === "dark" ? "light" : "dark";
    this.setTheme(next);
  },
  updateToggleIcon() {
    const btn = document.getElementById("themeToggleBtn");
    if (!btn || !window.AsikinIcons) return;
    const isDark = this.getTheme() === "dark";
    btn.innerHTML = isDark ? window.AsikinIcons.sun : window.AsikinIcons.moon;
    btn.setAttribute("title", isDark ? "Mode Terang" : "Mode Gelap");
  },
  init() {
    const btn = document.getElementById("themeToggleBtn");
    if (btn) {
      btn.onclick = () => this.toggle();
      this.updateToggleIcon();
    }
  }
};
