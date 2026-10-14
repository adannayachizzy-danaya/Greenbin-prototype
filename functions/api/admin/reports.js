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
      .prepare(`SELECT r.id, r.nickname, r.location, r.category, r.description, r.urgency, r.status,
                       r.photo_key, r.lat, r.lng, r.created_at, r.assigned_to, r.assigned_at, r.collected_at,
                       u.email AS assignee_email
                FROM reports r LEFT JOIN users u ON u.id = r.assigned_to
                ORDER BY r.id DESC LIMIT 200`)
      .all();
    return json({ reports: results });
  } catch (err) {
    return json({ error: "Server problem: " + (err && err.message ? err.message : String(err)) }, 500);
  }
}
