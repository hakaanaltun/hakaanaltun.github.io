/* Fetch the generated index only on the search page, once per visit. */
(function () {
  'use strict';
  var page = document.querySelector('[data-search-index]');
  if (!page) return;
  var input = document.getElementById('site-search');
  var form = input.form;
  var status = document.getElementById('search-status');
  var results = document.getElementById('search-results');
  var indexPromise;
  var revision = 0;
  var timer;
  var decoder = document.createElement('textarea');

  function plain(text) {
    // A textarea decodes entities as text, without creating active elements.
    decoder.innerHTML = String(text || '');
    return decoder.value;
  }

  function normalize(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/ı/g, 'i').replace(/[’‘]/g, "'");
  }

  function loadIndex() {
    if (!indexPromise) {
      indexPromise = fetch(page.dataset.searchIndex).then(function (response) {
        if (!response.ok) throw new Error('Search unavailable');
        return response.json();
      }).then(function (entries) {
        return entries.filter(function (entry) {
          return entry && typeof entry.url === 'string' && /^\/(?!\/)/.test(entry.url);
        }).map(function (entry) {
          ['title', 'description', 'text', 'kind'].forEach(function (key) { entry[key] = plain(entry[key]); });
          entry.titleKey = normalize(entry.title);
          entry.descriptionKey = normalize(entry.description);
          entry.bodyKey = normalize(entry.text);
          entry.allKey = [entry.titleKey, entry.descriptionKey, entry.bodyKey, normalize(entry.kind)].join(' ');
          return entry;
        });
      }).catch(function (error) { indexPromise = null; throw error; });
    }
    return indexPromise;
  }

  function snippet(entry, terms) {
    var body = entry.text;
    var position = -1;
    terms.forEach(function (term) {
      var found = entry.bodyKey.indexOf(term);
      if (found !== -1 && (position === -1 || found < position)) position = found;
    });
    if (position === -1) return entry.description || body.slice(0, 210);
    // Normalization may shorten accented text slightly; the wider context
    // keeps the match visible without inserting HTML into search results.
    var start = Math.max(0, position - 65);
    if (start) {
      var boundary = body.lastIndexOf(' ', start);
      if (boundary !== -1) start = boundary + 1;
    }
    return (start ? '…' : '') + body.slice(start, start + 210) + (body.length > start + 210 ? '…' : '');
  }

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = text;
    return node;
  }

  function updateURL(query) {
    var url = new URL(window.location.href);
    if (query) url.searchParams.set('q', query);
    else url.searchParams.delete('q');
    window.history.replaceState(null, '', url);
  }

  async function search() {
    var current = ++revision;
    var query = input.value.trim().slice(0, 200);
    var key = normalize(query);
    var terms = key.split(/\s+/).filter(Boolean);
    results.replaceChildren();
    updateURL(query);
    if (!terms.length) {
      status.textContent = 'Search by title or by a word you remember.';
      return;
    }
    status.textContent = 'Searching…';
    try {
      var entries = await loadIndex();
      if (current !== revision) return;
      var matches = entries.filter(function (entry) {
        return terms.every(function (term) { return entry.allKey.includes(term); });
      }).map(function (entry) {
        var score = entry.titleKey === key ? 100 : entry.titleKey.includes(key) ? 50 : 0;
        terms.forEach(function (term) {
          if (entry.titleKey.includes(term)) score += 10;
          if (entry.descriptionKey.includes(term)) score += 3;
        });
        return { entry: entry, score: score };
      }).sort(function (a, b) { return b.score - a.score || a.entry.title.localeCompare(b.entry.title); });
      status.textContent = matches.length ? matches.length + (matches.length === 1 ? ' result' : ' results') + ' for “' + query + '”.' : 'No results for “' + query + '”. Try another word or a shorter phrase.';
      var fragment = document.createDocumentFragment();
      matches.forEach(function (match) {
        var entry = match.entry;
        var row = document.createElement('li');
        row.appendChild(element('span', 'search-result-kind', entry.kind));
        var heading = document.createElement('h2');
        var link = element('a', '', entry.title);
        link.setAttribute('href', entry.url);
        heading.appendChild(link);
        row.appendChild(heading);
        row.appendChild(element('p', '', snippet(entry, terms)));
        fragment.appendChild(row);
      });
      results.appendChild(fragment);
    } catch (error) {
      if (current !== revision) return;
      status.textContent = 'Search could not load. Check your connection and press Search to try again.';
    }
  }

  form.addEventListener('submit', function (event) { event.preventDefault(); clearTimeout(timer); search(); });
  input.addEventListener('input', function () {
    clearTimeout(timer);
    ++revision;
    timer = setTimeout(search, 150);
  });
  window.addEventListener('popstate', function () {
    input.value = (new URLSearchParams(window.location.search).get('q') || '').slice(0, 200);
    search();
  });
  input.value = (new URLSearchParams(window.location.search).get('q') || '').slice(0, 200);
  search();
})();
