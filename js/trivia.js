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
  var quizName = app.getAttribute('data-quiz-name') || 'Trivia';
  var roundSize = 10;
  var roundCount = Math.ceil(questions.length / roundSize);

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
  var questionText = document.getElementById('trivia-question-text');
  var choices = document.getElementById('trivia-choices');
  var feedback = document.getElementById('trivia-feedback');
  var nextButton = document.getElementById('trivia-next');

  var roundKicker = document.getElementById('trivia-round-kicker');
  var roundTitle = document.getElementById('trivia-round-title');
  var roundScore = document.getElementById('trivia-round-score');
  var continueButton = document.getElementById('trivia-continue');

  var resultTitle = document.getElementById('trivia-result-title');
  var resultCopy = document.getElementById('trivia-result-copy');
  var playAgainButton = document.getElementById('trivia-play-again');
  var review = document.getElementById('trivia-review');
  var reviewList = document.getElementById('trivia-review-list');

  var state = null;

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

  function freshState() {
    return {
      version: 1,
      order: shuffle(questions.map(function (_, index) { return index; })),
      position: 0,
      score: 0,
      roundScores: Array(roundCount).fill(0),
      incorrect: [],
      pending: null,
      atBreak: false,
      complete: false
    };
  }

  function validState(candidate) {
    if (!candidate || candidate.version !== 1) return false;
    if (!Array.isArray(candidate.order) || candidate.order.length !== questions.length) return false;
    if (!Array.isArray(candidate.roundScores) || candidate.roundScores.length !== roundCount) return false;
    if (!Array.isArray(candidate.incorrect)) return false;
    if (typeof candidate.position !== 'number' || candidate.position < 0 || candidate.position > questions.length) return false;
    return candidate.order.every(function (value) {
      return Number.isInteger(value) && value >= 0 && value < questions.length;
    });
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

  function currentQuestion() {
    if (!state || state.position >= questions.length) return null;
    return questions[state.order[state.position]];
  }

  function setProgress(done) {
    var percent = Math.max(0, Math.min(100, (done / questions.length) * 100));
    progressBar.style.width = percent + '%';
  }

  function markChoice(button, mark) {
    var span = document.createElement('span');
    span.className = 'trivia-choice-mark';
    span.textContent = mark;
    button.appendChild(span);
  }

  function showAnswered(selectedIndex) {
    var q = currentQuestion();
    if (!q) return;
    var buttons = choices.querySelectorAll('.trivia-choice');

    buttons.forEach(function (button, index) {
      button.disabled = true;
      if (index === q.answer) {
        button.classList.add('is-correct');
        markChoice(button, index === selectedIndex ? 'Correct' : 'Answer');
      } else if (index === selectedIndex) {
        button.classList.add('is-selected-wrong');
        markChoice(button, 'Your answer');
      }
    });

    if (selectedIndex === q.answer) {
      feedback.textContent = 'Correct. ' + q.note;
    } else {
      feedback.textContent = 'Answer: ' + q.choices[q.answer] + '. ' + q.note;
    }

    var nextPosition = state.position + 1;
    if (nextPosition >= questions.length) {
      nextButton.textContent = 'See result';
    } else if (nextPosition % roundSize === 0) {
      nextButton.textContent = 'Finish round';
    } else {
      nextButton.textContent = 'Next';
    }
    nextButton.hidden = false;
  }

  function chooseAnswer(selectedIndex) {
    if (!state || state.pending) return;
    var q = currentQuestion();
    if (!q) return;

    var questionIndex = state.order[state.position];
    var roundIndex = Math.floor(state.position / roundSize);
    var correct = selectedIndex === q.answer;

    if (correct) {
      state.score += 1;
      state.roundScores[roundIndex] += 1;
    } else {
      state.incorrect.push({ questionIndex: questionIndex, selected: selectedIndex });
    }

    state.pending = { selected: selectedIndex };
    saveState();
    showAnswered(selectedIndex);
  }

  function renderQuestion() {
    showOnly(questionPanel);
    state.atBreak = false;

    var q = currentQuestion();
    if (!q) {
      renderResult();
      return;
    }

    var roundIndex = Math.floor(state.position / roundSize);
    roundLabel.textContent = 'Round ' + (roundIndex + 1) + ' of ' + roundCount;
    counter.textContent = 'Question ' + (state.position + 1) + ' of ' + questions.length;
    setProgress(state.position);
    questionText.textContent = q.question;
    choices.innerHTML = '';
    feedback.textContent = '';
    nextButton.hidden = true;

    q.choices.forEach(function (choice, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'trivia-choice';
      button.setAttribute('data-choice', String(index));

      var number = document.createElement('span');
      number.className = 'trivia-choice-number';
      number.textContent = String(index + 1);

      var label = document.createElement('span');
      label.className = 'trivia-choice-text';
      label.textContent = choice;

      button.appendChild(number);
      button.appendChild(label);
      button.addEventListener('click', function () { chooseAnswer(index); });
      choices.appendChild(button);
    });

    if (state.pending && Number.isInteger(state.pending.selected)) {
      showAnswered(state.pending.selected);
    }

    saveState();
  }

  function advance() {
    if (!state || !state.pending) return;
    state.pending = null;
    state.position += 1;

    if (state.position >= questions.length) {
      state.complete = true;
      state.atBreak = false;
      saveState();
      renderResult();
      return;
    }

    if (state.position % roundSize === 0) {
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
    var finishedRound = Math.max(1, Math.min(roundCount - 1, state.position / roundSize));
    var roundResult = state.roundScores[finishedRound - 1];

    roundKicker.textContent = 'Round ' + finishedRound + ' complete';
    roundTitle.textContent = roundResult + ' / ' + roundSize;
    roundScore.textContent = state.score + ' correct so far.';
    continueButton.textContent = 'Round ' + (finishedRound + 1);
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

    resultTitle.textContent = state.score + ' / ' + questions.length;
    resultCopy.textContent = 'You got ' + state.score + ' of ' + questions.length + ' right.';
    buildReview();
  }

  function beginNewGame() {
    clearState();
    state = freshState();
    saveState();
    renderQuestion();
  }

  function openFromIntro() {
    var stored = readState();
    if (!stored || stored.complete) {
      beginNewGame();
      return;
    }

    state = stored;
    if (state.atBreak) renderRoundBreak();
    else renderQuestion();
  }

  function updateIntro() {
    var stored = readState();
    if (!stored) return;

    if (stored.complete) {
      resumeCopy.hidden = false;
      resumeCopy.textContent = 'Last score: ' + stored.score + ' / ' + questions.length + '.';
      startButton.textContent = 'Play again';
      resetIntroButton.hidden = true;
      return;
    }

    state = stored;
    resumeCopy.hidden = false;
    if (stored.atBreak) {
      resumeCopy.textContent = 'You finished round ' + (stored.position / roundSize) + '.';
    } else {
      resumeCopy.textContent = 'Continue at question ' + (stored.position + 1) + ' of ' + questions.length + '.';
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

  document.addEventListener('keydown', function (event) {
    if (questionPanel.hidden || !state || state.pending) return;
    if (!/^[1-4]$/.test(event.key)) return;
    var index = Number(event.key) - 1;
    var button = choices.querySelector('[data-choice="' + index + '"]');
    if (button) {
      event.preventDefault();
      button.click();
    }
  });

  updateIntro();
})();
