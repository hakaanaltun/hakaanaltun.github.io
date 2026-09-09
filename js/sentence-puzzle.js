/* Reversible sentence puzzles, one paragraph at a time. A reader opens puzzle
   mode, then scatters whichever paragraph they are curious about and puts its
   sentences back in an order of their own; the rest of the essay stays
   readable. Original DOM nodes are detached intact and returned on exit;
   nothing is sent or saved. */
(function(){
  'use strict';
  var launch=document.getElementById('essay-puzzle');
  var article=document.querySelector('.essay-body');
  if(!launch || !article) return;
  var MIME='application/x-olae-sentence-puzzle';
  /* No editorial cap: which paragraph is worth the trouble is the reader's
     call, and one deliberate click is what bounds the cost. RUNAWAY is only a
     guard against a pathological paragraph, not a judgement about any
     particular essay — texts change, and a cap fitted to today's would
     quietly start hiding tomorrow's. A paragraph of one sentence is not a
     puzzle at all: there is nothing in it to reorder. */
  var MIN_SENTENCES=2, RUNAWAY_SENTENCES=60, COUNT_SHOWN_ABOVE=4;
  var phase='reading', records=[], opened=[], panel=null, message=null;
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
  /* Where sentences end is the browser's job, not a regular expression's: it
     knows that "Dr." and "e.g." are not endings and that other scripts end
     differently. The fallback below only runs where Intl.Segmenter does not. */
  var segmenter=null;
  try{
    if(window.Intl && Intl.Segmenter)
      segmenter=new Intl.Segmenter(document.documentElement.lang || 'en',{granularity:'sentence'});
  }catch(e){}
  /* Neither path knows every abbreviation. Intl.Segmenter follows the Unicode
     sentence rules, which have no opinion about "Dr." and duly cut it off from
     the name after it — a card reading "Dr." and nothing else. So both paths
     are put through the same rejoining afterwards. It errs towards joining on
     purpose: a sentence left attached to the next one is a longer card, which
     still works; a sentence cut in half is a broken one. */
  var ABBREVIATION=/(?:\b[A-Z]|\b(?:mr|mrs|ms|dr|prof|st|jr|sr|vs|etc|no|fig|cf|al|ed|vol|approx|e\.g|i\.e|vb|bkz|sn|yy|örn))\.$/i;
  function rejoin(pieces){
    var out=[];
    pieces.forEach(function(piece){
      var trimmed=piece.trim();
      if(!trimmed)return;
      var previous=out.length?out[out.length-1]:null;
      if(previous && ABBREVIATION.test(previous))out[out.length-1]=previous+' '+trimmed;
      else out.push(trimmed);
    });
    return out;
  }
  function sentences(text){
    if(!segmenter)return rejoin(text.split(/(?<=[.!?…][»"'”’)\]]?)\s+/u));
    return rejoin(Array.from(segmenter.segment(text)).map(function(piece){return piece.segment;}));
  }
  function opening(sentence){
    var words=sentence.match(/\S+/gu)||[];
    return words.slice(0,5).join(' ')+(words.length>5?'…':'');
  }
  function shuffled(units){
    var order=units.map(function(_,i){return i;});
    for(var i=order.length-1;i>0;i--){
      var j=Math.floor(Math.random()*(i+1)),temp=order[i];order[i]=order[j];order[j]=temp;
    }
    /* With two or three sentences a fair shuffle lands back on the original
       often enough to be a non-event. Compared by value, so a paragraph that
       repeats a sentence is not called "changed" by swapping the two. */
    if(order.length>1 && order.every(function(id,i){return units[id]===units[i];}))order.push(order.shift());
    return order;
  }
  function clearSelection(){var selection=window.getSelection();if(selection)selection.removeAllRanges();}
  /* Prose only: nothing with nested blocks, media, code or controls in it. */
  function eligible(node){
    if(node.closest('.puzzle-panel, .sentence-puzzle, .puzzle-preview'))return null;
    if(node.querySelector('p, li, blockquote, img, svg, video, audio, canvas, iframe, button, input, select, textarea, pre, code, math'))return null;
    var text=prose(node).trim();
    if(!text)return null;
    var units=sentences(text);
    if(units.length<MIN_SENTENCES || units.length>RUNAWAY_SENTENCES)return null;
    return {original:node,text:text,units:units,view:null,board:null};
  }
  function survey(stopAtFirst){
    var found=[],nodes=article.querySelectorAll('p, li, blockquote');
    for(var i=0;i<nodes.length;i++){
      var record=eligible(nodes[i]);
      if(record){found.push(record);if(stopAtFirst)break;}
    }
    return found;
  }
  function restore(){
    records.forEach(function(record){
      if(record.view && record.view.parentNode)record.view.replaceWith(record.original);
    });
    records=[];opened=[];
    if(panel)panel.remove();panel=message=null;
    phase='reading';article.classList.remove('puzzle-active');
    launch.textContent='puzzle mode';launch.setAttribute('aria-pressed','false');
    launch.focus({preventScroll:true});
  }
  function setPanel(){
    panel=el('div','puzzle-panel');panel.setAttribute('role','group');panel.setAttribute('aria-label','Puzzle controls');
    var controls=el('div','puzzle-panel-actions');
    var exit=button('puzzle-action','Read the original');exit.addEventListener('click',restore);
    function dismiss(){
      panel.hidden=true;
      var next=article.querySelector('.puzzle-piece:not([hidden])') || article.querySelector('.puzzle-scatter-cue') || launch;
      next.focus({preventScroll:true});
    }
    var hide=button('puzzle-action','Hide instructions');hide.addEventListener('click',dismiss);
    panel.addEventListener('click',function(event){
      if(!event.target.closest('button'))dismiss();
    });
    controls.append(exit,hide);
    message=el('p','puzzle-instructions','Choose a paragraph to scatter its sentences, then put them back in an order of your own. Escape returns one paragraph; Escape again leaves puzzle mode.');
    panel.append(controls,message);article.prepend(panel);
  }
  /* The paragraph keeps its own role, so its prose stays readable and a list
     item stays a list item; the trailing cue is the actual control. Pointer
     users can click anywhere in the paragraph, which claims nothing in ARIA. */
  function makePreview(record,index){
    var preview=record.original.cloneNode(false);
    preview.classList.add('puzzle-preview');
    preview.dataset.puzzleIndex=String(index);
    record.units.forEach(function(sentence,i){
      if(i)preview.appendChild(document.createTextNode(' '));
      preview.appendChild(el('span','puzzle-sentence',sentence));
    });
    var size=record.units.length;
    var cue=button('puzzle-scatter-cue',size>COUNT_SHOWN_ABOVE?'scatter · '+size+' sentences':'scatter');
    cue.setAttribute('aria-label','Scatter the '+size+' sentences of paragraph '+(index+1)+' of '+records.length);
    preview.append(' ',cue);
    return preview;
  }
  function cueOf(preview){return preview && preview.querySelector('.puzzle-scatter-cue');}
  function focusCue(preview){var cue=cueOf(preview);if(cue)cue.focus({preventScroll:true});}
  function openPuzzle(){
    records=survey(false);
    if(!records.length)return;
    clearSelection();
    records.forEach(function(record,index){
      var preview=makePreview(record,index);
      record.original.replaceWith(preview);record.view=preview;
    });
    phase='open';article.classList.add('puzzle-active');
    launch.textContent='leave puzzle mode';launch.setAttribute('aria-pressed','true');
    setPanel();panel.scrollIntoView({block:'start',behavior:'instant'});
    focusCue(records[0].view);
  }
  function makeBoard(record,index){
    // Preserve list semantics where a prose item lives inside a list.
    var board=el(record.original.tagName==='LI'?'li':'section','sentence-puzzle');
    board.setAttribute('aria-label','Paragraph '+(index+1));
    board.dataset.puzzleIndex=String(index);
    if(record.original.id)board.id=record.original.id;
    var heading=el('div','puzzle-paragraph-label','Paragraph '+(index+1));
    var slots=el('div','puzzle-slots');slots.setAttribute('role','group');slots.setAttribute('aria-label','Rebuild paragraph '+(index+1));
    var bank=el('div','puzzle-bank');bank.setAttribute('role','group');bank.setAttribute('aria-label','Available sentences for paragraph '+(index+1));
    var actions=el('div','puzzle-board-actions');
    var compare=button('puzzle-action','Compare with original');compare.disabled=true;
    var putBack=button('puzzle-action','Put this paragraph back');
    putBack.addEventListener('click',function(){closeBoard(index);});
    var status=el('span','puzzle-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    var comparison=el('div','puzzle-comparison');comparison.hidden=true;
    actions.append(compare,putBack,status);board.append(heading,slots,bank,actions,comparison);
    var units=record.units,placement=units.map(function(){return null;}),selected=null;
    var slotButtons=[],slotBodies=[],pieceButtons=[],order=shuffled(units),boardId=gameId+'-paragraph-'+index;
    function select(id){
      selected=id;
      pieceButtons.forEach(function(node,i){node.setAttribute('aria-pressed',String(i===id));});
      board.classList.toggle('puzzle-has-selection',id!==null);
    }
    function announce(){
      var count=placement.filter(function(id){return id!==null;}).length;
      status.textContent=count+' of '+units.length+' sentences placed';
      compare.disabled=count!==units.length;
    }
    function paint(){
      comparison.hidden=true;comparison.replaceChildren();compare.textContent='Compare with original';
      var used=new Set(placement.filter(function(id){return id!==null;}));
      pieceButtons.forEach(function(node,id){node.hidden=used.has(id);});
      slotButtons.forEach(function(node,i){
        var id=placement[i];
        slotBodies[i].textContent=id===null?'':units[id];
        node.classList.toggle('puzzle-filled',id!==null);
        node.classList.remove('puzzle-different');
        node.draggable=id!==null;
        node.setAttribute('aria-label','Position '+(i+1)+(id===null?', empty':': '+opening(units[id])+'. Select to return this sentence.'));
      });
      announce();
    }
    function place(id,position){
      if(!Number.isInteger(id) || id<0 || id>=units.length)return;
      var from=placement.indexOf(id),displaced=placement[position];
      if(from>=0)placement[from]=displaced;
      placement[position]=id;select(null);paint();
    }
    function returnPiece(id){
      var from=placement.indexOf(id);
      if(from>=0)placement[from]=null;
      select(null);paint();pieceButtons[id].focus({preventScroll:true});
    }
    function dragStart(event,id){
      if(id===null || !event.dataTransfer){event.preventDefault();return;}
      event.dataTransfer.setData(MIME,boardId+':'+id);event.dataTransfer.effectAllowed='move';select(id);
    }
    function draggedId(event){
      if(!event.dataTransfer)return null;
      var data=event.dataTransfer.getData(MIME).split(':');
      if(data[0]!==boardId || !/^\d+$/.test(data[1]||''))return null;
      var id=Number(data[1]);return id<units.length?id:null;
    }
    function dragOver(event){
      if(event.dataTransfer && Array.from(event.dataTransfer.types||[]).includes(MIME)){
        event.preventDefault();event.dataTransfer.dropEffect='move';
      }
    }
    units.forEach(function(sentence,id){
      var piece=button('puzzle-piece',sentence);piece.draggable=true;piece.setAttribute('aria-pressed','false');
      piece.addEventListener('click',function(){
        select(selected===id?null:id);
        status.textContent=selected===null?'Selection cleared':'Selected “'+opening(sentence)+'”. Choose a position above.';
      });
      piece.addEventListener('dragstart',function(event){dragStart(event,id);});
      piece.addEventListener('dragend',function(){select(null);});
      pieceButtons.push(piece);
      var slot=button('puzzle-slot');
      var slotBody=el('span','puzzle-slot-text','');
      slot.append(el('span','puzzle-slot-number',String(id+1)),slotBody);
      slot.addEventListener('click',function(){
        if(selected!==null){place(selected,id);slot.focus({preventScroll:true});}
        else if(placement[id]!==null)returnPiece(placement[id]);
        else status.textContent='Choose a sentence below, then select this position.';
      });
      slot.addEventListener('dragstart',function(event){dragStart(event,placement[id]);});
      slot.addEventListener('dragend',function(){select(null);});
      slot.addEventListener('dragover',dragOver);
      slot.addEventListener('drop',function(event){
        var pieceId=draggedId(event);if(pieceId===null)return;
        event.preventDefault();place(pieceId,id);slot.focus({preventScroll:true});
      });
      slotButtons.push(slot);slotBodies.push(slotBody);slots.appendChild(slot);
    });
    order.forEach(function(id){bank.appendChild(pieceButtons[id]);});
    bank.addEventListener('dragover',dragOver);
    bank.addEventListener('drop',function(event){
      var id=draggedId(event);if(id===null)return;event.preventDefault();returnPiece(id);
    });
    compare.addEventListener('click',function(){
      if(!comparison.hidden){comparison.hidden=true;compare.textContent='Compare with original';return;}
      if(placement.some(function(id){return id===null;}))return;
      var same=placement.every(function(id,i){return units[id]===units[i];});
      status.textContent=same?'This matches the original order.':'A different order. Compare the two versions.';
      comparison.replaceChildren();
      comparison.append(el('h3','puzzle-comparison-label','Your version'),el('p','puzzle-version',placement.map(function(id){return units[id];}).join(' ')),
        el('h3','puzzle-comparison-label','Original text'),el('p','puzzle-version',record.text));
      if(!same)comparison.appendChild(el('p','puzzle-comparison-note','A different order can also be coherent. Which sentence opens the paragraph, and what does that change about where it arrives?'));
      slotButtons.forEach(function(slot,i){slot.classList.toggle('puzzle-different',units[placement[i]]!==units[i]);});
      comparison.hidden=false;compare.textContent='Hide comparison';
    });
    paint();record.view.replaceWith(board);record.view=board;record.board=board;
  }
  /* One paragraph at a time: the reader asks for each board, and gets the
     paragraph back whenever they want it. */
  function openBoard(index){
    var record=records[index];
    if(phase!=='open' || !record || record.board)return;
    clearSelection();makeBoard(record,index);
    opened.push(index);
    var first=record.view.querySelector('.puzzle-piece');
    if(first)first.focus({preventScroll:true});
  }
  function closeBoard(index){
    var record=records[index];
    if(phase!=='open' || !record || !record.board)return;
    var preview=makePreview(record,index);
    record.view.replaceWith(preview);record.view=preview;record.board=null;
    opened=opened.filter(function(other){return other!==index;});
    focusCue(preview);
  }
  function previewIndex(event){
    var preview=event.target.closest && event.target.closest('.puzzle-preview');
    return preview && article.contains(preview) ? Number(preview.dataset.puzzleIndex) : null;
  }
  article.addEventListener('click',function(event){
    var index=previewIndex(event);
    if(index!==null)openBoard(index);
  });
  launch.addEventListener('click',function(){
    if(phase==='reading')openPuzzle();else restore();
  });
  document.addEventListener('keydown',function(event){
    if(event.key!=='Escape' || phase!=='open' || event.defaultPrevented)return;
    if(event.target.closest && event.target.closest('input, textarea, select, [contenteditable], [role="dialog"], .theme-menu, .drawer'))return;
    event.preventDefault();
    /* A single Escape never costs more than one paragraph's work: it closes
       the board you are in, or the one opened most recently, and only leaves
       puzzle mode once nothing is scattered. */
    var board=event.target.closest && event.target.closest('.sentence-puzzle');
    if(board && board.dataset.puzzleIndex)closeBoard(Number(board.dataset.puzzleIndex));
    else if(opened.length)closeBoard(opened[opened.length-1]);
    else restore();
  });
  /* A button that cannot do anything is never offered. */
  if(survey(true).length)launch.hidden=false;
})();
