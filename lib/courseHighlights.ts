/**
 * コースページの注目ポイント（得意・よく穴をあける・苦手）の判定
 *
 * components/HighlightsSection.tsx の evaluateItems と同じ条件。
 * 出走20回以上を対象に、以下で振り分ける。
 * - 得意: 勝利数が上位5位以内 かつ 単勝回収率または複勝回収率が100%以上
 * - 苦手: 複勝率20%以下 かつ 複勝回収率30%未満
 * - よく穴をあける: 複勝率が上位5位未満 かつ 複勝回収率100%以上
 */

export interface HighlightStat {
  name: string;
  races: number;
  wins?: number;
  place_rate: number;
  win_payback: number;
  place_payback: number;
  link?: string;
}

export interface HighlightResult<T extends HighlightStat> {
  strong: T[];
  upset: T[];
  weak: T[];
}

export function evaluateHighlights<T extends HighlightStat>(items: T[] | undefined): HighlightResult<T> {
  if (!items || items.length === 0) {
    return { strong: [], upset: [], weak: [] };
  }

  const top5Wins = [...items].sort((a, b) => (b.wins ?? 0) - (a.wins ?? 0))[4]?.wins ?? 0;
  const top5PlaceRate = [...items].sort((a, b) => b.place_rate - a.place_rate)[4]?.place_rate ?? 0;

  const result: HighlightResult<T> = { strong: [], upset: [], weak: [] };
  items.forEach((item) => {
    if (item.races < 20) return;
    if ((item.wins ?? 0) >= top5Wins && (item.win_payback >= 100 || item.place_payback >= 100)) {
      result.strong.push(item);
    } else if (item.place_rate <= 20 && item.place_payback < 30) {
      result.weak.push(item);
    } else if (item.place_rate < top5PlaceRate && item.place_payback >= 100) {
      result.upset.push(item);
    }
  });
  return result;
}
