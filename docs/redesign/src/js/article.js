// コラム記事：目次（開く・移動・現在地）と、グラフ・表の動き（画面に入ったら1回だけ）
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 本文の中の目次：「すべて表示」で残りを開く（開いたらボタンは消える。現行と同じ）
  document.querySelectorAll('.toc').forEach(function (toc) {
    var m = toc.querySelector('.toc-m');
    if (m) m.addEventListener('click', function () { toc.classList.add('open'); m.setAttribute('aria-expanded', 'true'); });
  });

  // 目次から見出しへ（履歴に積まない）
  document.querySelectorAll('.toc a, .ts a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var el = document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  });

  // 右の目次：いま読んでいる見出しを現在地にする
  var links = Array.prototype.slice.call(document.querySelectorAll('.ts a'));
  var heads = links.map(function (a) { return document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))); });
  var box = document.querySelector('.ts-in'), cur = -1, tick = false;
  function mark() {
    tick = false;
    var k = 0;
    heads.forEach(function (h, i) { if (h && h.getBoundingClientRect().top < 140) k = i; });
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) { /* 最下部でも最後に読んだ見出しのまま */ }
    if (k === cur) return;
    cur = k;
    links.forEach(function (a, i) { a.classList.toggle('on', i === k); if (i === k) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
    var a = links[k];
    if (box && a && box.scrollHeight > box.clientHeight) box.scrollTo({ top: a.offsetTop - box.clientHeight / 2 });
  }
  if (links.length) { addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(mark); } }, { passive: true }); mark(); }

  // グラフ・表：画面に入ったら棒が伸び、数値が数え上がる
  var figs = document.querySelectorAll('.ch, .tb');
  if (!('IntersectionObserver' in window) || reduce) { figs.forEach(function (f) { f.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      en.target.classList.add('in');
      en.target.querySelectorAll('.ch-b span[data-to] b').forEach(function (b) {
        var to = parseFloat(b.parentNode.dataset.to), t0 = performance.now() + 150;
        (function step(now) {
          var p = Math.min(1, Math.max(0, (now - t0) / 700)), e = 1 - Math.pow(1 - p, 3);
          b.textContent = (to * e).toFixed(1);
          if (p < 1) requestAnimationFrame(step); else b.textContent = b.parentNode.dataset.to;
        })(performance.now());
      });
    });
  }, { threshold: 0.3 });
  figs.forEach(function (f) { io.observe(f); });
})();
