(function () {
  var ESSAYS = [
    { href: 'best-ideas.html', title: 'The Best Ideas Come When You Let Go', subtitle: 'Default Mode Network and the art of not thinking', image: 'https://miro.medium.com/v2/resize:fit:600/1*UjDYBeUBBvmImB5JFvYC0A.jpeg' },
    { href: 'empathy-paradox.html', title: 'The Empathy Paradox', subtitle: 'Outside every story but our own', image: 'https://miro.medium.com/v2/resize:fit:600/1*pN4_9fIbWOr7dNg27qdGqA.png' },
    { href: 'love-or-fear.html', title: 'It Is Either from Love or Fear', subtitle: 'Fear wears love\u2019s face \u2014 and speaks its language', image: 'https://miro.medium.com/v2/resize:fit:600/1*1e3whgMVRxzw13ve5wK1MA.png' },
    { href: 'unfinished-things.html', title: 'Why Do Unfinished Things Haunt Us?', subtitle: 'The Zeigarnik\u2013Lacan trap we all fall into', image: 'https://miro.medium.com/v2/resize:fit:600/1*jfEURVCn1DDTIIiU7S_fFg.png' },
    { href: 'jung-shadow.html', title: 'Jung\u2019s Golden Shadow', subtitle: 'Why we envy the things we forbid ourselves the most', image: 'https://miro.medium.com/v2/resize:fit:600/1*xGR4JAqJxcwp-NNSDaadyw.png' },
    { href: 'defense-mechanisms.html', title: 'Our Defense Mechanisms: Protectors or Dungeon Masters?', subtitle: 'Have we handed over the keys to our own prisons?', image: 'https://miro.medium.com/v2/resize:fit:600/1*vJenz3RNAUcWpK9zgnv9iA.png' },
    { href: 'ai-enough.html', title: 'Will AI Be Enough for Us?', subtitle: 'A reflection on AI\u2019s promise and the warmth it can\u2019t replicate', image: 'https://miro.medium.com/v2/resize:fit:600/1*xktOKOEkb01NorbJNzs4yA.png' },
    { href: 'say-hello.html', title: 'Why Do We Say Hello?', subtitle: 'Transactional Analysis and the hidden games in our relationships', image: 'https://miro.medium.com/v2/resize:fit:600/1*_TffjC5cdVkKJoadRfi3tQ.png' },
    { href: 'on-lying.html', title: 'On Lying', subtitle: 'Not being caught carries its own sentence.', image: 'https://miro.medium.com/v2/resize:fit:600/1*IqjZ2v3VkF7FE6Ax3briCA.png' },
    { href: 'on-perceiving.html', title: 'On Perceiving', subtitle: 'Misperception is a corridor whose architect burned the blueprint.', image: 'https://miro.medium.com/v2/resize:fit:600/1*yOa_B48M5L0j4xm7w8wnKQ.png' },
    { href: 'on-looking.html', title: 'On Looking', subtitle: 'A room full of directors and no audience.', image: 'https://miro.medium.com/v2/resize:fit:600/1*g2FLjY3V9utA09Yp_CaQYQ.png' },
    { href: 'on-forgiveness.html', title: 'On Forgiveness', subtitle: 'Cruelty made architectural.', image: 'https://miro.medium.com/v2/resize:fit:600/1*7rEEeB6sH4VS-tePMsb4_w.png' },
    { href: 'on-beauty.html', title: 'On Beauty', subtitle: 'The corridor narrows in adversity.', image: '../images/on-beauty.png' },
    { href: 'on-longing.html', title: 'On Longing', subtitle: 'Lighter. Smaller. Younger.', image: '../images/on-longing.png' },
    { href: 'on-silence.html', title: 'On Silence', subtitle: 'I forgot I had a cat.', image: '../images/on-silence.jpg' }
  ];

  function getCurrentFilename() {
    var parts = window.location.pathname.split('/');
    return parts[parts.length - 1] || '';
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function render() {
    var container = document.getElementById('more-essays-container');
    if (!container) return;
    var current = getCurrentFilename();
    var pool = ESSAYS.filter(function (e) { return e.href !== current; });
    var picks = shuffle(pool).slice(0, 4);
    var html = '<div class="more-essays"><p class="more-essays-title">More essays</p><div class="more-essays-grid">';
    for (var i = 0; i < picks.length; i++) {
      var e = picks[i];
      html += '<a href="' + e.href + '" class="more-essay-card">'
        + '<img src="' + e.image + '" alt="' + e.title.replace(/"/g, '&quot;') + '" loading="lazy">'
        + '<div class="more-essay-card-body">'
        + '<div class="more-essay-card-title">' + e.title + '</div>'
        + '<div class="more-essay-card-subtitle">' + e.subtitle + '</div>'
        + '</div></a>';
    }
    html += '</div></div>';
    container.innerHTML = html;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
