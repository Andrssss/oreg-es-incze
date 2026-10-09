// Asks for confirmation (in the site's own style) before the top phone bar starts a call.
(function () {
  var en = document.documentElement.lang === 'en';
  var t = en
    ? { title: 'Start a call', text: 'Do you want to call Öreg & Incze?', call: 'Call', cancel: 'Cancel' }
    : { title: 'Hívás indítása', text: 'Fel szeretné hívni az Öreg & Incze-t?', call: 'Hívás', cancel: 'Mégse' };
  var overlay = null;
  var lastFocus = null;

  function close() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    document.removeEventListener('keydown', onKey);
    if (lastFocus) lastFocus.focus();
  }

  function onKey(e) {
    if (e.key === 'Escape') close();
  }

  function open(href, number) {
    lastFocus = document.activeElement;
    overlay = document.createElement('div');
    overlay.className = 'call-overlay';
    overlay.innerHTML =
      '<div class="call-dialog" role="dialog" aria-modal="true" aria-labelledby="call-title">' +
      '<p class="call-title" id="call-title"></p>' +
      '<p class="call-text"></p>' +
      '<p class="call-number"></p>' +
      '<div class="call-actions">' +
      '<a class="call-yes"></a>' +
      '<button type="button" class="call-no"></button>' +
      '</div></div>';
    var q = function (s) { return overlay.querySelector(s); };
    q('.call-title').textContent = t.title;
    q('.call-text').textContent = t.text;
    q('.call-number').textContent = number;
    q('.call-yes').textContent = t.call;
    q('.call-yes').href = href;
    q('.call-no').textContent = t.cancel;
    q('.call-no').addEventListener('click', close);
    q('.call-yes').addEventListener('click', function () { setTimeout(close, 300); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(overlay);
    q('.call-yes').focus();
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest('a.topbar');
    if (!link) return;
    e.preventDefault();
    open(link.getAttribute('href'), link.textContent.trim());
  });
})();
