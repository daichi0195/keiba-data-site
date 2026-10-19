import Link from 'next/link';
import { StaticSection, staticLink } from '@/components/StaticPageLayout';

export default function SiteAbout() {
  return (
    <>
      <StaticSection title="競馬データ.comについて">
        <p>
          競馬データ.comは、中央競馬（JRA）の過去レース結果をもとに、競馬予想に役立つ統計データと分析コラムを公開している個人運営のサイトです。
          {/* 【要確認】サイト開設時期を正確な年月に直してください */}
          2025年にコース別データの公開から始め、現在は次のコンテンツを提供しています。
        </p>
        <ul>
          <li><Link href="/courses" className={staticLink}>コース別データ</Link>：全10競馬場の芝・ダート・障害コースごとに、人気・枠順・脚質・騎手・血統・調教師の成績を集計</li>
          <li><Link href="/jockeys" className={staticLink}>騎手データ</Link>・<Link href="/trainers" className={staticLink}>調教師データ</Link>：得意なコース・距離・脚質、人気時の信頼度、コンビ成績など</li>
          <li><Link href="/sires" className={staticLink}>種牡馬（血統）データ</Link>：産駒の距離適性、芝・ダート適性、馬場適性、成長曲線、母父との相性</li>
          <li><Link href="/articles" className={staticLink}>データ分析コラム</Link>：「初ダートは買えるか」「夏は牝馬を買えは本当か」など、競馬の定説を数万レースのデータで検証する記事</li>
          <li><Link href="/ai" className={staticLink}>競馬AI 勝率予測</Link>：機械学習モデルによる各馬の勝率予測を無料で公開</li>
        </ul>
        <p>
          会員登録不要・完全無料で利用でき、有料予想の販売や予想会社への誘導は一切行っていません。
          データの出典や集計ルールは<Link href="/about/data" className={staticLink}>データの出典と集計方法</Link>で公開しています。
        </p>
      </StaticSection>

      <StaticSection title="サイトの目的">
        <p>
          競馬の統計データは専門誌や有料サービスに分散していて、スマートフォンで手軽に見比べられるものが少ないと感じたことが開設のきっかけです。
          「世界で1番使いやすい競馬メディア」を目標に、必要な数字に最短でたどり着ける表の設計と、数字の意味を自分の言葉で説明することを大切にしています。
        </p>
      </StaticSection>
    </>
  );
}
