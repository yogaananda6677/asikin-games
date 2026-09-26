window.AsikinStore = {
  STORAGE_KEY: "asikin_catalog_v17",

  REQUIRED_GAMES: [
    {
      id: "pancaran-horror",
      title: "PANCARAN: Stasiun Halilintar",
      category: "Action",
      code: "PH",
      coverUrl: "/uploads/cover-pancaran-horror.svg",
      url: "games/pancaran-horror.html",
      featured: true,
      description: "Game 3D Psychological Survival Horror (3 Level & Multi-Ending)! Sebagai Agen Raka Wiratama, kumpulkan 3 Dokumen Rahasia, tentukan pilihan cerita, beli Air Suci & Garam Ruqyah di Toko Spiritual [B], dan counter 3 entitas hantu!"
    },
    {
      id: "stickman-spider-parkour",
      title: "Stickman Spider-Parkour",
      category: "Action",
      code: "RP",
      coverUrl: "/uploads/cover-spider-parkour.svg",
      url: "games/radgoll.html",
      featured: true,
      description: "Game parkour ayunan jaring Stickman! Tembakkan jaring ke langit-langit dengan klik mouse, hindari pipa jatuh & duri, dan capai bendera checkpoint."
    },
    {
      id: "zai-k1e5u85gutp0",
      title: "Spider-Parkour Arena (Z.ai)",
      category: "Action",
      code: "SP",
      coverUrl: "/uploads/cover-zai-k1e5u85gutp0.svg",
      url: "https://chat.z.ai/space/k1e5u85gutp0-art",
      featured: true,
      description: "Berayun dengan jaring laba-laba melewati rintangan jurang, duri tajam, dan pipa jatuh di arena parkour Z.ai!"
    }
  ],

  ensureRequiredGames(list) {
    if (!Array.isArray(list)) return [...this.REQUIRED_GAMES];
    const existingIds = new Set(list.map(g => g.id));
    const missing = this.REQUIRED_GAMES.filter(g => !existingIds.has(g.id));
    if (missing.length === 0) return list;
    return [...missing, ...list];
  },

  async loadGames(basePath = "") {
    const bust = "?v=" + Date.now();
    const jsonCandidates = ["/api/games" + bust, basePath + "data/games.json" + bust];
    for (const endpoint of jsonCandidates) {
      try {
        const res = await fetch(endpoint, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const merged = this.ensureRequiredGames(data);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(merged));
            return merged;
          }
        }
      } catch (_) {}
    }

    const cached = localStorage.getItem(this.STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return this.ensureRequiredGames(parsed);
      } catch (_) {}
    }

    return [...this.REQUIRED_GAMES];
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
