(function () {
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const anchor = document.getElementById("reports");
  if (!anchor) return;

  const sec = document.createElement("section");
  sec.className = "block";
  sec.id = "my-reports";
  sec.hidden = true;
  sec.innerHTML =
    '<h2>My reports</h2><p class="section-desc">Reports you submitted while signed in.</p>' +
    '<div id="my-list" style="display:grid;gap:1.25rem;margin-top:1.5rem"></div>';
  anchor.insertAdjacentElement("afterend", sec);

  async function refresh() {
    try {
      const me = await (await fetch("/api/auth/me")).json();
      if (!me.user) { sec.hidden = true; return; }
      const data = await (await fetch("/api/reports?mine=1")).json();
      const list = document.getElementById("my-list");
      sec.hidden = false;
      if (!data.reports.length) {
        list.innerHTML = '<div class="report-card">You have not submitted any reports yet.</div>';
        return;
      }
      list.innerHTML = data.reports.map((r) => {
        const done = r.status === "Resolved";
        const when = new Date(String(r.created_at).replace(" ", "T") + "Z").toLocaleString();
        const photo = r.photo_key
          ? '<img src="/api/photo/' + esc(r.photo_key) + '" alt="Photo of reported waste" loading="lazy" style="width:100%;max-height:260px;object-fit:cover;border-radius:10px;margin-top:.75rem">'
          : "";
        return '<article class="report-card">' +
          '<div class="report-top"><span class="badge badge-cat">' + esc(r.category) + '</span>' +
          '<span class="badge ' + (done ? "badge-status-collected" : "badge-status-reported") + '">' +
          (done ? "Collected" : esc(r.status === "In progress" ? "In progress" : "Reported")) + '</span></div>' +
          '<h3 style="font-size:1.05rem">' + esc(r.location) + '</h3>' +
          '<p class="report-meta">Urgency: ' + esc(r.urgency) + " · " + esc(when) + '</p>' +
          '<p class="report-desc">' + esc(r.description) + '</p>' + photo + '</article>';
      }).join("");
    } catch (e) { console.error(e); }
  }

  ["account-message", "confirmation"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) new MutationObserver(refresh).observe(el, { childList: true, subtree: true, characterData: true });
  });

  refresh();
})();
