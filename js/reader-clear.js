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

  function sync(){
    row.hidden = !document.body.classList.contains('reading');
  }

  clearBtn.addEventListener('click', function(){
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
