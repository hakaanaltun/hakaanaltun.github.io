/* Shared two-step Clear controls for The List and The Lots.
   The first press arms the control for three seconds; the second clears.
   Like The Page, a short Undo window brings the cleared state back. */
(function(){
  'use strict';

  function encodeLotsState(state){
    try{
      return btoa(unescape(encodeURIComponent(JSON.stringify({
        t: state.text,
        d: state.drawn,
        r: state.remove
      }))))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }catch(e){ return ''; }
  }

  function armable(button, hasSomething, clearNow, undoNow){
    var armT = null, undoT = null, canUndo = false;

    function reset(){
      clearTimeout(armT);
      clearTimeout(undoT);
      button.classList.remove('arm');
      button.textContent = 'Clear';
      canUndo = false;
    }

    button.addEventListener('click', function(){
      if(canUndo){
        clearTimeout(undoT);
        canUndo = false;
        undoNow();
        button.textContent = 'Clear';
        return;
      }

      if(!hasSomething()){
        reset();
        return;
      }

      if(button.classList.contains('arm')){
        clearTimeout(armT);
        button.classList.remove('arm');
        clearNow();
        canUndo = true;
        button.textContent = 'Undo';
        undoT = setTimeout(reset, 15000);
        return;
      }

      button.classList.add('arm');
      button.textContent = 'clear?';
      armT = setTimeout(function(){
        button.classList.remove('arm');
        button.textContent = 'Clear';
      }, 3000);
    });
  }

  function setupList(){
    var ta = document.getElementById('list');
    var row = document.querySelector('.act-row');
    var copy = document.getElementById('copyBtn');
    var undo = document.getElementById('undoBtn');
    var report = document.getElementById('report');
    if(!ta || !row || !copy) return;

    var button = document.createElement('button');
    button.className = 'btn';
    button.type = 'button';
    button.id = 'clearListBtn';
    button.textContent = 'Clear';
    copy.insertAdjacentElement('afterend', button);

    var snapshot = '';
    armable(
      button,
      function(){ return !!ta.value; },
      function(){
        snapshot = ta.value;
        ta.value = '';
        ta.dispatchEvent(new Event('input', { bubbles:true }));
        if(undo) undo.disabled = true;
        if(report) report.textContent = 'Cleared.';
      },
      function(){
        ta.value = snapshot;
        ta.dispatchEvent(new Event('input', { bubbles:true }));
        ta.focus();
        if(report) report.textContent = 'Clear undone.';
        snapshot = '';
      }
    );
  }

  function setupLots(){
    var ta = document.getElementById('nameList');
    var head = document.querySelector('#listBlock .list-head');
    var toggle = document.getElementById('listToggle');
    var listBlock = document.getElementById('listBlock');
    var restore = document.getElementById('restoreBtn');
    var drawnList = document.getElementById('drawnList');
    var remove = document.getElementById('removeToggle');
    var groupsNote = document.getElementById('groupsNote');
    var groupsResult = document.getElementById('groupsResult');
    var deal = document.getElementById('dealBtn');
    var display = document.getElementById('drawDisplay');
    if(!ta || !head || !toggle || !listBlock || !restore || !drawnList || !remove) return;

    var style = document.createElement('style');
    style.textContent = '.list-head-actions{display:flex;align-items:baseline;gap:14px;flex:none}.list-head-actions .link-btn{margin-top:0}@media(max-width:600px){.list-head-actions{gap:10px}}';
    document.head.appendChild(style);

    var actions = document.createElement('div');
    actions.className = 'list-head-actions';
    head.appendChild(actions);
    actions.appendChild(toggle);

    var button = document.createElement('button');
    button.className = 'link-btn list-toggle';
    button.type = 'button';
    button.id = 'clearLotsBtn';
    button.textContent = 'Clear';
    actions.appendChild(button);

    var snapshot = null;

    function snapshotState(){
      return {
        text: ta.value,
        drawn: Array.prototype.map.call(drawnList.querySelectorAll('li'), function(li){ return li.textContent; }),
        remove: remove.checked,
        collapsed: listBlock.classList.contains('collapsed'),
        groupsNote: groupsNote ? groupsNote.textContent : '',
        groupsHtml: groupsResult ? groupsResult.innerHTML : '',
        dealText: deal ? deal.textContent : 'Divide',
        displayText: display ? display.textContent : '',
        displayClass: display ? display.className : ''
      };
    }

    function clearState(){
      snapshot = snapshotState();
      if(snapshot.drawn.length) restore.click();
      ta.value = '';
      ta.dispatchEvent(new Event('input', { bubbles:true }));
      listBlock.classList.remove('collapsed');
      toggle.textContent = 'Hide the list';
      toggle.setAttribute('aria-expanded', 'true');
      if(groupsNote) groupsNote.textContent = '';
      if(groupsResult) groupsResult.innerHTML = '';
      if(deal) deal.textContent = 'Divide';
      if(display){
        display.className = 'draw-display idle';
        display.textContent = 'Press draw and a name appears here.';
      }
      if(history.replaceState) history.replaceState(null, '', location.pathname + location.search);
      try{
        if(window.OLAE_STORAGE) window.OLAE_STORAGE.save('olae-lots-v1', JSON.stringify({
          text:'', drawn:[], remove:remove.checked, collapsed:false, at:Date.now()
        }));
      }catch(e){}
    }

    function undoClear(){
      if(!snapshot) return;
      var s = encodeLotsState(snapshot);
      if(s && history.replaceState){
        history.replaceState(null, '', '#s=' + s);
        try{ window.dispatchEvent(new HashChangeEvent('hashchange')); }
        catch(e){ window.dispatchEvent(new Event('hashchange')); }
      }else{
        ta.value = snapshot.text;
      }

      listBlock.classList.toggle('collapsed', snapshot.collapsed);
      toggle.textContent = snapshot.collapsed ? 'Edit the list' : 'Hide the list';
      toggle.setAttribute('aria-expanded', snapshot.collapsed ? 'false' : 'true');
      if(groupsNote) groupsNote.textContent = snapshot.groupsNote;
      if(groupsResult) groupsResult.innerHTML = snapshot.groupsHtml;
      if(deal) deal.textContent = snapshot.dealText;
      if(display){
        display.className = snapshot.displayClass;
        display.textContent = snapshot.displayText;
      }
      ta.dispatchEvent(new Event('input', { bubbles:true }));
      snapshot = null;
    }

    armable(
      button,
      function(){
        return !!ta.value.trim() || drawnList.children.length > 0 ||
          !!(groupsResult && groupsResult.children.length) || !!location.hash;
      },
      clearState,
      undoClear
    );
  }

  if(location.pathname === '/list/' || location.pathname === '/list') setupList();
  if(location.pathname === '/lots/' || location.pathname === '/lots') setupLots();
})();
