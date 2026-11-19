// コースデータ一覧の見本（現行 app/courses/page.tsx）
import * as L from '../lib.mjs';
import { hero, chips, tail, css, js, X } from './list-shared.mjs';
const { I, ad, dists, all, VENUES, SURF, WEEK_RC } = L;

const nOf = (sf) => all.filter((c) => c.sf === sf).length;
const venue = ([rc, ja]) => `<section class="lc-v" id="rc-${rc}" aria-label="${ja}競馬場">
  <div class="lc-h"><h2>${ja}<span>競馬場</span></h2>${WEEK_RC.includes(rc) ? '<span class="lw" title="今週開催"><i class="lw-d"></i>今週開催</span>' : ''}<span class="lc-n"><b class="num">${all.filter((c) => c.rc === rc).length}</b>コース</span></div>
  ${dists(rc)}
</section>`;
const half = Math.ceil(VENUES.length / 2);

const body = `
${hero({ title: 'コースデータ一覧', lead: '直近3年間でレースが行われた全てのコースを対象としています。', count: `${VENUES.length}競馬場・${all.length}コース` })}
<div class="lf" data-mode="course">
  <div class="lf-b">
    <div class="lf-s" role="group" aria-label="馬場で絞り込む"><button type="button" data-sf="" aria-pressed="true">すべて<span class="num">${all.length}</span></button>${SURF.map(([sf, ja]) => `<button type="button" data-sf="${sf}" aria-pressed="false">${ja}<span class="num">${nOf(sf)}</span></button>`).join('')}</div>
    <label class="lf-i">${I.search}<span class="vh">距離で絞り込む</span><input id="lf-q" type="text" inputmode="numeric" enterkeyhint="search" autocomplete="off" maxlength="6" placeholder="距離で絞り込む（例：1600）"><button class="lf-x" type="button" aria-label="入力を消す" hidden>${X}</button></label>
  </div>
  <p class="lf-n" role="status" hidden></p>
</div>
${chips(VENUES.map(([rc, ja]) => [`rc-${rc}`, ja, '', WEEK_RC.includes(rc)]), '競馬場へ移動')}

<section class="sc l1" id="all">
  <h2 class="vh">競馬場ごとのコース</h2>
  <div class="lc">${VENUES.slice(0, half).map(venue).join('')}</div>
  <div class="lx lc-ad">${ad}</div>
  <div class="lc lc2">${VENUES.slice(half).map(venue).join('')}</div>
  <p class="lc-0" hidden>一致するコースが見つかりませんでした。</p>
</section>

${tail('course')}`;

console.log('list-courses', L.page({ title: 'コースデータ一覧 見本', body, current: 'course', out: 'v6-list-courses.html', css, js }));
