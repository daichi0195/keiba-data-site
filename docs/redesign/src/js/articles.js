// コラム一覧：新着順／人気順の並び替えと、最初の1回だけの浮き上がり
(function () {
  document.querySelectorAll('.cl').forEach(function (cl) {
    Array.prototype.forEach.call(cl.children, function (el, i) { el.style.setProperty('--i', i); });
    if (!('IntersectionObserver' in window)) { cl.classList.add('in', 'done'); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(cl);
        cl.classList.add('in');
        setTimeout(function () { cl.classList.add('done'); }, 1200);
      });
    }, { threshold: 0.05 });
    io.observe(cl);
  });

  var list = document.getElementById('col-list');
  var btns = document.querySelectorAll('.srt button');
  if (!list) return;
  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      var key = b.dataset.sort; // new = 日付の新しい順 / pop = priority の小さい順
      btns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      list.classList.add('in', 'done');
      Array.prototype.slice.call(list.children)
        .sort(function (a, c) { return +a.dataset[key] - +c.dataset[key]; })
        .forEach(function (el) { list.appendChild(el); });
    });
  });
})();
