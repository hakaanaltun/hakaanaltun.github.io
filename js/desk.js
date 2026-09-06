/* One live instance per instrument. Moving or hiding a pane never reloads it. */
(function(){
  'use strict';
  var TOOLS = { read:'The Reader', write:'The Page', draw:'The Draw' };
  var KEY = 'olae-desk-layout-v1', VERSION = '20260905-desk-1';
  var workspace = document.getElementById('workspace');
  var divider = document.getElementById('divider');
  var status = document.getElementById('desk-status');
  var restoreBtn = document.getElementById('restore');
  var narrow = window.matchMedia('(max-width:700px)');
  var dark = window.matchMedia('(prefers-color-scheme:dark)');
  var order = ['read','write'], ratio = 50, focused = null, panels = {};
  function valid(slug){ return Object.prototype.hasOwnProperty.call(TOOLS, slug); }
  try{
    var saved = JSON.parse(localStorage.getItem(KEY));
    if(saved && Array.isArray(saved.order) && saved.order.length === 2 &&
       saved.order.every(valid) && saved.order[0] !== saved.order[1]) order = saved.order;
    if(saved && typeof saved.ratio === 'number' && isFinite(saved.ratio)) ratio = Math.max(25, Math.min(75, saved.ratio));
  }catch(e){}
  function remember(){
    try{ localStorage.setItem(KEY, JSON.stringify({order:order, ratio:ratio})); }catch(e){}
  }
  function announce(text){ status.textContent = text; }
  function embed(panel){
    try{ return panel.frame.contentWindow.OLAE_DESK_EMBED; }catch(e){ return null; }
  }
  function theme(){
    var root = document.documentElement, cs = getComputedStyle(root), tokens = {};
    ['--paper','--ink','--muted','--line'].forEach(function(key){ tokens[key] = cs.getPropertyValue(key); });
    return { name:root.getAttribute('data-theme') || (dark.matches ? 'dark' : 'light'), tokens:tokens };
  }
  function paint(panel){
    var api = embed(panel), t = theme();
    if(api) api.setTheme(t.name, t.tokens);
  }
  function paintAll(){
    Object.keys(panels).forEach(function(slug){ paint(panels[slug]); });
    document.querySelector('meta[name="theme-color"]').setAttribute('content', theme().tokens['--paper'].trim());
  }
  function setRatio(next){
    ratio = Math.max(25, Math.min(75, next));
    workspace.style.setProperty('--first', 'calc((100% - 14px) * ' + ratio/100 + ')');
    divider.setAttribute('aria-valuenow', String(Math.round(ratio)));
    divider.setAttribute('aria-valuetext', Math.round(ratio) + '% ' + (narrow.matches ? 'above' : 'on the left'));
  }
  function make(slug){
    if(panels[slug]) return;
    var el = document.createElement('section');
    el.className = 'panel'; el.id = 'panel-' + slug;
    el.setAttribute('aria-label', TOOLS[slug] + ' pane');
    var bar = document.createElement('div'); bar.className = 'panel-bar';
    var select = document.createElement('select');
    Object.keys(TOOLS).forEach(function(key){
      var option = document.createElement('option'); option.value = key; option.textContent = TOOLS[key]; select.appendChild(option);
    });
    select.value = slug;
    var expand = document.createElement('button');
    expand.type = 'button'; expand.className = 'icon-btn'; expand.textContent = '⤢';
    bar.append(select, expand);
    var body = document.createElement('div'); body.className = 'panel-body';
    var loading = document.createElement('div'); loading.className = 'frame-status'; loading.setAttribute('role','status');
    var message = document.createElement('p'); message.textContent = 'Opening ' + TOOLS[slug] + '…';
    var retry = document.createElement('button'); retry.type = 'button'; retry.textContent = 'Try again'; retry.hidden = true;
    loading.append(message,retry);
    var frame = document.createElement('iframe');
    frame.title = TOOLS[slug] + ' on the desk';
    frame.setAttribute('allow','clipboard-write; fullscreen');
    var panel = { el:el, select:select, expand:expand, frame:frame, loading:loading, ready:false, timer:null };
    panels[slug] = panel;
    function slow(){
      message.textContent = 'This instrument has not opened yet. Check your connection and try again.';
      retry.hidden = false;
    }
    function load(){
      panel.ready = false; loading.hidden = false; retry.hidden = true;
      message.textContent = 'Opening ' + TOOLS[slug] + '…';
      clearTimeout(panel.timer); panel.timer = setTimeout(slow, 20000);
      frame.src = '/' + slug + '/?desk=1&v=' + VERSION;
    }
    frame.addEventListener('load', function(){
      clearTimeout(panel.timer);
      var api = embed(panel);
      if(!api){ slow(); return; }
      panel.ready = true; loading.hidden = true;
      paint(panel); api.setActive(!el.hidden);
    });
    retry.addEventListener('click', load);
    select.addEventListener('change', function(){
      var slot = order.indexOf(slug), next = select.value;
      if(slot < 0 || !valid(next)) return;
      var other = order.indexOf(next);
      if(other >= 0) order[other] = slug;
      order[slot] = next;
      if(focused === slug) focused = next;
      render(); remember();
      panels[next].select.focus();
      announce(TOOLS[order[0]] + ' and ' + TOOLS[order[1]] + ' on the desk.');
    });
    expand.addEventListener('click', function(){
      focused = focused === slug ? null : slug;
      render();
      announce(focused ? TOOLS[slug] + ' fills the desk.' : 'Both panes restored.');
    });
    body.append(frame, loading); el.append(bar,body);
    /* The frame is attached exactly once. Reparenting an iframe loses its document. */
    workspace.appendChild(el); load();
  }
  function render(){
    order.forEach(make);
    if(focused) workspace.setAttribute('data-focus', focused); else workspace.removeAttribute('data-focus');
    Object.keys(panels).forEach(function(slug){
      var panel = panels[slug], slot = order.indexOf(slug);
      var active = slot >= 0 && (!focused || focused === slug);
      var api = embed(panel);
      /* Save the bookmark while the frame still has its original dimensions. */
      if(!active && api) api.setActive(false);
      panel.el.hidden = !active;
      panel.el.dataset.slot = String(slot);
      panel.select.value = slug;
      var side = narrow.matches ? (slot === 0 ? 'top' : 'bottom') : (slot === 0 ? 'left' : 'right');
      panel.select.setAttribute('aria-label', 'Instrument in ' + side + ' pane');
      var label = focused === slug ? 'Restore split view' : 'Expand ' + side + ' pane';
      panel.expand.setAttribute('aria-label', label); panel.expand.title = label;
      panel.expand.setAttribute('aria-pressed', String(focused === slug));
      panel.expand.textContent = focused === slug ? '↙' : '⤢';
      if(active && api) api.setActive(true);
    });
    divider.hidden = !!focused;
    divider.setAttribute('aria-orientation', narrow.matches ? 'horizontal' : 'vertical');
    restoreBtn.hidden = !focused;
    document.getElementById('swap').hidden = !!focused;
    document.getElementById('balance').hidden = !!focused;
    setRatio(ratio);
  }
  function restore(){
    if(!focused) return;
    var slug = focused; focused = null; render();
    panels[slug].expand.focus(); announce('Both panes restored.');
  }
  window.OLAE_DESK = { restore:restore };
  restoreBtn.addEventListener('click', restore);
  document.getElementById('swap').addEventListener('click', function(){
    order.reverse(); render(); remember(); announce('The panes have changed places.');
  });
  document.getElementById('balance').addEventListener('click', function(){ setRatio(50); remember(); announce('Equal space for both panes.'); });
  var dragging = null;
  divider.addEventListener('pointerdown', function(e){
    if(e.button !== 0) return;
    dragging = e.pointerId; divider.setPointerCapture(e.pointerId);
    workspace.classList.add('resizing'); e.preventDefault(); divider.focus();
  });
  divider.addEventListener('pointermove', function(e){
    if(e.pointerId !== dragging) return;
    var r = workspace.getBoundingClientRect();
    var size = narrow.matches ? r.height : r.width;
    var distance = narrow.matches ? e.clientY-r.top : e.clientX-r.left;
    setRatio(100 * (distance-7) / (size-14));
  });
  function endDrag(){
    if(dragging === null) return;
    dragging = null; workspace.classList.remove('resizing'); remember();
  }
  divider.addEventListener('pointerup', endDrag);
  divider.addEventListener('pointercancel', endDrag);
  divider.addEventListener('lostpointercapture', endDrag);
  divider.addEventListener('keydown', function(e){
    var next = ratio;
    if(e.key === 'ArrowLeft' || e.key === 'ArrowUp') next -= 5;
    else if(e.key === 'ArrowRight' || e.key === 'ArrowDown') next += 5;
    else if(e.key === 'Home') next = 25;
    else if(e.key === 'End') next = 75;
    else if(e.key === 'Enter') next = 50;
    else return;
    e.preventDefault(); setRatio(next); remember();
  });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') restore(); });
  var fsBtn = document.getElementById('fullscreen');
  if(!document.documentElement.requestFullscreen) fsBtn.hidden = true;
  fsBtn.addEventListener('click', function(){
    var result = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    if(result && result.catch) result.catch(function(){ announce('Fullscreen is unavailable in this browser.'); });
  });
  document.addEventListener('fullscreenchange', function(){
    var label = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen desk';
    fsBtn.setAttribute('aria-label', label); fsBtn.title = label;
  });
  function saveAll(){
    var failed = false;
    Object.keys(panels).forEach(function(slug){
      var api = embed(panels[slug]);
      if(api){ api.save(); failed = api.unsaved() || failed; }
    });
    return failed;
  }
  window.addEventListener('beforeunload', function(e){
    if(saveAll()){ e.preventDefault(); e.returnValue = ''; }
  });
  document.addEventListener('visibilitychange', function(){ if(document.hidden) saveAll(); });
  narrow.addEventListener('change', function(){ endDrag(); render(); });
  dark.addEventListener('change', paintAll);
  new MutationObserver(paintAll).observe(document.documentElement, {attributes:true, attributeFilter:['style','data-theme']});
  render(); paintAll();
})();
