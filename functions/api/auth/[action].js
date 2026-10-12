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
    .prepare("SELECT u.id, u.email, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > datetime('now')")
    .bind(token).first();
}

async function startSession(env, userId) {
  const token = randomHex(32);
  await env.DB
    .prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))")
    .bind(token, userId).run();
  return `gb_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`;
}

export async function onRequest({ request, env, params }) {
  const action = params.action;

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

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (action === "signup") {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Please enter a valid email" }, 400);
    if (password.length < 8) return json({ error: "Password must be at least 8 characters" }, 400);

    const exists = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    if (exists) return json({ error: "That email is already registered" }, 409);

    const salt = randomHex(16);
    const hash = await hashPassword(password, salt);
    const r = await env.DB
      .prepare("INSERT INTO users (email, password_hash, salt) VALUES (?, ?, ?)")
      .bind(email, hash, salt).run();
    const cookie = await startSession(env, r.meta.last_row_id);
    return json({ ok: true, user: { email } }, 201, { "Set-Cookie": cookie });
  }

  if (action === "login") {
    const user = await env.DB
      .prepare("SELECT id, email, password_hash, salt FROM users WHERE email = ?")
      .bind(email).first();
    if (!user) return json({ error: "Wrong email or password" }, 401);
    const hash = await hashPassword(password, user.salt);
    if (hash !== user.password_hash) return json({ error: "Wrong email or password" }, 401);
    const cookie = await startSession(env, user.id);
    return json({ ok: true, user: { email: user.email } }, 200, { "Set-Cookie": cookie });
  }

  return json({ error: "Not found" }, 404);
  }
