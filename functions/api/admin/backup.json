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
    const user = await currentUser(request, env);
    if (!user) return json({ error: "Please sign in" }, 401);
    if (user.role !== "admin") return json({ error: "Admins only" }, 403);

    const withPhotos = new URL(request.url).searchParams.get("photos") === "1";

    const users = (await env.DB.prepare("SELECT id, email, password_hash, salt, role, created_at FROM users").all()).results;
    const reports = (await env.DB.prepare("SELECT * FROM reports").all()).results;

    const backup = {
      app: "GreenBin",
      created_at: new Date().toISOString(),
      users,
      reports,
    };

    if (withPhotos) {
      backup.photos = (await env.DB.prepare("SELECT key, data, created_at FROM photos").all()).results;
    }

    const name = "greenbin-backup-" + new Date().toISOString().slice(0, 10) + (withPhotos ? "-with-photos" : "") + ".json";
    return new Response(JSON.stringify(backup), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return json({ error: "Server problem: " + (err && err.message ? err.message : String(err)) }, 500);
  }
}
