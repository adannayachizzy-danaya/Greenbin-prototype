(function () {
  "use strict";

  var css = [
    /* spacing for the Photo and Pin sections */
    "#report-form > div > label{margin-top:1.5rem!important}",
    "#report-form fieldset{margin-top:1.4rem!important}",

    /* bigger, tappable urgency choices */
    "#report-form .radio-row{gap:.6rem!important}",
    "#report-form .radio-row label{padding:.65rem 1rem!important;border:2px solid #9db0a2;border-radius:999px;background:#fff;min-height:44px}",
    "#report-form .radio-row label:has(input:checked){background:#dcfce7;border-color:#166534;color:#14532d}",

    /* nicer photo button */
    "#photo{padding:.5rem!important;min-height:56px;background:#fff!important}",
    "#photo::file-selector-button{margin-right:.8rem;padding:.7rem 1.1rem;border:0;border-radius:10px;background:#166534;color:#fff;font:inherit;font-weight:800;cursor:pointer}",

    /* taller map and bigger location button */
    "#pick-map{height:300px!important;border-radius:14px!important}",
    "#use-loc{min-height:48px!important;width:100%!important;margin-bottom:.8rem!important}",

    /* 16px text stops phones zooming in on inputs */
    "#report-form input,#report-form select,#report-form textarea{font-size:16px!important}",

    /* bigger submit button with space around it */
    "#report-form .btn-row{margin-top:1.8rem!important}",
    "#report-form .btn-primary{min-height:56px;font-size:1.1rem!important}"
  ].join("\n");

  var st = document.createElement("style");
  st.textContent = css;
  document.documentElement.appendChild(st);
})();
