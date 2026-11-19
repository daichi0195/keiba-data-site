// 固定ページ：目次（ページ内の移動と、読んでいる節の表示）
(function () {
  var st = document.querySelector('.st');
  if (!st) return;
  var links = st.querySelectorAll('.st-toc a, .st-toc-m a');
  if (!links.length) return;
  var pc = st.querySelectorAll('.st-toc a');
  var secs = Array.prototype.map.call(pc, function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 目次で押した節。着くまでと、着いた位置から動くまで（下へ8px超、または節の頭が判定線より下に出るまで）現在地に固定する
  var pin = null;
  var hdrH = function () { return (document.querySelector('.hdr') || { offsetHeight: 56 }).offsetHeight; };
  var maxY = function () { return document.documentElement.scrollHeight - innerHeight; };

  function set(i) {
    pc.forEach(function (a, k) {
      var on = k === i;
      if (a.classList.contains('on') === on) return;
      a.classList.toggle('on', on);
      if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
  }
  // 判定線：ふだんは画面の上から3割。ページの終わりが近づくと画面の下端へ向けて下げ、
  // 終わりの短い節も順に現在地になるようにする（一番下では、最後の節）
  function lineY() {
    var base = Math.max(hdrH() + 48, innerHeight * 0.3), span = innerHeight - base, left = maxY() - scrollY;
    return left >= span ? base : base + (span - Math.max(0, left));
  }
  function spy() {
    var line = lineY(), cur = 0;
    for (var i = 0; i < secs.length; i++) if (secs[i].getBoundingClientRect().top <= line) cur = i;
    if (pin) {
      if (!pin.arrived && (Math.abs(scrollY - pin.y) <= 2 || Date.now() > pin.until)) { pin.arrived = true; pin.y = scrollY; }
      if (!pin.arrived) cur = pin.i;
      else if (scrollY - pin.y > 8 || secs[pin.i].getBoundingClientRect().top > line) pin = null;
      else cur = pin.i;
    }
    set(cur);
  }
  links.forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1), el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      var i = secs.indexOf(el);
      if (i >= 0) {
        // 着く位置（節の頭 − scroll-margin-top。ページの終わりより先へは行かない）
        var y = Math.min(maxY(), Math.max(0, Math.round(el.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(el).scrollMarginTop) || 0))));
        pin = { i: i, y: y, arrived: false, until: Date.now() + 2500 };
        set(i);
        setTimeout(spy, 2600);
      }
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      try { history.replaceState(null, '', '#' + id); } catch (err) {}
    });
  });
  // スマホ・タブレット：節の末尾の「目次へ」。目次を開いて、そこまで戻る。短い節（画面の半分未満）には出さない
  var tocM = document.getElementById('st-toc-m');
  function backs() {
    st.querySelectorAll('.st-back').forEach(function (p) {
      p.hidden = false;
      p.hidden = p.parentNode.getBoundingClientRect().height < innerHeight / 2;
    });
  }
  st.querySelectorAll('.st-back a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      if (!tocM) return;
      tocM.open = true;
      tocM.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  });
  backs();
  var tick = false;
  addEventListener('scroll', function () {
    if (tick) return; tick = true;
    requestAnimationFrame(function () { tick = false; spy(); });
  }, { passive: true });
  addEventListener('resize', function () { backs(); spy(); });
  spy();
})();
