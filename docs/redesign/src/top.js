(function () {
  // 配色案の切替（見本用）
  var looks = document.querySelectorAll('.looks button');
  function setLook(k) {
    if (['m', 'a', 'b', 'c'].indexOf(k) === -1) k = 'm';
    document.documentElement.setAttribute('data-look', k);
    looks.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.look === k)); });
  }
  looks.forEach(function (b) { b.addEventListener('click', function () { setLook(b.dataset.look); try { history.replaceState(null, '', '#' + b.dataset.look); } catch (e) {} }); });
  setLook('m');
  

  // スマホ・タブレット：メニューボタンで左メニューを引き出す
  var hb = document.querySelector('.hbtn');
  if (hb) {
    hb.setAttribute('aria-expanded', 'false');
    hb.addEventListener('click', function () {
      var open = !document.body.classList.contains('menu-open');
      document.body.classList.toggle('menu-open', open);
      hb.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function (e) {
      if (document.body.classList.contains('menu-open') && !e.target.closest('.side') && !e.target.closest('.hbtn')) { document.body.classList.remove('menu-open'); hb.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { document.body.classList.remove('menu-open'); hb.setAttribute('aria-expanded', 'false'); } });
  }

  // 見本でつないでいないリンクは動かさない
  document.addEventListener('click', function (e) {
    if (e.target.closest('a[data-inert]')) e.preventDefault();
  });

  // ページ内の移動（履歴に積まない）と、チップの現在地
  var chips = document.querySelectorAll('.chips a');
  document.querySelectorAll('.chips a, .cta, .side a[href^="#"]:not([data-inert])').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var el = document.getElementById(a.getAttribute('href').slice(1));
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      // 押したチップを現在地にして、移動が終わるまで固定する（短い節で隣のチップが点くのを防ぐ）
      if (a.parentNode && a.parentNode.parentNode && a.parentNode.parentNode.classList.contains('chips')) { lockUntil = Date.now() + 1200; setChip(a.getAttribute('href')); }
    });
  });
  var lockUntil = 0;
  function setChip(h) {
    chips.forEach(function (c) {
      var on = c.getAttribute('href') === h;
      c.classList.toggle('on', on);
      if (on) { var box = c.parentNode; box.scrollTo({ left: c.offsetLeft - (box.clientWidth - c.offsetWidth) / 2, behavior: 'smooth' }); }
    });
  }
  // ページの一番下では最後のチップを現在地にする
  addEventListener('scroll', function () {
    if (!chips.length || Date.now() < lockUntil) return;
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) setChip(chips[chips.length - 1].getAttribute('href'));
    else if (scrollY < 200) { chips.forEach(function (c) { c.classList.remove('on'); }); if (chips[0]) chips[0].parentNode.scrollTo({ left: 0 }); }
  }, { passive: true });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting || Date.now() < lockUntil) return;
        setChip('#' + en.target.id);
      });
    }, { rootMargin: '-25% 0px -65% 0px' });
    chips.forEach(function (c) { var el = document.getElementById(c.getAttribute('href').slice(1)); if (el) io.observe(el); });
  }

  // 開閉（レース・順位）
  function toggler(sel, boxSel) {
    document.querySelectorAll(sel).forEach(function (b) {
      b.addEventListener('click', function () {
        var open = b.getAttribute('aria-expanded') !== 'true';
        var box = boxSel ? b.previousElementSibling : b.parentNode;
        (boxSel ? box : b.parentNode).classList.toggle('open', open);
        b.setAttribute('aria-expanded', String(open));
        b.textContent = open ? b.dataset.close : b.dataset.open;
      });
    });
  }
  toggler('.rp-m', false);
  toggler('.rk-m', true);

  // スマホ：競馬場の切替は横送りの位置を動かすだけ（中身は隠さない）
  var rps = document.querySelector('.rps'), segs = document.querySelectorAll('.seg button');
  if (rps) segs.forEach(function (b) {
    b.addEventListener('click', function () {
      var p = rps.children[+b.dataset.seg];
      rps.scrollTo({ left: p.offsetLeft - rps.children[0].offsetLeft, behavior: 'smooth' });
    });
  });
  if (rps) rps.addEventListener('scroll', function () {
    var w = rps.children[0].offsetWidth + 12, i = Math.round(rps.scrollLeft / w);
    segs.forEach(function (b, k) { b.classList.toggle('on', k === i); });
  }, { passive: true });

  // スマホ：検索欄を開閉
  var sbtn = document.querySelector('.sbtn'), hdr = document.querySelector('.hdr');
  if (sbtn) sbtn.addEventListener('click', function () {
    var open = !hdr.classList.contains('searching');
    hdr.classList.toggle('searching', open);
    sbtn.setAttribute('aria-expanded', String(open));
    if (open) document.getElementById('q').focus();
  });

  // 五十音
  document.querySelectorAll('.kn').forEach(function (kn) {
    var btns = kn.querySelectorAll('.kn-g button'), panels = kn.querySelectorAll('.kn-p');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        // 選択中をもう一度押しても閉じない（板の中身が空にならないように）
        btns.forEach(function (x) { x.setAttribute('aria-expanded', 'false'); });
        panels.forEach(function (p) { p.hidden = true; });
        b.setAttribute('aria-expanded', 'true');
        var pn = kn.querySelector('[data-p="' + b.dataset.i + '"]'); pn.hidden = false; pn.scrollTop = 0;
      });
    });
  });

  // 動き：画面に入ったら1回だけ（棒が伸びる・勝利数が数え上がる・カードが順に浮く）
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('js-anim');
    document.querySelectorAll('.rk li, .ai .ac').forEach(function (el) {
      el.style.setProperty('--i', Array.prototype.indexOf.call(el.parentNode.children, el));
    });
    var seen = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        seen.unobserve(en.target);
        en.target.classList.add('in');
        en.target.querySelectorAll('.rk-w b').forEach(function (b, k) {
          var to = parseInt(b.textContent, 10), t0 = performance.now() + k * 45;
          b.textContent = '0';
          (function tick(now) {
            var p = Math.min(1, Math.max(0, (now - t0) / 650)), e = 1 - Math.pow(1 - p, 3);
            b.textContent = String(Math.round(to * e));
            if (p < 1) requestAnimationFrame(tick);
          })(performance.now());
        });
      });
    }, { threshold: 0.2 });
    document.querySelectorAll('.rk, .ai').forEach(function (el) { seen.observe(el); });
  }

  // スマホ：名前が多い行は先頭12件までにして、ボタンで全部開く
  document.querySelectorAll('.kn-p').forEach(function (p) {
    var n = p.children.length;
    if (n <= 12) return;
    var m = document.createElement('button');
    m.type = 'button'; m.className = 'kn-more'; m.setAttribute('aria-expanded', 'false');
    m.textContent = 'すべて表示（' + n + '件）';
    m.addEventListener('click', function () {
      var open = !p.classList.contains('all');
      p.classList.toggle('all', open);
      m.setAttribute('aria-expanded', String(open));
      m.textContent = open ? '12件までにする' : 'すべて表示（' + n + '件）';
    });
    p.appendChild(m);
  });

  // 検索：名前と読みで絞り込む
  var INDEX = __INDEX__;
  var q = document.getElementById('q'), list = document.getElementById('q-list');
  if (q) q.addEventListener('input', function () {
    var v = q.value.trim();
    var ws = v.split(/\s+/);
    var hit = v ? INDEX.filter(function (x) { return ws.every(function (w) { return x[0].indexOf(w) !== -1 || (x[2] && x[2].indexOf(w) !== -1); }); }).slice(0, 8) : [];
    list.innerHTML = '';
    if (v && !hit.length) { var n = document.createElement('li'); n.textContent = '見つかりませんでした'; list.appendChild(n); }
    hit.forEach(function (x) {
      var li = document.createElement('li');
      li.textContent = x[0];
      var s = document.createElement('small'); s.textContent = x[1]; li.appendChild(s);
      list.appendChild(li);
    });
    list.hidden = !v;
  });
  if (q) document.addEventListener('click', function (e) { if (!e.target.closest('.search')) list.hidden = true; });
})();
