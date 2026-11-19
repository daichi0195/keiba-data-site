'use client';

// 騎手詳細・種牡馬詳細・調教師詳細のページ全体の動き（見本 js/jockey.js の、開閉以外の部分）。
// - PCのページ内ナビ：1行に入る幅なら1行（.one）
// - チップで飛んだとき：見出しが「ヘッダー＋ナビ＋12px」の位置に来るよう --jk-sm を入れる
// - 表：横に送ったら名前の列を縮める（.sx）、右に続きがあるあいだは右端に影（.more）
// - 表の見出し行：表が画面の上へ流れても、ヘッダーとナビの下に留める（--ty）
// - 動き：画面に入ったら1回だけ（.in）。数値は最終値の85%から短く数え上げる
// サーバーで描いた要素にクラスを足すだけで、要素の中身は作り直さない（ハイドレーションに影響しない）。
import { useEffect } from 'react';
import { s, sel } from './cx';

export default function EntityEffects() {
  useEffect(() => {
    const root = document.querySelector(sel('root')) as HTMLElement | null;
    if (!root) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const each = <T extends Element>(list: NodeListOf<T> | T[], fn: (el: T) => void) => Array.prototype.forEach.call(list, fn);
    const hdr = document.querySelector('header') as HTMLElement | null;
    const nav = root.querySelector(sel('jk-nav')) as HTMLElement | null;
    const topH = () => (hdr ? hdr.offsetHeight : 0) + (nav && getComputedStyle(nav).position === 'sticky' ? nav.offsetHeight : 0);

    // PCのナビ：全項目が1行に入る幅なら1行、入らなければ CSS の既定（2行）
    const navRows = () => {
      const row = nav?.querySelector('div');
      if (!row) return;
      row.classList.remove(s.one);
      if (getComputedStyle(row).display !== 'grid') return;
      const cs = getComputedStyle(row);
      let w = 0;
      each(Array.from(row.children), (c) => { w += (c as HTMLElement).offsetWidth; });
      w += (row.children.length - 1) * (parseFloat(cs.columnGap) || 0);
      row.classList.toggle(s.one, w <= row.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
    };
    // 見出しへ移動したときの止まる位置
    const margin = () => {
      const sc = root.querySelector(sel('sc'));
      const pt = sc ? parseFloat(getComputedStyle(sc).paddingTop) || 0 : 0;
      root.style.setProperty('--jk-sm', `${Math.round(topH() + 12 - pt)}px`);
    };

    // 表の横スクロール
    const edge = (w: HTMLElement) => {
      w.classList.toggle(s.sx, w.scrollLeft > 8);
      w.parentElement?.classList.toggle(s.more, w.clientWidth > 0 && w.scrollLeft + w.clientWidth < w.scrollWidth - 4);
    };
    const tws = Array.from(root.querySelectorAll<HTMLElement>(sel('jk-tw')));
    const onTw = (e: Event) => edge(e.currentTarget as HTMLElement);
    tws.forEach((w) => { w.addEventListener('scroll', onTw, { passive: true }); edge(w); });

    // 表の見出し行を留める
    const heads = Array.from(root.querySelectorAll<HTMLTableElement>(sel('jk-t')))
      .filter((t) => t.tHead)
      .map((t) => ({ t, h: t.tHead as HTMLElement, ty: 0 }));
    let ticking = false;
    const stick = () => {
      ticking = false;
      const top = topH();
      heads.forEach((x) => {
        if (!x.t.offsetParent) return;
        const r = x.t.getBoundingClientRect();
        const hh = x.h.offsetHeight;
        const last = x.t.rows[x.t.rows.length - 1]?.offsetHeight || 40;
        let ty = r.top < top && r.bottom > top ? Math.min(top - r.top, r.height - hh - last) : 0;
        ty = Math.max(0, Math.round(ty));
        if (ty !== x.ty) { x.ty = ty; x.h.style.setProperty('--ty', `${ty}px`); }
      });
    };
    // ページ内ナビの現在地（読んでいる節のチップを塗り、帯の中で見える位置へ寄せる）
    const navBox = nav?.querySelector('div') as HTMLElement | null;
    const navLinks = navBox ? (Array.from(navBox.querySelectorAll('a')) as HTMLAnchorElement[]) : [];
    const navTargets = navLinks.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))));
    let navOn = -1;
    const markNav = () => {
      if (!navBox || !navLinks.length) return;
      const line = topH() + 24;
      let i = -1;
      navTargets.forEach((t, k) => { if (t && t.getBoundingClientRect().top <= line) i = k; });
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) i = navLinks.length - 1;
      if (i === navOn) return;
      if (navOn >= 0) navLinks[navOn]?.classList.remove(s.on);
      navOn = i;
      if (i < 0) return;
      const a = navLinks[i];
      a.classList.add(s.on);
      const l = a.offsetLeft - navBox.offsetLeft, r = l + a.offsetWidth;
      if (l < navBox.scrollLeft || r > navBox.scrollLeft + navBox.clientWidth) navBox.scrollTo({ left: l - (navBox.clientWidth - a.offsetWidth) / 2, behavior: 'auto' });
    };
    let navTick = false;
    const onNavScroll = () => { if (!navTick) { navTick = true; requestAnimationFrame(() => { navTick = false; markNav(); }); } };
    addEventListener('scroll', onNavScroll, { passive: true });
    markNav();
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(stick); } };
    const onResize = () => { navRows(); margin(); tws.forEach(edge); onScroll(); };
    const onRefresh = () => { tws.forEach(edge); onScroll(); };
    // 競馬場ごとの開閉（details）：開いた中の表にも右端の合図を付ける（toggle は泡立たないので捕捉で受ける）
    const onToggle = (e: Event) => {
      const d = e.target as HTMLElement;
      if (d.tagName !== 'DETAILS') return;
      d.querySelectorAll<HTMLElement>(sel('jk-tw')).forEach(edge);
      onScroll();
    };

    navRows();
    margin();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onResize);
    addEventListener('jk:refresh', onRefresh);
    root.addEventListener('toggle', onToggle, true);

    // 動き：棒が伸びる・線が引かれる・つまみが滑る。数値は最終値の85%から短く数え上げる
    const count = (el: Element) => {
      el.querySelectorAll<HTMLElement>('[data-count]').forEach((c, k) => {
        const to = parseFloat(c.dataset.count ?? '0');
        const dp = Number(c.dataset.dp) || 0;
        const from = to * 0.85;
        const t0 = performance.now() + 200 + k * 60;
        const show = (v: number) => { c.textContent = dp ? v.toFixed(dp) : Math.round(v).toLocaleString('ja-JP'); };
        show(from);
        const tick = (now: number) => {
          const p = Math.min(1, Math.max(0, (now - t0) / 450));
          const e = 1 - Math.pow(1 - p, 3);
          if (p < 1) { show(from + (to - from) * e); requestAnimationFrame(tick); } else show(to);
        };
        tick(performance.now());
      });
    };
    let seen: IntersectionObserver | null = null;
    if (!reduce && 'IntersectionObserver' in window) {
      seen = new IntersectionObserver((es) => {
        es.forEach((en) => {
          if (!en.isIntersecting) return;
          seen?.unobserve(en.target);
          en.target.classList.add(s.in);
          count(en.target);
          en.target.querySelectorAll<HTMLElement>(sel('jk-tw')).forEach(edge);
        });
      }, { threshold: 0.15 });
      root.querySelectorAll('[data-anim]').forEach((el) => seen?.observe(el));
    } else {
      root.querySelectorAll('[data-anim]').forEach((el) => el.classList.add(s.in));
    }

    return () => {
      tws.forEach((w) => w.removeEventListener('scroll', onTw));
      removeEventListener('scroll', onScroll);
      removeEventListener('scroll', onNavScroll);
      removeEventListener('resize', onResize);
      removeEventListener('jk:refresh', onRefresh);
      root.removeEventListener('toggle', onToggle, true);
      seen?.disconnect();
    };
  }, []);
  return null;
}
