
/* 騎手詳細（種牡馬詳細・調教師詳細も読み込む）：開閉・表の横スクロール・見出しへ移動したときの止まる位置・動き（1回だけ） */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
  var root = document.documentElement, hdr = document.querySelector('.hdr'), nav = document.querySelector('.jk-nav');
  var topH = function () { return (hdr ? hdr.offsetHeight : 0) + (nav && getComputedStyle(nav).position === 'sticky' ? nav.offsetHeight : 0); };

  // PCのナビ：20個が1行に入る幅なら1行、入らなければ10個ずつ2行（CSS の既定）
  function navRows() {
    var row = nav && nav.querySelector('div'); if (!row) return;
    row.classList.remove('one');
    if (getComputedStyle(row).display !== 'grid') return;
    var cs = getComputedStyle(row), w = 0, n = row.children.length;
    each(row.children, function (c) { w += c.offsetWidth; });
    w += (n - 1) * (parseFloat(cs.columnGap) || 0);
    row.classList.toggle('one', w <= row.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
  }
  navRows();

  // チップで飛んだとき・表を閉じたとき：見出しが「ヘッダー＋ナビ＋12px」の位置に来るよう、節の上の余白を引いて止める位置を決める
  function margin() {
    var sc = document.querySelector('.sc');
    var pt = sc ? parseFloat(getComputedStyle(sc).paddingTop) || 0 : 0;
    root.style.setProperty('--jk-sm', Math.round(topH() + 12 - pt) + 'px');
  }
  margin();

  // 表：横に送ったら名前の列を先頭3文字分に縮める（現行仕様）。右にまだ続きがあるあいだは右端に影を出す
  function edge(w) {
    w.classList.toggle('sx', w.scrollLeft > 8);
    w.parentNode.classList.toggle('more', w.clientWidth > 0 && w.scrollLeft + w.clientWidth < w.scrollWidth - 4);
  }
  var tws = document.querySelectorAll('.jk-tw');
  each(tws, function (w) { w.addEventListener('scroll', function () { edge(w); }, { passive: true }); edge(w); });

  // 表の見出し行：表が画面の上へ流れても、ヘッダーとナビの下に留める（コース詳細と同じ）
  var heads = [];
  each(document.querySelectorAll('.jk-t'), function (t) { if (t.tHead) heads.push({ t: t, h: t.tHead, ty: 0 }); });
  var ticking = false;
  function stick() {
    ticking = false;
    var top = topH();
    heads.forEach(function (x) {
      if (!x.t.offsetParent) return;
      var r = x.t.getBoundingClientRect(), hh = x.h.offsetHeight, last = x.t.rows[x.t.rows.length - 1].offsetHeight || 40;
      var ty = r.top < top && r.bottom > top ? Math.min(top - r.top, r.height - hh - last) : 0;
      ty = Math.max(0, Math.round(ty));
      if (ty !== x.ty) { x.ty = ty; x.h.style.setProperty('--ty', ty + 'px'); }
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(stick); } }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', function () { navRows(); margin(); each(tws, edge); onScroll(); });

  // 開閉（「さらに表示」「全項目を見る」）。ボタンに近い data-box にクラスを付け外しする
  each(document.querySelectorAll('[data-tg]'), function (b) {
    b.addEventListener('click', function () {
      var box = b.closest('[data-box]'), open = b.getAttribute('aria-expanded') !== 'true';
      // 横に並ぶ板（得意・苦手）は一緒に開閉する
      var sync = box.closest('[data-sync]');
      var boxes = sync ? sync.querySelectorAll('[data-box]') : [box];
      each(boxes, function (x) {
        x.classList.toggle(b.dataset.tg, open);
        var t = x.querySelector('[data-tg="' + b.dataset.tg + '"]');
        if (t) { t.setAttribute('aria-expanded', String(open)); t.textContent = open ? t.dataset.close : t.dataset.open; }
        each(x.querySelectorAll('.jk-tw'), edge);
      });
      // 閉じたときに板の上端がヘッダーとナビの下に隠れていたら、節の見出しまで戻す
      var pn = box.closest('.jk-pn') || box;
      if (!open && pn.getBoundingClientRect().top < topH() + 8) (box.closest('.sc') || pn).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      onScroll();
    });
  });
  // 競馬場ごとの開閉：開いた中の表にも右端の合図を付ける
  each(document.querySelectorAll('.jk-acc details'), function (d) {
    d.addEventListener('toggle', function () { each(d.querySelectorAll('.jk-tw'), edge); onScroll(); });
  });

  // 動き：棒が伸びる・線が引かれる・つまみが滑る。数値は最終値の85%から短く数え上げる（途中にもっともらしい別の数字を見せない）
  var count = function (rootEl) {
    each(rootEl.querySelectorAll('[data-count]'), function (el, k) {
      var to = parseFloat(el.dataset.count), dp = +el.dataset.dp || 0, from = to * 0.85, t0 = performance.now() + 200 + k * 60;
      var show = function (v) { el.textContent = dp ? v.toFixed(dp) : Math.round(v).toLocaleString('ja-JP'); };
      show(from);
      (function tick(now) {
        var p = Math.min(1, Math.max(0, (now - t0) / 450)), e = 1 - Math.pow(1 - p, 3);
        if (p < 1) { show(from + (to - from) * e); requestAnimationFrame(tick); } else show(to);
      })(performance.now());
    });
  };
  if (root.classList.contains('js-anim')) {
    var seen = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        seen.unobserve(en.target);
        en.target.classList.add('in');
        count(en.target);
        each(en.target.querySelectorAll('.jk-tw'), edge);
      });
    }, { threshold: 0.15 });
    each(document.querySelectorAll('[data-anim]'), function (el) { seen.observe(el); });
  }
})();
