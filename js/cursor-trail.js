/* A short trail of gold behind the pointer in The House, a place to walk
   around in rather than to read.

   It follows a mouse only. A finger has no pointer to follow, and a reader
   who has asked for less motion gets none. The trail is drawn on one canvas
   laid over the page that no click, hover or selection can land on, and it
   stops drawing as soon as the last speck has faded, so a still pointer
   costs nothing.

   The colour is the page's to choose, so another page can take the trail
   up without touching this file: whatever is under the pointer sets
   --trail, a colour, and --trail-glow: 1 where the ground is dark enough for
   the specks to add light to each other rather than ink. On pale ground, where
   a light speck would be lost, --trail-aura gives each one a faint surround of
   a deeper colour to stand out from. Without any of them the trail is a
   middling gold. */
(function () {
  'use strict';
  if (!window.matchMedia || !window.requestAnimationFrame) return;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  var MAX = 600;        // specks alive at once
  var STEP = 3;         // px of travel between specks
  var GOLD = '#b99545';
  var canvas, ctx, ratio = 1, specks = [], last = null, running = false;
  var ground = { node: null, read: 0, colour: GOLD, glow: false, aura: '' };

  function setup() {
    var c = document.createElement('canvas');
    ctx = c.getContext && c.getContext('2d');
    if (!ctx) return false;
    canvas = c;
    canvas.className = 'cursor-trail';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147483000';
    document.body.appendChild(canvas);
    size();
    window.addEventListener('resize', size);
    return true;
  }

  function size() {
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
  }

  /* Read again when the pointer crosses into something new, and now and then
     where it is, since the room changes its hour and the reader their theme
     without the pointer moving. */
  function colourAt(node, now) {
    if (node === ground.node && now - ground.read < 500) return ground;
    var style = getComputedStyle(node.nodeType === 1 ? node : document.body);
    ground.node = node;
    ground.read = now;
    ground.colour = style.getPropertyValue('--trail').trim() || GOLD;
    ground.glow = style.getPropertyValue('--trail-glow').trim() === '1';
    ground.aura = style.getPropertyValue('--trail-aura').trim();
    return ground;
  }

  function add(x, y, at) {
    if (specks.length >= MAX) specks.shift();
    /* Most specks settle where the pointer passed; a few are thrown off it
       and drift, which is what makes it a trail of light and not a line. */
    var thrown = Math.random() < 0.2;
    var angle = Math.random() * Math.PI * 2;
    var speed = thrown ? 0.02 + Math.random() * 0.04 : Math.random() * 0.006;
    specks.push({
      x: x + (Math.random() - 0.5) * 4,
      y: y + (Math.random() - 0.5) * 4,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + 0.008,
      r: thrown ? 0.7 + Math.random() * 0.8 : 1.2 + Math.random() * 1.4,
      born: at,
      life: thrown ? 600 + Math.random() * 400 : 800 + Math.random() * 400,
      colour: ground.colour,
      glow: ground.glow,
      aura: ground.aura
    });
  }

  function move(event) {
    if (event.pointerType !== 'mouse' || calm.matches) return;
    var target = event.target;
    // A dialog stands above the canvas; nothing drawn under it would show.
    if (target && target.closest && target.closest('dialog[open]')) { last = null; return; }
    if (!canvas && !setup()) { document.removeEventListener('pointermove', move); return; }
    var now = performance.now();
    colourAt(target, now);
    var points = event.getCoalescedEvents ? event.getCoalescedEvents() : [];
    if (!points.length) points = [event];
    for (var i = 0; i < points.length; i++) {
      var x = points[i].clientX, y = points[i].clientY, t = points[i].timeStamp;
      // An older browser stamps its events from 1970, not from the page.
      if (!(Math.abs(now - t) < 1000)) t = now;
      if (!last) { add(x, y, t); last = { x: x, y: y, t: t }; continue; }
      var dx = x - last.x, dy = y - last.y, far = Math.sqrt(dx * dx + dy * dy);
      var n = Math.min(Math.floor(far / STEP), 60);
      // Spread along the way in time as well as space, so the trail fades
      // smoothly back from its head rather than in a step for each event.
      // A pointer that sat still for a while starts from now, not from then.
      var from = Math.max(last.t, t - 50);
      for (var k = 1; k <= n; k++) add(last.x + dx * k / n, last.y + dy * k / n, from + (t - from) * k / n);
      if (n) last = { x: x, y: y, t: t };
    }
    if (!running) { running = true; requestAnimationFrame(draw); }
  }

  /* Drawn once for each colour and then only stamped: a gradient made fresh
     for every speck in every frame would be the whole cost of the trail. */
  var halos = {};
  function halo(colour) {
    if (halos[colour]) return halos[colour];
    var c = document.createElement('canvas'), g = c.getContext('2d');
    c.width = c.height = 64;
    var fade = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    fade.addColorStop(0, 'rgba(255,255,255,1)');
    fade.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = fade;
    g.fillRect(0, 0, 64, 64);
    // The fade is only a shape; the colour goes into it afterwards, so it
    // thins out without greying at the edge.
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = colour;
    g.fillRect(0, 0, 64, 64);
    return (halos[colour] = c);
  }

  function dot(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw(now) {
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var kept = 0;
    for (var pass = 0; pass < 2; pass++) {
      // Ink first, then light, so the bright specks sit on top.
      ctx.globalCompositeOperation = pass ? 'lighter' : 'source-over';
      for (var i = 0; i < specks.length; i++) {
        var s = specks[i];
        if (s.glow !== !!pass) continue;
        var age = Math.max(now - s.born, 0);
        if (age >= s.life) continue;
        var left = 1 - age / s.life;
        var x = s.x + s.vx * age, y = s.y + s.vy * age, r = s.r * (0.35 + 0.65 * left);
        ctx.fillStyle = s.colour;
        // A lit speck carries a soft halo; where the halos overlap, at the
        // head of the trail, they add up to a light of their own.
        var alpha = Math.pow(left, 1.3);
        if (!s.glow && s.aura) { ctx.globalAlpha = alpha * 0.35; ctx.drawImage(halo(s.aura), x - r * 3, y - r * 3, r * 6, r * 6); }
        if (s.glow) { ctx.globalAlpha = alpha * 0.45; ctx.drawImage(halo(s.colour), x - r * 4, y - r * 4, r * 8, r * 8); }
        ctx.globalAlpha = alpha;
        dot(x, y, r);
      }
    }
    for (var j = 0; j < specks.length; j++) {
      if (now - specks[j].born < specks[j].life) specks[kept++] = specks[j];
    }
    specks.length = kept;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    if (kept) requestAnimationFrame(draw);
    else { running = false; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }

  document.addEventListener('pointermove', move, { passive: true });
  // Coming back in at the other side of the window is not a stroke across it.
  document.addEventListener('pointerout', function (event) { if (!event.relatedTarget) last = null; });
})();
