// Paging for the homepage reviews row: arrows scroll one card at a time (touch users can swipe).
(function () {
  var section = document.getElementById('velemenyek');
  if (!section) return;

  var track = document.getElementById('reviewsTrack');
  var prev = section.querySelector('.reviews-prev');
  var next = section.querySelector('.reviews-next');
  if (!track || !prev || !next || !track.firstElementChild) return;

  function updateNav() {
    var max = track.scrollWidth - track.clientWidth - 2;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max;
    prev.hidden = next.hidden = max <= 0;
  }

  function step(dir) {
    var first = track.firstElementChild;
    var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({ left: dir * (first.getBoundingClientRect().width + gap), behavior: 'smooth' });
  }

  prev.addEventListener('click', function () { step(-1); });
  next.addEventListener('click', function () { step(1); });
  track.addEventListener('scroll', updateNav, { passive: true });
  window.addEventListener('resize', updateNav);
  updateNav();
})();
