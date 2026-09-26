window.AsikinStore = {
  STORAGE_KEY: "asikin_catalog_live",

  async loadGames(basePath = "") {
    // Always fetch live data/games.json from server first so user edits in Superadmin are never lost
    const jsonCandidates = ["/api/games", basePath + "data/games.json"];
    for (const endpoint of jsonCandidates) {
      try {
        const res = await fetch(endpoint, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return data;
          }
        }
      } catch (_) {}
    }

    const cached = localStorage.getItem(this.STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch (_) {}
    }

    return [];
  },

  async saveGames(gamesList) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(gamesList));
    try {
      const res = await fetch("/api/games", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gamesList, null, 2)
      });
      if (res.ok) return { syncedToDisk: true };
    } catch (_) {}
    return { syncedToDisk: false };
  },

  async uploadCoverImage(file) {
    const dataUrl = await this.readFileAsDataUrl(file);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name.replace(/\.[^/.]+$/, ""),
          dataUrl
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.url) return data.url;
      }
    } catch (_) {}
    return dataUrl;
  },

  readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  makeCode(title) {
    const words = String(title || "GM").trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return String(title || "GM").slice(0, 2).toUpperCase();
  }
};
