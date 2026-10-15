(function () {
  "use strict";

  var st = document.createElement("style");
  st.textContent = [
    /* One scroll area only: the page itself */
    "html{overflow:visible!important;height:auto!important}",
    "body{overflow-x:clip!important;overflow-y:visible!important;height:auto!important;overscroll-behavior-y:auto!important}",
    "html.gb-pending,html.gb-pending body{overflow:hidden!important}",
    "#report-form{overflow:visible!important}",

    /* Map lock overlay */
    ".gb-maplock{position:absolute;top:0;right:0;bottom:0;left:0;z-index:1200;display:flex;align-items:flex-end;justify-content:center;padding-bottom:.7rem;background:rgba(255,255,255,.01);cursor:pointer}",
    ".gb-maplock span{background:#123f22;color:#fff;padding:.5rem 1rem;border-radius:999px;font-weight:700;font-size:.9rem;pointer-events:none}",
    ".gb-mapdone{position:absolute;top:10px;right:10px;z-index:1200;background:#166534;color:#fff;border:0;border-radius:999px;padding:.55rem 1rem;font:inherit;font-weight:800;min-height:40px;cursor:pointer}"
  ].join("\n");
  document.documentElement.appendChild(st);

  var EVENTS = ["click", "dblclick", "mousedown", "mouseup", "touchstart", "touchend", "pointerdown", "pointerup"];
  function isolate(el) {
    EVENTS.forEach(function (ev) {
      el.addEventListener(ev, function (e) { e.stopPropagation(); });
    });
  }

  function lock(id) {
    var map = document.getElementById(id);
    if (!map || map.getAttribute("data-gb-lock")) return false;
    map.setAttribute("data-gb-lock", "1");

    var ov = document.createElement("div");
    ov.className = "gb-maplock";
    ov.innerHTML = "<span>Tap to use map</span>";

    var done = document.createElement("button");
    done.type = "button";
    done.className = "gb-mapdone";
    done.textContent = "Done";
    done.style.display = "none";

    isolate(ov);
    isolate(done);

    ov.addEventListener("click", function () {
      ov.style.display = "none";
      done.style.display = "block";
    });
    done.addEventListener("click", function () {
      ov.style.display = "flex";
      done.style.display = "none";
    });

    map.appendChild(ov);
    map.appendChild(done);
    return true;
  }

  var tries = 0;
  var timer = setInterval(function () {
    tries++;
    var a = lock("pick-map");
    var b = lock("all-map");
    var both = document.getElementById("pick-map") && document.getElementById("all-map") &&
      document.getElementById("pick-map").getAttribute("data-gb-lock") &&
      document.getElementById("all-map").getAttribute("data-gb-lock");
    if (both || tries > 40) clearInterval(timer);
  }, 500);
})();
