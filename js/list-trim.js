/* Strengthen The List's Trim spaces operation for pasted web/PDF text.
   The page's built-in trim handles ordinary whitespace and owns Undo; this
   small pass runs around it so Undo still restores the exact original text.
   It removes only common invisible copy/paste artifacts that are not needed
   to spell a word: soft hyphen, zero-width space, word joiner and stray BOM.
   ZWJ/ZWNJ are deliberately preserved because some writing systems need them. */
(function(){
  'use strict';

  var button = document.getElementById('opTrim');
  var textarea = document.getElementById('list');
  var report = document.getElementById('report');
  if(!button || !textarea || !report) return;

  var before = null;

  function lines(text){
    return text.split(/\r\n|\r|\n/);
  }

  function cleanLine(line){
    return line
      .replace(/[\u00AD\u200B\u2060\uFEFF]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  button.addEventListener('click', function(){
    before = textarea.value;
  }, true);

  button.addEventListener('click', function(){
    var current = textarea.value;
    var cleaned = lines(current).map(cleanLine).join('\n');

    if(cleaned !== current){
      textarea.value = cleaned;
      textarea.dispatchEvent(new Event('input', { bubbles:true }));
    }

    var originalLines = lines(before === null ? current : before);
    var cleanedLines = lines(cleaned);
    var changed = 0;
    var count = Math.max(originalLines.length, cleanedLines.length);
    for(var i = 0; i < count; i++){
      if((originalLines[i] || '') !== (cleanedLines[i] || '')) changed++;
    }

    report.textContent = changed
      ? 'Trimmed ' + changed + ' ' + (changed === 1 ? 'line.' : 'lines.')
      : 'Nothing to trim.';
    before = null;
  });
})();
