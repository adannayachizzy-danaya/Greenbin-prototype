const CATEGORIES = ["Plastic","Organic","Paper","Glass","Metal","E-waste","Hazardous","Mixed / General"];
const URGENCIES = ["Low","Medium","High"];
const COLS = "id, nickname, location, category, description, urgency, status, photo_key, lat, lng, created_at";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
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
    const url = new URL(request.url);

    if (url.searchParams.get("mine") === "1") {
      const user = await currentUser(request, env);
      if (!user) return json({ reports: [] });
      const { results } = await env.DB
        .prepare(`SELECT ${COLS} FROM reports WHERE user_id = ? ORDER BY id DESC LIMIT 100`)
        .bind(user.id).all();
      return json({ reports: results });
    }

    const { results } = await env.DB
      .prepare(`SELECT ${COLS} FROM reports ORDER BY id DESC LIMIT 100`)
      .all();
    const stats = await env.DB
      .prepare("SELECT COUNT(*) AS total, SUM(status='Resolved') AS resolved, SUM(status!='Resolved') AS pending FROM reports")
      .first();
    return json({ reports: results, stats });
  } catch (err) {
    return json({ error: "Server problem: " + (err && err.message ? err.message : String(err)) }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const user = await currentUser(request, env);
    if (!user) return json({ error: "Please sign in first to submit a report" }, 401);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: "Invalid data" }, 400); }

    const location = String(body.location || "").trim();
    const description = String(body.description || "").trim();
    const category = String(body.category || "");
    const urgency = URGENCIES.includes(body.urgency) ? body.urgency : "Medium";
    const nickname = String(body.nickname || "").trim().slice(0, 40);
    const photoKey = /^[a-f0-9]{32}\.jpg$/.test(String(body.photo_key || "")) ? body.photo_key : null;

    const lat = Number(body.lat);
    const lng = Number(body.lng);
    const hasGeo = body.lat != null && body.lng != null &&
      isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

    if (location.length < 3) return json({ error: "Location too short" }, 400);
    if (description.length < 10) return json({ error: "Description too short" }, 400);
    if (!CATEGORIES.includes(category)) return json({ error: "Bad category" }, 400);

    const result = await env.DB
      .prepare("INSERT INTO reports (user_id, nickname, location, category, description, urgency, photo_key, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(user.id, nickname, location.slice(0, 120), category, description.slice(0, 1000), urgency, photoKey,
            hasGeo ? lat : null, hasGeo ? lng : null)
      .run();

    return json({ ok: true, id: result.meta.last_row_id }, 201);
  } catch (err) {
    return json({ error: "Server problem: " + (err && err.message ? err.message : String(err)) }, 500);
  }
}
