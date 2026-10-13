(function () {
  "use strict";

  var css = [
    "html,body{max-width:100%;overflow-x:hidden}",
    ".grid-2,.hero{grid-template-columns:1fr!important}",
    "#dashboard .hero{display:none!important}",
    "#account h2,#account .section-desc,#account .grid-2,#account-message{display:none!important}",
    ".gb-home{background:linear-gradient(135deg,#14532d,#15803d);color:#fff;border-radius:22px;padding:1.4rem;margin-top:.5rem;box-shadow:0 4px 14px rgba(20,83,45,.25)}",
    ".gb-hi{margin:0;font-weight:700;color:#dcfce7}",
    ".gb-h{font-size:1.6rem;font-weight:800;line-height:1.2;margin:.3rem 0 .4rem}",
    ".gb-sub{margin:0 0 1.1rem;color:#e7f6ec;line-height:1.45}",
    ".gb-cta{display:block;text-align:center;background:#fff;color:#14532d!important;font-weight:800;font-size:1.05rem;text-decoration:none;padding:.95rem;border-radius:14px}",
    ".gb-chips{display:flex;justify-content:space-between;align-items:center;margin-top:1rem;font-size:.95rem}",
    ".gb-chips a{color:#fff;font-weight:700}",
    ".gb-acct{background:#fff;border:1px solid #dbe5dd;border-radius:22px;padding:1.5rem;margin-top:.5rem;text-align:center;box-shadow:0 1px 4px rgba(16,28,20,.08)}",
    ".gb-av{width:76px;height:76px;margin:0 auto .8rem;border-radius:50%;background:#14532d;color:#fff;display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:800}",
    ".gb-em{font-weight:800;font-size:1.1rem;color:#101c14;word-break:break-all}",
    ".gb-role{display:inline-block;margin-top:.4rem;padding:.2rem .8rem;border-radius:999px;background:#dcfce7;color:#14532d;font-weight:700;font-size:.85rem}",
    ".gb-rows{display:flex;gap:.75rem;margin:1.2rem 0}",
    ".gb-rows div{flex:1;background:#f0fdf4;border-radius:14px;padding:.8rem .4rem}",
    ".gb-rows b{display:block;font-size:1.6rem;color:#14532d}",
    ".gb-rows span{font-size:.85rem;color:#33463a}",
    ".gb-link,.gb-out{display:block;width:100%;box-sizing:border-box;min-height:50px;border-radius:14px;font:inherit;font-weight:800;font-size:1rem;text-align:center;text-decoration:none;padding:.85rem;margin-top:.7rem;cursor:pointer}",
    ".gb-link{background:#166534;color:#fff!important;border:0}",
    ".gb-out{background:#fff;color:#991b1b;border:2px solid #991b1b}"
  ].join("\n");
  var st = document.createElement("style");
  st.textContent = css;
  document.documentElement.appendChild(st);

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function ss(k, v) { try { if (v === null) sessionStorage.removeItem(k); else if (v !== undefined) sessionStorage.setItem(k, v); else return sessionStorage.getItem(k); } catch (e) {} }

  function nameOf(email) {
    var n = String(email || "").split("@")[0].replace(/[._\-0-9]+/g, " ").trim();
    return n ? n.charAt(0).toUpperCase() + n.slice(1) : "there";
  }

  function goHome() {
    var b = document.querySelector('#gb-tabs [data-tab="home"]');
    if (b) b.click();
  }

  function signOut() {
    fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
      .catch(function () {})
      .then(function () {
        ss("gb_guest", null);
        ss("gb_welcomed", null);
        location.reload();
      });
  }

  function openGate() { ss("gb_guest", null); location.reload(); }

  function render(user, mine) {
    var dash = document.getElementById("dashboard");
    var acct = document.getElementById("account");

    if (dash) {
      var old = dash.querySelector(".gb-home");
      if (old) old.remove();
      var h = document.createElement("div");
      h.className = "gb-home";
      h.innerHTML = user
        ? '<p class="gb-hi">Hello, ' + esc(nameOf(user.email)) + ' 👋</p>' +
          '<div class="gb-h">See waste? Report it.</div>' +
          '<p class="gb-sub">Help keep your community clean in under a minute.</p>' +
          '<a class="gb-cta" href="#report">Report waste</a>' +
          '<div class="gb-chips"><span><b>' + mine.length + '</b> of your reports</span><a href="#map">View map</a></div>'
        : '<p class="gb-hi">Welcome to GreenBin</p>' +
          '<div class="gb-h">Cleaner communities start here.</div>' +
          '<p class="gb-sub">Sign in to report waste and track your reports.</p>' +
          '<a class="gb-cta" href="#" id="gb-open-gate">Sign in or create account</a>';
      dash.insertBefore(h, dash.firstChild);
      var g = h.querySelector("#gb-open-gate");
      if (g) g.onclick = function (e) { e.preventDefault(); openGate(); };
    }

    if (acct) {
      var oldA = acct.querySelector(".gb-acct");
      if (oldA) oldA.remove();
      var a = document.createElement("div");
      a.className = "gb-acct";
      if (user) {
        var done = mine.filter(function (r) { return r.status === "Resolved"; }).length;
        a.innerHTML =
          '<div class="gb-av">' + esc(nameOf(user.email).charAt(0)) + '</div>' +
          '<div class="gb-em">' + esc(user.email) + '</div>' +
          '<span class="gb-role">' + (user.role === "admin" ? "Administrator" : "Member") + '</span>' +
          '<div class="gb-rows"><div><b>' + mine.length + '</b><span>Reports</span></div>' +
          '<div><b>' + done + '</b><span>Collected</span></div></div>' +
          (user.role === "admin" ? '<a class="gb-link" href="/admin.html">Open admin dashboard</a>' : "") +
          '<button type="button" class="gb-out" id="gb-signout">Sign out</button>';
      } else {
        a.innerHTML =
          '<div class="gb-av">?</div><div class="gb-em">You are browsing as a guest</div>' +
          '<p style="color:#33463a">Sign in to submit and track reports.</p>' +
          '<button type="button" class="gb-link" id="gb-signin" style="width:100%;border:0">Sign in or create account</button>';
      }
      acct.insertBefore(a, acct.firstChild);
      var so = a.querySelector("#gb-signout");
      if (so) so.onclick = signOut;
      var si = a.querySelector("#gb-signin");
      if (si) si.onclick = openGate;
    }
  }

  function init() {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var user = d && d.user;
        if (!user) {
          ss("gb_welcomed", null);
          render(null, []);
          return;
        }
        fetch("/api/reports?mine=1", { cache: "no-store" })
          .then(function (r) { return r.json(); })
          .catch(function () { return { reports: [] }; })
          .then(function (m) {
            render(user, m.reports || []);
            // Fresh launch or just signed in: open on Home
            if (ss("gb_welcomed") !== user.email) {
              ss("gb_welcomed", user.email);
              goHome();
            }
          });
      })
      .catch(function () {});
  }

  if (document.readyState === "complete") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
