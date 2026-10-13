(function () {
  "use strict";

  var css = [
    ".gb-extra{margin-top:1.2rem;text-align:center;font-size:.95rem}",
    ".gb-extra a,.gb-extra button{color:#166534;font:inherit;font-weight:700;background:none;border:0;text-decoration:underline;padding:.5rem;cursor:pointer}",
    ".gb-extra #gb-del{color:#991b1b}",
    "#gb-dlg{position:fixed;inset:0;z-index:6000;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center}",
    "#gb-dlg .box{background:#fff;width:100%;max-width:480px;border-radius:22px 22px 0 0;padding:1.4rem 1.3rem calc(1.4rem + env(safe-area-inset-bottom))}",
    "#gb-dlg h3{margin:0 0 .5rem;font-size:1.25rem;color:#101c14}",
    "#gb-dlg p{margin:.3rem 0 1rem;color:#33463a;line-height:1.45}",
    "#gb-dlg input{width:100%;box-sizing:border-box;font:inherit;font-size:16px;border:2px solid #2f4536;border-radius:12px;padding:.8rem .9rem;min-height:50px}",
    "#gb-dlg .row{display:flex;gap:.7rem;margin-top:1rem}",
    "#gb-dlg .row button{flex:1;min-height:50px;border-radius:14px;font:inherit;font-weight:800;font-size:1rem;cursor:pointer}",
    "#gb-dlg .cancel{background:#fff;border:2px solid #2f4536;color:#101c14}",
    "#gb-dlg .go{background:#991b1b;border:0;color:#fff}",
    "#gb-dlg .go:disabled{opacity:.6}",
    "#gb-dlg .err{display:none;margin-top:.8rem;padding:.7rem .9rem;background:#fee2e2;border:2px solid #991b1b;border-radius:12px;color:#5f0f0f;font-weight:600}",
    "#gb-dlg .err.on{display:block}"
  ].join("\n");
  var st = document.createElement("style");
  st.textContent = css;
  document.documentElement.appendChild(st);

  function openDialog() {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || !d.user) return;
        var email = d.user.email;
        var dlg = document.createElement("div");
        dlg.id = "gb-dlg";
        dlg.innerHTML =
          '<div class="box"><h3>Delete your account?</h3>' +
          '<p>This permanently deletes your account, all your reports and your photos. This cannot be undone.</p>' +
          '<input id="gb-dpw" type="password" placeholder="Enter your password to confirm" autocomplete="current-password">' +
          '<div class="err" id="gb-derr" role="alert"></div>' +
          '<div class="row"><button type="button" class="cancel">Cancel</button>' +
          '<button type="button" class="go">Delete forever</button></div></div>';
        document.body.appendChild(dlg);

        dlg.querySelector(".cancel").onclick = function () { dlg.remove(); };
        var go = dlg.querySelector(".go");
        var err = dlg.querySelector("#gb-derr");
        go.onclick = function () {
          var pw = dlg.querySelector("#gb-dpw").value;
          if (!pw) { err.textContent = "Please enter your password."; err.className = "err on"; return; }
          go.disabled = true;
          go.textContent = "Deleting...";
          fetch("/api/account-delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, password: pw })
          }).then(function (r) {
            return r.json().catch(function () { return {}; }).then(function (b) { return { ok: r.ok, b: b }; });
          }).then(function (res) {
            if (res.ok) {
              try { sessionStorage.clear(); localStorage.clear(); } catch (e) {}
              location.reload();
              return;
            }
            err.textContent = res.b.error || "Something went wrong.";
            err.className = "err on";
            go.disabled = false;
            go.textContent = "Delete forever";
          }).catch(function () {
            err.textContent = "Connection problem. Please try again.";
            err.className = "err on";
            go.disabled = false;
            go.textContent = "Delete forever";
          });
        };
      });
  }

  function addLinks() {
    var box = document.querySelector("#account .gb-acct");
    if (!box || box.querySelector(".gb-extra")) return;
    var signedIn = !!box.querySelector("#gb-signout");
    var d = document.createElement("div");
    d.className = "gb-extra";
    d.innerHTML = '<a href="/privacy.html">Privacy policy</a>' +
      (signedIn ? ' · <button type="button" id="gb-del">Delete account</button>' : "");
    box.appendChild(d);
    var b = d.querySelector("#gb-del");
    if (b) b.onclick = openDialog;
  }

  function start() {
    addLinks();
    var acct = document.getElementById("account");
    if (acct) new MutationObserver(addLinks).observe(acct, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
