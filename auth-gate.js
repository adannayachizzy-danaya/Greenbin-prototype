(function () {
  "use strict";

  // Sign out: end the session, then return to the welcome screen
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("#logout-btn");
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    b.disabled = true;
    fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}"
    }).catch(function () {}).then(function () {
      try { sessionStorage.removeItem("gb_guest"); } catch (x) {}
      location.reload();
    });
  }, true);

  var guest = false;
  try { guest = sessionStorage.getItem("gb_guest") === "1"; } catch (x) {}
  if (guest) return;

  var root = document.documentElement;
  root.classList.add("gb-pending");

  var style = document.createElement("style");
  style.textContent = [
    "html.gb-pending{background:#14532d;overflow:hidden}",
    "html.gb-pending body{visibility:hidden;overflow:hidden}",
    "#gb-gate{visibility:visible;position:fixed;inset:0;z-index:5000;display:flex;flex-direction:column;background:linear-gradient(#14532d,#166534);overflow-y:auto;-webkit-overflow-scrolling:touch;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif}",
    "#gb-gate .gg-top{color:#fff;text-align:center;padding:calc(2.2rem + env(safe-area-inset-top)) 1.5rem 1.6rem}",
    "#gb-gate .gg-logo{width:76px;height:76px;margin:0 auto .9rem;border-radius:22px;background:#fff;color:#14532d;display:flex;align-items:center;justify-content:center;font-size:44px;font-weight:800;box-shadow:0 6px 18px rgba(0,0,0,.25)}",
    "#gb-gate .gg-name{font-size:2rem;font-weight:800;line-height:1.2}",
    "#gb-gate .gg-tag{margin:.35rem 0 0;color:#dcfce7;font-size:1rem;line-height:1.4}",
    "#gb-gate .gg-sheet{flex:1;background:#f8faf7;border-radius:28px 28px 0 0;padding:1.4rem 1.4rem calc(1.6rem + env(safe-area-inset-bottom));min-height:300px}",
    "#gb-gate .gg-spin{width:34px;height:34px;margin:3rem auto;border:4px solid #dcfce7;border-top-color:#166534;border-radius:50%;animation:ggspin .8s linear infinite}",
    "@keyframes ggspin{to{transform:rotate(360deg)}}",
    "#gb-gate .gg-tabs{display:flex;background:#e4ece6;border-radius:14px;padding:4px;margin-bottom:1.1rem}",
    "#gb-gate .gg-tabs button{flex:1;border:0;background:none;font:inherit;font-weight:800;font-size:1rem;color:#33463a;padding:.7rem;border-radius:11px;cursor:pointer}",
    "#gb-gate .gg-tabs button.on{background:#fff;color:#14532d;box-shadow:0 1px 4px rgba(16,28,20,.15)}",
    "#gb-gate label{display:block;font-weight:700;color:#101c14;margin:.9rem 0 .35rem;font-size:.95rem}",
    "#gb-gate input{width:100%;box-sizing:border-box;font:inherit;font-size:16px;color:#101c14;background:#fff;border:2px solid #2f4536;border-radius:12px;padding:.8rem .9rem;min-height:50px}",
    "#gb-gate input:focus{outline:3px solid #0a58ca;outline-offset:1px;border-color:#0a58ca}",
    "#gb-gate .gg-pw{position:relative}",
    "#gb-gate .gg-pw input{padding-right:4.6rem}",
    "#gb-gate .gg-show{position:absolute;right:6px;top:50%;transform:translateY(-50%);border:0;background:none;color:#166534;font:inherit;font-weight:800;padding:.6rem .7rem;cursor:pointer}",
    "#gb-gate .gg-btn{display:block;width:100%;margin-top:1.3rem;border:0;background:#166534;color:#fff;font:inherit;font-weight:800;font-size:1.05rem;min-height:52px;border-radius:14px;cursor:pointer}",
    "#gb-gate .gg-btn:active{background:#123f22}",
    "#gb-gate .gg-btn:disabled{opacity:.6}",
    "#gb-gate .gg-err{display:none;margin:.9rem 0 0;padding:.75rem .9rem;background:#fee2e2;color:#5f0f0f;border:2px solid #991b1b;border-radius:12px;font-weight:600;font-size:.95rem}",
    "#gb-gate .gg-err.on{display:block}",
    "#gb-gate .gg-guest{display:block;margin:1.2rem auto 0;border:0;background:none;color:#166534;font:inherit;font-weight:700;text-decoration:underline;padding:.6rem;cursor:pointer}",
    "#gb-gate .gg-note{margin:1rem 0 0;color:#33463a;font-size:.85rem;text-align:center}"
  ].join("\n");
  document.documentElement.appendChild(style);

  var gate;

  function finish() {
    if (gate && gate.parentNode) gate.parentNode.removeChild(gate);
    root.classList.remove("gb-pending");
  }

  function render(mode) {
    var signup = mode === "signup";
    var sheet = gate.querySelector("#gg-sheet");
    sheet.innerHTML =
      '<div class="gg-tabs">' +
        '<button type="button" data-m="login" class="' + (signup ? "" : "on") + '">Sign in</button>' +
        '<button type="button" data-m="signup" class="' + (signup ? "on" : "") + '">Create account</button>' +
      '</div>' +
      '<form id="gg-form" novalidate>' +
        '<label for="gg-email">Email address</label>' +
        '<input id="gg-email" type="email" inputmode="email" autocomplete="email" autocapitalize="none" spellcheck="false">' +
        '<label for="gg-pass">Password' + (signup ? ' <span style="font-weight:400;color:#33463a">(at least 8 characters)</span>' : '') + '</label>' +
        '<div class="gg-pw"><input id="gg-pass" type="password" autocomplete="' + (signup ? "new-password" : "current-password") + '">' +
        '<button type="button" class="gg-show" id="gg-show">Show</button></div>' +
        '<div class="gg-err" id="gg-err" role="alert"></div>' +
        '<button type="submit" class="gg-btn" id="gg-go">' + (signup ? "Create account" : "Sign in") + '</button>' +
      '</form>' +
      '<button type="button" class="gg-guest" id="gg-guest">Browse without signing in</button>' +
      '<p class="gg-note">You need an account to submit reports.</p>';

    var tabs = sheet.querySelectorAll(".gg-tabs button");
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].onclick = function () { render(this.getAttribute("data-m")); };
    }

    var pass = sheet.querySelector("#gg-pass");
    sheet.querySelector("#gg-show").onclick = function () {
      var hide = pass.type === "password";
      pass.type = hide ? "text" : "password";
      this.textContent = hide ? "Hide" : "Show";
    };

    sheet.querySelector("#gg-guest").onclick = function () {
      try { sessionStorage.setItem("gb_guest", "1"); } catch (x) {}
      finish();
    };

    var err = sheet.querySelector("#gg-err");
    function showErr(msg) { err.textContent = msg; err.className = "gg-err on"; }

    sheet.querySelector("#gg-form").onsubmit = function (ev) {
      ev.preventDefault();
      err.className = "gg-err";
      var email = sheet.querySelector("#gg-email").value.trim();
      var password = pass.value;

      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return showErr("Please enter a valid email address.");
      if (!password) return showErr("Please enter your password.");
      if (signup && password.length < 8) return showErr("Password must be at least 8 characters.");

      var btn = sheet.querySelector("#gg-go");
      btn.disabled = true;
      btn.textContent = "Please wait...";

      fetch("/api/auth/" + mode, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: password })
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; });
      }).then(function (res) {
        if (res.ok) { location.reload(); return; }
        showErr(res.d.error || "Something went wrong. Please try again.");
        btn.disabled = false;
        btn.textContent = signup ? "Create account" : "Sign in";
      }).catch(function () {
        showErr("Connection problem. Please check your internet and try again.");
        btn.disabled = false;
        btn.textContent = signup ? "Create account" : "Sign in";
      });
    };
  }

  function start() {
    gate = document.createElement("div");
    gate.id = "gb-gate";
    gate.innerHTML =
      '<div class="gg-top"><div class="gg-logo" aria-hidden="true">&#9851;</div>' +
      '<div class="gg-name">GreenBin</div>' +
      '<p class="gg-tag">Smarter waste management for cleaner communities</p></div>' +
      '<div class="gg-sheet" id="gg-sheet"><div class="gg-spin"></div></div>';
    document.body.appendChild(gate);

    var done = false;
    var timer = setTimeout(function () { if (!done) { done = true; finish(); } }, 6000);

    fetch("/api/auth/me", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        if (d && d.user) finish();
        else render("login");
      })
      .catch(function () {
        if (done) return;
        done = true;
        clearTimeout(timer);
        finish(); // offline: let people see the app
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
