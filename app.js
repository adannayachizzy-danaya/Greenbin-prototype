(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const CATS = ["Plastic","Organic","Paper","Glass","Metal","E-waste","Hazardous","Mixed / General"];

  function renderStats(data) {
    const s = data.stats || {};
    const reports = data.reports || [];
    const total = s.total || 0;
    const resolved = s.resolved || 0;
    const pending = s.pending || 0;
    const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

    const counts = {};
    CATS.forEach((c) => (counts[c] = 0));
    reports.forEach((r) => { counts[r.category] = (counts[r.category] || 0) + 1; });
    let top = "–", topN = 0;
    Object.entries(counts).forEach(([c, n]) => { if (n > topN) { top = c; topN = n; } });

    $("stat-total").textContent = total;
    $("stat-resolved").textContent = resolved;
    $("stat-resolved-sub").textContent = pct(resolved) + "% of all reports";
    $("bar-resolved").style.width = pct(resolved) + "%";
    $("stat-pending").textContent = pending;
    $("stat-pending-sub").textContent = pct(pending) + "% still open";
    $("bar-pending").style.width = pct(pending) + "%";
    $("stat-top").textContent = top;
    $("stat-top-sub").textContent = topN + " report(s)";
    $("bar-top").style.width = (reports.length ? Math.round((topN / reports.length) * 100) : 0) + "%";

    const max = Math.max(1, ...Object.values(counts));
    $("category-bars").innerHTML = CATS.map((c) =>
      `<div class="cat-row"><span class="cat-name">${esc(c)}</span>` +
      `<div class="bar"><span style="width:${Math.round((counts[c] / max) * 100)}%"></span></div>` +
      `<span class="cat-count">${counts[c]}</span></div>`
    ).join("");
  }

  function renderList(reports) {
    const box = document.querySelector(".reports-list");
    if (!box) return;
    if (!reports.length) {
      box.innerHTML = '<div class="report-card">No reports yet. Be the first to report!</div>';
      return;
    }
    box.innerHTML = reports.map((r) => {
      const done = r.status === "Resolved";
      const when = new Date(String(r.created_at).replace(" ", "T") + "Z").toLocaleString();
      return `<article class="report-card">
        <div class="report-top">
          <span class="badge badge-cat">${esc(r.category)}</span>
          <span class="badge ${done ? "badge-status-collected" : "badge-status-reported"}">${done ? "Collected" : "Reported"}</span>
        </div>
        <h3 style="font-size:1.05rem">${esc(r.location)}</h3>
        <p class="report-meta">Urgency: ${esc(r.urgency)} · ${esc(r.nickname || "Anonymous")} · ${esc(when)}</p>
        <p class="report-desc">${esc(r.description)}</p>
      </article>`;
    }).join("");
  }

  async function load() {
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      renderStats(data);
      renderList(data.reports || []);
    } catch (e) { console.error("Load failed", e); }
  }

  function showErr(id, bad) {
    const el = $(id);
    if (el) el.classList.toggle("visible", bad);
  }

  // Runs BEFORE the old script's handler and replaces it
  document.addEventListener("submit", async (e) => {
    if (!e.target || e.target.id !== "report-form") return;
    e.preventDefault();
    e.stopImmediatePropagation();

    const form = e.target;
    const location = form.location.value.trim();
    const category = form.category.value;
    const description = form.description.value.trim();
    const nickname = form.nickname.value.trim();
    const urgency = (form.querySelector('input[name="urgency"]:checked') || {}).value || "Medium";

    const badLoc = location.length < 3;
    const badCat = !category;
    const badDesc = description.length < 10;
    showErr("location-error", badLoc);
    showErr("category-error", badCat);
    showErr("description-error", badDesc);
    if (badLoc || badCat || badDesc) return;

    const btn = form.querySelector('button[type="submit"]');
    const conf = $("confirmation");
    btn.disabled = true;
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, location, category, description, urgency }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out.error || "Could not save");
      form.reset();
      $("category").dispatchEvent(new Event("change"));
      conf.innerHTML = "<strong>Thank you!</strong>Your report was saved.";
      conf.classList.add("visible");
      await load();
    } catch (err) {
      conf.innerHTML = "<strong>Sorry.</strong>" + esc(err.message);
      conf.classList.add("visible");
    } finally {
      btn.disabled = false;
    }
  }, true);

  // Update the old "mock data" wording
  const note = document.querySelector(".mock-note");
  if (note) note.textContent = "Live data from the GreenBin database.";
  const eyebrow = document.querySelector(".eyebrow");
  if (eyebrow) eyebrow.textContent = "Live app · real database";

  load();
})();
