(function () {
  "use strict";
  var st = document.createElement("style");
  st.textContent = [
    /* Let vertical swipes scroll the page, even when your finger is on a map */
    "#pick-map,#all-map,#pick-map *,#all-map *{touch-action:pan-y!important}",
    "#pick-map .leaflet-control-zoom a,#all-map .leaflet-control-zoom a{touch-action:manipulation!important}",
    "html:not(.gb-pending),html:not(.gb-pending) body{overflow-y:auto!important}",
    "#report-form{overflow:visible!important}"
  ].join("\n");
  document.documentElement.appendChild(st);
})();
