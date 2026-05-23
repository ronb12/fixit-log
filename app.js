(() => {
  const key = "fixit-log-v1";
  const state = JSON.parse(localStorage.getItem(key) || "null") || {
    items: [
      { id: crypto.randomUUID(), asset: "Honda Accord", task: "Oil Change", due: "2026-06-12", cost: 84.2, status: "Logged" },
      { id: crypto.randomUUID(), asset: "Home HVAC", task: "Filter Replacement", due: "2026-06-04", cost: 18, status: "Due Soon" },
    ],
  };
  const save = () => localStorage.setItem(key, JSON.stringify(state));

  document.head.insertAdjacentHTML("beforeend", `<style>
    body{margin:0;background:#12100d;color:#f6f1e8;font:16px/1.45 system-ui,sans-serif}main{max-width:1100px;margin:0 auto;padding:28px 20px 48px}
    .fx-grid,.fx-list{display:grid;gap:16px}.fx-panels{display:grid;gap:16px;grid-template-columns:1.15fr .85fr}.fx-card{background:#221d16;border:1px solid #4d3c2a;border-radius:20px;padding:18px}
    form{display:grid;gap:10px}.row{display:grid;gap:10px;grid-template-columns:repeat(2,minmax(0,1fr))}input,select,button{font:inherit;padding:11px 12px;border-radius:12px;border:1px solid #6d573d}
    input,select{background:#16110b;color:#fff4e8}button{background:#e8b160;color:#1f160b;font-weight:700;cursor:pointer}.item{display:grid;gap:4px;background:#18130e;border-radius:14px;padding:14px}
    .meta{color:#d3c2aa}.stats{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}.stat{background:#18130e;padding:14px;border-radius:14px}.good{color:#92f5b1}
    @media (max-width:760px){.fx-panels,.row{grid-template-columns:1fr}}
  </style>`);

  const main = document.querySelector("main");

  function render() {
    const total = state.items.reduce((sum, item) => sum + Number(item.cost), 0);
    const dueSoon = state.items.filter((item) => item.status !== "Done").length;
    main.innerHTML = `
      <div class="fx-grid">
        <section class="fx-card">
          <h1>FixIt Log</h1>
          <p class="meta">Track repairs, reminders, and cost history for your car and home with saved local records.</p>
          <div class="stats">
            <div class="stat"><strong>${state.items.length}</strong><div class="meta">Repair records</div></div>
            <div class="stat"><strong>$${total.toFixed(2)}</strong><div class="meta">Logged spend</div></div>
            <div class="stat"><strong>${dueSoon}</strong><div class="meta">Open reminders</div></div>
          </div>
        </section>
        <section class="fx-panels">
          <article class="fx-card">
            <h2>Add Record</h2>
            <form id="repairForm">
              <div class="row">
                <input name="asset" placeholder="Asset: House, Toyota Camry" required>
                <input name="task" placeholder="Task" required>
              </div>
              <div class="row">
                <input name="due" type="date" required>
                <input name="cost" type="number" min="0" step="0.01" placeholder="Cost">
              </div>
              <select name="status"><option>Logged</option><option>Due Soon</option><option>Watching</option></select>
              <button type="submit">Save Record</button>
            </form>
          </article>
          <article class="fx-card">
            <h2>Repair History</h2>
            <div class="fx-list">
              ${state.items.map((item) => `<div class="item"><b>${item.task}</b><span>${item.asset}</span><span class="meta">${item.due} • $${Number(item.cost).toFixed(2)}</span><div class="row"><span class="${item.status === "Done" ? "good" : "meta"}">${item.status}</span><button data-done="${item.id}">${item.status === "Done" ? "Reopen" : "Mark Done"}</button></div></div>`).join("")}
            </div>
          </article>
        </section>
      </div>`;

    document.querySelector("#repairForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      state.items.unshift({
        id: crypto.randomUUID(),
        asset: String(form.get("asset")),
        task: String(form.get("task")),
        due: String(form.get("due")),
        cost: Number(form.get("cost") || 0),
        status: String(form.get("status")),
      });
      save();
      render();
    });

    document.querySelectorAll("[data-done]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = state.items.find((entry) => entry.id === button.dataset.done);
        item.status = item.status === "Done" ? "Logged" : "Done";
        save();
        render();
      });
    });
  }

  save();
  render();
})();
