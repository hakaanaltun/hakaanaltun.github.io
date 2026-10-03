(function () {
  'use strict';

  var root = document.getElementById('home-daily-trivia');
  if (!root || !window.fetch) return;

  var fallback = document.getElementById('home-daily-trivia-fallback');
  var game = document.getElementById('home-daily-trivia-game');
  var quizLabel = document.getElementById('home-daily-trivia-quiz');
  var questionText = document.getElementById('home-daily-trivia-question');
  var choices = document.getElementById('home-daily-trivia-choices');
  var feedback = document.getElementById('home-daily-trivia-feedback');
  var more = document.getElementById('home-daily-trivia-more');
  var source = root.getAttribute('data-source');

  function pad(value) {
    return value < 10 ? '0' + value : String(value);
  }

  function dayKey(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  function previousDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
  }

  function hash(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function grouped(questions) {
    var groups = {};
    questions.forEach(function (q) {
      if (!q || !q.slug || !q.question || !Array.isArray(q.choices)) return;
      if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.choices.length) return;
      if (!groups[q.slug]) groups[q.slug] = [];
      groups[q.slug].push(q);
    });
    return groups;
  }

  function pick(groups, date) {
    var keys = Object.keys(groups).sort();
    if (!keys.length) return null;

    var today = dayKey(date);
    var quizKey = keys[hash(today + '|quiz') % keys.length];
    var bank = groups[quizKey];
    if (!bank || !bank.length) return null;

    var index = hash(today + '|' + quizKey + '|question') % bank.length;

    var yesterday = previousDay(date);
    var yesterdayKey = dayKey(yesterday);
    var yesterdayQuiz = keys[hash(yesterdayKey + '|quiz') % keys.length];
    if (yesterdayQuiz === quizKey && bank.length > 1) {
      var yesterdayIndex = hash(yesterdayKey + '|' + quizKey + '|question') % bank.length;
      if (yesterdayIndex === index) index = (index + 1) % bank.length;
    }

    return bank[index];
  }

  function arrangedIndices(q, date) {
    var key = dayKey(date) + '|' + q.slug + '|' + q.id + '|choice';
    return q.choices.map(function (_, index) {
      return { index: index, rank: hash(key + '|' + index) };
    }).sort(function (a, b) {
      return a.rank - b.rank;
    }).map(function (item) {
      return item.index;
    });
  }

  function mark(button, text) {
    var span = document.createElement('span');
    span.className = 'home-daily-trivia-mark';
    span.textContent = text;
    button.appendChild(span);
  }

  function render(q, date) {
    var arrangement = arrangedIndices(q, date);
    var answered = false;

    quizLabel.textContent = q.quiz;
    questionText.textContent = q.question;
    choices.innerHTML = '';
    feedback.textContent = '';
    more.hidden = true;

    arrangement.forEach(function (original) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'home-daily-trivia-choice';
      button.setAttribute('data-original', String(original));

      var label = document.createElement('span');
      label.textContent = q.choices[original];
      button.appendChild(label);

      button.addEventListener('click', function () {
        if (answered) return;
        answered = true;

        choices.querySelectorAll('.home-daily-trivia-choice').forEach(function (choice) {
          var choiceIndex = Number(choice.getAttribute('data-original'));
          choice.setAttribute('aria-disabled', 'true');

          if (choiceIndex === q.answer) {
            choice.classList.add('is-correct');
            mark(choice, choiceIndex === original ? 'Correct' : 'Answer');
          } else if (choiceIndex === original) {
            choice.classList.add('is-selected-wrong');
            mark(choice, 'Your answer');
          }
        });

        feedback.textContent = original === q.answer
          ? 'Correct. ' + q.note
          : 'Answer: ' + q.choices[q.answer] + '. ' + q.note;

        more.href = q.url || '/trivia/';
        more.textContent = 'More ' + q.quiz + ' →';
        more.hidden = false;
      });

      choices.appendChild(button);
    });

    fallback.hidden = true;
    game.hidden = false;
  }

  fetch(source, { credentials: 'same-origin' })
    .then(function (response) {
      if (!response.ok) throw new Error('Question data unavailable');
      return response.json();
    })
    .then(function (questions) {
      if (!Array.isArray(questions) || !questions.length) return;
      var groups = grouped(questions);
      var now = new Date();
      var question = pick(groups, now);
      if (question) render(question, now);
    })
    .catch(function () {
      /* The fallback copy remains in place. */
    });
})();
