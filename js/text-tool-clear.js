/* Shared two-step Clear controls for The Diff, The Prompter and The Counter.
   The first press arms the control for three seconds; the second clears.
   For fifteen seconds afterwards the same control becomes Undo, matching the
   clear behaviour used by The Page, The Reader, The List and The Lots. */
(function(){
  'use strict';

  function armable(button, hasSomething, clearNow, undoNow, interceptLegacy){
    var armT = null, undoT = null, canUndo = false;

    function reset(){
      clearTimeout(armT);
      clearTimeout(undoT);
      button.classList.remove('arm');
      button.textContent = 'Clear';
      canUndo = false;
    }

    function handle(e){
      if(e){
        e.preventDefault();
        e.stopImmediatePropagation();
      }

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
    }

    if(interceptLegacy){
      /* The Counter's old confirm()-based listener is registered before this
         deferred script. Catch the click on the document while it is still
         travelling down to the button, so the old target listener never runs. */
      document.addEventListener('click', function(e){
        if(e.target === button || button.contains(e.target)) handle(e);
      }, true);
    }else{
      button.addEventListener('click', handle);
    }
  }

  function fireInput(el){
    el.dispatchEvent(new Event('input', { bubbles:true }));
  }

  function setupCounter(){
    var ta = document.getElementById('text');
    var button = document.getElementById('clearBtn');
    if(!ta || !button) return;

    button.textContent = 'Clear';
    var snapshot = '';

    armable(
      button,
      function(){ return !!ta.value; },
      function(){
        snapshot = ta.value;
        ta.value = '';
        fireInput(ta);
        ta.focus();
      },
      function(){
        ta.value = snapshot;
        fireInput(ta);
        ta.focus();
        snapshot = '';
      },
      true
    );
  }

  function setupPrompter(){
    var ta = document.getElementById('script');
    var start = document.getElementById('startBtn');
    var row = start && start.parentElement;
    if(!ta || !start || !row) return;

    var button = document.createElement('button');
    button.className = 'btn';
    button.type = 'button';
    button.id = 'clearPromptBtn';
    button.textContent = 'Clear';
    start.insertAdjacentElement('afterend', button);

    var snapshot = '';

    armable(
      button,
      function(){ return !!ta.value; },
      function(){
        snapshot = ta.value;
        ta.value = '';
        fireInput(ta);
        ta.focus();
      },
      function(){
        ta.value = snapshot;
        fireInput(ta);
        ta.focus();
        snapshot = '';
      }
    );
  }

  function setupDiff(){
    var before = document.getElementById('beforeText');
    var after = document.getElementById('afterText');
    var compare = document.getElementById('compareBtn');
    var stats = document.getElementById('stats');
    var result = document.getElementById('result');
    if(!before || !after || !compare) return;

    var button = document.createElement('button');
    button.className = 'btn';
    button.type = 'button';
    button.id = 'clearDiffBtn';
    button.textContent = 'Clear';
    compare.insertAdjacentElement('afterend', button);

    var snapshot = null;

    armable(
      button,
      function(){ return !!before.value || !!after.value; },
      function(){
        snapshot = { before:before.value, after:after.value };
        before.value = '';
        after.value = '';
        if(stats) stats.textContent = '';
        if(result){
          result.innerHTML = '';
          result.classList.remove('on');
        }
        fireInput(before);
        fireInput(after);
        before.focus();
      },
      function(){
        if(!snapshot) return;
        before.value = snapshot.before;
        after.value = snapshot.after;
        fireInput(before);
        fireInput(after);
        before.focus();
        snapshot = null;
      }
    );
  }

  var path = location.pathname.replace(/\/+$/, '') || '/';
  if(path === '/words') setupCounter();
  if(path === '/prompt') setupPrompter();
  if(path === '/diff') setupDiff();
})();
