(async function initCatalogApp() {
  window.AsikinIcons.injectAll();
  window.AsikinTheme.init();

  let games = await window.AsikinStore.loadGames("");
  let currentFilter = "ALL";
  let currentGame = null;

  const cardsGrid = document.getElementById("cardsGrid");
  const recommendedList = document.getElementById("recommendedList");
  const searchInput = document.getElementById("searchInput");
  const sectionHeading = document.getElementById("sectionHeading");
  const sectionCountText = document.getElementById("sectionCountText");

  const stageIdle = document.getElementById("stageIdle");
  const gameFrame = document.getElementById("gameFrame");
  const activeCode = document.getElementById("activeCode");
  const activeTitle = document.getElementById("activeTitle");
  const activeCategory = document.getElementById("activeCategory");

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, m => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[m]));
  }

  function resolveCoverUrl(url) {
    if (!url) return "";
    if (url.startsWith("/uploads/")) return url.slice(1);
    return url;
  }

  function launchGame(id, shouldScroll = true) {
    const g = games.find(item => item.id === id);
    if (!g || !gameFrame) return;
    currentGame = g;
    const code = g.code || window.AsikinStore.makeCode(g.title);

    if (activeCode) activeCode.textContent = code;
    if (activeTitle) activeTitle.textContent = g.title;
    if (activeCategory) activeCategory.textContent = `${g.category} · ${g.description || "Interactive Web Game"}`;
    if (stageIdle) stageIdle.classList.add("hidden");

    gameFrame.src = g.url || "about:blank";

    if (shouldScroll) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function updateSidebarCounts() {
    const setBadge = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setBadge("count-ALL", games.length);
    setBadge("count-FEATURED", games.filter(g => g.featured).length);
    ["Arcade", "Action", "Puzzle", "Racing", "Casual", "Sports"].forEach(cat => {
      setBadge(`count-${cat}`, games.filter(g => g.category.toLowerCase() === cat.toLowerCase()).length);
    });
  }

  function renderCatalog(query = "") {
    updateSidebarCounts();
    const q = query.trim().toLowerCase();

    const filtered = games.filter(g => {
      const matchFilter =
        currentFilter === "ALL" ? true :
        currentFilter === "FEATURED" ? Boolean(g.featured) :
        g.category.toLowerCase() === currentFilter.toLowerCase();

      const matchQuery =
        !q ||
        g.title.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        (g.description && g.description.toLowerCase().includes(q));

      return matchFilter && matchQuery;
    });

    if (sectionCountText) {
      sectionCountText.textContent = `${filtered.length} judul tersedia`;
    }

    if (cardsGrid) {
      if (filtered.length === 0) {
        cardsGrid.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 48px 20px; text-align: center; background: var(--bg-surface); border: 1px dashed var(--border-subtle); border-radius: var(--radius-lg); color: var(--text-tertiary);">
            <div style="font-size: 14px; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px;">Tidak ada game ditemukan</div>
            <div style="font-size: 12.5px;">Coba kata kunci atau kategori lain.</div>
          </div>
        `;
      } else {
        cardsGrid.innerHTML = filtered.map(g => {
          const code = escapeHtml(g.code || window.AsikinStore.makeCode(g.title));
          const coverSrc = resolveCoverUrl(g.coverUrl);
          const coverHtml = coverSrc
            ? `<img class="card-cover-img" src="${escapeHtml(coverSrc)}" alt="${escapeHtml(g.title)}" loading="lazy" />`
            : `<div class="card-cover-pattern"></div><span class="card-monogram">${code}</span>`;

          return `
            <article class="game-card" data-id="${escapeHtml(g.id)}">
              <div class="card-cover">
                ${coverHtml}
                <span class="card-play-pill">${window.AsikinIcons.play}</span>
              </div>
              <div class="card-body">
                <div class="card-top-row">
                  <span class="card-category">${escapeHtml(g.category)}</span>
                  <span class="card-live-dot" title="Tersedia"></span>
                </div>
                <h3 class="card-title">${escapeHtml(g.title)}</h3>
                <p class="card-desc">${escapeHtml(g.description || g.category)}</p>
              </div>
            </article>
          `;
        }).join("");

        cardsGrid.querySelectorAll(".game-card").forEach(card => {
          card.addEventListener("click", () => launchGame(card.getAttribute("data-id"), true));
        });
      }
    }

    if (recommendedList) {
      const curated = games.filter(g => g.featured).slice(0, 5);
      const recSource = curated.length > 0 ? curated : games.slice(0, 5);

      recommendedList.innerHTML = recSource.map(g => {
        const code = escapeHtml(g.code || window.AsikinStore.makeCode(g.title));
        const coverSrc = resolveCoverUrl(g.coverUrl);
        const thumbHtml = coverSrc
          ? `<img src="${escapeHtml(coverSrc)}" alt="${escapeHtml(g.title)}" style="width:42px;height:34px;border-radius:6px;object-fit:cover;flex-shrink:0;border:1px solid var(--border-subtle)" />`
          : `<div class="rec-code">${code}</div>`;

        return `
          <div class="rec-item" data-id="${escapeHtml(g.id)}">
            ${thumbHtml}
            <div class="rec-info">
              <b>${escapeHtml(g.title)}</b>
              <span>${escapeHtml(g.category)}</span>
            </div>
          </div>
        `;
      }).join("");

      recommendedList.querySelectorAll(".rec-item").forEach(item => {
        item.addEventListener("click", () => launchGame(item.getAttribute("data-id"), true));
      });
    }
  }

  function redirectToSecretLogin() {
    // Always clear any previous session so login page ALWAYS demands password input
    localStorage.removeItem("asikin_superadmin_auth");
    sessionStorage.removeItem("asikin_vault_unlocked");
    window.location.href = "admin/login.html";
  }

  document.querySelectorAll(".sidebar .nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".sidebar .nav-item").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.getAttribute("data-filter") || "ALL";

      if (sectionHeading) {
        sectionHeading.textContent =
          currentFilter === "ALL" ? "Semua Katalog Game" :
          currentFilter === "FEATURED" ? "Pilihan Utama" :
          `Kategori · ${currentFilter}`;
      }
      renderCatalog(searchInput ? searchInput.value : "");
    });
  });

  const reloadBtn = document.getElementById("reloadGameBtn");
  if (reloadBtn) {
    reloadBtn.addEventListener("click", () => {
      if (currentGame) launchGame(currentGame.id, false);
    });
  }

  const fullscreenBtn = document.getElementById("fullscreenGameBtn");
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener("click", () => {
      const viewport = document.getElementById("stageViewport");
      if (viewport && viewport.requestFullscreen) {
        viewport.requestFullscreen();
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", e => renderCatalog(e.target.value));
    searchInput.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        const val = searchInput.value.trim().toLowerCase();
        if (val === "/vault" || val === "/superadmin" || val === "/admin") {
          e.preventDefault();
          searchInput.value = "";
          redirectToSecretLogin();
        }
      }
    });
  }

  // Secret Keyboard Shortcut: Ctrl + Shift + L -> Always opens Login Page requiring Password
  window.addEventListener("keydown", e => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      redirectToSecretLogin();
    }
  });

  renderCatalog();
  if (games.length > 0) {
    launchGame(games[0].id, false);
  }
})();
