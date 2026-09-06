/* Clear the currently open document in The Reader without making the reader
   hunt for a browser refresh. The file itself is never stored by The Reader,
   so a clean reload is the safest reset: it also lets the Reader's own
   beforeunload hook save the current bookmark before the text disappears. */
(function(){
  'use strict';

  var shelf = document.getElementById('shelf');
  var tocRow = document.getElementById('tocRow');
  var reading = document.getElementById('reading');
  if(!shelf || !reading) return;

  var row = document.createElement('div');
  row.className = 'shelf-row reader-file-row';
  row.hidden = true;
  row.innerHTML =
    '<h2 class="shelf-label">File</h2>' +
    '<div class="shelf-controls">' +
      '<button class="shelf-pill" id="readerClearBtn" type="button">Clear</button>' +
    '</div>';

  if(tocRow && tocRow.nextSibling) shelf.insertBefore(row, tocRow.nextSibling);
  else shelf.insertBefore(row, shelf.firstChild);

  var clearBtn = document.getElementById('readerClearBtn');
  var clearArmT = null;

  function disarm(){
    clearTimeout(clearArmT);
    clearArmT = null;
    clearBtn.classList.remove('arm');
    clearBtn.textContent = 'Clear';
    clearBtn.setAttribute('aria-label', 'Clear the current file');
  }

  function sync(){
    var readingNow = document.body.classList.contains('reading');
    row.hidden = !readingNow;
    if(!readingNow) disarm();
  }

  /* Same two-press habit as The Page: the first press arms Clear for three
     seconds, the second confirms. A stray click therefore cannot dismiss a
     file the reader is in the middle of. */
  clearBtn.addEventListener('click', function(){
    if(!clearBtn.classList.contains('arm')){
      clearBtn.classList.add('arm');
      clearBtn.textContent = 'clear?';
      clearBtn.setAttribute('aria-label', 'Press again to clear the current file');
      clearArmT = setTimeout(disarm, 3000);
      return;
    }

    clearTimeout(clearArmT);
    clearArmT = null;
    clearBtn.classList.remove('arm');

    /* Keep the bookmark the Reader has already been maintaining, but remove
       the transient file from the page. Replacing the same URL resets every
       parser/book object as well as blob URLs, which a DOM-only clear cannot. */
    try{ history.scrollRestoration = 'manual'; }catch(e){}
    try{ window.scrollTo(0, 0); }catch(e){}
    location.replace(location.pathname + location.search);
  });

  new MutationObserver(sync).observe(document.body, {
    attributes: true,
    attributeFilter: ['class']
  });
  sync();
})();
