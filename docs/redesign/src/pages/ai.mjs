// AI予測トップ（現行 app/ai/page.tsx）
import * as L from '../lib.mjs';
import * as A from './ai-shared.mjs';
const { head, ad } = L;

// 現行と同じ：index.json の並びに依存せず開催日の新しい順（同日内はデータの順）で10件
const latest = [...A.preds].sort((x, y) => y.date.localeCompare(x.date)).slice(0, 10);
const first = A.preds.reduce((m, e) => (e.date < m ? e.date : m), '9999');
const firstLabel = (() => { const d = new Date(first + 'T00:00:00+09:00'); return `${d.getFullYear()}年${d.getMonth() + 1}月`; })();

const SECTIONS = [['latest', '最新のレース予測'], ['about', 'このAIについて'], ['model', '予測モデルについて'], ['marks', '印について']];

// 印の位置関係の図（横軸＝人気、縦軸＝AIの予測勝率）。数値の目盛りは置かない（現行の印の定義文の位置関係だけを描く）
const chart = `<svg class="p-mc" viewBox="0 0 400 300" role="img" aria-label="印の位置関係の図。横軸は人気、縦軸はAIの予測勝率。本命は予測勝率が高く人気より評価が高い位置、紐は人気がなく人気より評価が高い位置、危険は人気を集めていて予測勝率が低い位置。">
  <path class="p-mc-up" d="M46 16H392V258Z"/>
  <path class="p-mc-ax" d="M46 16V258H392"/>
  <path class="p-mc-dg" d="M46 16L392 258"/>
  <text class="p-mc-t" x="384" y="38" text-anchor="end">市場が過小評価</text>
  <text class="p-mc-t" x="56" y="248">市場が過大評価</text>
  <text class="p-mc-t d" x="300" y="212" transform="rotate(35 300 212)" text-anchor="middle">人気どおりの評価</text>
  <g class="p-mc-m honmei" style="--i:0"><rect x="134" y="50" width="124" height="46" rx="23"/><text x="196" y="80" text-anchor="middle">◎ 本命</text></g>
  <g class="p-mc-m himo" style="--i:1"><rect x="272" y="104" width="104" height="46" rx="23"/><text x="324" y="134" text-anchor="middle">△ 紐</text></g>
  <g class="p-mc-m kiken" style="--i:2"><rect x="64" y="166" width="124" height="46" rx="23"/><text x="126" y="196" text-anchor="middle">× 危険</text></g>
  <text class="p-mc-a" x="46" y="280">人気が高い</text><text class="p-mc-a" x="392" y="280" text-anchor="end">人気が低い</text><text class="p-mc-a b" x="219" y="298" text-anchor="middle">人気（オッズ）</text>
  <text class="p-mc-a" x="36" y="18" text-anchor="end" transform="rotate(-90 36 18)">高い</text><text class="p-mc-a" x="36" y="258" transform="rotate(-90 36 258)">低い</text><text class="p-mc-a b" x="16" y="137" text-anchor="middle" transform="rotate(-90 16 137)">AIの予測勝率</text>
</svg>`;

const body = `
<nav class="chips" aria-label="ページ内の見出し"><div>${SECTIONS.map(([id, l]) => `<a href="#${id}">${l}</a>`).join('')}</div></nav>
${A.crumb([['競馬AI 勝率予測', false]])}
<div class="p-top" id="p-top">
  <h1 class="p-h1">競馬AI 勝率予測</h1>
  <p class="p-lead">過去の中央競馬レースデータを機械学習で分析し、各馬の勝率を予測するAIです。</p>
</div>
<div class="p-w p-facts-w">
  <dl class="p-pn p-facts">
    <div><dt>公開した予測<small>${firstLabel}〜</small></dt><dd><b class="num" data-to="${A.preds.length}">${A.preds.length.toLocaleString('ja-JP')}</b>レース</dd></div>
    <div><dt>学習に使う要素</dt><dd><b class="num">100</b>以上</dd></div>
    <div class="t"><dt>公開</dt><dd>レース約5分前に<wbr>無料で公開</dd></div>
  </dl>
</div>

<section class="sc" id="latest">
  ${head('最新のレース予測', '', '予測一覧をみる')}
  <div class="ai">${latest.map((e) => A.card(e)).join('')}</div>
</section>

${ad}

<div class="p-w p-duo-w">
  <div class="p-pn p-duo">
    <section id="about">
      <h2>このAIについて</h2>
      <div class="p-prose">
        <p>過去の中央競馬レースデータを機械学習で分析し、各馬の勝率を予測するAIです。<br>予測勝率とオッズから期待値を算出し、市場が過小評価・過大評価している馬を見抜きます。</p>
        <p>新馬レース・障害レースは対象外です。</p>
        <p>予測は<strong>レース約5分前</strong>に公開しています。</p>
      </div>
    </section>
    <section id="model">
      <h2>予測モデルについて</h2>
      <div class="p-prose">
        <p>過去成績・レーティング・騎手/調教師/血統スタッツ・コース適性・馬場適性など、<strong>100以上の要素</strong>から学習し予測しています。</p>
        <p>オッズは学習させていません。</p>
      </div>
    </section>
  </div>
  ${A.xBanner}
</div>

<section class="sc" id="marks">
  ${head('印について', '', '')}
  <div class="p-w"><div class="p-pn p-marks">
    <figure class="p-marks-f">${chart}<figcaption><b>印は予測勝率の順位ではなく、人気との差で付きます</b>印の位置関係（目盛りのない概念図）</figcaption></figure>
    <div class="p-marks-l">${Object.keys(A.MARKS).map((k) => `<div class="p-marks-r"><div>${A.mark(k)}</div><p>${A.MARK_DESC[k].join('<br>')}</p></div>`).join('')}</div>
  </div></div>
</section>`;

console.log('ai', L.page({ title: '競馬予想AI｜無料で勝率予測を公開中！ | 競馬データ.com', body, current: 'ai', out: 'v6-ai.html', css: A.CSS, js: A.JS, railAi: false }));
