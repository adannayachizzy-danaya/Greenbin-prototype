export async function onRequestGet({ env, params }) {
  try {
    const key = String(params.key || "");
    if (!/^[a-f0-9]{32}\.jpg$/.test(key)) return new Response("Not found", { status: 404 });

    const row = await env.DB.prepare("SELECT data FROM photos WHERE key = ?").bind(key).first();
    if (!row) return new Response("Photo not stored", { status: 404 });

    const bin = atob(row.data);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    return new Response(bytes, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    return new Response("Server problem: " + (err && err.message ? err.message : String(err)), { status: 500 });
  }
}
