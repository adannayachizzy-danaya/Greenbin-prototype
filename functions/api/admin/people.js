const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

async function currentUser(request, env) {
  const m = (request.headers.get("Cookie") || "").match(/(?:^|;\s*)gb_session=([a-f0-9]+)/);
  if (!m) return null;
  return await env.DB
    .prepare("SELECT u.id, u.email, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > datetime('now')")
    .bind(m[1]).first();
}

export async function onRequestGet({ request, env }) {
  try {
    const user = await currentUser(request, env);
    if (!user) return json({ error: "Please sign in" }, 401);
    if (user.role !== "admin") return json({ error: "Admins only" }, 403);

    const { results } = await env.DB
      .prepare(`SELECT id, email, full_name, phone, area, collector_status, created_at
                FROM users WHERE account_type = 'collector' AND role != 'admin'
                ORDER BY CASE collector_status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, id DESC
                LIMIT 200`)
      .all();
    return json({ people: results });
  } catch (err) {
    return json({ error: "Server problem: " + (err && err.message ? err.message : String(err)) }, 500);
  }
}

export async function onRequestPatch({ request, env }) {
  try {
    const user = await currentUser(request, env);
    if (!user) return json({ error: "Please sign in" }, 401);
    if (user.role !== "admin") return json({ error: "Admins only" }, 403);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: "Invalid data" }, 400); }

    const id = parseInt(body.id, 10);
    if (!id) return json({ error: "Bad user id" }, 400);

    let r;
    if (body.action === "approve") {
      r = await env.DB
        .prepare("UPDATE users SET role = 'collector', collector_status = 'approved' WHERE id = ? AND account_type = 'collector' AND role != 'admin'")
        .bind(id).run();
    } else if (body.action === "reject") {
      r = await env.DB
        .prepare("UPDATE users SET role = 'user', collector_status = 'rejected' WHERE id = ? AND account_type = 'collector' AND role != 'admin'")
        .bind(id).run();
    } else {
      return json({ error: "Unknown action" }, 400);
    }
    if (!r.meta.changes) return json({ error: "Collector not found" }, 404);
    return json({ ok: true });
  } catch (err) {
    return json({ error: "Server problem: " + (err && err.message ? err.message : String(err)) }, 500);
  }
}
people.html (main page of the repo)
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#14532d">
<title>Collector applications</title>
<style>
  *{box-sizing:border-box}
  html,body{max-width:100%;overflow-x:hidden}
  body{margin:0;font-family:-apple-system,Roboto,Arial,sans-serif;background:#f8faf7;color:#1a2b1f;line-height:1.5}
  header{background:#14532d;color:#fff;padding:1rem 1.2rem;display:flex;justify-content:space-between;gap:.5rem}
  header a{color:#fff;font-weight:700}
  main{max-width:640px;margin:0 auto;padding:1rem}
  .card{background:#fff;border:1px solid #dbe5dd;border-radius:16px;padding:1rem;margin-bottom:1rem;box-shadow:0 1px 4px rgba(16,28,20,.08)}
  .badge{font-size:.85rem;font-weight:800;padding:.2rem .7rem;border-radius:999px;border:2px solid #a16207;background:#fefce8;color:#713f12}
  .badge.approved{border-color:#166534;background:#dcfce7;color:#14532d}
  .badge.rejected{border-color:#991b1b;background:#fee2e2;color:#7f1d1d}
  .row{display:flex;justify-content:space-between;align-items:center;gap:.5rem;flex-wrap:wrap}
  .meta{color:#33463a;font-size:.92rem;margin:.2rem 0}
  .meta a{color:#166534;font-weight:700}
  .btns{display:flex;gap:.6rem;margin-top:.8rem}
  button{flex:1;min-height:48px;border-radius:14px;font:inherit;font-weight:800;font-size:1rem;cursor:pointer}
  .go{background:#166534;color:#fff;border:0}
  .no{background:#fff;color:#991b1b;border:2px solid #991b1b}
  button:disabled{opacity:.6}
  .msg{padding:1rem;background:#fee2e2;border:2px solid #991b1b;border-radius:12px;color:#5f0f0f;font-weight:600}
  .tip{padding:.8rem 1rem;background:#f0fdf4;border:2px solid #166534;border-radius:12px;margin-bottom:1rem}
</style>
</head>
<body>
<header><strong>Collector applications</strong><a href="/admin.html">Admin</a></header>
<main id="app"><p>Loading...</p></main>
<script>
var esc = function (s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
};
var app = document.getElementById("app");

function card(p) {
  var phone = String(p.phone || "").replace(/[^0-9+]/g, "");
  var st = p.collector_status;
  var btns = "";
  if (st !== "approved") btns += '<button class="go" onclick="act(' + p.id + ',\'approve\',this)">Approve</button>';
  if (st !== "rejected") btns += '<button class="no" onclick="act(' + p.id + ',\'reject\',this)">' + (st === "approved" ? "Revoke" : "Reject") + '</button>';
  return '<div class="card"><div class="row"><strong>' + esc(p.full_name || "No name") + '</strong>' +
    '<span class="badge ' + esc(st) + '">' + esc(st) + '</span></div>' +
    '<p class="meta">' + esc(p.email) + '</p>' +
    '<p class="meta">Area: ' + esc(p.area || "–") + '</p>' +
    '<p class="meta">Phone: ' + (phone ? '<a href="tel:' + esc(phone) + '">' + esc(p.phone) + '</a>' : "–") + '</p>' +
    '<p class="meta">Applied: ' + esc(String(p.created_at || "").slice(0, 10)) + '</p>' +
    '<div class="btns">' + btns + '</div><p class="meta" id="m-' + p.id + '"></p></div>';
}

function load() {
  fetch("/api/admin/people", { cache: "no-store" }).then(function (r) {
    return r.json().catch(function () { return {}; }).then(function (d) { return { status: r.status, d: d }; });
  }).then(function (res) {
    if (res.status === 401) { app.innerHTML = '<div class="msg">Please sign in on the <a href="/">main app</a> first.</div>'; return; }
    if (res.status === 403) { app.innerHTML = '<div class="msg">This page is for admins only.</div>'; return; }
    if (!res.d.people) { app.innerHTML = '<div class="msg">' + esc(res.d.error || "Could not load") + '</div>'; return; }
    var tip = '<div class="tip">Call or message each applicant before approving. Check their name, area and that the phone number is theirs.</div>';
    app.innerHTML = tip + (res.d.people.length ? res.d.people.map(card).join("") : "<p>No collector applications yet.</p>");
  }).catch(function () { app.innerHTML = '<div class="msg">Connection problem. Please refresh.</div>'; });
}

function act(id, action, b) {
  b.disabled = true;
  var n = document.getElementById("m-" + id);
  if (n) n.textContent = "Saving...";
  fetch("/api/admin/people", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: id, action: action })
  }).then(function (r) {
    return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; });
  }).then(function (res) {
    if (res.ok) { load(); return; }
    if (n) n.textContent = res.d.error || "Could not save";
    b.disabled = false;
  }).catch(function () { if (n) n.textContent = "Connection problem"; b.disabled = false; });
}
load();
</script>
</body>
</html>
