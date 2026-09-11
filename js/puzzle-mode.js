/* Reversible puzzles: sentence order, words within a chosen sentence, or all
   words in a paragraph. A
   reader opens puzzle mode, scatters whichever paragraph they are curious
   about, and puts its pieces back in an order of their own; the rest of the
   essay stays readable. Sentence order asks what a paragraph's shape does;
   word order asks what a sentence's does. Original DOM nodes are detached
   intact and returned on exit; nothing is sent or saved. */
(function(){
  'use strict';
  var launch=document.getElementById('essay-puzzle');
  var article=document.querySelector('.essay-body');
  if(!launch || !article) return;
  var MIME='application/x-olae-puzzle-piece';
  /* No editorial cap: which paragraph is worth the trouble is the reader's
     call, and one deliberate click is what bounds the cost. RUNAWAY is only a
     guard against a pathological paragraph, not a judgement about any
     particular essay — texts change, and a cap fitted to today's would
     quietly start hiding tomorrow's. A paragraph of one sentence is not a
     puzzle at all: there is nothing in it to reorder. */
  var MIN_PIECES=2;
  /* Per unit: how many is a runaway rather than a paragraph, and where a
     reader deserves the size before choosing. About attention, not about
     any particular essay. */
  var UNITS={
    sentences:{label:'sentences', noun:'sentence', runaway:60, countAbove:4},
    sentenceWords:{label:'words in a sentence', noun:'word', runaway:400, countAbove:60},
    words:    {label:'all words', noun:'word', runaway:400, countAbove:60}
  };
  var unit='sentences';
  var phase='reading', records=[], offered=0, opened=[], panel=null, message=null, releasePanel=null;
  /* Where the reader last put the rail. Kept for as long as the page is open,
     so hiding the instructions a second time puts it back where they left it,
     and never written anywhere: puzzle mode saves nothing. */
  var railSpot=null;
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
  /* Prose only: nothing with nested blocks, media, code or controls in it.
     Both cuts are taken once, here: switching unit must not cost a reader a
     second walk of the essay, and a paragraph is worth keeping if either cut
     has something to reorder. A paragraph of one sentence is not a sentence
     puzzle — there is nothing in it to reorder — but it is still a fine word
     puzzle, so it stays on the books and is simply not offered in the mode
     that cannot use it. */
  function eligible(node){
    if(node.closest('.puzzle-panel, .puzzle-board, .puzzle-preview'))return null;
    if(node.querySelector('p, li, blockquote, img, svg, video, audio, canvas, iframe, button, input, select, textarea, pre, code, math'))return null;
    var text=prose(node).trim();
    if(!text)return null;
    var cuts={sentences:sentences(text),words:text.match(/\S+/gu)||[]};
    var usable=false;
    Object.keys(UNITS).forEach(function(name){
      if(name==='sentenceWords')return;
      if(cuts[name].length>=MIN_PIECES && cuts[name].length<=UNITS[name].runaway)usable=true;
    });
    if(!usable)return null;
    return {original:node,text:text,cuts:cuts,view:null,viewUnit:null,board:null};
  }
  function piecesOf(record,name){return record.cuts[name||unit];}
  function scatterable(record,name){
    if((name||unit)==='sentenceWords')return record.cuts.sentences.some(function(text){
      var count=(text.match(/\S+/gu)||[]).length;
      return count>=MIN_PIECES && count<=UNITS.words.runaway;
    });
    var pieces=piecesOf(record,name),limits=UNITS[name||unit];
    return pieces.length>=MIN_PIECES && pieces.length<=limits.runaway;
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
      if(record.view && record.view!==record.original && record.view.parentNode)record.view.replaceWith(record.original);
    });
    records=[];opened=[];
    if(releasePanel){releasePanel();releasePanel=null;}
    if(panel)panel.remove();panel=message=null;
    phase='reading';article.classList.remove('puzzle-active');
    launch.textContent='puzzle mode';launch.setAttribute('aria-pressed','false');
    launch.focus({preventScroll:true});
  }
  function setPanel(){
    panel=el('div','puzzle-panel');panel.setAttribute('role','group');panel.setAttribute('aria-label','Puzzle controls');
    var controls=el('div','puzzle-panel-actions');
    var exit=button('puzzle-action','Read the original');exit.addEventListener('click',restore);
    /* Hiding the instructions shrinks the panel rather than taking it away.
       What is left is the choice of unit, small and out of the way down the
       left, because a reader who has read the instructions once may still
       want to switch between sentences and words at any point. */
    /* The rail is fixed to the window, and .essay-body carries the identity
       transform its fade-in leaves behind — which would make it the rail's
       containing block and pin the thing back inside the column it is trying
       to get out of. So while it is a rail it hangs off the body instead, and
       comes home to the top of the essay when it is opened again. */
    var wide=window.matchMedia?window.matchMedia('(min-width:1100px)'):{matches:false};
    function dock(){
      if(!panel)return;
      var railed=panel.classList.contains('puzzle-collapsed') &&
        (wide.matches || panel.classList.contains('puzzle-moved'));
      var home=railed?document.body:article;
      if(panel.parentNode===home)return;
      if(railed)document.body.appendChild(panel);else article.prepend(panel);
    }
    /* Where the rail sits is the reader's business, not the stylesheet's: the
       left margin suits one reader, the paragraph they are working on suits
       another, and on a narrow window there is no margin to suit anybody. So
       it is picked up by its grip and put down wherever they want it, which
       fixes it to the window at any width. Clamped to the window on every
       move and every resize, because a rail parked off-screen is a rail lost;
       6px of air is enough to get hold of it again. */
    function placeRail(left,top){
      if(!panel)return;
      panel.classList.add('puzzle-moved');dock();
      var box=panel.getBoundingClientRect();
      var room=document.documentElement.clientWidth || window.innerWidth || 0;
      var sill=window.innerHeight || document.documentElement.clientHeight || 0;
      railSpot={left:Math.min(Math.max(6,left),Math.max(6,room-box.width-6)),
        top:Math.min(Math.max(6,top),Math.max(6,sill-box.height-6))};
      panel.style.left=railSpot.left+'px';panel.style.top=railSpot.top+'px';
    }
    function reclamp(){
      if(panel && railSpot && panel.classList.contains('puzzle-moved'))placeRail(railSpot.left,railSpot.top);
    }
    if(wide.addEventListener)wide.addEventListener('change',dock);
    window.addEventListener('resize',reclamp,{passive:true});
    releasePanel=function(){
      if(wide.removeEventListener)wide.removeEventListener('change',dock);
      window.removeEventListener('resize',reclamp);
    };
    function collapse(){
      if(panel.classList.contains('puzzle-collapsed'))return;
      panel.classList.add('puzzle-collapsed');
      if(railSpot)placeRail(railSpot.left,railSpot.top);else dock();
      var next=article.querySelector('.puzzle-piece:not([hidden])') || article.querySelector('.puzzle-scatter-cue') || launch;
      next.focus({preventScroll:true});
    }
    /* Opened again it is a panel at the head of the essay, not a rail, so it
       gives up the spot it was pinned to — but not the memory of it. */
    function expand(){
      panel.classList.remove('puzzle-collapsed','puzzle-moved','puzzle-lifted');
      panel.style.left=panel.style.top='';
      dock();
      hide.focus({preventScroll:true});
    }
    var hide=button('puzzle-action','Hide instructions');hide.addEventListener('click',collapse);
    /* The handle. Dragging the rail by its body would fight the page for a
       touch that meant to scroll, so only this bar takes a drag — it is the
       one thing on the rail carrying touch-action:none — and the arrow keys
       do the same job for anyone not using a pointer. */
    var grip=button('puzzle-grip');
    var bar=el('span','puzzle-grip-bar');bar.setAttribute('aria-hidden','true');
    grip.appendChild(bar);
    grip.setAttribute('aria-label','Move the puzzle rail. Drag it, or use the arrow keys.');
    grip.title='Drag to move';
    var lift=null;
    grip.addEventListener('pointerdown',function(event){
      if(event.button>0 || !panel.classList.contains('puzzle-collapsed'))return;
      /* Pinned to the window when the grip is taken hold of, not on the first
         move: leaving the column re-parents the rail, and an element that
         moves in the document drops the pointer it captured — done mid-drag
         that ended the drag one step in. It is pinned exactly where it
         already was, so taking hold of it moves nothing. */
      var held=panel.classList.contains('puzzle-moved'), box=panel.getBoundingClientRect();
      placeRail(box.left,box.top);
      box=panel.getBoundingClientRect();
      lift={id:event.pointerId,held:held,moved:false,
        x:Math.min(Math.max(0,event.clientX-box.left),box.width),
        y:Math.min(Math.max(0,event.clientY-box.top),box.height)};
      panel.classList.add('puzzle-lifted');
      if(grip.setPointerCapture)try{grip.setPointerCapture(event.pointerId);}catch(e){}
      // Stopping the default keeps a drag from selecting the page, which also
      // costs the grip the focus it would have had — so it is given back, and
      // the arrow keys carry on from wherever the hand put it.
      event.preventDefault();grip.focus({preventScroll:true});
    });
    grip.addEventListener('pointermove',function(event){
      if(!lift || lift.id!==event.pointerId)return;
      event.preventDefault();lift.moved=true;
      placeRail(event.clientX-lift.x,event.clientY-lift.y);
    });
    function drop(event){
      if(!lift || (event && lift.id!==event.pointerId))return;
      if(grip.releasePointerCapture)try{grip.releasePointerCapture(lift.id);}catch(e){}
      // A grip taken hold of and let go again has asked for nothing, so a rail
      // that was in the flow goes back to it rather than floating from a tap.
      if(!lift.moved && !lift.held){
        railSpot=null;panel.classList.remove('puzzle-moved');
        panel.style.left=panel.style.top='';dock();
      }
      lift=null;panel.classList.remove('puzzle-lifted');
    }
    grip.addEventListener('pointerup',drop);
    grip.addEventListener('pointercancel',drop);
    grip.addEventListener('lostpointercapture',drop);
    var NUDGE={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
    grip.addEventListener('keydown',function(event){
      var way=NUDGE[event.key];
      if(!way || !panel.classList.contains('puzzle-collapsed'))return;
      event.preventDefault();
      var box=panel.getBoundingClientRect(), stride=event.shiftKey?60:14;
      var left=railSpot?railSpot.left:box.left, top=railSpot?railSpot.top:box.top;
      placeRail(left+way[0]*stride,top+way[1]*stride);
    });
    var show=button('puzzle-expand','instructions');
    show.setAttribute('aria-label','Show the puzzle instructions again');
    show.addEventListener('click',expand);
    panel.addEventListener('click',function(event){
      if(event.target.closest('button'))return;
      if(!panel.classList.contains('puzzle-collapsed'))collapse();
    });
    /* The choice changes the scope of the puzzle and redraws the previews. */
    var choice=el('div','puzzle-unit-choice');choice.setAttribute('role','group');
    choice.setAttribute('aria-label','What to scatter');
    choice.appendChild(el('span','puzzle-unit-label','Scatter by'));
    Object.keys(UNITS).forEach(function(name){
      var option=button('puzzle-unit',UNITS[name].label);
      option.dataset.puzzleUnit=name;
      option.addEventListener('click',function(){setUnit(name);});
      choice.appendChild(option);
    });
    choice.appendChild(show);
    controls.append(exit,hide);
    message=el('p','puzzle-instructions','');
    panel.append(grip,choice,controls,message);article.prepend(panel);
    paintUnitChoice();
  }
  function paintUnitChoice(){
    if(!panel)return;
    panel.querySelectorAll('.puzzle-unit').forEach(function(option){
      option.setAttribute('aria-pressed',String(option.dataset.puzzleUnit===unit));
    });
    message.textContent=unit==='sentenceWords'
      ?'Choose a sentence to scatter its words. The other sentences stay boxed until you choose them. Escape returns one sentence; Escape again leaves when nothing is scattered.'
      :'Choose a paragraph to scatter its '+UNITS[unit].noun+
      's, then put them back in an order of your own. Escape returns one paragraph; Escape again leaves puzzle mode.';
  }
  function setUnit(name){
    if(!UNITS[name] || name===unit)return;
    unit=name;paintUnitChoice();renumber();
    /* An open board comes along. The paragraph a reader has scattered is the
       one they are thinking about, so it is the last one that should be left
       behind in the old unit. Its arrangement cannot come with it — placed
       words are not placed sentences — so it opens fresh; and a paragraph
       the new unit has no use for goes quietly back to being prose. */
    opened.slice().forEach(function(index){
      var record=records[index];
      if(!record || !record.board)return;
      if(unit==='sentenceWords' || record.sentenceRecords){
        record.view.replaceWith(record.original);
        record.view=record.original;record.viewUnit=null;record.board=null;
        record.sentenceRecords=null;record.sentenceOpened=[];
        opened=opened.filter(function(other){return other!==index;});
        // Entering the sentence scope waits for an explicit sentence choice.
        if(unit==='sentenceWords')return;
      }
      if(scatterable(record)){
        makeBoard(record,index);
        if(!opened.includes(index))opened.push(index);
        return;
      }
      record.view.replaceWith(record.original);
      record.view=record.original;record.viewUnit=null;record.board=null;
      opened=opened.filter(function(other){return other!==index;});
    });
    renderPreviews();
  }
  /* The paragraph keeps its own role, so its prose stays readable and a list
     item stays a list item; the trailing cue is the actual control. Pointer
     users can click anywhere in the paragraph, which claims nothing in ARIA. */
  function makePreview(record,index){
    if(unit==='sentenceWords')return makeSentencePreview(record,index);
    record.sentenceRecords=null;record.sentenceOpened=[];
    var preview=record.original.cloneNode(false);
    preview.classList.add('puzzle-preview','puzzle-by-'+unit);
    preview.dataset.puzzleIndex=String(index);
    var pieces=piecesOf(record);
    pieces.forEach(function(piece,i){
      if(i)preview.appendChild(document.createTextNode(' '));
      preview.appendChild(el('span','puzzle-piece-preview',piece));
    });
    var size=pieces.length,noun=UNITS[unit].noun;
    var cue=button('puzzle-scatter-cue',size>UNITS[unit].countAbove?'scatter · '+size+' '+noun+'s':'scatter');
    cue.setAttribute('aria-label','Scatter the '+size+' '+noun+'s of paragraph '+record.ordinal+' of '+offered);
    preview.append(' ',cue);
    return preview;
  }
  function makeSentencePreview(record,index){
    var preview=el(record.original.tagName==='LI'?'li':'div',record.original.className);
    if(record.original.id)preview.id=record.original.id;
    preview.classList.add('puzzle-preview','puzzle-sentence-group');
    preview.dataset.puzzleIndex=String(index);
    record.sentenceOpened=[];
    record.sentenceRecords=record.cuts.sentences.map(function(text,sentenceIndex){
      var row=el('p','puzzle-sentence-preview puzzle-by-words');
      row.dataset.puzzleSentence=String(sentenceIndex);
      var words=text.match(/\S+/gu)||[];
      words.forEach(function(word,i){
        if(i)row.append(' ');
        row.appendChild(el('span','puzzle-piece-preview',word));
      });
      if(words.length>=MIN_PIECES && words.length<=UNITS.words.runaway){
        var cue=button('puzzle-scatter-cue','scatter');
        cue.setAttribute('aria-label','Scatter the '+words.length+' words of sentence '+(sentenceIndex+1)+' in paragraph '+record.ordinal);
        row.append(' ',cue);
        row.classList.add('puzzle-sentence-ready');
      }
      preview.append(row,' ');
      return {original:row,view:row,text:text,cuts:{words:words},ordinal:record.ordinal,
        sentenceIndex:sentenceIndex,board:null};
    });
    return preview;
  }
  function openSentenceBoard(index,sentenceIndex){
    var parent=records[index],record=parent && parent.sentenceRecords && parent.sentenceRecords[sentenceIndex];
    if(phase!=='open' || unit!=='sentenceWords' || !record || record.board || !scatterable(record,'words'))return;
    clearSelection();makeBoard(record,index);
    parent.board=parent.view;
    parent.sentenceOpened.push(sentenceIndex);
    opened=opened.filter(function(other){return other!==index;});opened.push(index);
    var first=record.board.querySelector('.puzzle-piece');if(first)first.focus({preventScroll:true});
  }
  function closeSentenceBoard(index,sentenceIndex){
    var parent=records[index],record=parent && parent.sentenceRecords && parent.sentenceRecords[sentenceIndex];
    if(!record || !record.board)return;
    record.view.replaceWith(record.original);record.view=record.original;record.board=null;
    parent.sentenceOpened=parent.sentenceOpened.filter(function(other){return other!==sentenceIndex;});
    if(!parent.sentenceOpened.length){
      parent.board=null;opened=opened.filter(function(other){return other!==index;});
    }
    focusCue(record.view);
  }
  /* Paragraphs are numbered by what this unit actually offers, so a reader
     counting down the page is never told "of 5" when four are on offer. */
  function renumber(){
    offered=0;
    records.forEach(function(record){record.ordinal=scatterable(record)?++offered:0;});
  }
  /* Every paragraph is one of three things: a board the reader is working in,
     a boxed paragraph waiting to be chosen, or — when this unit has nothing to
     do with it — the prose exactly as it was written. */
  function renderPreviews(){
    renumber();
    records.forEach(function(record,index){
      if(record.board)return;
      var offer=scatterable(record);
      if(offer && record.viewUnit===unit)return;
      if(!offer && record.view===record.original)return;
      var target=offer?makePreview(record,index):record.original;
      record.view.replaceWith(target);record.view=target;record.viewUnit=offer?unit:null;
    });
  }
  function cueOf(preview){return preview && preview.querySelector('.puzzle-scatter-cue');}
  function focusCue(preview){var cue=cueOf(preview);if(cue)cue.focus({preventScroll:true});}
  function openPuzzle(){
    records=survey(false);
    if(!records.length)return;
    clearSelection();
    records.forEach(function(record){record.view=record.original;record.viewUnit=null;});
    phase='open';article.classList.add('puzzle-active');
    launch.textContent='leave puzzle mode';launch.setAttribute('aria-pressed','true');
    setPanel();renderPreviews();
    panel.scrollIntoView({block:'start',behavior:'instant'});
    focusCue(article.querySelector('.puzzle-preview'));
  }
  function makeBoard(record,index){
    // Preserve list semantics where a prose item lives inside a list.
    var board=el(record.original.tagName==='LI'?'li':'section','puzzle-board');
    var isSentence=record.sentenceIndex!==undefined;
    var boardUnit=isSentence?'words':unit, noun=UNITS[boardUnit].noun;
    var label=isSentence?'Sentence '+(record.sentenceIndex+1)+' · Paragraph '+record.ordinal:'Paragraph '+record.ordinal;
    board.classList.add('puzzle-by-'+boardUnit);
    board.dataset.puzzleUnit=boardUnit;
    board.setAttribute('aria-label',label);
    if(isSentence)board.dataset.puzzleSentence=String(record.sentenceIndex);
    board.dataset.puzzleIndex=String(index);
    if(record.original.id)board.id=record.original.id;
    var heading=el('div','puzzle-paragraph-label',label);
    var slots=el('div','puzzle-slots');slots.setAttribute('role','group');slots.setAttribute('aria-label','Rebuild paragraph '+record.ordinal);
    var bank=el('div','puzzle-bank');bank.setAttribute('role','group');bank.setAttribute('aria-label','Available '+noun+'s for paragraph '+record.ordinal);
    var actions=el('div','puzzle-board-actions');
    var compare=button('puzzle-action','Compare with original');compare.disabled=true;
    if(isSentence){slots.setAttribute('aria-label','Rebuild '+label.toLowerCase());bank.setAttribute('aria-label','Available words for '+label.toLowerCase());}
    var putBack=button('puzzle-action',isSentence?'Put this sentence back':'Put this paragraph back');
    putBack.addEventListener('click',function(){if(isSentence)closeSentenceBoard(index,record.sentenceIndex);else closeBoard(index);});
    var status=el('span','puzzle-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    var comparison=el('div','puzzle-comparison');comparison.hidden=true;
    actions.append(compare,putBack,status);board.append(heading,slots,bank,actions,comparison);
    var units=piecesOf(record,boardUnit),placement=units.map(function(){return null;}),selected=null;
    var slotButtons=[],slotBodies=[],pieceButtons=[],order=shuffled(units),boardId=gameId+'-paragraph-'+index+(isSentence?'-sentence-'+record.sentenceIndex:'');
    function select(id){
      selected=id;
      pieceButtons.forEach(function(node,i){node.setAttribute('aria-pressed',String(i===id));});
      board.classList.toggle('puzzle-has-selection',id!==null);
    }
    function announce(){
      var count=placement.filter(function(id){return id!==null;}).length;
      status.textContent=count+' of '+units.length+' '+noun+'s placed';
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
        node.setAttribute('aria-label','Position '+(i+1)+(id===null?', empty':': '+opening(units[id])+'. Select to return this '+noun+'.'));
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
    units.forEach(function(text,id){
      var piece=button('puzzle-piece',text);piece.draggable=true;piece.setAttribute('aria-pressed','false');
      // A word puzzle is a field of small tiles; a light tilt keeps it from
      // reading as a form. A stack of sentences is prose, and stays square.
      if(boardUnit==='words')piece.style.setProperty('--puzzle-tilt',(Math.random()*4-2).toFixed(2)+'deg');
      piece.addEventListener('click',function(){
        select(selected===id?null:id);
        status.textContent=selected===null?'Selection cleared':'Selected “'+opening(text)+'”. Choose a position above.';
      });
      piece.addEventListener('dragstart',function(event){dragStart(event,id);});
      piece.addEventListener('dragend',function(){select(null);});
      pieceButtons.push(piece);
      var slot=button('puzzle-slot');
      var slotBody=el('span','puzzle-slot-text','');
      // Numbered positions make sense for a handful of sentences; for a
      // hundred words they are noise, and the slot's own width is the cue.
      if(boardUnit==='sentences')slot.appendChild(el('span','puzzle-slot-number',String(id+1)));
      else slot.style.setProperty('--puzzle-space',Math.max(2.5,Math.min(8,Array.from(text).length*.48))+'em');
      slot.appendChild(slotBody);
      slot.addEventListener('click',function(){
        if(selected!==null){place(selected,id);slot.focus({preventScroll:true});}
        else if(placement[id]!==null)returnPiece(placement[id]);
        else status.textContent='Choose a '+noun+' below, then select this position.';
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
      status.textContent=same?(boardUnit==='sentences'?'This matches the original order.':'This matches the original wording.')
        :'A different order. Compare the two versions.';
      comparison.replaceChildren();
      comparison.append(el('h3','puzzle-comparison-label','Your version'),el('p','puzzle-version',placement.map(function(id){return units[id];}).join(' ')),
        el('h3','puzzle-comparison-label','Original text'),el('p','puzzle-version',record.text));
      if(!same)comparison.appendChild(el('p','puzzle-comparison-note',boardUnit==='sentences'
        ?'A different order can also be coherent. Which sentence opens the paragraph, and what does that change about where it arrives?'
        :'A different order can also be grammatical. What changes in meaning or emphasis?'));
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
    // It may have been opened under the other unit; it comes back under this one.
    var offer=scatterable(record);
    var target=offer?makePreview(record,index):record.original;
    record.view.replaceWith(target);record.view=target;record.viewUnit=offer?unit:null;record.board=null;
    opened=opened.filter(function(other){return other!==index;});
    if(offer)focusCue(target);else launch.focus({preventScroll:true});
  }
  function previewIndex(event){
    var preview=event.target.closest && event.target.closest('.puzzle-preview');
    return preview && article.contains(preview) ? Number(preview.dataset.puzzleIndex) : null;
  }
  article.addEventListener('click',function(event){
    if(event.target.closest && event.target.closest('.puzzle-board'))return;
    var index=previewIndex(event);
    if(unit==='sentenceWords'){
      var sentence=event.target.closest && event.target.closest('.puzzle-sentence-ready');
      if(index!==null && sentence)openSentenceBoard(index,Number(sentence.dataset.puzzleSentence));
      return;
    }
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
    var board=event.target.closest && event.target.closest('.puzzle-board');
    if(board && board.dataset.puzzleSentence!==undefined)closeSentenceBoard(Number(board.dataset.puzzleIndex),Number(board.dataset.puzzleSentence));
    else if(board && board.dataset.puzzleIndex)closeBoard(Number(board.dataset.puzzleIndex));
    else if(opened.length){
      var index=opened[opened.length-1],record=records[index];
      if(record.sentenceOpened && record.sentenceOpened.length)closeSentenceBoard(index,record.sentenceOpened[record.sentenceOpened.length-1]);
      else closeBoard(index);
    }
    else restore();
  });
  /* A button that cannot do anything is never offered. */
  if(survey(true).length)launch.hidden=false;
})();
