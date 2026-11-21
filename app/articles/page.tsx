import { Metadata } from 'next';
import Link from '@/components/HardLink';
import { getAllArticles } from '@/lib/articles';
import ColumnIndex from '@/components/v6/article/ColumnIndex';
import { toCard } from '@/components/v6/article/Cards';
import { cx } from '@/components/v6/article/cx';

export const metadata: Metadata = {
  title: 'コラム | 競馬データ.com',
  description:
    'データを活用した分析記事や一口馬主のコラムなどを掲載しています。',
};

export default function ArticlesPage() {
  // カスタムリンク先（link）を持つものは一覧に出さない（現行と同じ）
  const articles = getAllArticles().filter((a) => !a.frontmatter.link);
  // 新着順：日付の新しい順。人気順：priority の小さい順（未指定は999。同じ値は新着順のまま）＝現行と同じ
  const newest = [...articles].sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime());
  const popular = [...newest].sort((a, b) => (a.frontmatter.priority ?? 999) - (b.frontmatter.priority ?? 999));

  return (
    <main className={cx('root')}>
      <ColumnIndex
        title="コラム"
        lead="データを活用した分析記事や一口馬主のコラムなどを掲載しています。"
        newest={newest.map(toCard)}
        popular={popular.map(toCard)}
      />

      <aside className={cx('pr')} aria-label="ご案内">
        <div className={cx('pr-ai')}>
          <div>
            <p className={cx('pr-k')}>AI勝率予測</p>
            <h2>出走馬ごとの勝率をAIで予測</h2>
            <p>独自のモデルで出走馬の勝率を算出し、対象レースの約5分前に無料で公開しています。</p>
          </div>
          <Link prefetch={false} className={cx('cta')} href="/ai">
            予測を見る
          </Link>
        </div>
        <div className={cx('pr-bm')}>
          <b>毎週の予想に活用しよう！</b>
          <kbd>Ctrl+D / ⌘+D</kbd>
          <span>でブックマークに登録！</span>
        </div>
      </aside>
    </main>
  );
}
