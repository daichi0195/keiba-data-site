import { Metadata } from 'next';
import Link from 'next/link';
import StaticPageLayout, { StaticSection, staticLink } from '@/components/StaticPageLayout';
import { MIN_RACES_FOR_MENTION, MIN_RACES_FOR_TRENDS } from '@/lib/dataPageRules';

export const metadata: Metadata = {
  title: 'データの出典と集計方法 | 競馬データ.com',
  description:
    '競馬データ.comに掲載している統計データの出典、集計期間、更新頻度、勝率・複勝率・回収率などの指標の定義、脚質・距離区分・傾向判定のルールを説明します。',
  alternates: { canonical: 'https://www.keibadata.com/about/data' },
};

export default function DataPolicyPage() {
  return (
    <StaticPageLayout
      pageName="データの出典と集計方法"
      breadcrumbs={[
        { label: 'サイト情報・運営者情報', href: '/about' },
        { label: 'データの出典と集計方法' },
      ]}
      title="データの出典と集計方法"
      lead={
        <>
          このページでは、競馬データ.comのコース別・騎手別・種牡馬別・調教師別データがどのように作られているかを説明します。
          数値の意味や限界を理解したうえで予想にお役立てください。
        </>
      }
    >
      <StaticSection title="データの出典">
        <p>
          掲載している統計は、中央競馬（JRA）で施行された過去のレース結果（着順・人気・払戻・枠番・通過順位・馬体重など）をもとに、
          運営者が独自に構築・管理しているデータベースから集計したものです。
        </p>
        <p>
          地方競馬（NAR）および海外のレースは集計対象に含みません。
        </p>
      </StaticSection>

      <StaticSection title="集計期間と更新頻度">
        <ul>
          <li>集計期間は「集計日の前日から遡って3年間」です。期間は固定ではなく、更新のたびに1週間ずつ前に進みます。</li>
          <li>データは原則として毎週更新し、各ページの冒頭に「最終更新日」と「対象レース数」を表示しています。</li>
          <li>年度別成績は暦年（1月〜12月）で区切っています。当年分は集計日までの途中経過です。</li>
        </ul>
      </StaticSection>

      <StaticSection title="集計対象のルール">
        <ul>
          <li>騎手ページ・調教師ページは、直近3年間で30レース以上に騎乗・出走している現役の中央所属者を対象にしています。</li>
          <li>種牡馬ページは、直近3年間に産駒が中央競馬に出走している主要種牡馬を対象にしています。</li>
          <li>コースページは、各競馬場の芝・ダート・障害の全コース（内回り・外回りを区別）を対象にしています。</li>
          <li>
            対象レース数が{MIN_RACES_FOR_TRENDS}レースに満たないコースでは、傾向判定（荒れやすさ・枠順傾向・脚質傾向）と注目ポイントを表示していません。
            サンプルが少ない統計は偶然の影響を大きく受けるためです。
          </li>
          <li>コースページで個別の騎手・調教師・種牡馬を「得意」「苦手」として取り上げる際は、そのコースで{MIN_RACES_FOR_MENTION}走以上を目安にしています。</li>
          <li>出走取消・競走除外は出走数に含めません。</li>
        </ul>
      </StaticSection>

      <StaticSection title="指標の定義">
        <ul>
          <li><strong>勝率</strong>：出走数に対する1着の割合</li>
          <li><strong>連対率</strong>：出走数に対する2着以内の割合</li>
          <li><strong>複勝率</strong>：出走数に対する3着以内の割合</li>
          <li><strong>単勝回収率</strong>：該当する全馬の単勝馬券を100円ずつ購入した場合の払戻額の割合（100%が損益分岐点）</li>
          <li><strong>複勝回収率</strong>：同じく複勝馬券を100円ずつ購入した場合の払戻額の割合</li>
          <li><strong>平均人気・平均着順</strong>：該当する全出走の単勝人気と着順の平均値。中央値はその中央の値で、極端な値の影響を受けにくい指標です。</li>
        </ul>
      </StaticSection>

      <StaticSection title="脚質の定義">
        <p>
          脚質は公式の分類が存在しないため、当サイトでは各レースの通過順位から次のルールで機械的に判定しています。
          出走頭数を3で割って第1集団〜第3集団に分け、いずれにも該当しない場合は集計から除外します。
        </p>
        <ul>
          <li><strong>逃げ</strong>：いずれかのコーナーを1位で通過</li>
          <li><strong>先行</strong>：最終コーナーで第1集団</li>
          <li><strong>差し</strong>：最終コーナーで第2集団かつ上がり3ハロンが3位以内</li>
          <li><strong>追込</strong>：最終コーナーで第3集団かつ上がり3ハロンが3位以内</li>
        </ul>
      </StaticSection>

      <StaticSection title="距離区分の定義">
        <p>
          IFHA（国際競馬統括機関連盟）の基準をもとに、次の4区分を使用しています。長距離レースの数が少ないため、中長距離は長距離に含めています。
        </p>
        <ul>
          <li><strong>短距離</strong>：1000m〜1300m</li>
          <li><strong>マイル</strong>：1400m〜1600m</li>
          <li><strong>中距離</strong>：1700m〜2100m</li>
          <li><strong>長距離</strong>：2200m以上</li>
        </ul>
      </StaticSection>

      <StaticSection title="傾向判定のルール">
        <p>
          コースページや騎手ページに表示している5段階のゲージは、次の基準で機械的に判定しています。
        </p>
        <ul>
          <li>
            <strong>荒れやすさ（コース）</strong>：三連単配当の中央値を、障害を除く全コース（3年間で20回以上施行）の中で相対比較し、5段階で評価します。
            配当の中央値が高いほど、上位人気で決まりにくいコースです。
          </li>
          <li>
            <strong>枠順傾向（コース）</strong>：内枠（1〜4枠）と外枠（5〜8枠）の複勝率を比較し、差が5ポイント以上なら「内枠有利」または「外枠有利」、2ポイント以上なら「やや有利」、それ未満なら「互角」とします。
          </li>
          <li>
            <strong>脚質傾向（コース）</strong>：逃げ・先行と差し・追込の複勝率を比較し、枠順傾向と同じ閾値（5ポイント・2ポイント）で判定します。
          </li>
          <li>
            <strong>人気時の信頼度（騎手・調教師）</strong>：1番人気に支持されたときの複勝率を、1番人気での騎乗・出走が10回以上の全騎手・全調教師の中で相対比較し、5段階で評価します。
          </li>
          <li>
            <strong>得意なコース・距離・脚質（騎手・調教師・種牡馬）</strong>：芝とダート、短距離側と長距離側、逃げ・先行と差し・追込の複勝率をそれぞれ比較し、差が5ポイント以上・2ポイント以上を基準に判定します。
          </li>
        </ul>
      </StaticSection>

      <StaticSection title="データの限界と注意点">
        <ul>
          <li>統計は過去の結果の集計であり、将来のレース結果を予測・保証するものではありません。</li>
          <li>回収率は少数の高配当に大きく左右されます。特に出走数が少ない条件の回収率は再現性が低いとお考えください。</li>
          <li>コース改修、馬場造園の変更、騎手の移籍や調教師の引退などにより、過去の傾向が当てはまらなくなることがあります。</li>
          <li>入力・集計の誤りに気づかれた場合は、<Link href="/contact" className={staticLink}>お問い合わせ</Link>からご連絡ください。確認のうえ修正します。</li>
        </ul>
      </StaticSection>

      <StaticSection title="データの利用について">
        <p>
          当サイトの表やグラフを引用する場合は、出典として「競馬データ.com」と該当ページのURLを明記してください。
          データベース自体の提供や、表の一括転載には対応していません。
        </p>

        <p>
          運営者やサイトの目的については
          <Link href="/about" className={staticLink}>サイト情報・運営者情報</Link>
          をご覧ください。
        </p>
      </StaticSection>
    </StaticPageLayout>
  );
}
