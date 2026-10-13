const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function currentUser(request, env) {
  const m = (request.headers.get("Cookie") || "").match(/(?:^|;\s*)gb_session=([a-f0-9]+)/);
  if (!m) return null;
  return await env.DB
    .prepare("SELECT u.id FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > datetime('now')")
    .bind(m[1]).first();
}

export async function onRequestPost({ request, env }) {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Please sign in first to submit a report" }, 401);

  let form;
  try { form = await request.formData(); }
  catch { return json({ error: "Invalid upload" }, 400); }

  const file = form.get("photo");
  if (!file || typeof file === "string") return json({ error: "No photo found" }, 400);
  if (file.size > 3 * 1024 * 1024) return json({ error: "Photo is too large" }, 413);

  const buf = await file.arrayBuffer();
  const b = new Uint8Array(buf);
  if (!(b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff)) {
    return json({ error: "Only JPEG photos are allowed" }, 400);
  }

  const key = [...crypto.getRandomValues(new Uint8Array(16))]
    .map((x) => x.toString(16).padStart(2, "0")).join("") + ".jpg";

  await env.PHOTOS.put(key, buf, { httpMetadata: { contentType: "image/jpeg" } });
  return json({ ok: true, key }, 201);
}
