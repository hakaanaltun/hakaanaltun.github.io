/* astronomy.js — the shared solar and lunar arithmetic behind /moon/,
   /season/, /twilight/ and the homepage's "Tonight" line. Pure math, no
   DOM: each page keeps its own UI and calls in here, so the pages and the
   home strip always agree. (js/theme.js and head.html carry their own
   compact copy of the solar altitude for the Dusk theme — those stay
   inline so the theme can resolve before first paint.) */
(function(){
  "use strict";
  var RAD = Math.PI / 180;

  /* ---- a place's UTC offset at a given instant (DST-aware, via Intl) ---- */
  var offFmts = {};
  function offFmt(tz){
    return offFmts[tz] || (offFmts[tz] = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    }));
  }
  function tzOffsetMs(tz, date){
    var p = {};
    offFmt(tz).formatToParts(date).forEach(function(x){ p[x.type] = x.value; });
    var asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, (+p.hour) % 24, +p.minute, +p.second);
    return asUTC - Math.floor(date.getTime() / 1000) * 1000;
  }

  /* ---- the calendar day where the observer stands ---- */
  function dayOfYearLocal(now, tz){
    var s = new Date(now.getTime() + tzOffsetMs(tz, now));  /* UTC fields = the local wall clock */
    var start = Date.UTC(s.getUTCFullYear(), 0, 0);
    return { n: Math.floor((s.getTime() - start) / 86400000),
             y: s.getUTCFullYear(), mo: s.getUTCMonth(), d: s.getUTCDate() };
  }

  /* ---- sunrise/sunset (Almanac for Computers algorithm, ±1–2 min) ----
     zenith: 90.833 for sunrise/sunset, 96 for civil twilight. The event is
     anchored to the observer's own calendar day: for far-east or far-west
     places the UT can land on the neighboring UTC date, which put sunset
     before sunrise and bent the day length negative. ---- */
  function sunEvent(day, rising, zenith, lat, lng, tz){
    var lngHour = lng / 15;
    var t = day.n + (((rising ? 6 : 18) - lngHour) / 24);
    var M = (0.9856 * t) - 3.289;
    var L = M + (1.916 * Math.sin(M * RAD)) + (0.020 * Math.sin(2 * M * RAD)) + 282.634;
    L = ((L % 360) + 360) % 360;
    var RA = Math.atan(0.91764 * Math.tan(L * RAD)) / RAD;
    RA = ((RA % 360) + 360) % 360;
    RA = (RA + (Math.floor(L / 90) * 90) - (Math.floor(RA / 90) * 90)) / 15;
    var sinDec = 0.39782 * Math.sin(L * RAD);
    var cosDec = Math.cos(Math.asin(sinDec));
    var cosH = (Math.cos(zenith * RAD) - (sinDec * Math.sin(lat * RAD))) / (cosDec * Math.cos(lat * RAD));
    if(cosH > 1 || cosH < -1) return null;
    var H = rising ? 360 - Math.acos(cosH) / RAD : Math.acos(cosH) / RAD;
    H /= 15;
    var T = H + RA - (0.06571 * t) - 6.622;
    var UT = ((T - lngHour) % 24 + 24) % 24;
    var date = new Date(Date.UTC(day.y, day.mo, day.d));
    date.setUTCMinutes(Math.round(UT * 60));
    var wall = new Date(date.getTime() + tzOffsetMs(tz, date));
    var shift = Date.UTC(day.y, day.mo, day.d)
              - Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate());
    if(shift !== 0) date = new Date(date.getTime() + shift);
    return date;
  }

  /* ---- current solar altitude (low-precision ephemeris, ±0.3°) ---- */
  function sunAltitude(now, lat, lng){
    var d = (now.getTime() / 86400000) - 10957.5;        /* days since J2000 */
    var g = (357.529 + 0.98560028 * d) * RAD;
    var q = 280.459 + 0.98564736 * d;
    var L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * RAD;
    var e = (23.439 - 0.00000036 * d) * RAD;
    var sinDec = Math.sin(e) * Math.sin(L);
    var dec = Math.asin(sinDec);
    var RAh = (Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / RAD) / 15;
    var GMST = ((18.697374558 + 24.06570982441908 * d) % 24 + 24) % 24;
    var lst = ((GMST + lng / 15) % 24 + 24) % 24;
    var H = ((lst - RAh) * 15 + 540) % 360 - 180;
    var latR = lat * RAD;
    return Math.asin(Math.sin(latR) * sinDec + Math.cos(latR) * Math.cos(dec) * Math.cos(H * RAD)) / RAD;
  }

  /* ---- the moon: mean-cycle phase arithmetic ---- */
  var SYNODIC = 29.530588853;                            /* mean lunation, days */
  var NEW_EPOCH = Date.UTC(2000, 0, 6, 18, 14);          /* a known new moon */
  var MOON_EDGES = [1.84566, 5.53699, 9.22831, 12.91963, 16.61096, 20.30228, 23.99361, 27.68493];
  function lunation(now){ return (now.getTime() - NEW_EPOCH) / 86400000 / SYNODIC; }
  /* age in days → phase index 0–7 (new, waxing crescent, first quarter,
     waxing gibbous, full, waning gibbous, last quarter, waning crescent);
     past the last edge the cycle wraps back to new. */
  function moonPhaseIndex(age){
    for(var i = 0; i < MOON_EDGES.length; i++){ if(age < MOON_EDGES[i]) return i; }
    return 0;
  }

  /* ---- solstices & equinoxes: Meeus, Astronomical Algorithms ch. 27 ----
     Mean JDE polynomial for the years 1000–3000, then 24 periodic terms.
     Accuracy is a small fraction of an hour — plenty for a calendar page. */
  var MEAN = [
    [2451623.80984, 365242.37404,  0.05169, -0.00411, -0.00057],   /* March equinox   */
    [2451716.56767, 365241.62603,  0.00325,  0.00888, -0.00030],   /* June solstice   */
    [2451810.21715, 365242.01767, -0.11575,  0.00337,  0.00078],   /* September eq.   */
    [2451900.05952, 365242.74049, -0.06223, -0.00823,  0.00032]    /* December sol.   */
  ];
  var TERMS = [
    [485,324.96,1934.136],[203,337.23,32964.467],[199,342.08,20.186],[182,27.85,445267.112],
    [156,73.14,45036.886],[136,171.52,22518.443],[77,222.54,65928.934],[74,296.72,3034.906],
    [70,243.58,9037.513],[58,119.81,33718.147],[52,297.17,150.678],[50,21.02,2281.226],
    [45,247.54,29929.562],[44,325.15,31555.956],[29,60.93,4443.417],[18,155.12,67555.328],
    [17,288.79,4562.452],[16,198.04,62894.029],[14,199.76,31436.921],[12,95.39,14577.848],
    [12,287.11,31931.756],[12,320.81,34777.259],[9,227.73,1222.114],[8,15.45,16859.074]
  ];
  function turningPoint(year, which){          /* → epoch ms, UTC */
    var Y = (year - 2000) / 1000;
    var c = MEAN[which];
    var JDE0 = c[0] + c[1]*Y + c[2]*Y*Y + c[3]*Y*Y*Y + c[4]*Y*Y*Y*Y;
    var T = (JDE0 - 2451545.0) / 36525;
    var W = (35999.373 * T - 2.47) * RAD;
    var dl = 1 + 0.0334 * Math.cos(W) + 0.0007 * Math.cos(2 * W);
    var S = 0;
    for(var i = 0; i < TERMS.length; i++){
      S += TERMS[i][0] * Math.cos((TERMS[i][1] + TERMS[i][2] * T) * RAD);
    }
    var JDE = JDE0 + (0.00001 * S) / dl;       /* in TT */
    return (JDE - 2440587.5) * 86400000 - 69000;   /* TT → UTC, ΔT ≈ 69 s */
  }

  window.OLAE_ASTRO = {
    tzOffsetMs: tzOffsetMs,
    dayOfYearLocal: dayOfYearLocal,
    sunEvent: sunEvent,
    sunAltitude: sunAltitude,
    SYNODIC: SYNODIC,
    NEW_EPOCH: NEW_EPOCH,
    MOON_EDGES: MOON_EDGES,
    lunation: lunation,
    moonPhaseIndex: moonPhaseIndex,
    turningPoint: turningPoint
  };
})();
