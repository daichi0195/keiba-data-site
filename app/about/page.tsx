import { Metadata } from 'next';
import Image from 'next/image';
import StaticPage, { P, Ul, Df, In, Ext, type StaticSection } from '@/components/v6/static/StaticPage';
import Video from '@/components/v6/static/Video';
import { cx } from '@/components/v6/static/cx';

export const metadata: Metadata = {
  title: 'サイト情報・運営者情報 | 競馬データ.com',
  description:
    '競馬データ.comの目的、提供しているコンテンツ、運営者のプロフィール、データとの向き合い方、収益と広告についての方針を掲載しています。',
  alternates: { canonical: 'https://www.keibadata.com/about' },
};

// 見本：docs/redesign/src/pages/about.mjs
const sections: StaticSection[] = [
  {
    title: '競馬データ.comについて',
    body: (
      <>
        <P>競馬データ.comは、中央競馬（JRA）の過去レース結果をもとに、競馬予想に役立つ統計データと分析コラムを公開している個人運営のサイトです。2025年にコース別データの公開から始め、現在は次のコンテンツを提供しています。</P>
        <Df
          mode="row-pc"
          tw="13em"
          rows={[
            [<In href="/courses" key="c">コース別データ</In>, '全10競馬場の芝・ダート・障害コースごとに、人気・枠順・脚質・騎手・血統・調教師の成績を集計'],
            [<><In href="/jockeys">騎手データ</In>・<In href="/trainers">調教師データ</In></>, '得意なコース・距離・脚質、人気時の信頼度、コンビ成績など'],
            [<In href="/sires" key="s">種牡馬（血統）データ</In>, '産駒の距離適性、芝・ダート適性、馬場適性、成長曲線、母父との相性'],
            [<In href="/articles" key="a">データ分析コラム</In>, '「初ダートは買えるか」「夏は牝馬を買えは本当か」など、競馬の定説を数万レースのデータで検証する記事'],
            [<In href="/ai" key="ai">競馬AI 勝率予測</In>, '機械学習モデルによる各馬の勝率予測を無料で公開'],
          ]}
        />
        <P>
          会員登録不要・完全無料で利用でき、有料予想の販売や予想会社への誘導は一切行っていません。データの出典や集計ルールは<In href="/about/data">データの出典と集計方法</In>で公開しています。
        </P>
      </>
    ),
  },
  {
    title: 'サイトの目的',
    body: <P>競馬の統計データは専門誌や有料サービスに分散していて、スマートフォンで手軽に見比べられるものが少ないと感じたことが開設のきっかけです。「世界で1番使いやすい競馬メディア」を目標に、必要な数字に最短でたどり着ける表の設計と、数字の意味を自分の言葉で説明することを大切にしています。</P>,
  },
  {
    title: '運営者について',
    body: (
      <>
        <div className={cx('st-prof')}>
          <Image src="/images/authors/daichi.jpg" alt="運営者ダイチのアイコン" width={96} height={96} />
          <div>
            <p className={cx('st-prof-n')}>
              ダイチ<span className={cx('st-prof-t')}>（競馬データ.com 運営者）</span>
            </p>
            <p className={cx('st-prof-x')}>
              <Ext href="https://x.com/daichikeibadata">X（旧Twitter）：@daichikeibadata</Ext>
            </p>
          </div>
        </div>
        <Ul
          items={[
            '1990年代後半生まれ。会社員としてWebマーケティングに携わったのち、現在は個人のマーケターとして活動しています。',
            'データの収集・集計基盤の構築（SQL・Python）、サイトの開発（Next.js）、記事の執筆まで、すべて運営者本人が行っています。',
            '2020年の競馬デビュー以来、毎週データを見ながら馬券を買い続けており、2025年からは一口馬主としても競馬に関わっています。',
            '競馬のほかにサウナが好きです。',
          ]}
        />
      </>
    ),
  },
  {
    title: 'データとの向き合い方',
    body: <P>当サイトの統計はすべて、運営者が自分の予想に使うために作った集計をそのまま公開したものです。「よく言われる定説は本当にデータで支持されるのか」を確かめることを一貫したテーマにしており、コラムでは結論だけでなく集計の定義・対象期間・サンプル数を必ず示すようにしています。</P>,
  },
  {
    title: '収益と広告について',
    body: <P>当サイトの運営費（データ基盤の利用料・サーバー代）は、サイト内に掲載する広告収入でまかなうことを予定しています。広告の掲載有無によってデータの内容や記事の結論が変わることはありません。また、有料の予想販売、予想会社や馬券購入サービスへの誘導、アフィリエイト目的の記事は行っていません。</P>,
  },
  {
    title: '競馬歴について',
    cls: 'st-vids',
    body: (
      <>
        <P>競馬デビューは2020年のアイビスサマーダッシュです。新潟の直線1000mで外枠の馬が一斉に外ラチ沿いへ寄っていく光景に驚き、「コースごとにこんなに有利不利があるのか」と気づいたことが、のちにコース別データを集計するきっかけになりました。</P>
        <Video id="x3HBXEIdhgM" title="2020年アイビスサマーダッシュ" />
        <P>好きな馬はグランアレグリア。好きなレースは2020年のスプリンターズステークスで、1200mの短距離戦でマイル王者が差し切った展開は、今でも「脚質と距離適性は数字だけでは測れない」と思い出させてくれる一戦です。応援している騎手は菱田裕二騎手です。</P>
        <Video id="OyHexM0B17w" title="2020年スプリンターズステークス" />
      </>
    ),
  },
  {
    title: 'お問い合わせ',
    body: (
      <P>
        当サイトに関するご意見・ご要望は、<In href="/contact">お問い合わせページ</In>よりお気軽にご連絡ください！
      </P>
    ),
  },
];

export default function AboutPage() {
  return <StaticPage pageKey="about" title="サイト情報・運営者情報" crumbs={[{ label: 'サイト情報・運営者情報' }]} sections={sections} toc />;
}
