/* global chrome */

const baseUrlInput = document.getElementById("baseUrl");
const tokenInput = document.getElementById("token");
const statusEl = document.getElementById("status");
const projectsEl = document.getElementById("projects");

function setStatus(msg) {
  statusEl.textContent = msg;
}

function normalizeBase(url) {
  return String(url || "").replace(/\/+$/, "");
}

async function loadSettings() {
  const { apiBaseUrl = "", sessionToken = "" } = await chrome.storage.sync.get([
    "apiBaseUrl",
    "sessionToken",
  ]);
  baseUrlInput.value = apiBaseUrl;
  tokenInput.value = sessionToken;
}

document.getElementById("save").addEventListener("click", async () => {
  const apiBaseUrl = normalizeBase(baseUrlInput.value);
  const sessionToken = tokenInput.value.trim();
  await chrome.storage.sync.set({ apiBaseUrl, sessionToken });
  setStatus("Saved.");
});

document.getElementById("load").addEventListener("click", async () => {
  const apiBaseUrl = normalizeBase(baseUrlInput.value);
  const sessionToken = tokenInput.value.trim();
  if (!apiBaseUrl || !sessionToken) {
    setStatus("Set base URL and token first.");
    return;
  }
  setStatus("Loading…");
  projectsEl.innerHTML = "";
  try {
    const res = await fetch(`${apiBaseUrl}/api/projects`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus(data.error || `HTTP ${res.status}`);
      return;
    }
    const projects = data.projects || [];
    setStatus(`${projects.length} project(s). Click one to load tasks.`);
    for (const p of projects) {
      const row = document.createElement("div");
      row.className = "row";
      row.textContent = p.name;
      row.addEventListener("click", async () => {
        setStatus(`Tasks for ${p.name}…`);
        projectsEl.innerHTML = "";
        const tr = await fetch(
          `${apiBaseUrl}/api/projects/${encodeURIComponent(p.id)}/tasks`,
          { headers: { Authorization: `Bearer ${sessionToken}` } },
        );
        const td = await tr.json().catch(() => ({}));
        if (!tr.ok) {
          setStatus(td.error || `HTTP ${tr.status}`);
          return;
        }
        const tasks = td.tasks || [];
        setStatus(`${tasks.length} task(s) in ${p.name}`);
        for (const t of tasks) {
          const line = document.createElement("div");
          line.className = "row";
          line.style.cursor = "default";
          line.textContent = t.name;
          projectsEl.appendChild(line);
        }
      });
      projectsEl.appendChild(row);
    }
  } catch (e) {
    setStatus(e instanceof Error ? e.message : "Request failed");
  }
});

void loadSettings();
