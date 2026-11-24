// components/layout/svg/*.svg（24×24、currentColor の単色）から components/layout/iconData.ts を作る
// 使い方: node scripts/build-icons.mjs [元のフォルダ]   … 元のフォルダを渡すと svg/ に写してから作る
import fs from 'fs';
import path from 'path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dir = path.join(root, 'components/layout/svg');
const src = process.argv[2];
if (src) {
  for (const f of fs.readdirSync(src).filter((f) => f.endsWith('.svg'))) fs.copyFileSync(path.join(src, f), path.join(dir, f));
}
const out = {};
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.svg')).sort()) {
  const svg = fs.readFileSync(path.join(dir, f), 'utf8');
  const open = svg.match(/<svg\b([^>]*)>/);
  if (!open) throw new Error(`${f}: <svg> がありません`);
  if (!/viewBox="0 0 24 24"/.test(open[1])) throw new Error(`${f}: viewBox は 0 0 24 24 にしてください`);
  // ルートの fill / stroke 系の属性は <g> に移して中身ごと持つ
  const attrs = [...open[1].matchAll(/\s(fill|stroke|stroke-width|stroke-linecap|stroke-linejoin|fill-rule|clip-rule)="([^"]*)"/g)].map((m) => `${m[1]}="${m[2]}"`);
  let inner = svg.slice(open.index + open[0].length, svg.lastIndexOf('</svg>')).replace(/<title>.*?<\/title>/gs, '').replace(/\s+/g, ' ').trim();
  if (/<(style|text|linearGradient|radialGradient|image)\b/.test(inner)) throw new Error(`${f}: 使えない要素があります`);
  if (attrs.length) inner = `<g ${attrs.join(' ')}>${inner}</g>`;
  out[f.replace(/\.svg$/, '')] = inner;
}
const body = Object.entries(out).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join('\n');
fs.writeFileSync(path.join(root, 'components/layout/iconData.ts'),
  `// node scripts/build-icons.mjs で components/layout/svg/*.svg から生成（手で編集しない）\nexport const ICON_DATA = {\n${body}\n} as const;\n\nexport type IconName = keyof typeof ICON_DATA;\n`);
console.log(Object.keys(out).length, 'icons →', 'components/layout/iconData.ts');
