# Trivia

Notes on how to build and change Trivia, for the sessions that work on it.
The rules a reader could read, with their reasons, are in `COLOPHON.md`; a
note here marked "(rule in `COLOPHON.md`)" carries out a rule written
there.

- Adding a quiz requires three files, as described in `_data/trivia.yml`.

- **Answer illustrations can follow the current work.** On 9 October 2026,
  students playing British Culture asked for pictures to help them understand
  the explanations. After the ongoing projects are finished, try small
  thumbnails beside revealed correct answers, beginning with British Culture.
  A thumbnail may open a larger view. Show it after answering so it does not
  give away the answer. Choose images only where they explain the subject;
  every question does not need one. Verify image identity, source and reuse
  permission. This is a future task, not part of the current Space expansion.

- **A question can name a word** (rule in `COLOPHON.md`). `"word": "<slug>"`
  in the bank adds the line under the answered note (`#trivia-word`,
  `js/trivia.js`). Following it puts `#question` in the quiz's address, and
  a quiz opened with `#question` and a game in progress goes straight back
  to that question with its note. `scripts/test-content.cjs` fails on a
  word with no story in `_words/`.
