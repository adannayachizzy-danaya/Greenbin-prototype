functions/api/admin/people.js
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
