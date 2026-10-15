(function () {
  "use strict";
  function apply() {
    var home = document.querySelector("#dashboard .gb-home");
    if (!home || home.querySelector(".gb-market")) return;
    var a = document.createElement("a");
    a.className = "gb-cta gb-market";
    a.href = "/market.html";
    a.style.marginTop = ".6rem";
    a.style.background = "#dcfce7";
    a.textContent = "Recyclables market";
    var cta = home.querySelector(".gb-cta");
    if (cta) cta.insertAdjacentElement("afterend", a);
  }
  function start() { apply(); setInterval(apply, 1000); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
