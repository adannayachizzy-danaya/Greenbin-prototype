(function () {
  "use strict";

  var css = [
    "#stats-grid{grid-template-columns:repeat(2,1fr)!important;gap:.8rem!important}",
    ".stat-card{padding:1rem!important}",
    ".stat-card strong.k{font-size:.9rem!important}",
    ".stat-card strong.v{font-size:1.8rem!important}",
    ".stat-card small{font-size:.85rem!important}",
    "#stat-top{font-size:1.2rem!important;line-height:1.3!important;min-height:2.4rem}",
    ".mock-note{display:none!important}",
    ".gb-cta{font-size:1.15rem!important;padding:1.05rem!important}",
    ".gb-hi,.gb-sub{font-size:1rem!important}",
    ".gb-chips{font-size:1rem!important}",
    "#gb-tabs button{font-size:12px!important}",
    "#stats h2{margin-top:.5rem}"
  ].join("\n");
  var st = document.createElement("style");
  st.textContent = css;
  document.documentElement.appendChild(st);

  function fixText() {
    var label = document.getElementById("stat-top-label");
    if (label && label.textContent !== "Top category") label.textContent = "Top category";

    var total = document.getElementById("stat-total");
    if (total && total.parentNode) {
      var small = total.parentNode.querySelector("small");
      if (small && small.textContent !== "All community reports") {
        small.textContent = "All community reports";
      }
    }
  }

  function start() {
    fixText();
    var grid = document.getElementById("stats-grid");
    if (grid) {
      new MutationObserver(fixText).observe(grid, { childList: true, subtree: true, characterData: true });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
