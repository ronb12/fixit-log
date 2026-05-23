const state = {
  activePanel: "assets",
  data: null
};

const elements = {
  stats: document.querySelector("#stats"),
  assetList: document.querySelector("#assetList"),
  recordList: document.querySelector("#recordList"),
  assetForm: document.querySelector("#assetForm"),
  recordForm: document.querySelector("#recordForm"),
  recordAssetId: document.querySelector("#recordAssetId"),
  railTabs: [...document.querySelectorAll(".rail-tab")],
  panels: [...document.querySelectorAll(".panel")],
  heroTabs: [...document.querySelectorAll("[data-panel-target]")],
  toast: document.querySelector("#toast"),
  cardTemplate: document.querySelector("#cardTemplate")
};

function showToast(message, isError = false) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  elements.toast.style.borderColor = isError ? "rgba(255, 125, 125, 0.3)" : "rgba(241,188,112,.22)";
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => elements.toast.classList.remove("show"), 2200);
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload;
}

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
}

function badgeClass(value) {
  if (["Done", "Routine", "Logged"].includes(value)) return "badge";
  if (["High", "Due Soon"].includes(value)) return "badge warn";
  if (["Critical"].includes(value)) return "badge good";
  return "badge";
}

function setPanel(panel) {
  state.activePanel = panel;
  elements.railTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.panel === panel));
  elements.panels.forEach((panelNode) => panelNode.classList.toggle("active", panelNode.dataset.panelView === panel));
}

function buildCard(title, badge, rows, footer = "") {
  const card = elements.cardTemplate.content.firstElementChild.cloneNode(true);
  card.innerHTML = `
    <header>
      <h3>${title}</h3>
      <span class="${badgeClass(badge)}">${badge}</span>
    </header>
    <div class="record-grid">
      ${rows.map((row) => `<div class="record-row"><span>${row.label}</span><strong>${row.value}</strong></div>`).join("")}
    </div>
    ${footer ? `<div class="record-row"><span>Notes</span><strong>${footer}</strong></div>` : ""}
  `;
  return card;
}

function renderStats() {
  const { stats } = state.data;
  elements.stats.innerHTML = [
    { label: "Assets", value: stats.totalAssets },
    { label: "Open Items", value: stats.dueSoon },
    { label: "Urgent", value: stats.urgent },
    { label: "Tracked Spend", value: money(stats.totalCost) }
  ].map((item) => `<article class="stat-card"><div class="value">${item.value}</div><div class="label">${item.label}</div></article>`).join("");
}

function renderSelects() {
  elements.recordAssetId.innerHTML = state.data.assets
    .map((asset) => `<option value="${asset.id}">${asset.name}</option>`)
    .join("");
}

function renderAssets() {
  elements.assetList.innerHTML = "";
  state.data.assets.forEach((asset) => {
    elements.assetList.appendChild(buildCard(asset.name, asset.priority, [
      { label: "Category", value: asset.category },
      { label: "Purchase Year", value: asset.purchase_year || "Unknown" }
    ]));
  });
}

function renderRecords() {
  elements.recordList.innerHTML = "";
  state.data.records.forEach((record) => {
    const asset = state.data.assets.find((entry) => entry.id === record.asset_id);
    elements.recordList.appendChild(buildCard(record.task, record.status, [
      { label: "Asset", value: asset ? asset.name : "Unknown" },
      { label: "Due", value: record.due_date || "No due date" },
      { label: "Cost", value: money(record.cost) },
      { label: "Vendor", value: record.vendor || "Not set" }
    ], record.notes));
  });
}

function render() {
  renderStats();
  renderSelects();
  renderAssets();
  renderRecords();
}

async function refresh() {
  state.data = await request("/api/bootstrap");
  render();
}

async function handleSubmit(form, endpoint, successMessage) {
  const payload = Object.fromEntries(new FormData(form).entries());
  state.data = await request(endpoint, {
    method: "POST",
    body: JSON.stringify(payload)
  });
  render();
  form.reset();
  renderSelects();
  showToast(successMessage);
}

elements.railTabs.forEach((tab) => tab.addEventListener("click", () => setPanel(tab.dataset.panel)));
elements.heroTabs.forEach((tab) => tab.addEventListener("click", () => setPanel(tab.dataset.panelTarget)));

elements.assetForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await handleSubmit(elements.assetForm, "/api/assets", "Asset saved.");
  } catch (error) {
    showToast(error.message, true);
  }
});

elements.recordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await handleSubmit(elements.recordForm, "/api/records", "Maintenance record saved.");
  } catch (error) {
    showToast(error.message, true);
  }
});

refresh().catch((error) => showToast(error.message, true));
