(function () {
  'use strict';

  var app = document.getElementById('trivia-app');
  var dataNode = document.getElementById('trivia-data');
  if (!app || !dataNode) return;

  var questions;
  try {
    questions = JSON.parse(dataNode.textContent);
  } catch (error) {
    return;
  }
  if (!Array.isArray(questions) || !questions.length) return;

  var storageKey = app.getAttribute('data-storage-key') || 'ole-trivia';
  var STATE_VERSION = 2;

  /* A round is a run of one category, in the order the categories appear in
     the bank — not a slice of ten. The bank is stored grouped, so "five
     rounds" is a fact about the questions rather than a number written twice.
     A bank with no categories still plays: it falls back to rounds of ten. */
  var FALLBACK_ROUND_SIZE = 10;

  var intro = document.getElementById('trivia-intro');
  var questionPanel = document.getElementById('trivia-question');
  var roundPanel = document.getElementById('trivia-round');
  var resultPanel = document.getElementById('trivia-result');

  var resumeCopy = document.getElementById('trivia-resume-copy');
  var startButton = document.getElementById('trivia-start');
  var resetIntroButton = document.getElementById('trivia-reset-intro');
  var roundLabel = document.getElementById('trivia-round-label');
  var counter = document.getElementById('trivia-counter');
  var progressBar = document.getElementById('trivia-progress-bar');
  var questionCategory = document.getElementById('trivia-question-category');
  var questionText = document.getElementById('trivia-question-text');
  var choices = document.getElementById('trivia-choices');
  var feedback = document.getElementById('trivia-feedback');
  var nextButton = document.getElementById('trivia-next');

  var roundKicker = document.getElementById('trivia-round-kicker');
  var roundTitle = document.getElementById('trivia-round-title');
  var roundScore = document.getElementById('trivia-round-score');
  var continueButton = document.getElementById('trivia-continue');

  var resultKicker = document.getElementById('trivia-result-kicker');
  var resultTitle = document.getElementById('trivia-result-title');
  var resultCopy = document.getElementById('trivia-result-copy');
  var breakdown = document.getElementById('trivia-breakdown');
  var playAgainButton = document.getElementById('trivia-play-again');
  var retryMissedButton = document.getElementById('trivia-retry-missed');
  var review = document.getElementById('trivia-review');
  var reviewList = document.getElementById('trivia-review-list');

  var state = null;
  var rounds = [];

  /* Where each category first appears in the bank. Rounds follow this order
     however the questions reach us — including a second look at the ones a
     reader missed, which arrives in the order they were missed. */
  var categoryRank = {};
  questions.forEach(function (q, index) {
    var name = (q && q.category) || '';
    if (!(name in categoryRank)) categoryRank[name] = index;
  });

  function shuffle(values) {
    var a = values.slice();
    for (var i = a.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function groupedOrder(indices) {
    var buckets = [];
    var byName = {};

    indices.forEach(function (qIndex) {
      var name = (questions[qIndex] && questions[qIndex].category) || '';
      if (!byName[name]) {
        byName[name] = { rank: categoryRank[name], items: [] };
        buckets.push(byName[name]);
      }
      byName[name].items.push(qIndex);
    });

    buckets.sort(function (a, b) { return a.rank - b.rank; });

    var order = [];
    buckets.forEach(function (bucket) {
      shuffle(bucket.items).forEach(function (qIndex) { order.push(qIndex); });
    });
    return order;
  }

  function buildRounds(order) {
    var built = [];
    var named = order.length > 0 && order.every(function (qIndex) {
      return questions[qIndex] && questions[qIndex].category;
    });

    if (named) {
      var current = null;
      order.forEach(function (qIndex, position) {
        var name = questions[qIndex].category;
        if (!current || current.name !== name) {
          current = { name: name, start: position, length: 0 };
          built.push(current);
        }
        current.length += 1;
      });
      return built;
    }

    for (var start = 0; start < order.length; start += FALLBACK_ROUND_SIZE) {
      built.push({
        name: '',
        start: start,
        length: Math.min(FALLBACK_ROUND_SIZE, order.length - start)
      });
    }
    return built;
  }

  function roundIndexAt(position) {
    for (var i = rounds.length - 1; i >= 0; i -= 1) {
      if (position >= rounds[i].start) return i;
    }
    return 0;
  }

  /* Which answer sits in which slot, decided once per game and kept with the
     rest of the state so a reload does not reshuffle the choices under the
     reader. Without this the bank's own answer positions are the game: in the
     first fifty questions written here, 29 of the right answers were the
     second choice, so "always pick the second one" scored 29. */
  function arrangementFor(qIndex) {
    var q = questions[qIndex];
    return shuffle(q.choices.map(function (_, index) { return index; }));
  }

  function freshState(mode, indices) {
    var order = groupedOrder(indices);
    return {
      version: STATE_VERSION,
      mode: mode,
      order: order,
      arrangement: order.map(arrangementFor),
      position: 0,
      score: 0,
      roundScores: buildRounds(order).map(function () { return 0; }),
      incorrect: [],
      pending: null,
      atBreak: false,
      complete: false
    };
  }

  function isPermutationOf(candidate, length) {
    if (!Array.isArray(candidate) || candidate.length !== length) return false;
    var seen = candidate.slice().sort(function (a, b) { return a - b; });
    return seen.every(function (value, index) { return value === index; });
  }

  function validState(candidate) {
    if (!candidate || candidate.version !== STATE_VERSION) return false;
    if (candidate.mode !== 'full' && candidate.mode !== 'missed') return false;
    if (!Array.isArray(candidate.order) || !candidate.order.length) return false;
    if (candidate.order.length > questions.length) return false;
    if (candidate.mode === 'full' && candidate.order.length !== questions.length) return false;

    var wellFormed = candidate.order.every(function (value, position) {
      if (!Number.isInteger(value) || value < 0 || value >= questions.length) return false;
      if (!Array.isArray(candidate.arrangement)) return false;
      return isPermutationOf(candidate.arrangement[position], questions[value].choices.length);
    });
    if (!wellFormed) return false;
    if (candidate.arrangement.length !== candidate.order.length) return false;

    if (typeof candidate.position !== 'number') return false;
    if (candidate.position < 0 || candidate.position > candidate.order.length) return false;
    if (!Array.isArray(candidate.incorrect)) return false;

    var shape = buildRounds(candidate.order);
    if (!Array.isArray(candidate.roundScores)) return false;
    return candidate.roundScores.length === shape.length;
  }

  function adopt(next) {
    state = next;
    rounds = buildRounds(state.order);
  }

  function readState() {
    try {
      var raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return validState(parsed) ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function saveState() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      /* The quiz still works if storage is blocked. */
    }
  }

  function clearState() {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      /* Nothing else to do. */
    }
  }

  function showOnly(panel) {
    [intro, questionPanel, roundPanel, resultPanel].forEach(function (item) {
      item.hidden = item !== panel;
    });
  }

  /* Headings carry tabindex="-1" so the panel that replaces the last one can
     take focus. A keyboard or screen reader otherwise hears the answer to the
     question just gone and then silence, with the new question never
     announced and the focus back at the top of the document. */
  function focusSafely(element) {
    if (!element) return;
    try {
      element.focus();
    } catch (error) {
      /* Focus is a courtesy here, never the mechanism. */
    }
  }

  /* The note under an answer is the part worth reading, and on a phone it
     lands below the fold: the choices fill the screen, and the note and the
     Next button open underneath it. Bring them up. block: "nearest" does
     nothing when they are already in view, so a wide screen never moves. */
  function revealAnswer() {
    var actions = questionPanel.querySelector('.trivia-actions--question');
    if (!actions || !actions.scrollIntoView) return;
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    try {
      actions.scrollIntoView({ block: 'nearest', behavior: still ? 'auto' : 'smooth' });
    } catch (error) {
      actions.scrollIntoView(false);
    }
  }

  function currentQuestion() {
    if (!state || state.position >= state.order.length) return null;
    return questions[state.order[state.position]];
  }

  function currentArrangement() {
    return state.arrangement[state.position];
  }

  function setProgress(done) {
    var percent = Math.max(0, Math.min(100, (done / state.order.length) * 100));
    progressBar.style.width = percent + '%';
  }

  function markChoice(button, mark) {
    var span = document.createElement('span');
    span.className = 'trivia-choice-mark';
    span.textContent = mark;
    button.appendChild(span);
  }

  /* aria-disabled, not disabled. A disabled button leaves the tab order the
     moment it is pressed, so answering with the keyboard dropped the reader
     back to the top of the page; this way the answered choices stay
     readable, stay focused, and simply stop responding. */
  function showAnswered(selected) {
    var q = currentQuestion();
    if (!q) return;
    var arrangement = currentArrangement();

    choices.querySelectorAll('.trivia-choice').forEach(function (button, slot) {
      var original = arrangement[slot];
      button.setAttribute('aria-disabled', 'true');
      if (original === q.answer) {
        button.classList.add('is-correct');
        markChoice(button, original === selected ? 'Correct' : 'Answer');
      } else if (original === selected) {
        button.classList.add('is-selected-wrong');
        markChoice(button, 'Your answer');
      }
    });

    if (selected === q.answer) {
      feedback.textContent = 'Correct. ' + q.note;
    } else {
      feedback.textContent = 'Answer: ' + q.choices[q.answer] + '. ' + q.note;
    }

    var nextPosition = state.position + 1;
    if (nextPosition >= state.order.length) {
      nextButton.textContent = 'See result';
    } else if (rounds[roundIndexAt(nextPosition)].start === nextPosition) {
      nextButton.textContent = 'Finish round';
    } else {
      nextButton.textContent = 'Next';
    }
    nextButton.hidden = false;
  }

  function chooseAnswer(slot) {
    if (!state || state.pending) return;
    var q = currentQuestion();
    if (!q) return;

    var questionIndex = state.order[state.position];
    var selected = currentArrangement()[slot];
    var roundIndex = roundIndexAt(state.position);

    if (selected === q.answer) {
      state.score += 1;
      state.roundScores[roundIndex] += 1;
    } else {
      state.incorrect.push({ questionIndex: questionIndex, selected: selected });
    }

    state.pending = { selected: selected };
    saveState();
    showAnswered(selected);
    revealAnswer();
  }

  function renderQuestion() {
    showOnly(questionPanel);
    state.atBreak = false;

    var q = currentQuestion();
    if (!q) {
      renderResult();
      return;
    }

    var roundIndex = roundIndexAt(state.position);
    var round = rounds[roundIndex];
    var arrangement = currentArrangement();

    roundLabel.textContent = 'Round ' + (roundIndex + 1) + ' of ' + rounds.length;
    counter.textContent = 'Question ' + (state.position + 1) + ' of ' + state.order.length;
    setProgress(state.position);

    questionCategory.textContent = round.name;
    questionCategory.hidden = !round.name;

    questionText.textContent = q.question;
    choices.innerHTML = '';
    feedback.textContent = '';
    nextButton.hidden = true;

    arrangement.forEach(function (original, slot) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'trivia-choice';
      button.setAttribute('data-choice', String(slot));

      var number = document.createElement('span');
      number.className = 'trivia-choice-number';
      number.textContent = String(slot + 1);

      var label = document.createElement('span');
      label.className = 'trivia-choice-text';
      label.textContent = q.choices[original];

      button.appendChild(number);
      button.appendChild(label);
      button.addEventListener('click', function () {
        if (button.getAttribute('aria-disabled') === 'true') return;
        chooseAnswer(slot);
      });
      choices.appendChild(button);
    });

    if (state.pending && Number.isInteger(state.pending.selected)) {
      showAnswered(state.pending.selected);
    }

    saveState();
    focusSafely(questionText);
  }

  function advance() {
    if (!state || !state.pending) return;
    state.pending = null;
    state.position += 1;

    if (state.position >= state.order.length) {
      state.complete = true;
      state.atBreak = false;
      saveState();
      renderResult();
      return;
    }

    if (rounds[roundIndexAt(state.position)].start === state.position) {
      state.atBreak = true;
      saveState();
      renderRoundBreak();
      return;
    }

    saveState();
    renderQuestion();
  }

  function renderRoundBreak() {
    showOnly(roundPanel);

    var nextIndex = roundIndexAt(state.position);
    var finished = Math.max(0, nextIndex - 1);
    var round = rounds[finished];

    roundKicker.textContent = round.name
      ? 'Round ' + (finished + 1) + ' · ' + round.name
      : 'Round ' + (finished + 1) + ' complete';
    /* The round's own length, not a fixed ten: rounds here are subjects, and
       subjects are not the same size. */
    roundTitle.textContent = state.roundScores[finished] + ' / ' + round.length;
    roundScore.textContent = state.score + ' correct so far, of ' + state.position + '.';

    var upcoming = rounds[nextIndex];
    continueButton.textContent = upcoming && upcoming.name
      ? 'Round ' + (nextIndex + 1) + ': ' + upcoming.name
      : 'Round ' + (nextIndex + 1);

    focusSafely(roundTitle);
  }

  function buildBreakdown() {
    breakdown.innerHTML = '';
    var named = rounds.some(function (round) { return !!round.name; });
    if (!named) {
      breakdown.hidden = true;
      return;
    }

    rounds.forEach(function (round, index) {
      var item = document.createElement('li');

      var name = document.createElement('span');
      name.className = 'trivia-breakdown-name';
      name.textContent = round.name || 'Round ' + (index + 1);

      var score = document.createElement('span');
      score.className = 'trivia-breakdown-score';
      score.textContent = state.roundScores[index] + ' / ' + round.length;

      item.appendChild(name);
      item.appendChild(score);
      breakdown.appendChild(item);
    });

    breakdown.hidden = false;
  }

  function buildReview() {
    reviewList.innerHTML = '';
    if (!state.incorrect.length) {
      review.hidden = true;
      return;
    }

    state.incorrect.forEach(function (miss) {
      var q = questions[miss.questionIndex];
      if (!q) return;

      var item = document.createElement('li');
      var prompt = document.createElement('span');
      prompt.className = 'trivia-review-question';
      prompt.textContent = q.question;

      var answer = document.createElement('span');
      answer.className = 'trivia-review-answer';
      answer.textContent = 'Answer: ' + q.choices[q.answer] + '. ' + q.note;

      item.appendChild(prompt);
      item.appendChild(answer);
      reviewList.appendChild(item);
    });

    review.hidden = false;
  }

  function renderResult() {
    showOnly(resultPanel);
    state.complete = true;
    state.atBreak = false;
    state.pending = null;
    saveState();

    var total = state.order.length;
    resultKicker.textContent = state.mode === 'missed' ? 'Second look' : 'Finished';
    resultTitle.textContent = state.score + ' / ' + total;
    resultCopy.textContent = state.mode === 'missed'
      ? 'You got ' + state.score + ' of the ' + total + ' you had missed.'
      : 'You got ' + state.score + ' of ' + total + ' right.';

    buildBreakdown();
    buildReview();

    var missed = state.incorrect.length;
    retryMissedButton.hidden = missed === 0;
    retryMissedButton.textContent = missed === 1
      ? 'Try the one you missed'
      : 'Try the ' + missed + ' you missed';

    focusSafely(resultTitle);
  }

  function beginGame(mode, indices) {
    clearState();
    adopt(freshState(mode, indices));
    saveState();
    renderQuestion();
  }

  function beginNewGame() {
    beginGame('full', questions.map(function (_, index) { return index; }));
  }

  function retryMissed() {
    if (!state || !state.incorrect.length) return;
    var seen = {};
    var indices = [];
    state.incorrect.forEach(function (miss) {
      if (seen[miss.questionIndex]) return;
      seen[miss.questionIndex] = true;
      indices.push(miss.questionIndex);
    });
    beginGame('missed', indices);
  }

  function openFromIntro() {
    var stored = readState();
    if (!stored || stored.complete) {
      beginNewGame();
      return;
    }

    adopt(stored);
    if (state.atBreak) renderRoundBreak();
    else renderQuestion();
  }

  function updateIntro() {
    var stored = readState();
    if (!stored) return;

    adopt(stored);
    resumeCopy.hidden = false;

    if (stored.complete) {
      resumeCopy.textContent = 'Last score: ' + stored.score + ' / ' + stored.order.length + '.';
      startButton.textContent = 'Play again';
      resetIntroButton.hidden = true;
      return;
    }

    if (stored.atBreak) {
      resumeCopy.textContent = 'You finished round ' + roundIndexAt(stored.position) + ' of ' + rounds.length + '.';
    } else {
      resumeCopy.textContent = 'Continue at question ' + (stored.position + 1) + ' of ' + stored.order.length + '.';
    }
    startButton.textContent = 'Continue';
    resetIntroButton.hidden = false;
  }

  startButton.addEventListener('click', openFromIntro);
  resetIntroButton.addEventListener('click', beginNewGame);
  nextButton.addEventListener('click', advance);
  continueButton.addEventListener('click', function () {
    if (!state) return;
    state.atBreak = false;
    saveState();
    renderQuestion();
  });
  playAgainButton.addEventListener('click', beginNewGame);
  retryMissedButton.addEventListener('click', retryMissed);

  function isTypingTarget(node) {
    if (!node || !node.tagName) return false;
    if (node.isContentEditable) return true;
    var tag = node.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  }

  /* The shortcuts are on the document, so they have to give way to anything
     the reader is actually typing into. The site carries a search field in
     the drawer and another in the footer strip on every page, this one
     included: without the guard below, typing "1984" into either one
     answered the open question and swallowed the digit. */
  function shortcutTarget() {
    if (!questionPanel.hidden && !nextButton.hidden) return nextButton;
    if (!roundPanel.hidden) return continueButton;
    if (!intro.hidden) return startButton;
    return null;
  }

  document.addEventListener('keydown', function (event) {
    if (event.defaultPrevented) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (isTypingTarget(event.target)) return;

    if (state && !questionPanel.hidden && !state.pending && /^[1-9]$/.test(event.key)) {
      var button = choices.querySelector('[data-choice="' + (Number(event.key) - 1) + '"]');
      if (button) {
        event.preventDefault();
        focusSafely(button);
        button.click();
      }
      return;
    }

    if (event.key === 'Enter') {
      var target = event.target;
      var tag = target && target.tagName;
      /* A focused button or link answers Enter by itself, so Enter is left
         to it — but an answered choice answers nothing, and keeps focus
         after a click. Without the exception below, answering with the
         mouse and then reaching for Enter did nothing at all. */
      var onChoice = !!(target && target.classList && target.classList.contains('trivia-choice'));
      if (!onChoice && (tag === 'BUTTON' || tag === 'A')) return;
      var move = shortcutTarget();
      if (move) {
        event.preventDefault();
        move.click();
      }
    }
  });

  updateIntro();
})();
