(function () {
  const form = document.getElementById("report-form");
  const reportsSection = document.getElementById("reports");
  if (!form || !reportsSection) return;

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const DEFAULT_CENTER = [6.5244, 3.3792]; // Lagos. Change if you like.
  const BASE = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/";

  function loadLeaflet() {
    return new Promise((resolve, reject) => {
      if (window.L) return resolve();
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = BASE + "leaflet.css";
      document.head.appendChild(css);
      const js = document.createElement("script");
      js.src = BASE + "leaflet.js";
      js.onload = resolve;
      js.onerror = () => reject(new Error("Map could not load"));
      document.head.appendChild(js);
    });
  }

  // ---------- Pin picker inside the form ----------
  const box = document.createElement("div");
  box.innerHTML =
    '<label>Pin the location <span class="optional-tag">(optional)</span></label>' +
    '<button type="button" class="btn btn-secondary" id="use-loc" style="width:auto;margin-bottom:.6rem;padding:.6rem 1rem">Use my current location</button>' +
    '<div id="pick-map" style="height:260px;border:2.5px solid #2f4536;border-radius:10px"></div>' +
    '<p class="hint" id="pick-status">Tap the map to drop a pin. Please don\'t pin your own home.</p>';
  const btnRow = form.querySelector(".btn-row");
  btnRow.parentNode.insertBefore(box, btnRow);

  // ---------- Map of all reports ----------
  const sec = document.createElement("section");
  sec.className = "block";
  sec.id = "map";
  sec.innerHTML =
    '<h2>Reports map</h2><p class="section-desc">Reports that have a pinned location. Orange = open, green = collected.</p>' +
    '<div id="all-map" style="height:340px;border:2.5px solid #2f4536;border-radius:10px"></div>' +
    '<p class="hint" id="all-status"></p>';
  reportsSection.insertAdjacentElement("beforebegin", sec);

  let picker = null, pin = null, picked = null, allMap = null, layer = null;
  const status = document.getElementById("pick-status");

  function setPin(lat, lng) {
    picked = { lat: +lat.toFixed(6), lng: +lng.toFixed(6) };
    if (pin) pin.setLatLng([lat, lng]);
    else pin = L.marker([lat, lng]).addTo(picker);
    status.textContent = "Pin set: " + picked.lat + ", " + picked.lng;
    const loc = document.getElementById("location");
    if (loc && !loc.value.trim()) loc.value = "Pinned on map (" + picked.lat + ", " + picked.lng + ")";
  }

  function clearPin() {
    picked = null;
    if (pin) { picker.removeLayer(pin); pin = null; }
    status.textContent = "Tap the map to drop a pin. Please don't pin your own home.";
  }

  function tiles() {
    return L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    });
  }

  async function loadMarkers() {
    if (!allMap) return;
    try {
      const data = await (await fetch("/api/reports")).json();
      layer.clearLayers();
      const pts = [];
      (data.reports || []).forEach((r) => {
        if (r.lat == null || r.lng == null) return;
        const done = r.status === "Resolved";
        const color = done ? "#15803d" : "#b45309";
        L.circleMarker([r.lat, r.lng], { radius: 9, color, fillColor: color, fillOpacity: 0.8 })
          .bindPopup("<strong>" + esc(r.category) + "</strong><br>" + esc(r.location) + "<br>" + (done ? "Collected" : esc(r.status)))
          .addTo(layer);
        pts.push([r.lat, r.lng]);
      });
      document.getElementById("all-status").textContent =
        pts.length ? pts.length + " report(s) on the map." : "No reports with a pinned location yet.";
      if (pts.length) allMap.fitBounds(pts, { padding: [30, 30], maxZoom: 16 });
    } catch (e) { console.error(e); }
  }

  loadLeaflet().then(() => {
    L.Icon.Default.imagePath = BASE + "images/";

    picker = L.map("pick-map").setView(DEFAULT_CENTER, 11);
    tiles().addTo(picker);
    picker.on("click", (e) => setPin(e.latlng.lat, e.latlng.lng));

    allMap = L.map("all-map").setView(DEFAULT_CENTER, 11);
    tiles().addTo(allMap);
    layer = L.layerGroup().addTo(allMap);

    setTimeout(() => { picker.invalidateSize(); allMap.invalidateSize(); }, 300);
    loadMarkers();
  }).catch(() => {
    status.textContent = "The map could not load. You can still submit without a pin.";
  });

  document.getElementById("use-loc").addEventListener("click", () => {
    if (!picker) return;
    if (!navigator.geolocation) { status.textContent = "Your browser can't share location."; return; }
    status.textContent = "Finding you...";
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPin(p.coords.latitude, p.coords.longitude);
        picker.setView([p.coords.latitude, p.coords.longitude], 17);
      },
      () => { status.textContent = "Could not get your location. Tap the map instead."; },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  // Add the pin to the report when it is sent
  const prev = window.fetch.bind(window);
  window.fetch = async function (url, opts) {
    if (url === "/api/reports" && opts && opts.method === "POST" && picked) {
      const body = JSON.parse(opts.body);
      body.lat = picked.lat;
      body.lng = picked.lng;
      opts = { ...opts, body: JSON.stringify(body) };
      const res = await prev(url, opts);
      if (res.ok) clearPin();
      return res;
    }
    return prev(url, opts);
  };

  const conf = document.getElementById("confirmation");
  if (conf) new MutationObserver(loadMarkers).observe(conf, { childList: true, subtree: true, characterData: true });
})();
