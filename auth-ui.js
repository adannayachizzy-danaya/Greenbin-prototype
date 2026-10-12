(function () {
  const $ = (id) => document.getElementById(id);
  const msg = $("account-message");
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function say(html) { msg.innerHTML = html; msg.classList.add("visible"); }

  async function call(action, body) {
    const res = await fetch("/api/auth/" + action, {
      method: action === "me" ? "GET" : "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong");
    return data;
  }

  function showUser(user) {
    if (!user) { msg.classList.remove("visible"); return; }
    say("<strong>Signed in</strong>" + esc(user.email) +
      '<br><button class="btn btn-secondary" id="logout-btn" type="button" style="margin-top:0.75rem;width:auto">Sign out</button>');
    $("logout-btn").onclick = async () => {
      await call("logout", {});
      showUser(null);
      say("<strong>Signed out.</strong>");
    };
  }

  const forms = {
    "signup-form": { action: "signup", email: "signup-email", pass: "signup-password" },
    "login-form": { action: "login", email: "login-email", pass: "login-password" },
  };

  // Capture phase: runs before the Supabase code and blocks it
  document.addEventListener("submit", async (e) => {
    const cfg = e.target && forms[e.target.id];
    if (!cfg) return;
    e.preventDefault();
    e.stopImmediatePropagation();

    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true;
    say("Please wait...");
    try {
      const data = await call(cfg.action, {
        email: $(cfg.email).value,
        password: $(cfg.pass).value,
      });
      e.target.reset();
      showUser(data.user);
    } catch (err) {
      say("<strong>Sorry.</strong> " + esc(err.message));
    } finally {
      btn.disabled = false;
    }
  }, true);

  call("me").then((d) => showUser(d.user)).catch(() => {});
})();
