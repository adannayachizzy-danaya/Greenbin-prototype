const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const STATUSES = ["Pending", "In progress", "Resolved"];

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
    if (user.role !== "collector" && user.role !== "admin") return json({ error: "Collectors only" }, 403);

    const cols = "id, nickname, location, category, description, urgency, status, photo_key, lat, lng, created_at, assigned_at, collected_at";
    const q = user.role === "admin"
      ? env.DB.prepare(`SELECT ${cols} FROM reports WHERE assigned_to IS NOT NULL ORDER BY id DESC LIMIT 200`)
      : env.DB.prepare(`SELECT ${cols} FROM reports WHERE assigned_to = ? ORDER BY id DESC LIMIT 200`).bind(user.id);

    const { results } = await q.all();
    return json({ user: { email: user.email, role: user.role }, jobs: results });
  } catch (err) {
    return json({ error: "Server problem: " + (err && err.message ? err.message : String(err)) }, 500);
  }
}

export async function onRequestPatch({ request, env }) {
  try {
    const user = await currentUser(request, env);
    if (!user) return json({ error: "Please sign in" }, 401);
    if (user.role !== "collector") return json({ error: "Collectors only" }, 403);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: "Invalid data" }, 400); }

    const id = parseInt(body.id, 10);
    if (!id) return json({ error: "Bad report id" }, 400);
    if (!STATUSES.includes(body.status)) return json({ error: "Bad status" }, 400);

    const report = await env.DB
      .prepare("SELECT id, collected_at FROM reports WHERE id = ? AND assigned_to = ?")
      .bind(id, user.id).first();
    if (!report) return json({ error: "That job is not assigned to you" }, 403);

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const collectedAt = body.status === "Resolved" ? (report.collected_at || now) : null;

    await env.DB
      .prepare("UPDATE reports SET status = ?, collected_at = ? WHERE id = ?")
      .bind(body.status, collectedAt, id).run();

    return json({ ok: true });
  } catch (err) {
    return json({ error: "Server problem: " + (err && err.message ? err.message : String(err)) }, 500);
  }
  }
