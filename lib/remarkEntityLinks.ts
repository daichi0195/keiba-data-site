import { ALL_SIRES } from './sires';
import { ALL_JOCKEYS } from './jockeys';
import { ALL_TRAINERS } from './trainers';

/**
 * コラム本文に出てくる種牡馬・騎手・調教師の名前を、各データページへのリンクにする remark プラグイン。
 * コラムから入った読者がデータページへほとんど移動していなかった（1セッション平均1.09ページ）ため、本文から導線を作る。
 *
 * - 各名前は記事内の最初の1回だけリンクする（同じリンクを何度も並べない）
 * - 見出し・既存のリンク・コード・埋め込みコンポーネントの中はリンクにしない
 * - 2文字以下の名前は別の語の一部と誤って一致しやすいので対象外
 */

type Entity = { name: string; url: string };

const MIN_NAME_LENGTH = 3;

const ENTITIES: Entity[] = [
  ...ALL_SIRES.map((s) => ({ name: s.name, url: `/sires/${s.id}` })),
  ...ALL_JOCKEYS.map((j) => ({ name: j.name, url: `/jockeys/${j.id}` })),
  ...ALL_TRAINERS.map((t) => ({ name: t.name, url: `/trainers/${t.id}` })),
]
  .filter((e) => e.name && e.name.length >= MIN_NAME_LENGTH)
  // 長い名前を先に照合する（「ディープインパクト」より前に「ディープ」が一致しないように）
  .sort((a, b) => b.name.length - a.name.length);

const SKIP_TYPES = new Set([
  'link',
  'linkReference',
  'heading',
  'code',
  'inlineCode',
  'mdxJsxFlowElement',
  'mdxJsxTextElement',
  'mdxFlowExpression',
  'mdxTextExpression',
]);

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

type MdNode = { type: string; value?: string; children?: MdNode[]; url?: string };

export default function remarkEntityLinks() {
  return (tree: MdNode) => {
    const byName = new Map(ENTITIES.map((e) => [e.name, e]));
    const linked = new Set<string>();

    const walk = (node: MdNode) => {
      if (!node.children || SKIP_TYPES.has(node.type)) return;
      const next: MdNode[] = [];
      for (const child of node.children) {
        if (child.type !== 'text' || !child.value) {
          walk(child);
          next.push(child);
          continue;
        }
        let rest = child.value;
        // 1つのテキストの中に複数の名前があれば順に処理する（リンク済みの名前は照合から外す）
        for (;;) {
          const candidates = ENTITIES.filter((e) => !linked.has(e.name) && rest.includes(e.name));
          if (candidates.length === 0) break;
          const m = rest.match(new RegExp(`(${candidates.map((e) => escapeRegExp(e.name)).join('|')})`));
          const entity = m ? byName.get(m[1]) : undefined;
          if (!m || m.index === undefined || !entity) break;
          if (m.index > 0) next.push({ type: 'text', value: rest.slice(0, m.index) });
          next.push({ type: 'link', url: entity.url, children: [{ type: 'text', value: entity.name }] });
          linked.add(entity.name);
          rest = rest.slice(m.index + entity.name.length);
        }
        if (rest) next.push({ type: 'text', value: rest });
      }
      node.children = next;
    };

    walk(tree);
  };
}
