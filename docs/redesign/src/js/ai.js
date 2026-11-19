/* AI予測の3ページ共通：棒と数え上げ（画面に入ったら1回だけ）、ページ内チップの現在地、予測一覧の絞り込みとページ送り、
   同じ日のレースの横送り、見本用の状態切替 */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function center(box, el, smooth) { box.scrollTo({ left: el.offsetLeft - box.offsetLeft - (box.clientWidth - el.offsetWidth) / 2, behavior: smooth && !reduce ? 'smooth' : 'auto' }); }

  // 数え上げ：data-to（終点）、data-dp（小数の桁）
  function count(b, delay) {
    var to = parseFloat(b.dataset.to), dp = +(b.dataset.dp || 0), t0 = performance.now() + delay;
    var fmt = function (v) { return dp ? v.toFixed(dp) : Math.round(v).toLocaleString('ja-JP'); };
    b.textContent = fmt(0);
    (function tick(now) {
      var p = Math.min(1, Math.max(0, (now - t0) / 650)), e = 1 - Math.pow(1 - p, 3);
      b.textContent = fmt(to * e);
      if (p < 1) requestAnimationFrame(tick); else b.textContent = fmt(to);
    })(performance.now());
  }
  if ('IntersectionObserver' in window && !reduce) {
    var seen = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        seen.unobserve(en.target);
        en.target.classList.add('in');
        en.target.querySelectorAll('[data-to]').forEach(function (b, k) { count(b, k * 30); });
      });
    }, { threshold: 0.05 });
    document.querySelectorAll('.p-tb, .p-facts, .p-mc').forEach(function (el) { seen.observe(el); });
  }

  // ページ内チップ：押したチップを現在地にする。
  // 共通の top.js は「画面に入った見出し」と「最下部なら最後のチップ」で現在地を決めるので、
  // 短いページでは押したチップと選択中がずれる。押した直後は押したチップに固定し、
  // 横に並ぶ見出し（このAIについて／予測モデルについて）は左を優先する
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chips a'));
  if (chips.length && 'MutationObserver' in window) {
    var locked = null, timer = 0, fixing = false;
    function set(a) { fixing = true; chips.forEach(function (c) { c.classList.toggle('on', c === a); }); fixing = false; }
    function target(a) { return document.getElementById(a.getAttribute('href').slice(1)); }
    chips.forEach(function (a) {
      a.addEventListener('click', function () {
        locked = a; set(a);
        clearTimeout(timer);
        // 送りが止まるまで固定し、そのあと利用者が自分で動かしたら外す
        timer = setTimeout(function () { addEventListener('wheel', unlock, { once: true, passive: true }); addEventListener('touchmove', unlock, { once: true, passive: true }); addEventListener('keydown', unlock, { once: true }); }, 900);
      });
    });
    function unlock() { locked = null; }
    new MutationObserver(function () {
      if (fixing) return;
      var on = chips.filter(function (c) { return c.classList.contains('on'); })[0];
      if (locked) { if (on !== locked) set(locked); return; }
      if (!on) return;
      var i = chips.indexOf(on), prev = chips[i - 1];
      if (prev && target(prev) && target(on) && Math.abs(target(prev).getBoundingClientRect().top - target(on).getBoundingClientRect().top) < 2 && innerHeight + scrollY < document.documentElement.scrollHeight - 4) set(prev);
    }).observe(chips[0].parentNode, { attributes: true, attributeFilter: ['class'], subtree: true });
  }

  // 同じ日のレース：選択中のレース番号を中央へ
  var rs = document.querySelector('.p-rs-r');
  if (rs && rs.querySelector('.on')) {
    var on = rs.querySelector('.on');
    // はみ出していなければ送らない。送るときは中央へ寄せたうえで、左端がチップの途中で切れない位置にそろえる
    if (on.offsetLeft - rs.offsetLeft + on.offsetWidth > rs.clientWidth) {
      center(rs, on, false);
      var kids = Array.prototype.slice.call(rs.children), x = rs.scrollLeft, snap = 0;
      kids.forEach(function (k) { var l = k.offsetLeft - rs.offsetLeft; if (l <= x + 1) snap = l; });
      if (rs.scrollLeft < rs.scrollWidth - rs.clientWidth - 1) rs.scrollLeft = snap;
    }
  }

  // 見本用：予測の表の状態（表示／準備中／広告ブロッカー検知）
  var pred = document.querySelector('.p-pred'), demo = document.querySelector('.p-demo');
  if (pred && demo) demo.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var s = b.dataset.gate;
    pred.dataset.state = s; pred.setAttribute('aria-busy', String(s === 'loading'));
    pred.querySelectorAll('.p-gate').forEach(function (g) { g.hidden = g.dataset.gate !== s; });
    demo.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    scrollTo({ top: pred.getBoundingClientRect().top + scrollY - 72, behavior: reduce ? 'auto' : 'smooth' });
  });

  // 予測一覧：開催日・競馬場で絞り込み。スマホ・タブレットの1件1行は20件ずつページ送り、PCの表は全件
  var flt = document.querySelector('.p-flt');
  if (flt) {
    var per = +flt.dataset.per, table = document.querySelector('.p-ls'), pg = document.querySelector('.p-pg'), empty = document.querySelector('.p-ls-0');
    var rows = Array.prototype.slice.call(table.querySelectorAll('tbody tr:not(.p-ls-d)'));
    var heads = Array.prototype.slice.call(table.querySelectorAll('tbody tr.p-ls-d'));
    var mx = Array.prototype.slice.call(document.querySelectorAll('.p-mx'));
    var state = { date: '', venue: '', page: 1 };
    // 現行と同じ並べ方（7ページ以下は全部、それ以上は前後1つと両端）
    function numbers(cur, total) {
      var a = [], i;
      if (total <= 7) { for (i = 1; i <= total; i++) a.push(i); return a; }
      a.push(1);
      if (cur > 3) a.push('…');
      for (i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) a.push(i);
      if (cur < total - 2) a.push('…');
      a.push(total);
      return a;
    }
    function link(label, page, cls) {
      var a = document.createElement('a');
      a.href = '#'; a.textContent = label; a.dataset.page = page; if (cls) { a.className = cls; a.setAttribute('aria-current', 'page'); }
      return a;
    }
    function off(label, cls) { var s = document.createElement('span'); s.textContent = label; s.className = cls; if (cls === 'off') s.setAttribute('aria-disabled', 'true'); return s; }
    function render() {
      var hit = rows.filter(function (r) { return (!state.date || r.dataset.date === state.date) && (!state.venue || r.dataset.venue === state.venue); });
      var total = Math.max(1, Math.ceil(hit.length / per));
      state.page = Math.min(state.page, total);
      var from = (state.page - 1) * per, show = hit.slice(from, from + per);
      rows.forEach(function (r) { r.hidden = show.indexOf(r) === -1; r.classList.remove('first'); });
      heads.forEach(function (h) {
        var of = hit.filter(function (r) { return r.dataset.date === h.dataset.date; });
        var first = show.filter(function (r) { return r.dataset.date === h.dataset.date; })[0];
        h.hidden = !first; if (first) first.classList.add('first');
        h.querySelector('b').textContent = of.length;
        // 前のページから続く日付には（続き）を付ける
        h.querySelector('i').textContent = first && first !== of[0] ? '（続き）' : '';
      });
      table.parentNode.parentNode.hidden = !hit.length; empty.hidden = !!hit.length;
      pg.innerHTML = '';
      if (total > 1) {
        pg.appendChild(state.page > 1 ? link('前へ', state.page - 1) : off('前へ', 'off'));
        numbers(state.page, total).forEach(function (p) { pg.appendChild(p === '…' ? off('…', 'gap') : link(String(p), p, p === state.page ? 'on' : '')); });
        pg.appendChild(state.page < total ? link('次へ', state.page + 1) : off('次へ', 'off'));
      }
      // PCの表：日付で板を、競馬場で列を絞る
      document.querySelector('.p-mxw').classList.toggle('byv', !!state.venue);
      mx.forEach(function (m) {
        var n = 0, cols = 0;
        m.querySelectorAll('[data-venue][data-date]').forEach(function (c) {
          c.hidden = (!!state.venue && c.dataset.venue !== state.venue) || (!!state.date && c.dataset.date !== state.date);
          if (!c.hidden && c.hasAttribute('data-race')) n++; if (!c.hidden && c.tagName === 'TH') cols++;
        });
        m.querySelectorAll('tbody tr').forEach(function (tr) { tr.hidden = !tr.querySelector('td[data-race]:not([hidden])'); });
        m.hidden = !n || !cols || (m.dataset.kind === 'venue' && m.dataset.venue !== state.venue);
        m.querySelector('h2 b').textContent = n; m.classList.toggle('one', cols === 1);
      });
      // 絞り込みのチップの件数：もう一方の条件に合う件数を出す
      flt.querySelectorAll('button').forEach(function (b) {
        var f = b.dataset.f, v = b.dataset.v, other = f === 'date' ? 'venue' : 'date';
        b.setAttribute('aria-pressed', String(state[f] === v));
        b.querySelector('span').textContent = rows.filter(function (r) { return (!v || r.dataset[f] === v) && (!state[other] || r.dataset[other] === state[other]); }).length;
      });
    }
    flt.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      state[b.dataset.f] = b.dataset.v; state.page = 1; render();
      center(b.parentNode, b, true); // 選んだチップが端で切れないよう中央へ送る
    });
    pg.addEventListener('click', function (e) {
      var a = e.target.closest('a'); if (!a) return;
      e.preventDefault();
      state.page = +a.dataset.page; render();
      var top = document.querySelector('.p-sec').getBoundingClientRect().top + scrollY - 64;
      if (scrollY > top) scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
    });
    render();
  }
})();
