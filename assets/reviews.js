// Google reviews carousel for the homepage (Places API (New), loaded live in the browser).
// Fill in PLACE_ID and API_KEY (a public key restricted to this site's HTTP referrers and to
// the Places API). While either is empty the whole section stays hidden.
(function () {
  var PLACE_ID = '';
  var API_KEY = '';

  var section = document.getElementById('velemenyek');
  if (!section || !PLACE_ID || !API_KEY) return;

  var track = document.getElementById('reviewsTrack');
  var prev = section.querySelector('.reviews-prev');
  var next = section.querySelector('.reviews-next');
  var write = document.getElementById('reviewsWrite');
  var cacheKey = 'oi_reviews_' + PLACE_ID;

  write.href = 'https://search.google.com/local/writereview?placeid=' + encodeURIComponent(PLACE_ID);

  function stars(n) {
    return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
  }

  function card(r) {
    var fig = document.createElement('figure');
    fig.className = 'review-card';

    var st = document.createElement('div');
    st.className = 'review-stars';
    st.setAttribute('role', 'img');
    st.setAttribute('aria-label', r.rating + ' / 5');
    st.textContent = stars(r.rating);

    var text = document.createElement('blockquote');
    text.className = 'review-text';
    text.textContent = r.text;

    var cap = document.createElement('figcaption');
    cap.className = 'review-author';
    var name = r.authorUri ? document.createElement('a') : document.createElement('span');
    name.className = 'review-name';
    name.textContent = r.author;
    if (r.authorUri) {
      name.href = r.authorUri;
      name.target = '_blank';
      name.rel = 'noopener noreferrer';
    }
    var src = document.createElement('span');
    src.className = 'review-source';
    src.textContent = 'Google';
    cap.append(name, src);

    fig.append(st, text, cap);
    return fig;
  }

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

  function render(reviews) {
    if (!reviews.length) return;
    track.replaceChildren.apply(track, reviews.map(card));
    section.hidden = false;
    prev.addEventListener('click', function () { step(-1); });
    next.addEventListener('click', function () { step(1); });
    track.addEventListener('scroll', updateNav, { passive: true });
    window.addEventListener('resize', updateNav);
    updateNav();
  }

  // Only reviews that have a written text are shown (star-only ratings are skipped).
  function parse(data) {
    return (data.reviews || [])
      .filter(function (r) { return r.text && r.text.text && r.text.text.trim(); })
      .map(function (r) {
        return {
          rating: Math.max(1, Math.min(5, Math.round(r.rating || 5))),
          text: r.text.text.trim(),
          author: (r.authorAttribution && r.authorAttribution.displayName) || 'Google',
          authorUri: r.authorAttribution && r.authorAttribution.uri
        };
      });
  }

  function load() {
    try {
      var cached = sessionStorage.getItem(cacheKey);
      if (cached) return render(JSON.parse(cached));
    } catch (e) {}
    var lang = document.documentElement.lang === 'en' ? 'en' : 'hu';
    fetch('https://places.googleapis.com/v1/places/' + encodeURIComponent(PLACE_ID) + '?languageCode=' + lang, {
      headers: { 'X-Goog-Api-Key': API_KEY, 'X-Goog-FieldMask': 'reviews' }
    })
      .then(function (res) { return res.ok ? res.json() : Promise.reject(res.status); })
      .then(function (data) {
        var list = parse(data);
        try { sessionStorage.setItem(cacheKey, JSON.stringify(list)); } catch (e) {}
        render(list);
      })
      .catch(function () { /* leave the section hidden */ });
  }

  // Fetch only when the visitor is close to the section, so a quick bounce costs no API call.
  var anchor = document.getElementById('arak') || section;
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); load(); }
    }, { rootMargin: '900px 0px' });
    io.observe(anchor);
  } else {
    load();
  }
})();
