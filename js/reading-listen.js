/* Only voices reported as local are eligible. The site never sends the
   piece to a speech service. Short utterances also avoid long-text limits
   in device speech engines. Pausing cancels and resumes at the last word
   boundary, since native pause/resume is inconsistent across phones. */
(function () {
  'use strict';
  var panel = document.getElementById('reading-listen');
  var body = document.querySelector('[data-reading-body]');
  if (!panel || !body) return;
  var play = document.getElementById('reading-play');
  var stop = document.getElementById('reading-stop');
  var speed = document.getElementById('reading-speed');
  var voiceSelect = document.getElementById('reading-voice');
  var voiceLabel = document.getElementById('reading-voice-label');
  var status = document.getElementById('reading-listen-status');
  var synth = window.speechSynthesis;
  var KEY = 'olae-listen-v1';
  var voices = [], chunks = [], index = 0, offset = 0, boundary = 0;
  var state = 'idle', generation = 0, chosen = '';
  function say(text) { status.textContent = text; }
  panel.hidden = false;
  if (!synth || typeof window.SpeechSynthesisUtterance !== 'function') {
    play.disabled = true;
    speed.disabled = true;
    say('Reading aloud is unavailable in this browser.');
    return;
  }
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && ['0.85', '1', '1.15', '1.3'].indexOf(saved.speed) >= 0) speed.value = saved.speed;
    if (saved && typeof saved.voice === 'string') chosen = saved.voice;
  } catch (e) {}
  function remember() {
    try { localStorage.setItem(KEY, JSON.stringify({ speed: speed.value, voice: voiceSelect.value })); } catch (e) {}
  }
  function updateVoices() {
    var keep = voiceSelect.value || chosen;
    var language = (document.documentElement.lang || 'en').split('-')[0].toLowerCase();
    voices = synth.getVoices().filter(function (voice) {
      return voice.localService === true && voice.lang.toLowerCase().split('-')[0] === language;
    });
    voiceSelect.replaceChildren();
    voices.forEach(function (voice) {
      var option = document.createElement('option');
      option.value = voice.voiceURI;
      option.textContent = voice.name + ' (' + voice.lang + ')';
      voiceSelect.appendChild(option);
    });
    var selected = voices.find(function (voice) { return voice.voiceURI === keep; }) ||
      voices.find(function (voice) { return voice.lang.toLowerCase() === 'en-us'; }) ||
      voices.find(function (voice) { return voice.default; }) || voices[0];
    if (selected) voiceSelect.value = selected.voiceURI;
    voiceLabel.hidden = voices.length < 2;
    if (state === 'idle') say(voices.length ? 'Uses an English voice installed on your device.' : 'No local English voice is available. Install one in your device’s speech settings to listen here.');
  }
  function sync() {
    play.textContent = state === 'playing' ? 'Pause' : state === 'paused' ? 'Resume' : 'Listen';
    stop.hidden = state === 'idle';
  }
  function cancel() { generation++; synth.cancel(); }
  function finish(message) {
    cancel(); state = 'idle'; index = 0; offset = 0; sync(); say(message);
  }
  function words() {
    var container = body;
    var blocks = container.querySelectorAll('h2, h3, p, li, blockquote');
    var lines = [];
    Array.prototype.forEach.call(blocks, function (block) {
      if (block.closest('[hidden], button, nav, .puzzle-controls') || block.querySelector('p, li')) return;
      var text = block.textContent.replace(/\s+/g, ' ').trim();
      while (text.length > 420) {
        var end = text.lastIndexOf(' ', 420);
        if (end < 1) end = 420;
        lines.push(text.slice(0, end));
        text = text.slice(end).trim();
      }
      if (text) lines.push(text);
    });
    if (!lines.length) {
      var text = container.textContent.replace(/\s+/g, ' ').trim();
      if (text) lines.push(text);
    }
    return lines;
  }
  function speak() {
    var voice = voices.find(function (v) { return v.voiceURI === voiceSelect.value; });
    if (!voice || !voice.localService) { finish('No local English voice is available.'); return; }
    if (index >= chunks.length) { finish('Finished reading.'); return; }
    var token = ++generation;
    var utterance = new SpeechSynthesisUtterance(chunks[index].slice(offset));
    var start = offset;
    boundary = offset;
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = Number(speed.value);
    utterance.onboundary = function (event) { if (token === generation && event.name === 'word') boundary = start + event.charIndex; };
    utterance.onend = function () {
      if (token !== generation || state !== 'playing') return;
      index++; offset = 0; speak();
    };
    utterance.onerror = function () {
      if (token === generation) finish('Reading stopped. You can try Listen again.');
    };
    synth.speak(utterance);
    say('Reading on your device.');
  }
  play.addEventListener('click', function () {
    if (state === 'playing') {
      offset = boundary; cancel(); state = 'paused'; sync(); say('Paused.'); return;
    }
    updateVoices();
    if (!voices.length) return;
    if (document.getElementById('essay-puzzle') && document.getElementById('essay-puzzle').getAttribute('aria-pressed') === 'true') {
      say('Turn off puzzle mode before listening.'); return;
    }
    if (state === 'idle') { chunks = words(); index = 0; offset = 0; }
    if (!chunks.length) { say('There is no text to read.'); return; }
    cancel(); state = 'playing'; sync(); remember(); speak();
  });
  stop.addEventListener('click', function () { finish('Stopped.'); play.focus(); });
  function change() {
    chosen = voiceSelect.value;
    remember();
    if (state === 'playing') { offset = boundary; cancel(); speak(); }
  }
  speed.addEventListener('change', change);
  voiceSelect.addEventListener('change', change);
  window.addEventListener('pagehide', function () { finish('Stopped.'); });
  var puzzle = document.getElementById('essay-puzzle');
  if (puzzle) puzzle.addEventListener('click', function () { if (state !== 'idle') finish('Stopped for puzzle mode.'); });
  if (synth.addEventListener) synth.addEventListener('voiceschanged', updateVoices);
  updateVoices();
})();
