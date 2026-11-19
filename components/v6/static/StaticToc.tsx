'use client';

// 固定ページの目次（見本 js/static.js をそのまま移したもの）：ページ内の移動と、読んでいる節の表示。
// 目次・「目次へ」はサーバーで描いた要素を、描画後に DOM で動かす（クラス・hidden・open の付け外しだけなので、ハイドレーションとはぶつからない）。
import { useEffect } from 'react';
import { s } from './cx';

export default function StaticToc() {
  useEffect(() => {
    const st = document.getElementById('st-top');
    if (!st) return;
    const links = Array.from(st.querySelectorAll<HTMLAnchorElement>('[data-st-toc] a'));
    if (!links.length) return;
    const pc = Array.from(st.querySelectorAll<HTMLAnchorElement>('[data-st-toc="pc"] a'));
    const secs = pc.map((a) => document.getElementById(a.getAttribute('href')!.slice(1)) as HTMLElement);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ON = s.on;
    // 目次で押した節。着くまでと、着いた位置から動くまで（下へ8px超、または節の頭が判定線より下に出るまで）現在地に固定する
    let pin: { i: number; y: number; arrived: boolean; until: number } | null = null;
    const hdrH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hdr-h')) || 56;
    const maxY = () => document.documentElement.scrollHeight - innerHeight;
    const timers: number[] = [];

    function set(i: number) {
      pc.forEach((a, k) => {
        const on = k === i;
        if (a.classList.contains(ON) === on) return;
        a.classList.toggle(ON, on);
        if (on) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
    }
    // 判定線：ふだんは画面の上から3割。ページの終わりが近づくと画面の下端へ向けて下げ、
    // 終わりの短い節も順に現在地になるようにする（一番下では、最後の節）
    function lineY() {
      const base = Math.max(hdrH() + 48, innerHeight * 0.3), span = innerHeight - base, left = maxY() - scrollY;
      return left >= span ? base : base + (span - Math.max(0, left));
    }
    function spy() {
      if (!secs.length) return;
      const line = lineY();
      let cur = 0;
      for (let i = 0; i < secs.length; i++) if (secs[i] && secs[i].getBoundingClientRect().top <= line) cur = i;
      if (pin) {
        if (!pin.arrived && (Math.abs(scrollY - pin.y) <= 2 || Date.now() > pin.until)) {
          pin.arrived = true;
          pin.y = scrollY;
        }
        if (!pin.arrived) cur = pin.i;
        else if (scrollY - pin.y > 8 || secs[pin.i].getBoundingClientRect().top > line) pin = null;
        else cur = pin.i;
      }
      set(cur);
    }
    const onLink = (e: MouseEvent) => {
      const a = e.currentTarget as HTMLAnchorElement;
      const id = a.getAttribute('href')!.slice(1), el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      const i = secs.indexOf(el);
      if (i >= 0) {
        // 着く位置（節の頭 − scroll-margin-top。ページの終わりより先へは行かない）
        const y = Math.min(maxY(), Math.max(0, Math.round(el.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(el).scrollMarginTop) || 0))));
        pin = { i, y, arrived: false, until: Date.now() + 2500 };
        set(i);
        timers.push(window.setTimeout(spy, 2600));
      }
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      try {
        history.replaceState(history.state, '', '#' + id);
      } catch {}
    };
    links.forEach((a) => a.addEventListener('click', onLink));

    // スマホ・タブレット：節の末尾の「目次へ」。目次を開いて、そこまで戻る。短い節（画面の半分未満）には出さない
    const tocM = document.getElementById('st-toc-m') as HTMLDetailsElement | null;
    const backs = Array.from(st.querySelectorAll<HTMLElement>('[data-st-back]'));
    function fitBacks() {
      backs.forEach((p) => {
        p.hidden = false;
        p.hidden = (p.parentNode as HTMLElement).getBoundingClientRect().height < innerHeight / 2;
      });
    }
    const onBack = (e: MouseEvent) => {
      e.preventDefault();
      if (!tocM) return;
      tocM.open = true;
      tocM.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    };
    const backLinks = backs.map((p) => p.querySelector('a')).filter((a): a is HTMLAnchorElement => !!a);
    backLinks.forEach((a) => a.addEventListener('click', onBack));
    fitBacks();

    let tick = false;
    const onScroll = () => {
      if (tick) return;
      tick = true;
      requestAnimationFrame(() => {
        tick = false;
        spy();
      });
    };
    const onResize = () => {
      fitBacks();
      spy();
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onResize);
    spy();
    return () => {
      links.forEach((a) => a.removeEventListener('click', onLink));
      backLinks.forEach((a) => a.removeEventListener('click', onBack));
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onResize);
      timers.forEach(clearTimeout);
    };
  }, []);
  return null;
}
