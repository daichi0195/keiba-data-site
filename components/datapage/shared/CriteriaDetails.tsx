import s from '@/components/course/course.module.css';
import r from './shared.module.css';

export interface CriteriaItem {
  title: string;
  lead?: string;
  list?: React.ReactNode[];
}

/**
 * 特徴カード末尾の「判定の基準」（開閉は1つだけ）。騎手・種牡馬・調教師ページ共通。
 * 各メーターの判定基準と、距離・脚質の定義をまとめて入れる。
 */
export default function CriteriaDetails({ items }: { items: CriteriaItem[] }) {
  return (
    <details className={s.more} style={{ marginTop: 14 }}>
      <summary>判定の基準</summary>
      <div className={r.criteria}>
        {items.map((it) => (
          <div key={it.title}>
            <h3>{it.title}</h3>
            {it.lead && <p>{it.lead}</p>}
            {it.list && it.list.length > 0 && (
              <ul>
                {it.list.map((li, i) => (
                  <li key={i}>{li}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </details>
  );
}

// ------------------------------------------------------------
// 3ページで共通の判定基準・定義（メーターの向き：左＝芝／短距離／良馬場、右＝ダート／長距離／重馬場）
// ------------------------------------------------------------

export const SURFACE_CRITERIA: CriteriaItem = {
  title: '得意なコース傾向（芝・ダート）',
  lead: '芝とダートの複勝率を比較しています。',
  list: [
    '芝の複勝率がダートより5%以上高い：芝が得意',
    '芝の複勝率がダートより2%以上高い：やや芝が得意',
    '複勝率の差が2%未満：差分なし',
    'ダートの複勝率が芝より2%以上高い：ややダートが得意',
    'ダートの複勝率が芝より5%以上高い：ダートが得意',
  ],
};

export const DISTANCE_CRITERIA: CriteriaItem = {
  title: '得意な距離傾向',
  lead: '短距離・マイルと中距離・長距離の複勝率を比較しています。',
  list: [
    '短距離・マイルの複勝率が中距離・長距離より5%以上高い：短距離が得意',
    '短距離・マイルの複勝率が中距離・長距離より2%以上高い：やや短距離が得意',
    '複勝率の差が2%未満：差分なし',
    '中距離・長距離の複勝率が短距離・マイルより2%以上高い：やや長距離が得意',
    '中距離・長距離の複勝率が短距離・マイルより5%以上高い：長距離が得意',
  ],
};

export const CONDITION_CRITERIA: CriteriaItem = {
  title: '得意な馬場傾向（芝・ダート共通）',
  lead: '良馬場と稍重・重・不良馬場の複勝率を比較しています。',
  list: [
    '良馬場の複勝率が稍重〜不良馬場より5%以上高い：良馬場が得意',
    '良馬場の複勝率が稍重〜不良馬場より2%以上高い：やや良馬場が得意',
    '複勝率の差が2%未満：差分なし',
    '稍重〜不良馬場の複勝率が良馬場より2%以上高い：やや重馬場が得意',
    '稍重〜不良馬場の複勝率が良馬場より5%以上高い：重馬場が得意',
  ],
};

export const RUNNING_STYLE_CRITERIA: CriteriaItem = {
  title: '得意な脚質傾向',
  lead: '逃げ・先行と差し・追込の複勝率を比較しています。',
  list: [
    '逃げ・先行の複勝率が差し・追込より5%以上高い：逃げ・先行が得意',
    '逃げ・先行の複勝率が差し・追込より2%以上高い：やや逃げ・先行が得意',
    '複勝率の差が2%未満：差分なし',
    '差し・追込の複勝率が逃げ・先行より2%以上高い：やや差し・追込が得意',
    '差し・追込の複勝率が逃げ・先行より5%以上高い：差し・追込が得意',
  ],
};

export const DISTANCE_DEFINITION: CriteriaItem = {
  title: '距離の定義',
  list: [
    <><b>短距離</b>：〜1400m</>,
    <><b>マイル</b>：1401m〜1800m</>,
    <><b>中距離</b>：1801m〜2100m</>,
    <><b>長距離</b>：2101m〜</>,
  ],
};

export const RUNNING_STYLE_DEFINITION: CriteriaItem = {
  title: '脚質の定義',
  lead: '出走頭数を3で割ったものを第1集団〜第3集団とし、下記に該当しない場合は集計から除外しています。',
  list: [
    <><b>逃げ</b>：コーナーのいずれかが1位通過</>,
    <><b>先行</b>：最終コーナーで第1集団</>,
    <><b>差し</b>：最終コーナーで第2集団かつ上がりが3位以内</>,
    <><b>追込</b>：最終コーナーで第3集団かつ上がりが3位以内</>,
  ],
};
