(function () {
  "use strict";
  var u = null;
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  function apply() {
    if (!u) return;
    var box = document.querySelector("#account .gb-acct");
    if (!box || box.querySelector(".gb-prof")) return;

    var rows = "";
    if (u.full_name) rows += "<div><b>Name:</b> " + esc(u.full_name) + "</div>";
    if (u.phone) rows += "<div><b>Phone:</b> " + esc(u.phone) + "</div>";
    if (u.area) rows += "<div><b>Area:</b> " + esc(u.area) + "</div>";
    if (u.account_type === "collector" && u.collector_status === "pending")
      rows += '<div style="margin-top:.5rem;padding:.5rem .7rem;background:#fefce8;border:2px solid #a16207;border-radius:12px;color:#713f12;font-weight:700">Collector application: waiting for approval</div>';
    if (u.account_type === "collector" && u.collector_status === "rejected")
      rows += '<div style="margin-top:.5rem;padding:.5rem .7rem;background:#fee2e2;border:2px solid #991b1b;border-radius:12px;color:#5f0f0f;font-weight:700">Collector application was not approved</div>';

    var d = document.createElement("div");
    d.className = "gb-prof";
    d.style.cssText = "text-align:left;margin:1rem 0;line-height:1.6;color:#1a2b1f;font-size:.95rem";
    d.innerHTML = rows || '<div style="text-align:center;color:#33463a">No profile details yet.</div>';

    var role = box.querySelector(".gb-role");
    if (role) role.insertAdjacentElement("afterend", d); else box.appendChild(d);

    if (u.role === "admin" && !box.querySelector(".gb-people")) {
      var a = document.createElement("a");
      a.className = "gb-link gb-people";
      a.href = "/people.html";
      a.textContent = "Review collector applications";
      var out = box.querySelector("#gb-signout");
      if (out) box.insertBefore(a, out); else box.appendChild(a);
    }
  }

  function start() {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        u = d && d.user ? d.user : null;
        if (!u) return;
        apply();
        setInterval(apply, 1000);
      })
      .catch(function () {});
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
