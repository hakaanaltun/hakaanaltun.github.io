/* The drawer on the instruments: a small box beside the instrument's own
   buttons with "Keep in your drawer" and "Open your drawer". What is kept
   goes into the drawer in The House (js/keep.js): a page, a script, a list,
   a comparison as text, and a drawing as a picture.

   The instrument says what it holds, before this script runs, in
   window.OLAE_TOOL_WORK:
     slug      its address, /slug/
     prefix    the start of a kept thing's id (keep.js, WORKS)
     kind      its name, as the drawer shows it
     noun      what it holds, for the box's sentences ("page", "script")
     title     function(date): the kept thing's title
     note      the line at the foot of the box
     empty     what the box says when there is nothing to keep
     before    the id of the button the drawer button stands before
     download  true when the instrument has its own download
     pictures  true when what it keeps is a picture, as on The Draw
     work      function(): what it holds now, or null when it is empty:
               { text, drafts } for text, or { sign(), picture() } for a
               picture, picture() giving a promise of the PNG
     open      function(record): puts a kept thing back, for the drawer's
               way back to the instrument (?open=id); optional
     fresh     true when what it holds came from elsewhere, a shared link
               on The Lots, and so is not the copy it was kept as

   The instrument remembers the copy it was kept as, so keeping again brings
   that copy up to date. The memory is kept here, under olae-tool-kept, one
   entry for each instrument and each place on The Desk. Emptying the
   instrument lets go of it; the next thing is kept on its own, and Undo
   that brings the same words back takes hold of it again. */
(function(){
  'use strict';
  var KEEP = window.OLAE_KEEP, work = window.OLAE_TOOL_WORK;
  if(!KEEP || !work) return;
  var picture = !!work.pictures;
  // A drawing waits in IndexedDB; a browser without it keeps none.
  if(picture && !KEEP.files.works()) return;
  var desk = window.OLAE_DESK_EMBED || null;
  var chrome = document.querySelector('.chrome'), actions = chrome && chrome.querySelector('.actions');
  if(!actions) return;

  /* --- The copy it was kept as ----------------------------------------- */
  var LINKS = 'olae-tool-kept';
  var place = work.slug + (desk ? '@desk' + desk.pane : '');
  function links(){
    try{
      var all = JSON.parse(localStorage.getItem(LINKS) || '{}');
      return all && typeof all === 'object' && !Array.isArray(all) ? all : {};
    }catch(e){ return {}; }
  }
  function linked(){
    var value = links()[place];
    return value && typeof value.id === 'string' ? value : null;
  }
  function link(value){
    var all = links();
    if(value) all[place] = value; else delete all[place];
    try{ localStorage.setItem(LINKS, JSON.stringify(all)); }catch(e){}
  }
  function keptCopy(){
    var value = linked();
    return value ? KEEP.find(value.id) : null;
  }
  function same(now, copy){
    var value = linked();
    if(!now || !copy) return false;
    if(now.text !== undefined) return copy.text === now.text;
    return !!(value && value.sig && value.sig === now.sign());
  }

  /* --- The box ---------------------------------------------------------- */
  function make(tag, className, words){
    var node = document.createElement(tag);
    if(className) node.className = className;
    if(words) node.textContent = words;
    return node;
  }
  var button = make('button', 'icon-btn tool-drawer-btn');
  button.type = 'button';
  button.id = 'drawerBtn';
  button.title = 'Your drawer';
  button.setAttribute('aria-label', 'Your drawer');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'drawerPop');
  button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/>' +
    '<line x1="10" y1="7.5" x2="14" y2="7.5"/><line x1="10" y1="16.5" x2="14" y2="16.5"/></svg>';
  var before = work.before && document.getElementById(work.before);
  actions.insertBefore(button, before && before.parentNode === actions ? before : actions.firstChild);

  var box = make('div', 'tool-drawer');
  box.id = 'drawerPop';
  box.hidden = true;
  box.setAttribute('role', 'group');
  box.setAttribute('aria-label', 'Your drawer');
  var row = make('div', 'tool-drawer-row');
  var keep = make('button', 'tool-drawer-keep', 'Keep in your drawer');
  keep.type = 'button';
  keep.id = 'keepBtn';
  var open = make('a', 'tool-drawer-open', 'Open your drawer →');
  open.id = 'drawerLink';
  open.href = '/house/?from=' + (desk ? 'desk' : work.slug) + '#drawer';
  // Inside The Desk the drawer opens in the whole window.
  if(desk) open.target = '_top';
  row.appendChild(keep);
  row.appendChild(open);
  var said = make('p', 'tool-drawer-said');
  said.id = 'drawerSaid';
  said.setAttribute('role', 'status');
  box.appendChild(row);
  box.appendChild(said);
  box.appendChild(make('p', 'tool-drawer-note', work.note));
  chrome.appendChild(box);

  var copyWord = picture ? 'picture' : 'copy';
  var instead = work.download ? ' Download it instead.' : '';
  var SAID = {
    kept: 'Kept in your drawer.',
    updated: 'The ' + copyWord + ' in your drawer is up to date.',
    same: 'Your drawer has this ' + work.noun + ' as it is now.',
    empty: work.empty,
    unsaved: 'This browser cannot keep ' + (picture ? 'a drawing in your drawer.' : 'your drawer.') + instead,
    long: 'This ' + work.noun + ' is too long for your drawer.' + instead,
    full: 'There is no room for this ' + work.noun + ' in your drawer in this browser.' + instead
  };
  /* The label is read only while the box is open: it asks the drawer, and
     the drawer may hold long pages, so it is not asked on every keystroke. */
  var keeping = false;
  function sync(){
    if(box.hidden || keeping) return;
    var copy = keptCopy();
    keep.textContent = !copy ? 'Keep in your drawer'
      : same(work.work(), copy) ? 'In your drawer ✓' : 'Update the ' + copyWord + ' in your drawer';
  }
  function say(result){
    keeping = false;
    keep.disabled = false;
    said.textContent = SAID[result] || result || '';
    sync();
  }
  function today(){
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  }
  function itemFor(id, now){
    var item = { id: id, kind: work.kind, title: work.title(today()), href: '/' + work.slug + '/' };
    if(now.text !== undefined) item.text = now.text;
    if(now.drafts) item.drafts = now.drafts;
    return item;
  }
  function newId(){ return work.prefix + '-' + Date.now().toString(36); }

  /* Keeps what the instrument holds now, and tells done what came of it. */
  function store(now, done){
    var copy = keptCopy();
    if(copy && same(now, copy)){ done('same'); return; }
    var id = copy ? linked().id : newId();
    if(now.text !== undefined){
      var result = KEEP.storeWork(itemFor(id, now));
      if(result === 'kept' || result === 'updated') link({ id: id });
      done(result);
      return;
    }
    var sig = now.sign();
    now.picture().then(function(blob){
      if(!blob) throw new Error('No picture.');
      return KEEP.files.put(id, blob);
    }).then(function(){
      var result = KEEP.storeWork(itemFor(id, now));
      if(result === 'kept' || result === 'updated') link({ id: id, sig: sig });
      else if(!copy) KEEP.files.remove(id).catch(function(){});
      done(result);
    }, function(){ done(copy ? 'full' : 'unsaved'); });
  }

  keep.addEventListener('click', function(){
    if(keeping) return;
    var now = work.work();
    if(!now || now.text === ''){ say('empty'); return; }
    keeping = true;
    keep.disabled = true;
    if(picture) keep.textContent = 'Keeping…';
    store(now, function(result){
      letGoOf = null;
      say(result);
    });
  });

  function show(){
    said.textContent = '';
    box.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    sync();
    keep.focus();
  }
  function hide(back){
    if(box.hidden) return;
    box.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    if(back) button.focus();
  }
  button.addEventListener('click', function(){ if(box.hidden) show(); else hide(false); });
  document.addEventListener('pointerdown', function(e){
    if(!box.hidden && !box.contains(e.target) && !button.contains(e.target)) hide(false);
  });
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && !box.hidden) hide(true);
  });
  KEEP.subscribe(sync);

  /* --- Letting go ----------------------------------------------------- */
  var lastText = null, letGoOf = null;
  function seen(){
    var now = work.work();
    if(!now){
      var value = linked();
      if(value){ letGoOf = { id: value.id, text: lastText }; link(null); }
      return;
    }
    if(now.text !== undefined){
      if(letGoOf && now.text === letGoOf.text){ link({ id: letGoOf.id }); letGoOf = null; }
      lastText = now.text;
    }
    sync();
  }
  var seenTimer = 0;
  ['input', 'change', 'click', 'pointerup', 'keydown'].forEach(function(type){
    document.addEventListener(type, function(){
      clearTimeout(seenTimer);
      seenTimer = setTimeout(seen, 0);
    });
  });
  function letGo(){ letGoOf = null; link(null); }
  if(work.fresh) letGo();
  var first = work.work();
  lastText = first && first.text !== undefined ? first.text : null;

  /* --- Back from the drawer -------------------------------------------
     The drawer's way back to an instrument (?open=id) puts the kept thing
     here. What was here goes into the drawer first, unless it is there
     already as it is, so nothing is lost; if the drawer has no room for
     it, nothing changes. */
  var params = new URLSearchParams(location.search);
  var wanted = params.get('open');
  if(wanted && work.open && !desk){
    params.delete('open');
    try{ history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : '') + location.hash); }catch(e){}
    var record = KEEP.find(wanted);
    var message;
    if(!record || KEEP.workOf(record.id) !== work.prefix){
      message = 'This is no longer in your drawer.';
    } else {
      var now = work.work(), copy = keptCopy(), value = linked();
      var away = '';
      if(value && value.id === record.id && same(now, record)){
        message = 'This ' + work.noun + ' is here as you kept it.';
      } else {
        /* What is here goes into the copy it was kept as, unless that is
           the very copy coming back: then it is kept on its own. The same
           words as the kept thing need no putting away. */
        if(now && !(copy && same(now, copy)) && !same(now, record)){
          away = KEEP.storeWork(itemFor(copy && value.id !== record.id ? value.id : newId(), now));
        }
        if(away && away !== 'kept' && away !== 'updated'){
          message = 'There is no room in your drawer for what is here, so nothing was changed.';
        } else {
          work.open(record);
          link({ id: record.id });
          lastText = record.text;
          message = 'Opened from your drawer.' + (away ? ' What was here before is in your drawer too.' : '');
        }
      }
    }
    show();
    said.textContent = message;
  }

  window.OLAE_TOOL_DRAWER = { letGo: letGo, open: show, close: hide };
})();
