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
  try {
    const user = await currentUser(request, env);
    if (!user) return json({ error: "Please sign in" }, 401);
    if (user.role !== "admin") return json({ error: "Admins only" }, 403);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: "Invalid data" }, 400); }

    const id = parseInt(params.id, 10);
    if (!id) return json({ error: "Bad report id" }, 400);

    const report = await env.DB
      .prepare("SELECT id, status, assigned_to, assigned_at, collected_at FROM reports WHERE id = ?")
      .bind(id).first();
    if (!report) return json({ error: "Report not found" }, 404);

    let status = report.status;
    let assignedTo = report.assigned_to;

    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status)) return json({ error: "Bad status" }, 400);
      status = body.status;
    }

    if (body.assigned_to !== undefined) {
      if (body.assigned_to === null || body.assigned_to === "") {
        assignedTo = null;
      } else {
        const cid = parseInt(body.assigned_to, 10);
        const c = await env.DB
          .prepare("SELECT id FROM users WHERE id = ? AND role = 'collector'")
          .bind(cid).first();
        if (!c) return json({ error: "That user is not a collector" }, 400);
        assignedTo = cid;
      }
    }

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    let assignedAt = report.assigned_at;
    if (assignedTo !== report.assigned_to) assignedAt = assignedTo ? now : null;
    const collectedAt = status === "Resolved" ? (report.collected_at || now) : null;

    await env.DB
      .prepare("UPDATE reports SET status = ?, assigned_to = ?, assigned_at = ?, collected_at = ? WHERE id = ?")
      .bind(status, assignedTo, assignedAt, collectedAt, id).run();

    return json({ ok: true });
  } catch (err) {
    return json({ error: "Server problem: " + (err && err.message ? err.message : String(err)) }, 500);
  }
}
