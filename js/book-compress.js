/* A temporary visual layer leaves the real page and its controls intact. */
(function () {
  'use strict';
  var trigger = document.getElementById('book-compress');
  if (!trigger || !window.HTMLDialogElement || !HTMLDialogElement.prototype.showModal || !Element.prototype.animate) return;

  var scene = document.createElement('dialog');
  scene.className = 'book-compress-scene';
  scene.setAttribute('aria-label', 'Everything, compressed to a point');
  var layer = document.createElement('div');
  layer.className = 'book-compress-pieces';
  layer.setAttribute('aria-hidden', 'true');
  layer.inert = true;
  var dark = document.createElement('div');
  dark.className = 'book-compress-dark';
  var flash = document.createElement('div');
  flash.className = 'book-compress-flash';
  var point = document.createElement('button');
  point.type = 'button';
  point.className = 'book-compress-point';
  point.setAttribute('aria-label', 'Expand everything and return to the page');
  scene.append(layer, dark, flash, point);
  document.body.appendChild(scene);

  var state = 'idle';
  var animations = [];
  var pieces = [];
  var saved;
  var run = 0;
  var skipped = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  function visible(el) {
    for (var parent = el; parent && parent !== document.body; parent = parent.parentElement) {
      var style = getComputedStyle(parent);
      if (style.display === 'none' || style.visibility !== 'visible' || Number(style.opacity) === 0) return false;
    }
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > -160 && r.top < innerHeight + 160 && r.right > 0 && r.left < innerWidth;
  }

  /* A fragment keeps the ground it was written for. Cream type lifted off a
     dark surface onto the page's own paper is type nobody can read. */
  function bandBehind(el, ground, known) {
    for (var parent = el.parentElement; parent && parent !== document.documentElement; parent = parent.parentElement) {
      var color = known.get(parent);
      if (color === undefined) {
        color = getComputedStyle(parent).backgroundColor;
        known.set(parent, color);
      }
      if (color && color !== 'transparent' && color !== 'rgba(0, 0, 0, 0)') {
        return color === ground ? '' : color;
      }
    }
    return '';
  }

  function visualCopy(el) {
    var copy = el.cloneNode(true);
    var originals = [el].concat(Array.from(el.querySelectorAll('*')));
    var copies = [copy].concat(Array.from(copy.querySelectorAll('*')));
    originals.forEach(function (original, i) {
      var clone = copies[i];
      var style = getComputedStyle(original);
      for (var j = 0; j < style.length; j++) {
        var key = style[j];
        clone.style.setProperty(key, style.getPropertyValue(key));
      }
      clone.removeAttribute('id');
      clone.removeAttribute('autofocus');
      clone.style.setProperty('animation', 'none', 'important');
      clone.style.setProperty('transition', 'none', 'important');
      // A cloned canvas is blank, and one already torn down cannot be read.
      if (original.tagName === 'CANVAS' && original.width && original.height) {
        try { clone.getContext('2d').drawImage(original, 0, 0); } catch (error) {}
      }
    });
    return copy;
  }

  function capture() {
    layer.replaceChildren();
    pieces = [];
    // The chrome bands travel whole rather than as one piece per link: a band
    // is a surface, and taking it apart leaves the type on it without one.
    var candidates = Array.from(document.body.querySelectorAll('header,footer,h1,h2,h3,p,a,button,img,svg,hr,canvas,span'))
      .filter(function (el) { return !scene.contains(el) && visible(el); });
    var selected = new Set(candidates);
    var chosen = candidates.filter(function (el) {
      for (var p = el.parentElement; p; p = p.parentElement) if (selected.has(p)) return false;
      return true;
    }).slice(0, 180);
    // Read the page in one pass and attach the layer in one go. Measuring and
    // appending in the same turn made every piece force its own reflow.
    var ground = getComputedStyle(document.body).backgroundColor;
    var rects = chosen.map(function (el) { return el.getBoundingClientRect(); });
    var known = new Map();
    var bands = chosen.map(function (el) { return bandBehind(el, ground, known); });
    var copies = chosen.map(function (el) { return visualCopy(el); });
    var batch = document.createDocumentFragment();
    chosen.forEach(function (el, index) {
      var r = rects[index];
      var wrapper = document.createElement('div');
      wrapper.className = 'book-compress-piece';
      Object.assign(wrapper.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
      if (bands[index]) wrapper.style.background = bands[index];
      var copy = copies[index];
      Object.assign(copy.style, {
        position: 'static', margin: '0', width: r.width + 'px', height: r.height + 'px',
        minWidth: '0', maxWidth: 'none', minHeight: '0', maxHeight: 'none',
        boxSizing: 'border-box', transform: 'none', translate: 'none', rotate: 'none', scale: 'none'
      });
      wrapper.appendChild(copy);
      batch.appendChild(wrapper);
      var x = innerWidth / 2 - r.left - r.width / 2;
      var y = innerHeight / 2 - r.top - r.height / 2;
      var distance = Math.hypot(x, y) || 1;
      var drift = (Math.random() < .5 ? -1 : 1) * (45 + Math.random() * Math.min(100, innerWidth * .16));
      var phase = Math.random() * Math.PI * 2;
      pieces.push({ node: wrapper, x: x, y: y, width: r.width, height: r.height,
        bendX: -y / distance * drift, bendY: x / distance * drift,
        turn: (Math.random() - .5) * 80, phase: phase,
        massX: Math.cos(phase) * 3, massY: Math.sin(phase) * 3,
        massScale: .62 + Math.random() * .12,
        pace: Math.random(), delay: Math.random() * 400 });
    });
    layer.appendChild(batch);
  }

  function animate(el, frames, options) {
    var animation = el.animate(frames, Object.assign({ fill: 'both' }, options));
    animations.push(animation);
    return animation.finished.catch(function () {});
  }

  function flight(p) {
    var frames = [];
    for (var i = 0; i <= 32; i++) {
      var t = i / 32;
      var arc = Math.sin(Math.PI * t);
      var wander = arc * Math.sin(Math.PI * 2 * t + p.phase);
      var x = (p.x + p.massX) * t + p.bendX * arc + p.bendY * wander * .18;
      var y = (p.y + p.massY) * t + p.bendY * arc - p.bendX * wander * .18;
      // Keep their size as they collide. Only the vacuum clears the pile.
      var scale = 1 - (1 - p.massScale) * Math.pow(t, 4);
      var angle = p.turn * t + p.turn * arc * .45;
      frames.push({ offset: t,
        transform: 'translate(' + x + 'px,' + y + 'px) rotate(' + angle + 'deg) scale(' + scale + ')',
        opacity: 1 });
    }
    return frames;
  }

  function vacuum(p) {
    var frames = [];
    for (var i = 0; i <= 40; i++) {
      var t = i / 40;
      var pull = Math.max(0, (t - .16) / .84);
      var remaining = 1 - Math.pow(pull, 3);
      var x = p.x + p.massX * remaining;
      var y = p.y + p.massY * remaining;
      var angle = p.turn + (p.turn < 0 ? -1 : 1) * 22 * (1 - remaining);
      frames.push({ offset: t,
        transform: 'translate(' + x + 'px,' + y + 'px) rotate(' + angle + 'deg) scale(' + Math.max(.001, p.massScale * remaining) + ')',
        opacity: Math.min(1, remaining * 16) });
    }
    return frames;
  }

  /* Three wrong places before the right one. Each is another fragment's seat,
     and where two of them reach for the same one they push each other off it.
     Not physics — only the moment where two things cannot both be right. */
  function shoulders(round) {
    for (var pass = 0; pass < 4; pass++) {
      for (var i = 0; i < pieces.length; i++) {
        for (var j = i + 1; j < pieces.length; j++) {
          var a = pieces[i].tries[round], b = pieces[j].tries[round];
          var dx = (b.cx + b.pushX) - (a.cx + a.pushX);
          var dy = (b.cy + b.pushY) - (a.cy + a.pushY);
          var overlapX = (pieces[i].width + pieces[j].width) * .45 - Math.abs(dx);
          var overlapY = (pieces[i].height + pieces[j].height) * .45 - Math.abs(dy);
          if (overlapX <= 0 || overlapY <= 0) continue;
          var push;
          // Part along the shallower axis, the way two things actually part.
          if (overlapX < overlapY) {
            push = (dx < 0 ? -1 : 1) * overlapX * .3;
            a.pushX -= push; b.pushX += push;
          } else {
            push = (dy < 0 ? -1 : 1) * overlapY * .3;
            a.pushY -= push; b.pushY += push;
          }
        }
      }
    }
    // Weight decides who gives way. A retailer link is knocked clear across;
    // a paragraph takes the same shove and barely moves.
    pieces.forEach(function (p) {
      var t = p.tries[round];
      var cap = Math.max(26, 130 - Math.sqrt(p.width * p.height) * .35);
      var reach = Math.hypot(t.pushX, t.pushY);
      if (reach > cap) {
        t.pushX *= cap / reach;
        t.pushY *= cap / reach;
      }
    });
  }

  function wanderings() {
    var seats = pieces.map(function (p) {
      return { x: innerWidth / 2 - p.x, y: innerHeight / 2 - p.y };
    });
    pieces.forEach(function (p) { p.tries = []; });
    for (var round = 0; round < 3; round++) {
      pieces.forEach(function (p, i) {
        var seat = seats[Math.floor(Math.random() * seats.length)];
        var cx = seat.x, cy = seat.y;
        // A fragment that draws its own seat has not gone anywhere yet.
        if (Math.abs(cx - seats[i].x) < 60 && Math.abs(cy - seats[i].y) < 60) {
          cy = cy < innerHeight / 2 ? innerHeight * .72 : innerHeight * .28;
        }
        var marginX = Math.min(p.width / 2 + 12, innerWidth * .4);
        var marginY = Math.min(p.height / 2 + 12, innerHeight * .4);
        p.tries.push({
          cx: Math.max(marginX, Math.min(innerWidth - marginX, cx)),
          cy: Math.max(marginY, Math.min(innerHeight - marginY, cy)),
          pushX: 0, pushY: 0
        });
      });
      shoulders(round);
    }
    pieces.forEach(function (p, i) {
      p.tries.forEach(function (t) {
        t.x = t.cx - seats[i].x;
        t.y = t.cy - seats[i].y;
        t.shovedX = t.x + t.pushX;
        t.shovedY = t.y + t.pushY;
      });
    });
  }

  function findHome(p) {
    var arrive = [.19, .45, .70], scales = [.74, .85, .93];
    var stops = [{ t: 0, x: p.x, y: p.y, scale: .001, angle: p.turn, kind: 'travel' }];
    p.tries.forEach(function (t, i) {
      var tilt = Math.sin(p.phase + i * 1.7) * (17 - i * 4);
      // Only what actually landed in a crowd is jolted, and only as hard as it was.
      var knocked = tilt + Math.max(-9, Math.min(9, (t.pushX + t.pushY) * .12));
      stops.push({ t: arrive[i], x: t.x, y: t.y, scale: scales[i], angle: tilt, kind: 'shove' });
      stops.push({ t: arrive[i] + .055, x: t.shovedX, y: t.shovedY, scale: scales[i], angle: knocked, kind: 'hold' });
      stops.push({ t: arrive[i] + .11, x: t.shovedX, y: t.shovedY, scale: scales[i], angle: knocked, kind: 'travel' });
    });
    stops.push({ t: 1, x: 0, y: 0, scale: 1, angle: 0 });
    var frames = [];
    for (var leg = 0; leg < stops.length - 1; leg++) {
      var from = stops[leg], to = stops[leg + 1];
      var steps = from.kind === 'travel' ? 14 : (from.kind === 'shove' ? 4 : 1);
      for (var i = 0; i <= steps; i++) {
        if (leg > 0 && i === 0) continue;
        var u = i / steps;
        // A shove is sudden and then over; everything else eases both ends.
        var ease = from.kind === 'shove' ? 1 - Math.pow(1 - u, 3) : u * u * (3 - 2 * u);
        var bend = from.kind === 'travel' ? Math.sin(Math.PI * ease) * (leg === 0 ? .55 : .2) : 0;
        var t = from.t + (to.t - from.t) * u;
        var x = from.x + (to.x - from.x) * ease + p.bendX * bend;
        var y = from.y + (to.y - from.y) * ease + p.bendY * bend;
        frames.push({ offset: t,
          transform: 'translate(' + x + 'px,' + y + 'px) rotate(' +
            (from.angle + (to.angle - from.angle) * ease) + 'deg) scale(' +
            (from.scale + (to.scale - from.scale) * ease) + ')',
          opacity: Math.min(1, t * 12) });
      }
    }
    return frames;
  }

  /* A reader holding a phone has no Escape key, and the round trip is long
     enough to want a way out of. A tap runs the rest of it at once. */
  function skip() {
    if (state !== 'compressing' && state !== 'expanding') return;
    skipped = true;
    animations.forEach(function (animation) {
      try { animation.finish(); } catch (error) {}
    });
  }

  function clean() {
    run++;
    animations.forEach(function (a) { a.cancel(); });
    animations = [];
    layer.replaceChildren();
    pieces = [];
    if (scene.open) scene.close();
    if (saved) {
      var root = document.documentElement;
      root.style.overflow = saved.overflow;
      root.style.scrollbarGutter = saved.gutter;
      root.style.scrollBehavior = 'auto';
      window.scrollTo(saved.x, saved.y);
      root.style.scrollBehavior = saved.behavior;
      saved = null;
    }
    state = 'idle';
    point.disabled = true;
    trigger.focus({ preventScroll: true });
  }

  async function compress() {
    if (state !== 'idle') return;
    state = 'compressing';
    var token = ++run;
    var gentle = reduced.matches;
    skipped = false;
    try {
      var root = document.documentElement;
      saved = { x: scrollX, y: scrollY, overflow: root.style.overflow,
        gutter: root.style.scrollbarGutter, behavior: root.style.scrollBehavior };
      root.style.scrollbarGutter = 'stable';
      root.style.overflow = 'hidden';
      capture();
      point.style.opacity = '0';
      point.disabled = true;
      dark.style.opacity = '0';
      flash.style.opacity = '0';
      scene.showModal();
      var duration = gentle ? 180 : 2200;
      var jobs = pieces.map(function (p) {
        return animate(p.node, gentle ? [{ opacity: 1 }, { opacity: 0 }] : flight(p),
          { duration: gentle ? duration : duration + p.pace * 600,
            delay: gentle ? 0 : p.delay, easing: 'cubic-bezier(.42,0,.7,.4)' });
      });
      await Promise.all(jobs);
      if (run !== token) return;
      // The overlapping mass is pulled inward without making room first, and
      // the dark closes over it only once there is nothing left to read.
      var closing = gentle ? [] : pieces.map(function (p) {
        return animate(p.node, vacuum(p), { duration: 700 });
      });
      closing.push(animate(dark, [{ opacity: 0 }, { opacity: 1 }], { duration: gentle ? 180 : 700 }));
      closing.push(animate(point, [{ opacity: 0 }, { opacity: 1 }],
        { duration: gentle ? 180 : 200, delay: gentle ? 0 : 420 }));
      if (skipped) skip();
      await Promise.all(closing);
      if (run !== token) return;
      state = 'collapsed';
      point.disabled = false;
      point.focus({ preventScroll: true });
      // A focused keyboard target remains available while the visual copies can be released.
      layer.replaceChildren();
      pieces = [];
    } catch (error) { clean(); }
  }

  async function expand() {
    if (state !== 'collapsed') return;
    state = 'expanding';
    var token = run;
    var gentle = reduced.matches;
    skipped = false;
    point.disabled = true;
    try {
      // Re-measure the untouched page, including after a phone has been rotated.
      capture();
      if (!gentle) wanderings();
      var duration = gentle ? 180 : 4800;
      var pause = gentle ? 0 : 380;
      var firstDelay = pieces.length ? Math.min.apply(null, pieces.map(function (p) { return p.delay; })) : 0;
      var jobs = pieces.map(function (p) {
        return animate(p.node, gentle ? [{ opacity: 0 }, { opacity: 1 }] : findHome(p),
          { duration: gentle ? duration : duration + p.pace * 500,
            delay: gentle ? 0 : pause + (p.delay - firstDelay) * .5, easing: 'linear' });
      });
      // Releasing the point is the explosion the book puts after the dark, so
      // the dark it was holding opens into light before anything finds a place.
      jobs.push(animate(dark, [{ opacity: 1 }, { opacity: 0 }],
        { duration: gentle ? 180 : 420, easing: 'cubic-bezier(.2,0,0,1)' }));
      if (!gentle) {
        jobs.push(animate(flash, [{ opacity: 0, offset: 0 }, { opacity: 1, offset: .06 }, { opacity: 0, offset: 1 }],
          { duration: 600 }));
      }
      jobs.push(animate(point, [{ opacity: 1 }, { opacity: 0 }], { duration: gentle ? 180 : 380 }));
      await Promise.all(jobs);
      if (run === token) clean();
    } catch (error) { clean(); }
  }

  scene.addEventListener('cancel', function (event) {
    event.preventDefault();
    if (state === 'collapsed') expand();
    else clean();
  });
  scene.addEventListener('pointerdown', skip);
  window.addEventListener('pagehide', function () { if (state !== 'idle') clean(); });
  point.addEventListener('click', expand);
  trigger.addEventListener('click', compress);
  point.disabled = true;
  trigger.hidden = false;
})();
