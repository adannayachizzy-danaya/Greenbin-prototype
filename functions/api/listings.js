const CATEGORIES = ["Plastic", "Paper / Cardboard", "Glass", "Metal", "E-waste", "Other"];

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

const nowStr = () => new Date().toISOString().slice(0, 19).replace("T", " ");

export async function onRequestGet({ request, env }) {
  try {
    const user = await currentUser(request, env);
    if (!user) return json({ error: "Please sign in" }, 401);

    const { results } = await env.DB
      .prepare(`SELECT l.id, l.user_id, l.category, l.title, l.quantity, l.price, l.location, l.lat, l.lng,
                       l.contact, l.photo_key, l.status, l.claimed_by, l.claimed_at, l.completed_at, l.created_at,
                       c.email AS claimer_email
                FROM listings l LEFT JOIN users c ON c.id = l.claimed_by
                WHERE l.status = 'Open' OR l.user_id = ? OR l.claimed_by = ?
                ORDER BY l.id DESC LIMIT 100`)
      .bind(user.id, user.id).all();

    const items = results.map((l) => {
      const mine = l.user_id === user.id;
      const claimedByMe = l.claimed_by === user.id;
      const private_ = mine || claimedByMe;
      return {
        id: l.id, category: l.category, title: l.title, quantity: l.quantity, price: l.price,
        location: l.location, photo_key: l.photo_key, status: l.status,
        created_at: l.created_at, claimed_at: l.claimed_at, completed_at: l.completed_at,
        mine, claimed_by_me: claimedByMe,
        lat: private_ ? l.lat : null,
        lng: private_ ? l.lng : null,
        contact: private_ ? l.contact : null,
        claimer_email: mine ? l.claimer_email : null,
      };
    });
    return json({ items, role: user.role });
  } catch (err) {
    return json({ error: "Server problem: " + (err && err.message ? err.message : String(err)) }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const user = await currentUser(request, env);
    if (!user) return json({ error: "Please sign in" }, 401);

    const recent = await env.DB
      .prepare("SELECT COUNT(*) AS n FROM listings WHERE user_id = ? AND created_at > datetime('now', '-1 hour')")
      .bind(user.id).first();
    if (recent && recent.n >= 5) return json({ error: "Listing limit reached (5 per hour). Please try again later." }, 429);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: "Invalid data" }, 400); }

    const title = String(body.title || "").trim();
    const category = String(body.category || "");
    const quantity = String(body.quantity || "").trim();
    const location = String(body.location || "").trim();
    const contact = String(body.contact || "").trim();

    if (title.length < 3 || title.length > 80) return json({ error: "Title must be 3 to 80 characters" }, 400);
    if (!CATEGORIES.includes(category)) return json({ error: "Please choose a category" }, 400);
    if (quantity.length < 1 || quantity.length > 40) return json({ error: "Please enter a quantity, for example 20 kg" }, 400);
    if (location.length < 3 || location.length > 120) return json({ error: "Please enter your area" }, 400);
    if (contact && !/^[0-9+\-\s()]{6,30}$/.test(contact)) return json({ error: "Phone number looks invalid" }, 400);

    let price = null;
    if (body.price !== null && body.price !== undefined && body.price !== "") {
      price = Number(body.price);
      if (!Number.isInteger(price) || price < 0 || price > 10000000) return json({ error: "Price must be a whole number" }, 400);
    }

    const lat = Number(body.lat);
    const lng = Number(body.lng);
    const hasGeo = body.lat != null && body.lng != null &&
      isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
    const photoKey = /^[a-f0-9]{32}\.jpg$/.test(String(body.photo_key || "")) ? body.photo_key : null;

    const r = await env.DB
      .prepare("INSERT INTO listings (user_id, category, title, quantity, price, location, lat, lng, contact, photo_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(user.id, category, title, quantity, price, location, hasGeo ? lat : null, hasGeo ? lng : null, contact || null, photoKey)
      .run();
    return json({ ok: true, id: r.meta.last_row_id }, 201);
  } catch (err) {
    return json({ error: "Server problem: " + (err && err.message ? err.message : String(err)) }, 500);
  }
}

export async function onRequestPatch({ request, env }) {
  try {
    const user = await currentUser(request, env);
    if (!user) return json({ error: "Please sign in" }, 401);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: "Invalid data" }, 400); }

    const id = parseInt(body.id, 10);
    const action = String(body.action || "");
    if (!id) return json({ error: "Bad listing id" }, 400);

    const l = await env.DB
      .prepare("SELECT id, user_id, status, claimed_by FROM listings WHERE id = ?")
      .bind(id).first();
    if (!l) return json({ error: "Listing not found" }, 404);

    if (action === "claim") {
      if (user.role !== "collector") return json({ error: "Only verified collectors can claim pickups" }, 403);
      if (l.user_id === user.id) return json({ error: "You cannot claim your own listing" }, 400);
      const r = await env.DB
        .prepare("UPDATE listings SET status = 'Claimed', claimed_by = ?, claimed_at = ? WHERE id = ? AND status = 'Open'")
        .bind(user.id, nowStr(), id).run();
      if (!r.meta.changes) return json({ error: "This listing is no longer available" }, 409);
      return json({ ok: true });
    }

    if (action === "release") {
      if (l.claimed_by !== user.id || l.status !== "Claimed") return json({ error: "Not your pickup" }, 403);
      await env.DB
        .prepare("UPDATE listings SET status = 'Open', claimed_by = NULL, claimed_at = NULL WHERE id = ?")
        .bind(id).run();
      return json({ ok: true });
    }

    if (action === "complete") {
      if (l.user_id !== user.id) return json({ error: "Only the seller can complete a listing" }, 403);
      if (l.status !== "Claimed") return json({ error: "Only claimed listings can be completed" }, 400);
      await env.DB
        .prepare("UPDATE listings SET status = 'Completed', completed_at = ? WHERE id = ?")
        .bind(nowStr(), id).run();
      return json({ ok: true });
    }

    if (action === "cancel") {
      if (l.user_id !== user.id && user.role !== "admin") return json({ error: "Not allowed" }, 403);
      if (l.status !== "Open" && l.status !== "Claimed") return json({ error: "Listing is already closed" }, 400);
      await env.DB.prepare("UPDATE listings SET status = 'Cancelled' WHERE id = ?").bind(id).run();
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    return json({ error: "Server problem: " + (err && err.message ? err.message : String(err)) }, 500);
  }
}
