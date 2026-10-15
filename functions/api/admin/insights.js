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

    const url = new URL(request.url);
    let days = parseInt(url.searchParams.get("days"), 10);
    if (!days || days < 1) days = 30;
    if (days > 365) days = 365;
    const q = String(url.searchParams.get("q") || "").trim().slice(0, 60);
    const like = "%" + q.replace(/[%_]/g, "") + "%";

    const where = "created_at >= datetime('now', ?) AND location LIKE ?";
    const binds = ["-" + days + " days", like];

    const t = await env.DB.prepare(
      `SELECT COUNT(*) AS total,
              SUM(status = 'Resolved') AS resolved,
              SUM(status = 'In progress') AS in_progress,
              SUM(status = 'Pending') AS pending,
              SUM(assigned_to IS NULL AND status != 'Resolved') AS unassigned,
              SUM(urgency = 'High') AS high,
              SUM(photo_key IS NOT NULL) AS with_photo,
              SUM(lat IS NOT NULL) AS with_pin,
              AVG(CASE WHEN collected_at IS NOT NULL
                       THEN (julianday(collected_at) - julianday(created_at)) * 24 END) AS avg_hours
       FROM reports WHERE ${where}`
    ).bind(...binds).first();

    const cats = await env.DB.prepare(
      `SELECT category, COUNT(*) AS n, SUM(status = 'Resolved') AS resolved
       FROM reports WHERE ${where} GROUP BY category ORDER BY n DESC`
    ).bind(...binds).all();

    const weeks = await env.DB.prepare(
      `SELECT date(created_at, '-' || ((CAST(strftime('%w', created_at) AS INTEGER) + 6) % 7) || ' days') AS week,
              COUNT(*) AS n, SUM(status = 'Resolved') AS resolved
       FROM reports WHERE ${where} GROUP BY week ORDER BY week`
    ).bind(...binds).all();

    const oldest = await env.DB.prepare(
      `SELECT id, location, category, urgency, status, created_at
       FROM reports WHERE ${where} AND status != 'Resolved'
       ORDER BY created_at ASC LIMIT 5`
    ).bind(...binds).all();

    const n = (v) => Number(v || 0);
    return json({
      days, q,
      totals: {
        total: n(t.total), resolved: n(t.resolved), in_progress: n(t.in_progress),
        pending: n(t.pending), unassigned: n(t.unassigned), high: n(t.high),
        with_photo: n(t.with_photo), with_pin: n(t.with_pin),
        avg_hours: t.avg_hours == null ? null : Number(t.avg_hours),
      },
      categories: cats.results.map((c) => ({ category: c.category, n: n(c.n), resolved: n(c.resolved) })),
      weeks: weeks.results.map((w) => ({ week: w.week, n: n(w.n), resolved: n(w.resolved) })),
      oldest_open: oldest.results,
    });
  } catch (err) {
    return json({ error: "Server problem: " + (err && err.message ? err.message : String(err)) }, 500);
  }
      }
