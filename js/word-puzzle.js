/* Reversible, paragraph-by-paragraph word puzzles. Original DOM nodes are
   detached intact and returned on exit; nothing is sent or saved. */
(function(){
  'use strict';
  var launch=document.getElementById('essay-puzzle');
  var article=document.querySelector('.essay-body');
  if(!launch || !article) return;
  var phase='reading', records=[], panel=null, action=null, message=null;
  var MIME='application/x-olae-word-puzzle';
  var gameId=Math.random().toString(36).slice(2);
  function el(tag,cls,text){
    var node=document.createElement(tag);
    if(cls)node.className=cls;
    if(text!==undefined)node.textContent=text;
    return node;
  }
  function button(cls,text){var node=el('button',cls,text);node.type='button';return node;}
  function prose(node){
    if(node.nodeType===3)return node.nodeValue;
    if(node.nodeType!==1)return '';
    if(node.tagName==='BR')return '\n';
    if(/^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT)$/.test(node.tagName))return '';
    return Array.from(node.childNodes).map(prose).join('');
  }
  function shuffled(words){
    var order=words.map(function(_,i){return i;});
    for(var i=order.length-1;i>0;i--){
      var j=Math.floor(Math.random()*(i+1)),temp=order[i];order[i]=order[j];order[j]=temp;
    }
    if(order.length>1 && order.every(function(id,i){return words[id]===words[i];}))order.push(order.shift());
    return order;
  }
  function clearSelection(){var selection=window.getSelection();if(selection)selection.removeAllRanges();}
  function restore(){
    records.forEach(function(record){
      if(record.view.parentNode)record.view.replaceWith(record.original);
    });
    records=[];
    if(panel)panel.remove();panel=action=message=null;
    phase='reading';article.classList.remove('puzzle-active');
    launch.textContent='puzzle mode';launch.setAttribute('aria-pressed','false');
    launch.focus({preventScroll:true});
  }
  function setPanel(){
    panel=el('div','puzzle-panel');panel.setAttribute('role','group');panel.setAttribute('aria-label','Puzzle controls');
    var controls=el('div','puzzle-panel-actions');
    action=button('puzzle-action','Scatter the words');
    action.addEventListener('click',scatter);
    var exit=button('puzzle-action','Read the original');exit.addEventListener('click',restore);
    function dismiss(){
      panel.hidden=true;
      var next=article.querySelector('.puzzle-word:not([hidden])') || article.querySelector('.puzzle-slot') || launch;
      next.focus({preventScroll:true});
    }
    var hide=button('puzzle-action','Hide instructions');hide.addEventListener('click',dismiss);
    panel.addEventListener('click',function(event){
      if(!event.target.closest('button'))dismiss();
    });
    controls.append(action,exit,hide);
    message=el('p','puzzle-instructions','The words are still in their original order. Scatter them when you are ready.');
    panel.append(controls,message);article.prepend(panel);
  }
  function boxWords(){
    var candidates=Array.from(article.querySelectorAll('p, li, blockquote')).filter(function(node){
      return !node.querySelector('p, li, blockquote, img, svg, video, audio, canvas, iframe, button, input, select, textarea, pre, code, math') && prose(node).trim();
    });
    var total=0;
    records=candidates.map(function(node){
      var text=prose(node),words=text.match(/\S+/gu)||[];total+=words.length;
      return {original:node,text:text,words:words,view:null};
    });
    if(!records.length || total>15000){
      records=[];launch.textContent=total>15000?'This text is too long for puzzle mode':'No paragraphs to turn into a puzzle';return;
    }
    clearSelection();
    records.forEach(function(record){
      var preview=record.original.cloneNode(false);preview.classList.add('puzzle-preview');
      (record.text.match(/\S+|\s+/gu)||[]).forEach(function(part){
        preview.appendChild(/\S/u.test(part)?el('span','puzzle-word-preview',part):document.createTextNode(part));
      });
      record.original.replaceWith(preview);record.view=preview;
    });
    phase='boxed';article.classList.add('puzzle-active');
    launch.textContent='scatter the words';launch.setAttribute('aria-pressed','true');
    setPanel();panel.scrollIntoView({block:'start',behavior:'instant'});action.focus({preventScroll:true});
  }
  function makeBoard(record,index){
    // Preserve list semantics where a prose item lives inside a list.
    var board=el(record.original.tagName==='LI'?'li':'section','word-puzzle');
    board.setAttribute('aria-label','Paragraph '+(index+1));
    if(record.original.id)board.id=record.original.id;
    var heading=el('div','puzzle-paragraph-label','Paragraph '+(index+1));
    var slots=el('div','puzzle-slots');slots.setAttribute('role','group');slots.setAttribute('aria-label','Rebuild paragraph '+(index+1));
    var bank=el('div','puzzle-bank');bank.setAttribute('role','group');bank.setAttribute('aria-label','Available words for paragraph '+(index+1));
    var actions=el('div','puzzle-board-actions');
    var compare=button('puzzle-action','Compare with original');compare.disabled=true;
    var status=el('span','puzzle-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    var comparison=el('div','puzzle-comparison');comparison.hidden=true;
    actions.append(compare,status);board.append(heading,slots,bank,actions,comparison);
    var words=record.words,placement=words.map(function(){return null;}),selected=null;
    var slotButtons=[],wordButtons=[],order=shuffled(words),boardId=gameId+'-paragraph-'+index;
    function select(id){
      selected=id;
      wordButtons.forEach(function(node,i){node.setAttribute('aria-pressed',String(i===id));});
      board.classList.toggle('puzzle-has-selection',id!==null);
    }
    function announce(){
      var count=placement.filter(function(id){return id!==null;}).length;
      status.textContent=count+' of '+words.length+' words placed';
      compare.disabled=count!==words.length;
    }
    function paint(){
      comparison.hidden=true;comparison.replaceChildren();compare.textContent='Compare with original';
      var used=new Set(placement.filter(function(id){return id!==null;}));
      wordButtons.forEach(function(node,id){node.hidden=used.has(id);});
      slotButtons.forEach(function(node,i){
        var id=placement[i];
        node.textContent=id===null?'\u00a0':words[id];
        node.classList.toggle('puzzle-filled',id!==null);
        node.classList.remove('puzzle-different');
        node.draggable=id!==null;
        node.setAttribute('aria-label','Position '+(i+1)+(id===null?', empty':': '+words[id]+'. Select to return this word.'));
      });
      announce();
    }
    function place(id,position){
      if(!Number.isInteger(id) || id<0 || id>=words.length)return;
      var from=placement.indexOf(id),displaced=placement[position];
      if(from>=0)placement[from]=displaced;
      placement[position]=id;select(null);paint();
    }
    function returnWord(id){
      var from=placement.indexOf(id);
      if(from>=0)placement[from]=null;
      select(null);paint();wordButtons[id].focus({preventScroll:true});
    }
    function dragStart(event,id){
      if(id===null || !event.dataTransfer){event.preventDefault();return;}
      event.dataTransfer.setData(MIME,boardId+':'+id);event.dataTransfer.effectAllowed='move';select(id);
    }
    function draggedId(event){
      if(!event.dataTransfer)return null;
      var data=event.dataTransfer.getData(MIME).split(':');
      if(data[0]!==boardId || !/^\d+$/.test(data[1]||''))return null;
      var id=Number(data[1]);return id<words.length?id:null;
    }
    function dragOver(event){
      if(event.dataTransfer && Array.from(event.dataTransfer.types||[]).includes(MIME)){
        event.preventDefault();event.dataTransfer.dropEffect='move';
      }
    }
    words.forEach(function(word,id){
      var token=button('puzzle-word',word);token.draggable=true;token.setAttribute('aria-pressed','false');
      token.style.setProperty('--puzzle-tilt',(Math.random()*4-2).toFixed(2)+'deg');
      token.addEventListener('click',function(){
        select(selected===id?null:id);
        status.textContent=selected===null?'Selection cleared':'Selected “'+word+'”. Choose a position above.';
      });
      token.addEventListener('dragstart',function(event){dragStart(event,id);});
      token.addEventListener('dragend',function(){select(null);});
      wordButtons.push(token);
      var slot=button('puzzle-slot','\u00a0');
      slot.style.setProperty('--puzzle-space',Math.max(2.5,Math.min(8,Array.from(word).length*.48))+'em');
      slot.addEventListener('click',function(){
        if(selected!==null){place(selected,id);slot.focus({preventScroll:true});}
        else if(placement[id]!==null)returnWord(placement[id]);
        else status.textContent='Choose a word below, then select this position.';
      });
      slot.addEventListener('dragstart',function(event){dragStart(event,placement[id]);});
      slot.addEventListener('dragend',function(){select(null);});
      slot.addEventListener('dragover',dragOver);
      slot.addEventListener('drop',function(event){
        var tokenId=draggedId(event);if(tokenId===null)return;
        event.preventDefault();place(tokenId,id);slot.focus({preventScroll:true});
      });
      slotButtons.push(slot);slots.appendChild(slot);
    });
    order.forEach(function(id){bank.appendChild(wordButtons[id]);});
    bank.addEventListener('dragover',dragOver);
    bank.addEventListener('drop',function(event){
      var id=draggedId(event);if(id===null)return;event.preventDefault();returnWord(id);
    });
    compare.addEventListener('click',function(){
      if(!comparison.hidden){comparison.hidden=true;compare.textContent='Compare with original';return;}
      if(placement.some(function(id){return id===null;}))return;
      var same=placement.every(function(id,i){return words[id]===words[i];});
      status.textContent=same?'This matches the original wording.':'A different order. Compare the two versions.';
      comparison.replaceChildren();
      comparison.append(el('h3','puzzle-comparison-label','Your version'),el('p','puzzle-version',placement.map(function(id){return words[id];}).join(' ')),
        el('h3','puzzle-comparison-label','Original text'),el('p','puzzle-version',record.text));
      if(!same)comparison.appendChild(el('p','puzzle-comparison-note','A different order can also be grammatical. What changes in meaning or emphasis?'));
      slotButtons.forEach(function(slot,i){slot.classList.toggle('puzzle-different',words[placement[i]]!==words[i]);});
      comparison.hidden=false;compare.textContent='Hide comparison';
    });
    paint();record.view.replaceWith(board);record.view=board;
  }
  function scatter(){
    if(phase!=='boxed')return;
    clearSelection();records.forEach(makeBoard);phase='playing';
    launch.textContent='leave puzzle mode';
    action.hidden=true;
    message.textContent='Choose a word, then a position. You can also drag words. Select a placed word to return it. Fill a paragraph to compare. Escape returns to reading.';
    var first=article.querySelector('.puzzle-word');if(first)first.focus({preventScroll:true});
  }
  launch.addEventListener('click',function(){
    if(phase==='reading')boxWords();else if(phase==='boxed')scatter();else restore();
  });
  document.addEventListener('keydown',function(event){
    if(event.key!=='Escape' || phase==='reading' || event.defaultPrevented)return;
    if(event.target.closest && event.target.closest('input, textarea, select, [contenteditable], [role="dialog"], .theme-menu, .drawer'))return;
    event.preventDefault();restore();
  });
  launch.hidden=false;
})();
