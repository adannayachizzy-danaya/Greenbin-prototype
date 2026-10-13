const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });

const hex = (buf) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: 100000 },
    key, 256
  );
  return hex(bits);
}

export async function onRequestPost({ request, env }) {
  try {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";

    let body;
    try { body = await request.json(); }
    catch { return json({ error: "Invalid data" }, 400); }

    const email = String(body.email || "").trim().toLowerCase().slice(0, 200);
    const password = String(body.password || "").slice(0, 200);

    const tries = await env.DB
      .prepare("SELECT COUNT(*) AS n FROM attempts WHERE kind = 'delete-ip' AND ident = ? AND created_at > datetime('now', '-15 minutes')")
      .bind(ip).first();
    if (tries && tries.n >= 5) {
      return json({ error: "Too many attempts. Please wait 15 minutes and try again." }, 429);
    }

    const user = await env.DB
      .prepare("SELECT id, role, password_hash, salt FROM users WHERE email = ?")
      .bind(email).first();

    const ok = user && (await hashPassword(password, user.salt)) === user.password_hash;
    if (!ok) {
      await env.DB.prepare("INSERT INTO attempts (kind, ident) VALUES ('delete-ip', ?)").bind(ip).run();
      return json({ error: "Wrong email or password" }, 401);
    }

    if (user.role === "admin") {
      return json({ error: "Administrator accounts must be removed by the site owner." }, 403);
    }

    await env.DB.batch([
      env.DB.prepare("DELETE FROM photos WHERE key IN (SELECT photo_key FROM reports WHERE user_id = ? AND photo_key IS NOT NULL)").bind(user.id),
      env.DB.prepare("DELETE FROM reports WHERE user_id = ?").bind(user.id),
      env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(user.id),
      env.DB.prepare("DELETE FROM users WHERE id = ?").bind(user.id),
    ]);

    return json({ ok: true }, 200, {
      "Set-Cookie": "gb_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    });
  } catch (err) {
    return json({ error: "Server problem: " + (err && err.message ? err.message : String(err)) }, 500);
  }
  }
