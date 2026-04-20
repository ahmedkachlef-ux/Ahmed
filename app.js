/* Business Model Canvas Generator — frontend
 * Talks to the local Flask backend (see server.py). The backend holds the
 * OpenRouter API key and handles the LLM call. This file only:
 *   - fetches the free-model list from /api/models
 *   - sends the company name to /api/generate
 *   - renders the 9-block canvas
 */

const STORAGE_KEY = "bmc-generator.settings.v3";

const BLOCKS = [
  { key: "keyPartnerships" },
  { key: "keyActivities" },
  { key: "keyResources" },
  { key: "valuePropositions" },
  { key: "customerRelationships" },
  { key: "channels" },
  { key: "customerSegments" },
  { key: "costStructure" },
  { key: "revenueStreams" },
];

const DEFAULT_SETTINGS = {
  model: "",
};

/* ---------- Settings (client-side model preference only) ---------- */

function loadSettings() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}
function saveSettings(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
function getSettings() { return { ...DEFAULT_SETTINGS, ...loadSettings() }; }

/* ---------- UI helpers ---------- */

const $ = (sel) => document.querySelector(sel);

function setStatus(msg) { $("#statusText").textContent = msg; }

function showLoading(msg) {
  $("#errorSection").hidden = true;
  $("#canvasSection").hidden = true;
  $("#statusSection").hidden = false;
  setStatus(msg);
}
function hideLoading() { $("#statusSection").hidden = true; }

function showError(msg) {
  hideLoading();
  $("#errorSection").hidden = false;
  $("#errorText").textContent = msg;
}

function clearCanvas() {
  document.querySelectorAll(".bmc-block .bmc-body").forEach((el) => (el.innerHTML = ""));
  document.querySelectorAll(".bmc-analysis p").forEach((el) => (el.textContent = ""));
  $("#synthesisBody").innerHTML = "";
  $("#sourcesList").innerHTML = "";
  $("#sourcesWrapper").hidden = true;
  $("#synthesisSection").hidden = true;
}

/* ---------- Backend calls ---------- */

let serverConfigCache = null;
async function fetchServerConfig() {
  if (serverConfigCache) return serverConfigCache;
  const res = await fetch("/api/config");
  if (!res.ok) throw new Error(`/api/config: HTTP ${res.status}`);
  serverConfigCache = await res.json();
  return serverConfigCache;
}

let modelsCache = null;
async function fetchFreeModels() {
  if (modelsCache) return modelsCache;
  const res = await fetch("/api/models");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `/api/models: HTTP ${res.status}`);
  modelsCache = data.free || [];
  return modelsCache;
}

async function generateBmc(company, model) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company, model: model || undefined }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `/api/generate: HTTP ${res.status}`);
  return data;
}

/* ---------- Rendering ---------- */

function renderBmc(bmc) {
  hideLoading();
  $("#errorSection").hidden = true;

  $("#companyName").textContent = bmc.company?.name || "—";
  $("#companyTagline").textContent = bmc.company?.tagline || "";

  for (const { key } of BLOCKS) {
    const block = bmc.blocks?.[key];
    const blockEl = document.querySelector(`.bmc-block[data-key="${key}"]`);
    if (!blockEl || !block) continue;
    blockEl.querySelector(".bmc-body").innerHTML = renderItems(block.items || []);
    blockEl.querySelector(".bmc-analysis p").textContent = block.analysis || "";
  }

  if (bmc.synthesis) {
    $("#synthesisSection").hidden = false;
    $("#synthesisBody").innerHTML = `<p>${escapeHtml(bmc.synthesis)}</p>`;
  }

  const sources = Array.isArray(bmc.sources) ? bmc.sources.filter(Boolean) : [];
  if (sources.length) {
    $("#sourcesWrapper").hidden = false;
    $("#sourcesList").innerHTML = sources
      .map((url) => `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a></li>`)
      .join("");
  }

  $("#canvasSection").hidden = false;
  $("#canvasSection").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderItems(items) {
  if (!items?.length) return `<p class="item-desc">Aucune information disponible.</p>`;
  return `<ul>${items
    .map((it) => {
      const title = escapeHtml(it.title || "");
      const desc = escapeHtml(it.description || "");
      return `<li><div><div class="item-title">${title}</div>${desc ? `<div class="item-desc">${desc}</div>` : ""}</div></li>`;
    })
    .join("")}</ul>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ---------- Flow ---------- */

async function generate(company) {
  const settings = getSettings();
  clearCanvas();
  showLoading(`Génération du BMC pour « ${company} »…`);
  $("#generateBtn").disabled = true;

  try {
    const bmc = await generateBmc(company, settings.model);
    renderBmc(bmc);
  } catch (err) {
    console.error(err);
    const msg = String(err?.message || err);
    if (/OPENROUTER_API_KEY/.test(msg)) {
      showError("La clé API n'est pas configurée côté serveur. Définissez OPENROUTER_API_KEY puis relancez `python server.py`.");
    } else if (/no endpoints found/i.test(msg)) {
      showError(msg + " — ouvrez ⚙️ Paramètres et choisissez un autre modèle.");
      modelsCache = null;
    } else {
      showError(msg);
    }
  } finally {
    $("#generateBtn").disabled = false;
  }
}

/* ---------- Settings dialog (model picker only) ---------- */

async function populateModelList() {
  const datalist = $("#openrouterModels");
  const input = $("#openrouterModelInput");
  const status = $("#modelListStatus");

  status.textContent = "Chargement de la liste des modèles…";
  try {
    const free = await fetchFreeModels();
    datalist.innerHTML = free
      .map((m) => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.name || m.id)} (gratuit)</option>`)
      .join("");
    status.innerHTML = `${free.length} modèles <strong>gratuits</strong> disponibles. Laissez vide pour utiliser le modèle par défaut du serveur.`;

    const settings = getSettings();
    const config = await fetchServerConfig();
    input.placeholder = `défaut serveur : ${config.defaultModel}`;
    input.value = settings.model || "";
  } catch (err) {
    status.innerHTML = `Impossible de charger la liste (${escapeHtml(err.message)}). Vous pouvez entrer un ID manuellement.`;
  }
}

function openSettings() {
  const dialog = $("#settingsDialog");
  populateModelList();
  if (!dialog.open) dialog.showModal();
}

function setupSettingsDialog() {
  const dialog = $("#settingsDialog");
  $("#settingsBtn").addEventListener("click", openSettings);

  dialog.addEventListener("close", () => {
    if (dialog.returnValue !== "save") return;
    saveSettings({ model: $("#openrouterModelInput").value.trim() });
  });
}

/* ---------- Server status banner ---------- */

async function checkServerConfig() {
  try {
    const config = await fetchServerConfig();
    if (!config.hasApiKey) {
      showError("Le serveur a démarré sans OPENROUTER_API_KEY. Exportez la variable puis relancez `python server.py`.");
    }
  } catch (err) {
    showError(`Backend injoignable — lancez \`python server.py\`. (${err.message})`);
  }
}

/* ---------- Init ---------- */

function setupForm() {
  $("#bmcForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const value = $("#companyInput").value.trim();
    if (value) generate(value);
  });

  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const name = chip.dataset.company;
      $("#companyInput").value = name;
      generate(name);
    });
  });

  $("#newBtn").addEventListener("click", () => {
    $("#canvasSection").hidden = true;
    $("#companyInput").value = "";
    $("#companyInput").focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  $("#printBtn").addEventListener("click", () => window.print());
}

document.addEventListener("DOMContentLoaded", () => {
  setupSettingsDialog();
  setupForm();
  checkServerConfig();
});
