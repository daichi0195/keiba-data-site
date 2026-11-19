// 404（現行：app/not-found.tsx）。行き止まりにしないよう、主なページへの入口を大きく置く
import { L, a, css, js, tail, crumb } from './_static.mjs';
const { I } = L;

// 現行の「主なページ」7件（ラベル・並びは現行どおり）
const LINKS = [['home', 'トップページ'], ['course', 'コース別データ一覧'], ['jockey', '騎手データ一覧'], ['sire', '種牡馬（血統）データ一覧'], ['trainer', '調教師データ一覧'], ['col', 'データ分析コラム'], ['ai', '競馬AI 勝率予測']];

const body = tail(`<div class="st st-solo" id="st-top">
  <header class="st-h">
    ${crumb([['ページが見つかりません']])}
    <p class="nf-code num" aria-hidden="true">404</p>
    <h1>ページが見つかりません</h1>
    <p class="st-lead">お探しのページは削除されたか、URLが変更された可能性があります。データページは対象の騎手・調教師・種牡馬・コースが集計対象外になると公開を終了することがあります。</p>
  </header>
  <section class="st-pn nf">
    <h2>主なページ</h2>
    <ul class="nf-g">${LINKS.map(([k, l]) => `<li><a href="#" data-inert>${I[k]}<span>${l}</span>${I.chevR}</a></li>`).join('')}</ul>
    <p class="nf-note">リンク切れを見つけた場合は${a('お問い合わせ')}からお知らせいただけると助かります。</p>
  </section>
</div>`);

console.log('notfound', L.page({ title: 'ページが見つかりません | 競馬データ.com（見本）', body, current: 'none', out: 'v6-notfound.html', css, js }));
