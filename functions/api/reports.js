const CATEGORIES = ["Plastic","Organic","Paper","Glass","Metal","E-waste","Hazardous","Mixed / General"];
const URGENCIES = ["Low","Medium","High"];

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// GET /api/reports -> list reports + stats
export async function onRequestGet({ env }) {
  const { results } = await env.DB
    .prepare("SELECT id, nickname, location, category, description, urgency, status, created_at FROM reports ORDER BY id DESC LIMIT 100")
    .all();

  const stats = await env.DB
    .prepare("SELECT COUNT(*) AS total, SUM(status='Resolved') AS resolved, SUM(status!='Resolved') AS pending FROM reports")
    .first();

  return json({ reports: results, stats });
}

// POST /api/reports -> save a new report
export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: "Invalid data" }, 400); }

  const location = String(body.location || "").trim();
  const description = String(body.description || "").trim();
  const category = String(body.category || "");
  const urgency = URGENCIES.includes(body.urgency) ? body.urgency : "Medium";
  const nickname = String(body.nickname || "").trim().slice(0, 40);

  if (location.length < 3) return json({ error: "Location too short" }, 400);
  if (description.length < 10) return json({ error: "Description too short" }, 400);
  if (!CATEGORIES.includes(category)) return json({ error: "Bad category" }, 400);

  const result = await env.DB
    .prepare("INSERT INTO reports (nickname, location, category, description, urgency) VALUES (?, ?, ?, ?, ?)")
    .bind(nickname, location.slice(0, 120), category, description.slice(0, 1000), urgency)
    .run();

  return json({ ok: true, id: result.meta.last_row_id }, 201);
}
