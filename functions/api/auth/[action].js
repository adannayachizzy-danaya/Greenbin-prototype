const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });

const hex = (buf) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const randomHex = (n) => hex(crypto.getRandomValues(new Uint8Array(n)));

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

function getToken(request) {
  const m = (request.headers.get("Cookie") || "").match(/(?:^|;\s*)gb_session=([a-f0-9]+)/);
  return m ? m[1] : null;
}

async function currentUser(request, env) {
  const token = getToken(request);
  if (!token) return null;
  return await env.DB
    .prepare("SELECT u.id, u.email, u.role, u.full_name, u.phone, u.area, u.account_type, u.collector_status FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > datetime('now')")
    .bind(token).first();
}

async function startSession(env, userId) {
  const token = randomHex(32);
  await env.DB
    .prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))")
    .bind(token, userId).run();
  return `gb_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`;
}

async function tooMany(env, kind, ident, max, minutes) {
  const r = await env.DB
    .prepare("SELECT COUNT(*) AS n FROM attempts WHERE kind = ? AND ident = ? AND created_at > datetime('now', ?)")
    .bind(kind, ident, `-${minutes} minutes`).first();
  return (r ? r.n : 0) >= max;
}

async function record(env, kind, ident) {
  await env.DB.prepare("INSERT INTO attempts (kind, ident) VALUES (?, ?)").bind(kind, ident).run();
}

export async function onRequest({ request, env, params }) {
  try {
    const action = params.action;
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";

    if (action === "me" && request.method === "GET") {
      return json({ user: await currentUser(request, env) });
    }

    if (request.method !== "POST") return json({ error: "Not allowed" }, 405);

    if (action === "logout") {
      const token = getToken(request);
      if (token) await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
      return json({ ok: true }, 200, {
        "Set-Cookie": "gb_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
      });
    }

    let body;
    try { body = await request.json(); }
    catch { return json({ error: "Invalid data" }, 400); }

    const email = String(body.email || "").trim().toLowerCase().slice(0, 200);
    const password = String(body.password || "").slice(0, 200);

    await env.DB.prepare("DELETE FROM attempts WHERE created_at < datetime('now', '-1 day')").run();

    if (action === "signup") {
      if (await tooMany(env, "signup-ip", ip, 10, 60)) {
        return json({ error: "Too many sign-ups from this network. Please try again later." }, 429);
      }

      const fullName = String(body.full_name || "").trim().replace(/\s+/g, " ");
      const phone = String(body.phone || "").trim();
      const area = String(body.area || "").trim();
      const accountType = body.account_type === "collector" ? "collector" : "household";

      if (fullName.length < 2 || fullName.length > 60) return json({ error: "Please enter your full name" }, 400);
      if (!/^[0-9+\-\s()]{7,20}$/.test(phone)) return json({ error: "Please enter a valid phone number" }, 400);
      if (area.length < 2 || area.length > 80) return json({ error: "Please enter your area" }, 400);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Please enter a valid email" }, 400);
      if (password.length < 8) return json({ error: "Password must be at least 8 characters" }, 400);

      const exists = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
      if (exists) return json({ error: "That email is already registered" }, 409);

      const salt = randomHex(16);
      const hash = await hashPassword(password, salt);
      const status = accountType === "collector" ? "pending" : "none";
      const r = await env.DB
        .prepare("INSERT INTO users (email, password_hash, salt, full_name, phone, area, account_type, collector_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(email, hash, salt, fullName, phone, area, accountType, status).run();
      await record(env, "signup-ip", ip);
      const cookie = await startSession(env, r.meta.last_row_id);
      return json({ ok: true, user: { email } }, 201, { "Set-Cookie": cookie });
    }

    if (action === "login") {
      if ((await tooMany(env, "login-email", email, 5, 15)) || (await tooMany(env, "login-ip", ip, 20, 15))) {
        return json({ error: "Too many attempts. Please wait 15 minutes and try again." }, 429);
      }

      const user = await env.DB
        .prepare("SELECT id, email, password_hash, salt FROM users WHERE email = ?")
        .bind(email).first();

      let ok = false;
      if (user) ok = (await hashPassword(password, user.salt)) === user.password_hash;

      if (!ok) {
        await record(env, "login-email", email);
        await record(env, "login-ip", ip);
        return json({ error: "Wrong email or password" }, 401);
      }

      await env.DB.prepare("DELETE FROM attempts WHERE kind = 'login-email' AND ident = ?").bind(email).run();
      const cookie = await startSession(env, user.id);
      return json({ ok: true, user: { email: user.email } }, 200, { "Set-Cookie": cookie });
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    return json({ error: "Server problem: " + (err && err.message ? err.message : String(err)) }, 500);
  }
                    }
