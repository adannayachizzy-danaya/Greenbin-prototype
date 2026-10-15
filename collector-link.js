(function () {
  "use strict";
  var role = null;

  function apply() {
    if (!role) return;

    var acct = document.querySelector("#account .gb-acct");
    if (acct) {
      var badge = acct.querySelector(".gb-role");
      if (badge && role === "collector" && badge.textContent !== "Collector") {
        badge.textContent = "Collector";
      }
      var out = acct.querySelector("#gb-signout");

      if (role === "collector" && !acct.querySelector(".gb-jobs")) {
        var a = document.createElement("a");
        a.className = "gb-link gb-jobs";
        a.href = "/collector.html";
        a.textContent = "Open my jobs";
        if (out) acct.insertBefore(a, out); else acct.appendChild(a);
      }

      if (role === "admin" && !acct.querySelector(".gb-insights")) {
        var b = document.createElement("a");
        b.className = "gb-link gb-insights";
        b.href = "/insights.html";
        b.textContent = "Open insights";
        if (out) acct.insertBefore(b, out); else acct.appendChild(b);
      }
    }

    var home = document.querySelector("#dashboard .gb-home");
    if (home && role === "collector" && !home.querySelector(".gb-jobs")) {
      var c = document.createElement("a");
      c.className = "gb-cta gb-jobs";
      c.href = "/collector.html";
      c.style.marginTop = ".6rem";
      c.style.background = "#dcfce7";
      c.textContent = "My collection jobs";
      var cta = home.querySelector(".gb-cta");
      if (cta) cta.insertAdjacentElement("afterend", c);
    }
  }

  function start() {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        role = d && d.user ? d.user.role : null;
        if (role !== "collector" && role !== "admin") return;
        apply();
        setInterval(apply, 1000);
      })
      .catch(function () {});
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
