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

  function wire(formId, action, emailId, passId) {
    $(formId).addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector("button[type=submit]");
      btn.disabled = true;
      try {
        const data = await call(action, {
          email: $(emailId).value,
          password: $(passId).value,
        });
        e.target.reset();
        showUser(data.user);
      } catch (err) {
        say("<strong>Sorry.</strong>" + esc(err.message));
      } finally {
        btn.disabled = false;
      }
    });
  }

  wire("signup-form", "signup", "signup-email", "signup-password");
  wire("login-form", "login", "login-email", "login-password");
  call("me").then((d) => showUser(d.user)).catch(() => {});
})();
