(function initSuperadmin() {
  const SESSION_KEY = "asikin_vault_unlocked";
  // Clear legacy persistent auth so user is never auto-logged-in without password
  localStorage.removeItem("asikin_superadmin_auth");

  window.AsikinIcons.injectAll();
  window.AsikinTheme.init();

  const isLoginPage = window.location.pathname.endsWith("login.html");

  if (isLoginPage) {
    // Always invalidate session when landing on login.html so password is REQUIRED every time!
    sessionStorage.removeItem(SESSION_KEY);

    const loginForm = document.getElementById("loginForm");
    const authError = document.getElementById("authError");
    if (loginForm) {
      loginForm.addEventListener("submit", e => {
        e.preventDefault();
        const user = document.getElementById("adminUser").value.trim();
        const pass = document.getElementById("adminPass").value.trim();
        if ((user === "superadmin" || user === "admin") && (pass === "asikin2026" || pass === "admin123")) {
          sessionStorage.setItem(SESSION_KEY, "1");
          window.location.href = "index.html";
        } else {
          authError.style.display = "block";
          authError.textContent = "Akses ditolak. Identifier atau Passkey salah.";
        }
      });
    }
    return;
  }

  // Require active session from login page
  if (sessionStorage.getItem(SESSION_KEY) !== "1") {
    window.location.href = "login.html";
    return;
  }

  let games = [];
  let selectedCoverFile = null;

  const gameForm = document.getElementById("gameForm");
  const formHeading = document.getElementById("formHeading");
  const editIdInput = document.getElementById("editId");
  const existingCoverInput = document.getElementById("existingCoverUrl");
  const inpCoverFile = document.getElementById("inpCoverFile");
  const coverPreviewImg = document.getElementById("coverPreviewImg");
  const uploadPromptText = document.getElementById("uploadPromptText");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const tableBody = document.getElementById("adminTableBody");
  const totalBadge = document.getElementById("totalGamesBadge");
  const formAlert = document.getElementById("formAlert");
  const submitGameBtn = document.getElementById("submitGameBtn");

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, m => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[m]));
  }

  function formatAdminCoverPath(url) {
    if (!url) return "";
    if (url.startsWith("data:") || url.startsWith("http")) return url;
    if (url.startsWith("/uploads/")) return ".." + url;
    if (url.startsWith("uploads/")) return "../" + url;
    return url;
  }

  function showCoverPreview(src) {
    if (src) {
      coverPreviewImg.src = src;
      coverPreviewImg.style.display = "block";
      uploadPromptText.style.display = "none";
    } else {
      coverPreviewImg.src = "";
      coverPreviewImg.style.display = "none";
      uploadPromptText.style.display = "block";
    }
  }

  if (inpCoverFile) {
    inpCoverFile.addEventListener("change", async e => {
      const file = e.target.files[0];
      if (!file) return;
      selectedCoverFile = file;
      const previewUrl = await window.AsikinStore.readFileAsDataUrl(file);
      showCoverPreview(previewUrl);
      if (formAlert) formAlert.style.display = "none";
    });
  }

  async function initDashboard() {
    games = await window.AsikinStore.loadGames("../");
    renderTable();
  }

  function renderTable() {
    if (totalBadge) totalBadge.textContent = `${games.length} item tersimpan di data/games.json`;

    if (games.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center;padding:32px;color:var(--text-tertiary)">
            Belum ada data game. Gunakan formulir di sebelah kiri untuk menambahkan card game.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = games.map(g => {
      const code = escapeHtml(g.code || window.AsikinStore.makeCode(g.title));
      const imgSrc = formatAdminCoverPath(g.coverUrl);
      const thumbHtml = imgSrc
        ? `<img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(g.title)}" style="width:52px;height:36px;border-radius:6px;object-fit:cover;border:1px solid var(--border-subtle)" />`
        : `<span class="rec-code">${code}</span>`;

      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              ${thumbHtml}
              <div>
                <div style="font-weight:700">${escapeHtml(g.title)}</div>
                <div style="font-size:11.5px;color:var(--text-tertiary)">${escapeHtml(g.description || "-")}</div>
              </div>
            </div>
          </td>
          <td><span class="panel-tag">${escapeHtml(g.category)}</span></td>
          <td class="mono" style="font-size:11.5px;color:var(--text-secondary);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(g.url)}</td>
          <td>
            <div class="table-actions">
              <button type="button" class="sm-btn" data-edit="${escapeHtml(g.id)}">Edit</button>
              <button type="button" class="sm-btn danger" data-del="${escapeHtml(g.id)}">Hapus</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    tableBody.querySelectorAll("[data-edit]").forEach(btn => {
      btn.addEventListener("click", () => {
        const g = games.find(item => item.id === btn.getAttribute("data-edit"));
        if (!g) return;
        editIdInput.value = g.id;
        existingCoverInput.value = g.coverUrl || "";
        selectedCoverFile = null;
        document.getElementById("inpTitle").value = g.title;
        document.getElementById("inpCategory").value = g.category;
        document.getElementById("inpCode").value = g.code || "";
        document.getElementById("inpUrl").value = g.url || "";
        document.getElementById("inpDesc").value = g.description || "";
        document.getElementById("inpFeatured").checked = Boolean(g.featured);

        showCoverPreview(formatAdminCoverPath(g.coverUrl));
        formHeading.textContent = "Edit Card Game";
        cancelEditBtn.style.display = "inline-flex";
      });
    });

    tableBody.querySelectorAll("[data-del]").forEach(btn => {
      btn.addEventListener("click", async () => {
        games = games.filter(item => item.id !== btn.getAttribute("data-del"));
        await window.AsikinStore.saveGames(games);
        renderTable();
      });
    });
  }

  function resetForm() {
    gameForm.reset();
    editIdInput.value = "";
    existingCoverInput.value = "";
    selectedCoverFile = null;
    showCoverPreview("");
    formHeading.textContent = "Tambah Card Game Baru";
    cancelEditBtn.style.display = "none";
    if (formAlert) formAlert.style.display = "none";
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", resetForm);
  }

  if (gameForm) {
    gameForm.addEventListener("submit", async e => {
      e.preventDefault();
      const existingId = editIdInput.value.trim();
      let coverUrl = existingCoverInput.value.trim();

      if (!selectedCoverFile && !coverUrl) {
        formAlert.style.display = "block";
        formAlert.textContent = "Wajib mengunggah gambar cover untuk katalog.";
        return;
      }

      submitGameBtn.disabled = true;
      submitGameBtn.textContent = "Menyimpan...";

      try {
        if (selectedCoverFile) {
          coverUrl = await window.AsikinStore.uploadCoverImage(selectedCoverFile);
        }

        const title = document.getElementById("inpTitle").value.trim();
        const category = document.getElementById("inpCategory").value;
        const code = document.getElementById("inpCode").value.trim().toUpperCase() || window.AsikinStore.makeCode(title);
        const url = document.getElementById("inpUrl").value.trim();
        const description = document.getElementById("inpDesc").value.trim();
        const featured = document.getElementById("inpFeatured").checked;

        const payload = {
          id: existingId || "game-" + Date.now(),
          title,
          category,
          code,
          accent: "#6366f1",
          coverUrl,
          url,
          featured,
          description
        };

        if (existingId) {
          games = games.map(g => (g.id === existingId ? payload : g));
        } else {
          games.unshift(payload);
        }

        await window.AsikinStore.saveGames(games);
        resetForm();
        renderTable();
      } finally {
        submitGameBtn.disabled = false;
        submitGameBtn.textContent = "Simpan Card ke Katalog";
      }
    });
  }

  const exportBtn = document.getElementById("exportJsonBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(games, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "games.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  const importInput = document.getElementById("importJsonInput");
  if (importInput) {
    importInput.addEventListener("change", async e => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const parsed = JSON.parse(await file.text());
        if (Array.isArray(parsed)) {
          games = parsed;
          await window.AsikinStore.saveGames(games);
          renderTable();
        }
      } catch (_) {}
    });
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem(SESSION_KEY);
      window.location.href = "login.html";
    });
  }

  initDashboard();
})();
