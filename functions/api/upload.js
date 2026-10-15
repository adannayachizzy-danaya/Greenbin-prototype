const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// Test: open /api/upload in the browser
export async function onRequestGet({ env }) {
  try {
    const t = await env.DB.prepare("SELECT COUNT(*) AS n FROM photos").first();
    return json({ upload: "ready", photos_saved: t.n });
  } catch (err) {
    return json({ upload: "problem", detail: String(err && err.message ? err.message : err) });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const m = (request.headers.get("Cookie") || "").match(/(?:^|;\s*)gb_session=([a-f0-9]+)/);
    if (!m) return json({ error: "Please sign in first to submit a report" }, 401);
    const user = await env.DB
      .prepare("SELECT u.id FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > datetime('now')")
      .bind(m[1]).first();
    if (!user) return json({ error: "Please sign in first to submit a report" }, 401);

    const ident = String(user.id);
    const recent = await env.DB
      .prepare("SELECT COUNT(*) AS n FROM attempts WHERE kind = 'upload-user' AND ident = ? AND created_at > datetime('now', '-1 hour')")
      .bind(ident).first();
    if (recent && recent.n >= 10) {
      return json({ error: "Upload limit reached (10 photos per hour). Please try again later." }, 429);
    }

    const form = await request.formData();
    const file = form.get("photo");
    if (!file || typeof file === "string") return json({ error: "No photo found" }, 400);
    if (file.size > 1024 * 1024) return json({ error: "Photo is too large" }, 413);

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)) {
      return json({ error: "Only JPEG photos are allowed" }, 400);
    }

    let s = "";
    for (let i = 0; i < bytes.length; i += 8192) {
      s += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
    }
    const data = btoa(s);

    const key = [...crypto.getRandomValues(new Uint8Array(16))]
      .map((x) => x.toString(16).padStart(2, "0")).join("") + ".jpg";

    await env.DB.batch([
      env.DB.prepare("INSERT INTO photos (key, data) VALUES (?, ?)").bind(key, data),
      env.DB.prepare("INSERT INTO attempts (kind, ident) VALUES ('upload-user', ?)").bind(ident),
      // Tidy up: remove photos older than a day that no report uses
      env.DB.prepare("DELETE FROM photos WHERE created_at < datetime('now', '-1 day') AND key NOT IN (SELECT photo_key FROM reports WHERE photo_key IS NOT NULL)"),
    ]);

    return json({ ok: true, key }, 201);
  } catch (err) {
    return json({ error: "Server problem: " + (err && err.message ? err.message : String(err)) }, 500);
  }
}
  
