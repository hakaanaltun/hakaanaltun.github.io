/* A temporary visual layer leaves the real page and its controls intact. */
(function () {
  'use strict';
  var trigger = document.getElementById('book-compress');
  if (!trigger || !window.HTMLDialogElement || !HTMLDialogElement.prototype.showModal || !Element.prototype.animate) return;

  var scene = document.createElement('dialog');
  scene.className = 'book-compress-scene';
  scene.setAttribute('aria-label', 'Everything, compressed to a point');
  var white = document.createElement('div');
  white.className = 'book-compress-white';
  var layer = document.createElement('div');
  layer.className = 'book-compress-pieces';
  layer.setAttribute('aria-hidden', 'true');
  layer.inert = true;
  var point = document.createElement('button');
  point.type = 'button';
  point.className = 'book-compress-point';
  point.setAttribute('aria-label', 'Expand everything and return to the page');
  scene.append(white, layer, point);
  document.body.appendChild(scene);

  var state = 'idle';
  var animations = [];
  var pieces = [];
  var saved;
  var run = 0;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  function visible(el) {
    for (var parent = el; parent && parent !== document.body; parent = parent.parentElement) {
      var style = getComputedStyle(parent);
      if (style.display === 'none' || style.visibility !== 'visible' || Number(style.opacity) === 0) return false;
    }
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > -160 && r.top < innerHeight + 160 && r.right > 0 && r.left < innerWidth;
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
      if (original.tagName === 'CANVAS') {
        clone.getContext('2d').drawImage(original, 0, 0);
      }
    });
    return copy;
  }

  function capture() {
    layer.replaceChildren();
    pieces = [];
    var candidates = Array.from(document.body.querySelectorAll('h1,h2,h3,p,a,button,img,svg,hr,canvas,span'))
      .filter(function (el) { return !scene.contains(el) && visible(el); });
    var selected = new Set(candidates);
    candidates.filter(function (el) {
      for (var p = el.parentElement; p; p = p.parentElement) if (selected.has(p)) return false;
      return true;
    }).slice(0, 180).forEach(function (el) {
      var r = el.getBoundingClientRect();
      var wrapper = document.createElement('div');
      wrapper.className = 'book-compress-piece';
      Object.assign(wrapper.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
      var copy = visualCopy(el);
      Object.assign(copy.style, {
        position: 'static', margin: '0', width: r.width + 'px', height: r.height + 'px',
        minWidth: '0', maxWidth: 'none', minHeight: '0', maxHeight: 'none',
        boxSizing: 'border-box', transform: 'none', translate: 'none', rotate: 'none', scale: 'none'
      });
      wrapper.appendChild(copy);
      layer.appendChild(wrapper);
      var x = innerWidth / 2 - r.left - r.width / 2;
      var y = innerHeight / 2 - r.top - r.height / 2;
      var distance = Math.hypot(x, y) || 1;
      var drift = (Math.random() < .5 ? -1 : 1) * (45 + Math.random() * Math.min(100, innerWidth * .16));
      var phase = Math.random() * Math.PI * 2;
      pieces.push({ node: wrapper, x: x, y: y,
        bendX: -y / distance * drift, bendY: x / distance * drift,
        turn: (Math.random() - .5) * 80, phase: phase,
        massX: Math.cos(phase) * 11, massY: Math.sin(phase) * 8,
        massScale: Math.min(.4, 48 / Math.max(r.width, r.height)),
        pace: Math.random(), delay: Math.random() * 650 });
    });
  }

  function animate(el, frames, options) {
    var animation = el.animate(frames, Object.assign({ fill: 'both' }, options));
    animations.push(animation);
    return animation.finished.catch(function () {});
  }

  function flight(p, opening) {
    var frames = [];
    for (var i = 0; i <= 32; i++) {
      var t = i / 32;
      var progress = opening ? 1 - t : t;
      var arc = Math.sin(Math.PI * t);
      var wander = arc * Math.sin(Math.PI * 2 * t + p.phase);
      var direction = opening ? -1 : 1;
      var x = p.x * progress + direction * p.bendX * arc + p.bendY * wander * .18;
      var y = p.y * progress + direction * p.bendY * arc - p.bendX * wander * .18;
      if (!opening) { x += p.massX * t; y += p.massY * t; }
      var scale = opening ? .001 + .999 * (1 - Math.pow(1 - t, 1.6)) : 1 - (1 - p.massScale) * Math.pow(t, 1.6);
      var angle = p.turn * progress + p.turn * arc * .45;
      frames.push({ offset: t,
        transform: 'translate(' + x + 'px,' + y + 'px) rotate(' + angle + 'deg) scale(' + scale + ')',
        opacity: opening ? Math.min(1, t * 7) : 1 });
    }
    return frames;
  }

  function strain(p) {
    // The fragments stay visible as a tangled mass until a shared breaking point.
    return [0, .22, .44, .65, .8, 1].map(function (t, i) {
      var broken = t === 1;
      var squeeze = 1 - t * .17;
      var tremor = i === 0 || broken ? 0 : Math.sin(p.phase + i * 2.1) * 1.6;
      var x = p.x + (broken ? 0 : p.massX * squeeze + tremor);
      var y = p.y + (broken ? 0 : p.massY * squeeze - tremor * .6);
      var scale = broken ? .001 : p.massScale * squeeze;
      return { offset: t,
        transform: 'translate(' + x + 'px,' + y + 'px) rotate(' + p.turn + 'deg) scale(' + scale + ')',
        opacity: broken ? 0 : 1,
        easing: t === .8 ? 'cubic-bezier(.7,0,1,.3)' : 'ease-in-out' };
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
    trigger.focus({ preventScroll: true });
  }

  async function compress() {
    if (state !== 'idle') return;
    state = 'compressing';
    var token = ++run;
    var gentle = reduced.matches;
    try {
      var root = document.documentElement;
      saved = { x: scrollX, y: scrollY, overflow: root.style.overflow,
        gutter: root.style.scrollbarGutter, behavior: root.style.scrollBehavior };
      root.style.scrollbarGutter = 'stable';
      root.style.overflow = 'hidden';
      scene.style.background = getComputedStyle(document.body).background;
      capture();
      point.style.opacity = '0';
      point.disabled = true;
      scene.showModal();
      var duration = gentle ? 180 : 3600;
      var finish = duration;
      var jobs = pieces.map(function (p) {
        var time = gentle ? duration : duration + p.pace * 900;
        var delay = gentle ? 0 : p.delay;
        finish = Math.max(finish, time + delay);
        return animate(p.node, gentle ? [{ opacity: 1 }, { opacity: 0 }] : flight(p, false),
          { duration: time, delay: delay, easing: 'cubic-bezier(.42,0,.7,.4)' });
      });
      jobs.push(animate(white, [{ opacity: 0 }, { opacity: 1 }], { duration: finish }));
      if (gentle) jobs.push(animate(point, [{ opacity: 0 }, { opacity: 1 }], { duration: 180 }));
      await Promise.all(jobs);
      if (run !== token) return;
      if (!gentle) {
        // All arrivals finish before the mass strains and collapses together.
        var pressure = pieces.map(function (p) {
          return animate(p.node, strain(p), { duration: 1000 });
        });
        pressure.push(animate(point, [{ opacity: 0 }, { opacity: 1 }], { duration: 160, delay: 840 }));
        await Promise.all(pressure);
        if (run !== token) return;
      }
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
    point.disabled = true;
    try {
      // Re-measure the untouched page, including after a phone has been rotated.
      capture();
      var duration = reduced.matches ? 180 : 3000;
      var pause = reduced.matches ? 0 : 500;
      var firstDelay = pieces.length ? Math.min.apply(null, pieces.map(function (p) { return p.delay; })) : 0;
      var finish = duration;
      var jobs = pieces.map(function (p) {
        var time = reduced.matches ? duration : duration + p.pace * 900;
        var delay = reduced.matches ? 0 : (p.delay - firstDelay) * .8;
        finish = Math.max(finish, time + delay);
        return animate(p.node, reduced.matches ? [{ opacity: 0 }, { opacity: 1 }] : flight(p, true),
          { duration: time, delay: pause + delay, easing: 'cubic-bezier(.22,.4,.3,1)' });
      });
      jobs.push(animate(white, [{ opacity: 1 }, { opacity: 0 }], { duration: finish, delay: pause }));
      jobs.push(animate(point, [{ opacity: 1 }, { opacity: 0 }], { duration: reduced.matches ? 180 : 550, delay: pause }));
      await Promise.all(jobs);
      if (run === token) clean();
    } catch (error) { clean(); }
  }

  scene.addEventListener('cancel', function (event) {
    event.preventDefault();
    if (state === 'collapsed') expand();
    else clean();
  });
  window.addEventListener('pagehide', function () { if (state !== 'idle') clean(); });
  point.addEventListener('click', expand);
  trigger.addEventListener('click', compress);
  trigger.hidden = false;
})();
