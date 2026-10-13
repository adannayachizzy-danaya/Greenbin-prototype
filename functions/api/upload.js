
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)) {
    return json({ error: "Only JPEG photos are allowed" }, 400);
  }

  const key = [...crypto.getRandomValues(new Uint8Array(16))]
    .map((x) => x.toString(16).padStart(2, "0")).join("") + ".jpg";

  await env.DB.prepare("INSERT INTO photos (key, data) VALUES (?, ?)")
    .bind(key, toBase64(bytes)).run();

  return json({ ok: true, key }, 201);
}
