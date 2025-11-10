'use client';

import { useState, useMemo } from 'react';

interface StatItem {
  rank?: number;
  name: string;
  races: number;
  wins?: number;
  places_2?: number;
  places_3?: number;
  win_rate: number;
  place_rate: number;
  quinella_rate?: number;
  win_payback: number;
  place_payback: number;
}

interface HighlightsSectionProps {
  jockey_stats?: StatItem[];
  pedigree_stats?: StatItem[];
  dam_sire_stats?: StatItem[];
  trainer_stats?: StatItem[];
}

export default function HighlightsSection({
  jockey_stats,
  pedigree_stats,
  dam_sire_stats,
  trainer_stats
}: HighlightsSectionProps) {
  const [modalState, setModalState] = useState<{ isOpen: boolean; subsectionKey: string | null }>({
    isOpen: false,
    subsectionKey: null
  });

  // 条件評価関数
  const evaluateItems = (items: StatItem[] | undefined) => {
    if (!items || items.length === 0) {
      return { strong: [], upset: [], weak: [] };
    }

    // wins のtop5の閾値を取得
    const sortedByWins = [...items].sort((a, b) => (b.wins ?? 0) - (a.wins ?? 0));
    const top5Wins = sortedByWins[4]?.wins ?? 0;

    // place_rate のtop5の閾値も取得（upset用）
    const sortedByPlaceRate = [...items].sort((a, b) => b.place_rate - a.place_rate);
    const top5PlaceRate = sortedByPlaceRate[4]?.place_rate ?? 0;

    const strong: StatItem[] = [];
    const upset: StatItem[] = [];
    const weak: StatItem[] = [];

    items.forEach((item) => {
      // 出走回数20回以上の条件
      if (item.races >= 20) {
        // strong: wins が top5 以内 かつ (win_payback >= 100 or place_payback >= 100)
        if ((item.wins ?? 0) >= top5Wins && (item.win_payback >= 100 || item.place_payback >= 100)) {
          strong.push(item);
        }
        // weak: place_rate <= 20 かつ place_payback < 30
        else if (item.place_rate <= 20 && item.place_payback < 30) {
          weak.push(item);
        }
        // upset: place_rate が top5 未満 かつ place_payback >= 100
        else if (item.place_rate < top5PlaceRate && item.place_payback >= 100) {
          upset.push(item);
        }
      }
    });

    return { strong, upset, weak };
  };

  // 各カテゴリの評価結果をmemo化
  const jockeyEvaluation = useMemo(() => evaluateItems(jockey_stats), [jockey_stats]);
  const pedigreeEvaluation = useMemo(() => evaluateItems(pedigree_stats), [pedigree_stats]);
  const damSireEvaluation = useMemo(() => evaluateItems(dam_sire_stats), [dam_sire_stats]);
  const trainerEvaluation = useMemo(() => evaluateItems(trainer_stats), [trainer_stats]);

  const renderCards = (items: StatItem[], type: 'strong' | 'upset' | 'weak') => {
    if (!items || items.length === 0) {
      return (
        <div className="highlight-cards">
          <div className="highlight-card-empty">該当なし</div>
        </div>
      );
    }

    const cardClass = (type === 'strong' || type === 'upset') ? 'highlight-card-strong' : 'highlight-card-weak';

    return (
      <div className="highlight-cards">
        {items.map((item) => {
          return (
            <div
              key={item.name}
              className={`highlight-card ${cardClass}`}
            >
              <div className="card-name">{item.name}</div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSubsection = (
    title: string,
    items: StatItem[],
    type: 'strong' | 'upset' | 'weak',
    subsectionKey: string
  ) => {
    const openModal = () => {
      setModalState({
        isOpen: true,
        subsectionKey: subsectionKey
      });
    };

    return (
      <div className="highlight-subsection">
        <div className="subsection-header">
          <h4 className="highlight-subsection-title">{title}</h4>
          <button
            className="condition-info-btn"
            onClick={openModal}
            aria-label="条件を確認"
            title="条件を確認"
          >
            ?
          </button>
        </div>
        {renderCards(items, type)}
      </div>
    );
  };

  return (
    <section id="highlights-section">
      <div className="highlights-box">
        <h2 className="section-title">注目ポイント</h2>

        {/* 騎手セクション */}
        <div className="highlight-item">
          <h3 className="gauge-label">騎手</h3>
          {renderSubsection(
            'このコースが得意な騎手',
            jockeyEvaluation.strong,
            'strong',
            'jockey-strong'
          )}
          {jockeyEvaluation.upset.length > 0 && (
            renderSubsection(
              'このコースでよく穴をあける騎手',
              jockeyEvaluation.upset,
              'upset',
              'jockey-upset'
            )
          )}
          {renderSubsection(
            'このコースが苦手な騎手',
            jockeyEvaluation.weak,
            'weak',
            'jockey-weak'
          )}
          <div className="section-divider"></div>
        </div>

        {/* 血統（種牡馬）セクション */}
        <div className="highlight-item">
          <h3 className="gauge-label">血統（種牡馬）</h3>
          {renderSubsection(
            'このコースが得意な種牡馬',
            pedigreeEvaluation.strong,
            'strong',
            'sire-strong'
          )}
          {renderSubsection(
            'このコースが苦手な種牡馬',
            pedigreeEvaluation.weak,
            'weak',
            'sire-weak'
          )}
          <div className="section-divider"></div>
        </div>

        {/* 血統（母父）セクション */}
        <div className="highlight-item">
          <h3 className="gauge-label">血統（母父）</h3>
          {renderSubsection(
            'このコースが得意な母父',
            damSireEvaluation.strong,
            'strong',
            'dam-sire-strong'
          )}
          {renderSubsection(
            'このコースが苦手な母父',
            damSireEvaluation.weak,
            'weak',
            'dam-sire-weak'
          )}
          <div className="section-divider"></div>
        </div>

        {/* 調教師セクション */}
        <div className="highlight-item">
          <h3 className="gauge-label">調教師</h3>
          {renderSubsection(
            'このコースが得意な調教師',
            trainerEvaluation.strong,
            'strong',
            'trainer-strong'
          )}
          {renderSubsection(
            'このコースが苦手な調教師',
            trainerEvaluation.weak,
            'weak',
            'trainer-weak'
          )}
        </div>
      </div>

      {/* モーダル */}
      {modalState.isOpen && (
        <div className="condition-modal-overlay" onClick={() => setModalState({ isOpen: false, subsectionKey: null })}>
          <div className="condition-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setModalState({ isOpen: false, subsectionKey: null })}
            >
              ×
            </button>
            <h3 className="modal-title">条件について</h3>
            <div className="modal-conditions">
              {modalState.subsectionKey && [
                { key: 'jockey-strong', conditionGroups: [['直近3年間の出走回数20回以上'], ['勝数TOP5以内'], ['単勝回収率もしくは複勝回収率100%以上']] },
                { key: 'jockey-upset', conditionGroups: [['直近3年間の出走回数20回以上'], ['複勝率TOP5未満'], ['複勝回収率100%以上']] },
                { key: 'jockey-weak', conditionGroups: [['直近3年間の出走回数20回以上'], ['複勝率20%以下'], ['複勝回収率30%未満']] },
                { key: 'sire-strong', conditionGroups: [['直近3年間の出走回数20回以上'], ['勝数TOP5以内'], ['単勝回収率もしくは複勝回収率100%以上']] },
                { key: 'sire-weak', conditionGroups: [['直近3年間の出走回数20回以上'], ['複勝率20%以下'], ['複勝回収率30%未満']] },
                { key: 'dam-sire-strong', conditionGroups: [['直近3年間の出走回数20回以上'], ['勝数TOP5以内'], ['単勝回収率もしくは複勝回収率100%以上']] },
                { key: 'dam-sire-weak', conditionGroups: [['直近3年間の出走回数20回以上'], ['複勝率20%以下'], ['複勝回収率30%未満']] },
                { key: 'trainer-strong', conditionGroups: [['直近3年間の出走回数20回以上'], ['勝数TOP5以内'], ['単勝回収率もしくは複勝回収率100%以上']] },
                { key: 'trainer-weak', conditionGroups: [['直近3年間の出走回数20回以上'], ['複勝率20%以下'], ['複勝回収率30%未満']] },
              ].find(item => item.key === modalState.subsectionKey)?.conditionGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="condition-group">
                  {group.map((condition, itemIndex) => (
                    <div key={itemIndex} className="condition-item-wrapper">
                      <span className="condition-number">{groupIndex + 1}</span>
                      <span className="condition-text">{condition}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
