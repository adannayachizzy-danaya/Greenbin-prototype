(function () {
  "use strict";

  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("#logout-btn");
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    b.disabled = true;
    fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
      .catch(function () {}).then(function () {
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
    "#gb-gate .gg-top{color:#fff;text-align:center;padding:calc(1.6rem + env(safe-area-inset-top)) 1.5rem 1.2rem}",
    "#gb-gate .gg-logo{width:64px;height:64px;margin:0 auto .7rem;border-radius:18px;background:#fff;color:#14532d;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:800;box-shadow:0 6px 18px rgba(0,0,0,.25)}",
    "#gb-gate .gg-name{font-size:1.8rem;font-weight:800;line-height:1.2}",
    "#gb-gate .gg-tag{margin:.3rem 0 0;color:#dcfce7;font-size:.95rem;line-height:1.4}",
    "#gb-gate .gg-sheet{flex:1;background:#f8faf7;border-radius:28px 28px 0 0;padding:1.3rem 1.3rem calc(1.6rem + env(safe-area-inset-bottom));min-height:300px}",
    "#gb-gate .gg-spin{width:34px;height:34px;margin:3rem auto;border:4px solid #dcfce7;border-top-color:#166534;border-radius:50%;animation:ggspin .8s linear infinite}",
    "@keyframes ggspin{to{transform:rotate(360deg)}}",
    "#gb-gate .gg-tabs{display:flex;background:#e4ece6;border-radius:14px;padding:4px;margin-bottom:1rem}",
    "#gb-gate .gg-tabs button{flex:1;border:0;background:none;font:inherit;font-weight:800;font-size:1rem;color:#33463a;padding:.7rem;border-radius:11px;cursor:pointer}",
    "#gb-gate .gg-tabs button.on{background:#fff;color:#14532d;box-shadow:0 1px 4px rgba(16,28,20,.15)}",
    "#gb-gate label{display:block;font-weight:700;color:#101c14;margin:.85rem 0 .3rem;font-size:.95rem}",
    "#gb-gate input{width:100%;box-sizing:border-box;font:inherit;font-size:16px;color:#101c14;background:#fff;border:2px solid #2f4536;border-radius:12px;padding:.8rem .9rem;min-height:50px}",
    "#gb-gate input:focus{outline:3px solid #0a58ca;outline-offset:1px;border-color:#0a58ca}",
    "#gb-gate .gg-type{display:flex;gap:.6rem}",
    "#gb-gate .gg-type button{flex:1;border:2px solid #9db0a2;background:#fff;border-radius:14px;padding:.7rem .4rem;font:inherit;font-weight:800;color:#33463a;cursor:pointer}",
    "#gb-gate .gg-type button small{display:block;font-weight:500;font-size:.8rem;margin-top:.15rem}",
    "#gb-gate .gg-type button.on{border-color:#166534;background:#dcfce7;color:#14532d}",
    "#gb-gate .gg-hint{margin:.5rem 0 0;color:#33463a;font-size:.88rem}",
    "#gb-gate .gg-pw{position:relative}",
    "#gb-gate .gg-pw input{padding-right:4.6rem}",
    "#gb-gate .gg-show{position:absolute;right:6px;top:50%;transform:translateY(-50%);border:0;background:none;color:#166534;font:inherit;font-weight:800;padding:.6rem .7rem;cursor:pointer}",
    "#gb-gate .gg-btn{display:block;width:100%;margin-top:1.3rem;border:0;background:#166534;color:#fff;font:inherit;font-weight:800;font-size:1.05rem;min-height:52px;border-radius:14px;cursor:pointer}",
    "#gb-gate .gg-btn:disabled{opacity:.6}",
    "#gb-gate .gg-err{display:none;margin:.9rem 0 0;padding:.75rem .9rem;background:#fee2e2;color:#5f0f0f;border:2px solid #991b1b;border-radius:12px;font-weight:600;font-size:.95rem}",
    "#gb-gate .gg-err.on{display:block}",
    "#gb-gate .gg-guest{display:block;margin:1rem auto 0;border:0;background:none;color:#166534;font:inherit;font-weight:700;text-decoration:underline;padding:.6rem;cursor:pointer}",
    "#gb-gate .gg-note{margin:.8rem 0 0;color:#33463a;font-size:.85rem;text-align:center}",
    "#gb-gate .gg-note a{color:#166534}"
  ].join("\n");
  document.documentElement.appendChild(style);

  var gate;
  var acct = "household";

  function finish() {
    if (gate && gate.parentNode) gate.parentNode.removeChild(gate);
    root.classList.remove("gb-pending");
  }

  function field(id, label, type, extra) {
    return '<label for="' + id + '">' + label + '</label><input id="' + id + '" type="' + type + '" ' + (extra || "") + '>';
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
        (signup
          ? '<label>I am joining as</label>' +
            '<div class="gg-type">' +
              '<button type="button" data-t="household" class="' + (acct === "household" ? "on" : "") + '">Household<small>Report and sell waste</small></button>' +
              '<button type="button" data-t="collector" class="' + (acct === "collector" ? "on" : "") + '">Collector<small>Collect and buy waste</small></button>' +
            '</div>' +
            '<p class="gg-hint" id="gg-hint"></p>' +
            field("gg-name", "Full name", "text", 'autocomplete="name" maxlength="60"') +
            field("gg-phone", "Phone number", "tel", 'autocomplete="tel" inputmode="tel" maxlength="20" placeholder="e.g. 0803 000 0000"') +
            field("gg-area", "Area / neighbourhood", "text", 'autocomplete="address-level2" maxlength="80" placeholder="e.g. Ila Oregun"')
          : "") +
        field("gg-email", "Email address", "email", 'inputmode="email" autocomplete="email" autocapitalize="none" spellcheck="false"') +
        '<label for="gg-pass">Password' + (signup ? ' <span style="font-weight:400;color:#33463a">(at least 8 characters)</span>' : '') + '</label>' +
        '<div class="gg-pw"><input id="gg-pass" type="password" autocomplete="' + (signup ? "new-password" : "current-password") + '">' +
        '<button type="button" class="gg-show" id="gg-show">Show</button></div>' +
        '<div class="gg-err" id="gg-err" role="alert"></div>' +
        '<button type="submit" class="gg-btn" id="gg-go">' + (signup ? "Create account" : "Sign in") + '</button>' +
      '</form>' +
      (signup ? '<p class="gg-note">By creating an account you agree to our <a href="/privacy.html" target="_blank">Privacy policy</a>.</p>' : '') +
      '<button type="button" class="gg-guest" id="gg-guest">Browse without signing in</button>';

    var tabs = sheet.querySelectorAll(".gg-tabs button");
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].onclick = function () { render(this.getAttribute("data-m")); };
    }

    var hint = sheet.querySelector("#gg-hint");
    function setHint() {
      if (!hint) return;
      hint.textContent = acct === "collector"
        ? "Collector accounts are checked by the GreenBin team before you can claim pickups. Meanwhile you can use GreenBin as a household."
        : "Report waste and sell sorted recyclables to verified collectors.";
    }
    setHint();

    var types = sheet.querySelectorAll(".gg-type button");
    for (var j = 0; j < types.length; j++) {
      types[j].onclick = function () {
        acct = this.getAttribute("data-t");
        for (var k = 0; k < types.length; k++) {
          types[k].className = types[k].getAttribute("data-t") === acct ? "on" : "";
        }
        setHint();
      };
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
    function val(id) { var el = sheet.querySelector("#" + id); return el ? el.value.trim() : ""; }

    sheet.querySelector("#gg-form").onsubmit = function (ev) {
      ev.preventDefault();
      err.className = "gg-err";
      var email = val("gg-email");
      var password = pass.value;
      var payload = { email: email, password: password };

      if (signup) {
        payload.full_name = val("gg-name");
        payload.phone = val("gg-phone");
        payload.area = val("gg-area");
        payload.account_type = acct;
        if (payload.full_name.length < 2) return showErr("Please enter your full name.");
        if (!/^[0-9+\-\s()]{7,20}$/.test(payload.phone)) return showErr("Please enter a valid phone number.");
        if (payload.area.length < 2) return showErr("Please enter your area.");
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return showErr("Please enter a valid email address.");
      if (!password) return showErr("Please enter your password.");
      if (signup && password.length < 8) return showErr("Password must be at least 8 characters.");

      var btn = sheet.querySelector("#gg-go");
      btn.disabled = true;
      btn.textContent = "Please wait...";

      fetch("/api/auth/" + mode, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
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
        if (d && d.user) finish(); else render("login");
      })
      .catch(function () {
        if (done) return;
        done = true;
        clearTimeout(timer);
        finish();
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
