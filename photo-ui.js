(function () {
  const form = document.getElementById("report-form");
  if (!form) return;

  const wrap = document.createElement("div");
  wrap.innerHTML =
    '<label for="photo">Photo <span class="optional-tag">(optional)</span></label>' +
    '<input id="photo" type="file" accept="image/*" style="width:100%">';
  const btnRow = form.querySelector(".btn-row");
  btnRow.parentNode.insertBefore(wrap, btnRow);
  const input = wrap.querySelector("input");

  function shrink(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const s = Math.min(1, 1024 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * s);
        c.height = Math.round(img.height * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not read photo"))), "image/jpeg", 0.75);
      };
      img.onerror = () => reject(new Error("Could not read photo"));
      img.src = url;
    });
  }

  const realFetch = window.fetch.bind(window);
  window.fetch = async function (url, opts) {
    if (url === "/api/reports" && opts && opts.method === "POST" && input.files[0]) {
      const blob = await shrink(input.files[0]);
      const fd = new FormData();
      fd.append("photo", blob, "photo.jpg");
      const up = await realFetch("/api/upload", { method: "POST", body: fd });
      const out = await up.json().catch(() => ({}));
      if (!up.ok) throw new Error(out.error || "Photo upload failed");
      const body = JSON.parse(opts.body);
      body.photo_key = out.key;
      opts = { ...opts, body: JSON.stringify(body) };
      input.value = "";
    }
    return realFetch(url, opts);
  };
})();
