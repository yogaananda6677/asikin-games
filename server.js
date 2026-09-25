const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const DATA_FILE = path.join(ROOT_DIR, "data", "games.json");
const UPLOADS_DIR = path.join(ROOT_DIR, "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon"
};

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const pathname = urlObj.pathname;

  // Secret routes for Superadmin Login & Console Pages
  if (pathname === "/vault" || pathname === "/superadmin" || pathname === "/admin") {
    res.writeHead(302, { Location: "/admin/login.html" });
    res.end();
    return;
  }

  // Image Upload Endpoint (saves base64 image to /uploads/ folder on disk)
  if (pathname === "/api/upload" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      try {
        const { filename, dataUrl } = JSON.parse(body);
        const matches = String(dataUrl).match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (!matches) throw new Error("Invalid image data");
        const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
        const buffer = Buffer.from(matches[2], "base64");
        const safeName = (filename || "cover")
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, "-")
          .replace(/-+/g, "-")
          .slice(0, 40);
        const finalName = `${Date.now()}-${safeName}.${ext}`;
        const filePath = path.join(UPLOADS_DIR, finalName);
        fs.writeFileSync(filePath, buffer);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ url: `/uploads/${finalName}` }));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Upload failed" }));
      }
    });
    return;
  }

  // Games JSON Database API
  if (pathname === "/api/games") {
    if (req.method === "GET") {
      fs.readFile(DATA_FILE, "utf8", (err, content) => {
        if (err) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end("[]");
          return;
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(content || "[]");
      });
      return;
    }

    if (req.method === "PUT" || req.method === "POST") {
      let body = "";
      req.on("data", chunk => (body += chunk));
      req.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          if (!Array.isArray(parsed)) throw new Error("Invalid array");
          fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2), "utf8");
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "ok", count: parsed.length }));
        } catch (err) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON payload" }));
        }
      });
      return;
    }
  }

  // Static File Serving
  let safePath = path.normalize(pathname === "/" ? "/index.html" : pathname);
  let filePath = path.join(ROOT_DIR, safePath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("404 Not Found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`ASIKIN.GAMES running at http://localhost:${PORT}`);
});
