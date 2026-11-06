// Simple Node.js server for the Fitness Activity Tracker.
// It serves the website files and provides a small API for saving activities.
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const DATA_FILE = path.join(__dirname, "data", "activities.json");
const PUBLIC_DIR = path.join(__dirname, "public");

function readActivities() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (error) {
    return [];
  }
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function saveActivities(activities) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(activities, null, 2));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/api/activities") {
    return sendJson(res, 200, readActivities());
  }

  if (req.method === "POST" && url.pathname === "/api/activities") {
    try {
      const body = await getBody(req);
      const activity = {
        id: Date.now().toString(),
        type: String(body.type || "Walking").trim(),
        duration: Number(body.duration),
        distance: Number(body.distance || 0),
        calories: Number(body.calories || 0),
        date: String(body.date || new Date().toISOString().slice(0, 10)),
        notes: String(body.notes || "").trim()
      };

      if (!activity.type || !Number.isFinite(activity.duration) || activity.duration <= 0) {
        return sendJson(res, 400, { error: "Please enter a valid activity and duration." });
      }
      if (![activity.distance, activity.calories].every(n => Number.isFinite(n) && n >= 0)) {
        return sendJson(res, 400, { error: "Distance and calories must be zero or greater." });
      }

      const activities = readActivities();
      activities.unshift(activity);
      saveActivities(activities);
      return sendJson(res, 201, activity);
    } catch (error) {
      return sendJson(res, 400, { error: error.message || "Could not save activity." });
    }
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/activities/")) {
    const id = decodeURIComponent(url.pathname.split("/").pop());
    const activities = readActivities();
    const updated = activities.filter(item => item.id !== id);
    if (updated.length === activities.length) {
      return sendJson(res, 404, { error: "Activity not found." });
    }
    saveActivities(updated);
    return sendJson(res, 200, { success: true });
  }

  // Serve static website files.
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = path.normalize(path.join(PUBLIC_DIR, requestedPath));
  if (!safePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(safePath, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Page not found");
    }
    const ext = path.extname(safePath).toLowerCase();
    const types = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".svg": "image/svg+xml"
    };
    res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`Fitness Activity Tracker is running at http://localhost:${PORT}`);
  console.log("Press Ctrl + C to stop the server.");
});