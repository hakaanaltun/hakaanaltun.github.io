(() => {
  /* The way back names the place the journey was opened from. The House
     opens it with from=house or from=balcony; a word page opens it with
     from=word and its own address in back= (_includes/word-story.html), so
     the way back returns to that word. An address on another site is never
     followed. */
  const params = new URLSearchParams(location.search);
  const from = params.get('from');
  const back = document.getElementById('journeyReturn');
  if (!back) return;
  if (from === 'balcony' || from === 'house') {
    const room = from === 'balcony' ? 'balcony' : 'study';
    back.href = '/house/#' + room;
    back.textContent = '← the ' + room;
    return;
  }
  const address = params.get('back');
  if (from === 'word' && address && address.charAt(0) === '/') {
    try {
      const url = new URL(address, location.origin);
      if (url.origin !== location.origin || url.pathname.indexOf('/word/') !== 0) return;
      back.href = url.pathname + url.search + url.hash;
      back.textContent = '← the word';
      back.setAttribute('aria-label', 'Back to the word');
    } catch (error) {
      /* The usual way back to Pictures with Stories stays. */
    }
  }
})();
