(function () {
  'use strict';
  if (!('IntersectionObserver' in window)) return;

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('line-drawn');
        obs.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('section:not(:first-of-type), .essay-section-divider').forEach(function (el) {
    obs.observe(el);
  });
})();
