(function () {
  "use strict";

  var TABS = [
    { id: "home", label: "Home", title: "GreenBin", sections: ["dashboard", "stats"],
      icon: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>' },
    { id: "reports", label: "Reports", title: "Community reports", sections: ["map", "reports", "my-reports"],
      icon: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>' },
    { id: "report", label: "Report", title: "Report waste", sections: ["report"], main: true,
      icon: '<path d="M12 5v14M5 12h14"/>' },
    { id: "tips", label: "Tips", title: "Sorting tips", sections: ["tips"],
      icon: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>' },
    { id: "account", label: "Account", title: "My account", sections: ["account"],
      icon: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>' }
  ];

  var sectionTab = {}, tabById = {};
  TABS.forEach(function (t) {
    tabById[t.id] = t;
    t.sections.forEach(function (s) { sectionTab[s] = t.id; });
  });

  function pickInitial() {
    var h = (location.hash || "").slice(1);
    if (tabById[h]) return h;
    if (sectionTab[h]) return sectionTab[h];
    try {
      var saved = localStorage.getItem("gb_tab");
      if (tabById[saved]) return saved;
    } catch (e) {}
    return "home";
  }

  // ---------- Styles (injected immediately so there is no flash) ----------
  var HIDE = "position:absolute!important;left:-200vw!important;top:0!important;width:100%!important;" +
    "height:0!important;min-height:0!important;overflow:hidden!important;visibility:hidden!important;" +
    "pointer-events:none!important;padding:0!important;margin:0!important;border:0!important;";

  var css = [];
  TABS.forEach(function (t) {
    var not = t.sections.map(function (s) { return ":not(#" + s + ")"; }).join("");
    css.push('html[data-tab="' + t.id + '"] main>section' + not + "{" + HIDE + "}");
  });

  css.push(
    "html{-webkit-tap-highlight-color:transparent}",
    "body{overscroll-behavior-y:none}",
    ".site-header{position:sticky;top:0;z-index:900;padding:calc(.7rem + env(safe-area-inset-top)) 1rem .7rem!important}",
    "nav.top-nav,.brand-sub,footer,.eyebrow,#dashboard .hint{display:none!important}",
    ".brand-mark{width:38px!important;height:38px!important;font-size:22px!important}",
    ".brand-name{font-size:1.25rem!important}",
    "main{padding:0 1rem calc(100px + env(safe-area-inset-bottom))!important}",
    "section.block{padding:1.25rem 0!important;border-bottom:0!important}",
    "h1{font-size:1.7rem!important}",
    "h2{font-size:1.4rem!important}",
    ".hero{gap:1rem!important}",
    ".card,.report-card{border:1px solid #dbe5dd!important;border-radius:16px!important;box-shadow:0 1px 4px rgba(16,28,20,.08)}",
    ".stat-card,.tip-card{border-radius:16px!important;border-left-color:#dbe5dd!important;border-right-color:#dbe5dd!important;border-bottom-color:#dbe5dd!important;box-shadow:0 1px 4px rgba(16,28,20,.08)}",
    "input[type=text],input[type=email],input[type=password],select,textarea{min-height:48px;border-radius:12px!important}",
    "input[type=email],input[type=password]{width:100%;font:inherit;color:#101c14;background:#fff;border:2.5px solid #2f4536;padding:.75rem .9rem}",
    ".btn{border-radius:14px!important;min-height:50px;border-width:2px!important}",
    ".btn-row .btn{width:100%;text-align:center}",
    "main.gb-enter{animation:gbfade .22s ease}",
    "@keyframes gbfade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}",
    "#gb-tabs{position:fixed;left:0;right:0;bottom:0;z-index:1000;display:flex;background:#fff;border-top:1px solid #d8e2da;padding-bottom:env(safe-area-inset-bottom);box-shadow:0 -2px 10px rgba(16,28,20,.06)}",
    "#gb-tabs button{flex:1;border:0;background:none;padding:8px 2px 6px;font:inherit;font-size:11px;font-weight:700;color:#5b6b60;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:2px;min-height:58px;cursor:pointer;-webkit-touch-callout:none}",
    "#gb-tabs button[aria-current=page]{color:#166534}",
    "#gb-tabs .gb-ic{display:flex;align-items:center;justify-content:center;width:28px;height:28px}",
    "#gb-tabs svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}",
    "#gb-tabs button.gb-main .gb-ic{width:52px;height:52px;margin-top:-26px;border-radius:50%;background:#166534;color:#fff;box-shadow:0 4px 12px rgba(20,83,45,.4);border:4px solid #fff}",
    "#gb-tabs button.gb-main{color:#166534}",
    "#gb-toast{position:fixed;left:50%;bottom:calc(92px + env(safe-area-inset-bottom));transform:translate(-50%,20px);background:#123f22;color:#fff;padding:.7rem 1.1rem;border-radius:999px;font-weight:700;opacity:0;pointer-events:none;transition:.25s;z-index:1100}",
    "#gb-toast.show{opacity:1;transform:translate(-50%,0)}"
  );

  var style = document.createElement("style");
  style.textContent = css.join("\n");
  document.documentElement.appendChild(style);
  document.documentElement.setAttribute("data-tab", pickInitial());

  // ---------- Behaviour ----------
  function toast(msg) {
    var t = document.getElementById("gb-toast");
    if (!t) { t = document.createElement("div"); t.id = "gb-toast"; document.body.appendChild(t); }
    t.textContent = msg;
    t.className = "show";
    clearTimeout(t._t);
    t._t = setTimeout(function () { t.className = ""; }, 2600);
  }

  function go(id, noScroll) {
    if (!tabById[id]) id = "home";
    document.documentElement.setAttribute("data-tab", id);
    try { localStorage.setItem("gb_tab", id); } catch (e) {}

    var btns = document.querySelectorAll("#gb-tabs button");
    for (var i = 0; i < btns.length; i++) {
      if (btns[i].getAttribute("data-tab") === id) btns[i].setAttribute("aria-current", "page");
      else btns[i].removeAttribute("aria-current");
    }
    var bn = document.querySelector(".brand-name");
    if (bn) bn.textContent = tabById[id].title;

    var main = document.querySelector("main");
    if (main) { main.classList.remove("gb-enter"); void main.offsetWidth; main.classList.add("gb-enter"); }
    if (!noScroll) window.scrollTo(0, 0);
    window.dispatchEvent(new Event("resize")); // keeps maps sized correctly
  }

  function fixCopy() {
    function set(sel, text) { var el = document.querySelector(sel); if (el) el.textContent = text; }
    try {
      set("#dashboard .lede", "Report overflowing bins, illegal dumping and recyclables in seconds. Track what your neighbours have reported and learn how to sort waste correctly.");
      set("#stats .section-desc", "Live counts from community reports.");
      set("#report .section-desc", "Tell us where the waste is, what it is and how urgent. Add a photo and a map pin if you can. You need to be signed in to submit.");
      set("#report-form .optional-tag", "(optional, shown publicly)");
      var hints = document.querySelectorAll("#report-form .hint");
      var last = hints[hints.length - 1];
      if (last && /prototype|browser/i.test(last.textContent)) {
        last.textContent = "Your report is saved to the GreenBin database and shown on the community map.";
      }
      var side = document.querySelector("#report .grid-2 > .card:last-child");
      if (side) {
        side.innerHTML =
          '<h3>What happens next?</h3>' +
          '<ol style="margin:.5rem 0 0;padding-left:1.25rem"><li>Your report is saved and appears under Reports.</li>' +
          '<li>An admin marks it Collected once it is handled.</li></ol>' +
          '<h3 style="margin-top:1.5rem">Please don\'t include</h3>' +
          '<p style="margin:.4rem 0 0">Real names, phone numbers or exact home addresses. Use a nearby landmark, and avoid pinning your own home.</p>';
      }
    } catch (e) {}
  }

  function start() {
    var vp = document.querySelector('meta[name="viewport"]');
    if (vp && vp.content.indexOf("viewport-fit") === -1) vp.content += ", viewport-fit=cover";

    var nav = document.createElement("nav");
    nav.id = "gb-tabs";
    nav.setAttribute("aria-label", "Main");
    nav.innerHTML = TABS.map(function (t) {
      return '<button type="button" data-tab="' + t.id + '"' + (t.main ? ' class="gb-main"' : "") + '>' +
        '<span class="gb-ic"><svg viewBox="0 0 24 24" aria-hidden="true">' + t.icon + '</svg></span>' +
        '<span>' + t.label + '</span></button>';
    }).join("");
    document.body.appendChild(nav);
    nav.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-tab]");
      if (b) go(b.getAttribute("data-tab"));
    });

    // In-page links like "Report waste now" switch tabs instead of scrolling
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var tab = sectionTab[a.getAttribute("href").slice(1)];
      if (!tab) return;
      e.preventDefault();
      go(tab);
    });
    window.addEventListener("hashchange", function () {
      var h = location.hash.slice(1);
      if (tabById[h]) go(h);
      else if (sectionTab[h]) go(sectionTab[h]);
    });

    // After a successful report: toast, then jump to the Reports tab
    var conf = document.getElementById("confirmation");
    if (conf) {
      new MutationObserver(function () {
        if (/Thank you/.test(conf.textContent)) {
          conf.classList.remove("visible");
          conf.innerHTML = "";
          toast("Report saved ✓");
          setTimeout(function () { go("reports"); }, 700);
        }
      }).observe(conf, { childList: true });
    }

    fixCopy();
    go(document.documentElement.getAttribute("data-tab"), true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
