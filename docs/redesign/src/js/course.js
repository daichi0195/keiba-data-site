// コース詳細：メーター・横棒の動き、表の開閉、1列目の縮み、右へ送れる合図、見出し行の固定
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
  var root = document.documentElement, hdr = document.querySelector('.hdr'), chips = document.querySelector('.chips');

  // チップの帯の高さ（幅によって1行／2行）を、見出しへ移動したときの止まる位置に反映する
  function bandH() { if (chips) root.style.setProperty('--chips-h', chips.offsetHeight + 'px'); }
  bandH();

  // 動き：画面に入ったら1回だけ。数値は最終値の85%から短く数え上げる（途中にもっともらしい別の数字を見せない）
  function countUp(el, k) {
    var to = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0, suf = el.dataset.suf || '';
    var fmt = function (v) { return (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('ja-JP')) + suf; };
    var from = to * 0.85, t0 = performance.now() + 250 + k * 60;
    el.textContent = fmt(from);
    (function tick(now) {
      var p = Math.min(1, Math.max(0, (now - t0) / 450)), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(tick);
    })(performance.now());
  }
  if ('IntersectionObserver' in window && !reduce) {
    root.classList.add('c-anim');
    var seen = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        seen.unobserve(en.target);
        en.target.classList.add('in');
        each(en.target.querySelectorAll('[data-count]'), countUp);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    each(document.querySelectorAll('.an'), function (el) { seen.observe(el); });
  }

  // 表：横に送ったら1列目の長い名前を先頭3文字分に縮める。右にまだ続きがあるあいだは右端に影を出す
  function edge(tb) {
    tb.classList.toggle('narrow', tb.scrollLeft > 8);
    tb.parentNode.classList.toggle('more', tb.scrollLeft + tb.clientWidth < tb.scrollWidth - 4);
  }
  var tbs = document.querySelectorAll('.tb');
  each(tbs, function (tb) { tb.addEventListener('scroll', function () { edge(tb); }, { passive: true }); edge(tb); });

  // 表の見出し行：表が画面の上へ流れても、ヘッダーとチップの下に留める
  var heads = [];
  each(document.querySelectorAll('.st'), function (t) { heads.push({ t: t, h: t.tHead, ty: 0 }); });
  var ticking = false;
  function stick() {
    ticking = false;
    var top = (hdr ? hdr.offsetHeight : 0) + (chips && getComputedStyle(chips).position === 'sticky' ? chips.offsetHeight : 0);
    heads.forEach(function (x) {
      var ty = 0;
      // スマホ・タブレットでは留めない（PCだけ）。隠れている行は高さ0なので、高さのある最後の行で止める位置を決める
      if (innerWidth >= 1100 && x.t.offsetParent) {
        var r = x.t.getBoundingClientRect(), hh = x.h.offsetHeight, last = 0;
        for (var i = x.t.rows.length - 1; i > 0 && !last; i--) last = x.t.rows[i].offsetHeight;
        if (r.top < top && r.bottom > top) ty = Math.min(top - r.top, r.height - hh - last);
      }
      ty = Math.max(0, Math.round(ty));
      if (ty !== x.ty) { x.ty = ty; x.h.style.setProperty('--ty', ty + 'px'); }
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(stick); } }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', function () { bandH(); each(tbs, edge); onScroll(); });

  // 条件別（スマホ・900px未満）：全13項目の表を開閉
  each(document.querySelectorAll('.cd-m'), function (m) {
    m.addEventListener('click', function () {
      var cd = m.closest('.cd'), open = !cd.classList.contains('open');
      cd.classList.toggle('open', open);
      m.setAttribute('aria-expanded', String(open));
      m.textContent = open ? m.dataset.close : m.dataset.open;
      each(cd.querySelectorAll('.tb'), edge);
    });
  });

  // ランキング：10件 ⇔ 全件（最大50件）
  each(document.querySelectorAll('.rkt-m'), function (b) {
    b.addEventListener('click', function () {
      var box = b.closest('.rkt'), open = !box.classList.contains('open');
      box.classList.toggle('open', open);
      b.setAttribute('aria-expanded', String(open));
      b.textContent = open ? b.dataset.close : b.dataset.open;
      // 閉じたときに表の先頭が画面の上へ出ていたら、見出しまで戻す
      if (!open && box.getBoundingClientRect().top < 120) box.closest('.sc').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      onScroll();
    });
  });
})();
