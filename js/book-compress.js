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
    }).slice(0, 180).forEach(function (el, index) {
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
      pieces.push({ node: wrapper, x: innerWidth / 2 - r.left - r.width / 2,
        y: innerHeight / 2 - r.top - r.height / 2, turn: (index % 2 ? 1 : -1) * (4 + index % 9) });
    });
  }

  function animate(el, frames, options) {
    var animation = el.animate(frames, Object.assign({ fill: 'both' }, options));
    animations.push(animation);
    return animation.finished.catch(function () {});
  }

  function packed(p) {
    return 'translate(' + p.x + 'px,' + p.y + 'px) rotate(' + p.turn + 'deg) scale(0.001)';
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
      var duration = reduced.matches ? 180 : 2200;
      var jobs = pieces.map(function (p, i) {
        return animate(p.node, reduced.matches ? [{ opacity: 1 }, { opacity: 0 }] : [
          { transform: 'none', opacity: 1 },
          { transform: 'translate(' + p.x * .1 + 'px,' + p.y * .1 + 'px) rotate(' + p.turn * .15 + 'deg) scale(.94)', opacity: 1, offset: .4 },
          { transform: packed(p), opacity: 0 }
        ], { duration: duration, delay: reduced.matches ? 0 : i % 5 * 22, easing: 'cubic-bezier(.55,0,.85,.35)' });
      });
      jobs.push(animate(white, [{ opacity: 0 }, { opacity: 1 }], { duration: duration }));
      jobs.push(animate(point, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: reduced.matches ? 0 : duration - 200 }));
      await Promise.all(jobs);
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
    point.disabled = true;
    try {
      // Re-measure the untouched page, including after a phone has been rotated.
      capture();
      var duration = reduced.matches ? 180 : 1500;
      var jobs = pieces.map(function (p) {
        return animate(p.node, reduced.matches ? [{ opacity: 0 }, { opacity: 1 }] : [
          { transform: packed(p), opacity: 0 },
          { transform: 'translate(' + -p.x * .025 + 'px,' + -p.y * .025 + 'px) rotate(0deg) scale(1.015)', opacity: 1, offset: .8 },
          { transform: 'none', opacity: 1 }
        ], { duration: duration, easing: 'cubic-bezier(.16,.75,.25,1)' });
      });
      jobs.push(animate(white, [{ opacity: 1 }, { opacity: 0 }], { duration: duration }));
      jobs.push(animate(point, [{ opacity: 1 }, { opacity: 0 }], { duration: 180 }));
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
