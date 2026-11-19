// 一覧4ページ共通：ページ内の移動（チップ）と、名前（騎手・種牡馬・調教師）／馬場・距離（コース）の絞り込み
(function () {
  var box = document.querySelector('.lf');
  if (!box) return;
  var q = document.getElementById('lf-q'), clear = box.querySelector('.lf-x'), note = box.querySelector('.lf-n');
  var extras = document.querySelectorAll('.lx'), hdr = document.querySelector('.hdr');
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // カタカナはひらがなに、英字は小文字に、空白と記号は取り除く（生成側の yomi と同じ）
  function yomi(s) {
    return String(s).normalize('NFKC').toLowerCase().replace(/[ァ-ヶ]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0x60); }).replace(/[\s.・]/g, '');
  }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function setNote(html) { note.innerHTML = html; note.hidden = !html; }

  /* ---------- ページ内の移動と現在地 ----------
     共通の top.js には任せず、ここで受け持つ（チップの href は実在しない id にしてある）。
     現在地は「固定されている物（ヘッダーと、PCでは固定のチップ）の下端を最後に越えた節」。 */
  var nav = document.querySelector('.lj'), bar = nav.firstElementChild;
  var chips = [].map.call(nav.querySelectorAll('a'), function (a) { return { a: a, el: document.getElementById(a.dataset.to) }; });
  var cur = null, lock = 0, lockTo = null, pin = null, pinY = 0;
  function fixedBottom() {
    var b = hdr.getBoundingClientRect().bottom;
    if (getComputedStyle(nav).position === 'sticky' && nav.offsetHeight) b += nav.offsetHeight;
    return b;
  }
  function shown(el) { return el.getClientRects().length > 0; }
  function setChip(c) {
    chips.forEach(function (x) { x.a.classList.toggle('on', x === c); if (x === c) x.a.setAttribute('aria-current', 'true'); else x.a.removeAttribute('aria-current'); });
    var changed = c !== cur;
    cur = c;
    // 帯はすぐに送る（なめらかに送ると本文の移動に打ち消される）。共通の top.js がページ先頭付近で帯を左端へ戻すので、
    // 現在地のチップが帯からはみ出していたら毎回寄せ直す
    if (c) {
      var l = c.a.offsetLeft - bar.offsetLeft, out = l < bar.scrollLeft || l + c.a.offsetWidth > bar.scrollLeft + bar.clientWidth;
      if (changed || out) bar.scrollTo({ left: c.a.offsetLeft - (bar.clientWidth - c.a.offsetWidth) / 2, behavior: 'auto' });
    } else if (changed) bar.scrollTo({ left: 0, behavior: 'auto' });
  }
  function spy() {
    if (Date.now() < lock) { setChip(lockTo); return; }
    if (!shown(nav)) return;
    // 押して移動した先がページの末尾で線まで届かないときは、送り直すまで押したチップを現在地のままにする
    if (pin) { if (Math.abs(scrollY - pinY) < 3 && shown(pin.el)) { setChip(pin); return; } pin = null; }
    var line = fixedBottom() + 12, hit = null, last = null;
    chips.forEach(function (c) { if (!shown(c.el)) return; last = c; if (c.el.getBoundingClientRect().top <= line) hit = c; });
    // ページの一番下では最後の節を現在地にする
    if (last && scrollY > 0 && innerHeight + scrollY >= document.documentElement.scrollHeight - 2 && last.el.getBoundingClientRect().top < innerHeight) hit = last;
    setChip(hit);
  }
  var tick = 0;
  function onScroll() { if (!tick) tick = requestAnimationFrame(function () { tick = 0; spy(); }); }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  function unlock() {
    if (!lock) return;
    lock = 0;
    if (lockTo && shown(lockTo.el) && lockTo.el.getBoundingClientRect().top > fixedBottom() + 12) { pin = lockTo; pinY = scrollY; }
    spy();
  }
  addEventListener('scrollend', unlock);
  chips.forEach(function (c) {
    c.a.addEventListener('click', function (e) {
      e.preventDefault();
      // スマホでは移動先の行を開いてから位置を測る
      var d = c.el.querySelector('.ln-d');
      if (d && shown(d)) d.open = true;
      pin = null; lockTo = c; lock = Date.now() + 1500; setChip(c);
      scrollTo({ top: Math.max(0, c.el.getBoundingClientRect().top + scrollY - fixedBottom() - 8), behavior: calm ? 'auto' : 'smooth' });
      setTimeout(function () { if (lock && Date.now() >= lock) unlock(); }, 1550);
    });
  });
  spy();

  /* ---------- 絞り込みの共通 ---------- */
  // 絞り込み中は、結果が入力欄のすぐ下に来るようにリーディング・途中の広告枠・チップ・見出しをたたむ
  var filtering = false;
  function setMode(on) {
    extras.forEach(function (e) { e.hidden = on; });
    document.body.classList.toggle('lf-on', on);
    filtering = on;
    onScroll();
  }
  // スマホ・タブレット：入力欄をヘッダーのすぐ下へ寄せる（キーボードが出ても結果が見えるように）
  function dock() {
    if (innerWidth >= 1100) return;
    var top = box.getBoundingClientRect().top + scrollY - hdr.getBoundingClientRect().bottom;
    if (Math.abs(top - scrollY) > 2) scrollTo({ top: Math.max(0, top), behavior: 'auto' });
  }
  q.addEventListener('focus', function () { setTimeout(dock, 0); });
  // 日本語入力の変換中は、まだ確定していない末尾の英字（ローマ字の打ちかけ）を除いて判定する
  var composing = false;
  function typed() {
    var raw = q.value.trim();
    if (!composing) return raw;
    var cut = raw.replace(/[a-zA-Zａ-ｚＡ-Ｚ]+$/, '');
    return cut || !raw ? cut : null; // null＝打ちかけだけなので、いまの表示を変えない
  }
  function bind(run) {
    q.addEventListener('compositionstart', function () { composing = true; });
    q.addEventListener('compositionend', function () { composing = false; run(); });
    // 入力欄をヘッダー直下へ寄せるのは文字を打ったときだけ（馬場のボタンを押しただけでは動かさない）
    q.addEventListener('input', function (e) { if (e.isComposing) composing = true; var was = filtering; run(); if (filtering && !was) dock(); });
    clear.addEventListener('click', function () { q.value = ''; composing = false; run(); q.focus(); });
  }

  /* ---------- 名前で絞り込む ---------- */
  if (box.dataset.mode === 'name') {
    var unit = box.dataset.unit;
    var groups = [].map.call(document.querySelectorAll('.ln-g'), function (g) {
      var d = g.querySelector('.ln-d'), cnt = [].slice.call(g.querySelectorAll('summary i, h3 i'));
      return { el: g, d: d, was: d.open, cnt: cnt, all: cnt[0].textContent, a: [].slice.call(g.querySelectorAll('.ln-a a')), c: [].slice.call(g.querySelectorAll('.ln-c a')) };
    });
    var none = document.querySelector('.ln-0'), flat = document.querySelector('.ln-f'), active = false;
    var run = function () {
      var raw = typed();
      clear.hidden = !q.value;
      if (raw === null) return;
      var v = yomi(raw), total = 0;
      if (!v) {
        if (active) groups.forEach(function (g) { g.d.open = g.was; });
        active = false;
      } else if (!active) {
        groups.forEach(function (g) { g.was = g.d.open; });
        active = true;
      }
      groups.forEach(function (g) {
        var n = 0;
        g.a.forEach(function (a, i) {
          var hit = !v || a.dataset.k.indexOf(v) !== -1 || yomi(a.textContent).indexOf(v) !== -1;
          a.hidden = !hit; g.c[i].hidden = !hit;
          if (hit) n++;
        });
        g.el.hidden = !n;
        if (v) g.d.open = n > 0;
        // 行の件数は、絞り込み中は一致した数にする
        g.cnt.forEach(function (i) { i.textContent = v ? n : g.all; });
        total += n;
      });
      // スマホ：一致した名前を、行で分けずに1つのマスの並びにまとめる（入力欄のすぐ下に詰めて出す）
      flat.textContent = '';
      if (v) groups.forEach(function (g) { g.a.forEach(function (a) { if (!a.hidden) flat.appendChild(a.cloneNode(true)); }); });
      none.hidden = !v || total > 0;
      setMode(!!v);
      setNote(v ? '<span>「' + esc(raw) + '」に一致：<b>' + total + '</b>' + unit + '</span>' : '');
    };
    bind(run);
    // 押して開閉した状態は、絞り込みを解いたあとも保つ
    groups.forEach(function (g) { g.d.addEventListener('toggle', function () { if (!active) g.was = g.d.open; onScroll(); }); });
  }

  /* ---------- コース：馬場と距離で絞り込む ---------- */
  if (box.dataset.mode === 'course') {
    var segs = box.querySelectorAll('.lf-s button'), sf = '';
    var venues = [].map.call(document.querySelectorAll('.lc-v'), function (v) {
      return { el: v, home: v.parentNode, rows: [].map.call(v.querySelectorAll('.ds-r'), function (r) {
        return { el: r, sf: r.querySelector('.sf').className.replace(/^sf\s*/, ''), a: [].map.call(r.querySelectorAll('.ds-c a'), function (a) { return { el: a, d: String(parseInt(a.textContent, 10)) }; }) };
      }) };
    });
    var panels = [].slice.call(document.querySelectorAll('.lc')), none2 = document.querySelector('.lc-0');
    var LABEL = { turf: '芝', dirt: 'ダート', steeplechase: '障害' };
    var wide = matchMedia('(min-width:1800px)'), merged = false, on = false;
    // 表を1枚につなげる：絞り込み中と、途中の広告枠を出さない幅（1800px以上。広告は右列にある）
    function layout() {
      var m = on || wide.matches;
      if (m !== merged) { merged = m; venues.forEach(function (v) { (m ? panels[0] : v.home).appendChild(v.el); }); }
      panels.forEach(function (p) {
        var first = true, any = false;
        [].forEach.call(p.children, function (c) { c.classList.toggle('first', !c.hidden && first); if (!c.hidden) { first = false; any = true; } });
        p.hidden = !any;
      });
    }
    var runC = function () {
      var raw = typed();
      clear.hidden = !q.value;
      if (raw === null) return;
      raw = raw.normalize('NFKC');
      var d = raw.replace(/\D/g, ''), bad = /\D/.test(raw), total = 0, vn = 0;
      on = !!(d || sf);
      venues.forEach(function (v) {
        var n = 0;
        v.rows.forEach(function (r) {
          var m = 0;
          r.a.forEach(function (a) {
            var hit = (!sf || r.sf === sf) && (!d || a.d.indexOf(d) === 0);
            a.el.hidden = !hit;
            if (hit) m++;
          });
          r.el.hidden = !m; n += m;
        });
        v.el.hidden = !n; total += n;
        if (n) vn++;
      });
      layout();
      none2.hidden = total > 0;
      setMode(on);
      // 数字以外が混じっているときは、件数の横に案内を並べて出す
      setNote((on ? '<span>' + (sf ? LABEL[sf] : '') + (d ? '「' + d + '」で始まる距離' : '') + '：<b>' + total + '</b>コース（' + vn + '競馬場）</span>' : '') + (bad ? '<span class="warn">距離は数字で入力してください（例：1600）</span>' : ''));
    };
    bind(runC);
    segs.forEach(function (b) {
      b.addEventListener('click', function () {
        sf = b.dataset.sf;
        segs.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        runC();
      });
    });
    if (wide.addEventListener) wide.addEventListener('change', layout);
    layout();
  }
})();
