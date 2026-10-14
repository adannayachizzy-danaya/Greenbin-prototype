(function () {
  "use strict";
  var role = null;

  function addButtons() {
    if (role !== "collector") return;

    var acct = document.querySelector("#account .gb-acct");
    if (acct && !acct.querySelector(".gb-jobs")) {
      var a = document.createElement("a");
      a.className = "gb-link gb-jobs";
      a.href = "/collector.html";
      a.textContent = "Open my jobs";
      var out = acct.querySelector("#gb-signout");
      if (out) acct.insertBefore(a, out);
      else acct.appendChild(a);
    }

    var home = document.querySelector("#dashboard .gb-home");
    if (home && !home.querySelector(".gb-jobs")) {
      var b = document.createElement("a");
      b.className = "gb-cta gb-jobs";
      b.href = "/collector.html";
      b.style.marginTop = ".6rem";
      b.style.background = "#dcfce7";
      b.textContent = "My collection jobs";
      var cta = home.querySelector(".gb-cta");
      if (cta) cta.insertAdjacentElement("afterend", b);
    }
  }

  function start() {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        role = d && d.user ? d.user.role : null;
        if (role !== "collector") return;
        addButtons();
        ["account", "dashboard"].forEach(function (id) {
          var el = document.getElementById(id);
          if (el) new MutationObserver(addButtons).observe(el, { childList: true, subtree: true });
        });
      })
      .catch(function () {});
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
