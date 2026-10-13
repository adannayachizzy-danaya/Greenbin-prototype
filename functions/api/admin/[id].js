const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const STATUSES = ["Pending", "In progress", "Resolved"];

async function currentUser(request, env) {
  const m = (request.headers.get("Cookie") || "").match(/(?:^|;\s*)gb_session=([a-f0-9]+)/);
  if (!m) return null;
  return await env.DB
    .prepare("SELECT u.id, u.email, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > datetime('now')")
    .bind(m[1]).first();
}

export async function onRequestPatch({ request, env, params }) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Please sign in" }, 401);
  if (user.role !== "admin") return json({ error: "Admins only" }, 403);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "Invalid data" }, 400); }

  if (!STATUSES.includes(body.status)) return json({ error: "Bad status" }, 400);

  const id = parseInt(params.id, 10);
  if (!id) return json({ error: "Bad report id" }, 400);

  await env.DB.prepare("UPDATE reports SET status = ? WHERE id = ?")
    .bind(body.status, id).run();

  return json({ ok: true });
}
