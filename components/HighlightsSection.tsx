'use client';

import { useState } from 'react';

interface HighlightsItem {
  name: string;
  record?: string;
  win_rate: string;
  place_rate: string;
  win_payback: string;
  place_payback: string;
}

interface HighlightsSectionProps {
  courseInfo: {
    buying_points: {
      jockey: { strong: HighlightsItem[]; upset?: HighlightsItem[]; weak: HighlightsItem[] };
      pedigree: {
        sire: { strong: HighlightsItem[]; weak: HighlightsItem[] };
        dam_sire: { strong: HighlightsItem[]; weak: HighlightsItem[] };
      };
      trainer: { strong: HighlightsItem[]; weak: HighlightsItem[] };
    };
  };
}

export default function HighlightsSection({ courseInfo }: HighlightsSectionProps) {
  const [modalState, setModalState] = useState<{ isOpen: boolean; subsectionKey: string | null }>({
    isOpen: false,
    subsectionKey: null
  });

  const renderCards = (items: HighlightsItem[], type: 'strong' | 'upset' | 'weak') => {
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
    items: HighlightsItem[],
    type: 'strong' | 'upset' | 'weak',
    subsectionKey: string
  ) => {
    const conditionMap = {
      strong: [
        '直近3年間の出走回数20回以上',
        '複勝率TOP5以内かつ複勝回収率100%以上'
      ],
      upset: [
        '直近3年間の出走回数20回以上',
        '複勝率TOP5未満かつ複勝回収率100%以上'
      ],
      weak: [
        '直近3年間の出走回数20回以上',
        '複勝率10%以下かつ複勝回収率30%未満'
      ]
    };

    const conditions = conditionMap[type];

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
            courseInfo.buying_points.jockey.strong,
            'strong',
            'jockey-strong'
          )}
          {courseInfo.buying_points.jockey.upset && courseInfo.buying_points.jockey.upset.length > 0 && (
            renderSubsection(
              'このコースでよく穴をあける騎手',
              courseInfo.buying_points.jockey.upset,
              'upset',
              'jockey-upset'
            )
          )}
          {renderSubsection(
            'このコースが苦手な騎手',
            courseInfo.buying_points.jockey.weak,
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
            courseInfo.buying_points.pedigree.sire.strong,
            'strong',
            'sire-strong'
          )}
          {renderSubsection(
            'このコースが苦手な種牡馬',
            courseInfo.buying_points.pedigree.sire.weak,
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
            courseInfo.buying_points.pedigree.dam_sire.strong,
            'strong',
            'dam-sire-strong'
          )}
          {renderSubsection(
            'このコースが苦手な母父',
            courseInfo.buying_points.pedigree.dam_sire.weak,
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
            courseInfo.buying_points.trainer.strong,
            'strong',
            'trainer-strong'
          )}
          {renderSubsection(
            'このコースが苦手な調教師',
            courseInfo.buying_points.trainer.weak,
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
                { key: 'jockey-strong', conditionGroups: [['直近3年間の出走回数20回以上'], ['複勝率TOP5以内かつ複勝回収率100%以上']] },
                { key: 'jockey-upset', conditionGroups: [['直近3年間の出走回数20回以上'], ['複勝率TOP5未満かつ複勝回収率100%以上']] },
                { key: 'jockey-weak', conditionGroups: [['直近3年間の出走回数20回以上'], ['複勝率10%以下'], ['複勝回収率30%未満']] },
                { key: 'sire-strong', conditionGroups: [['直近3年間の出走回数20回以上'], ['複勝率TOP5以内かつ複勝回収率100%以上']] },
                { key: 'sire-weak', conditionGroups: [['直近3年間の出走回数20回以上'], ['複勝率10%以下'], ['複勝回収率30%未満']] },
                { key: 'dam-sire-strong', conditionGroups: [['直近3年間の出走回数20回以上'], ['複勝率TOP5以内かつ複勝回収率100%以上']] },
                { key: 'dam-sire-weak', conditionGroups: [['直近3年間の出走回数20回以上'], ['複勝率10%以下'], ['複勝回収率30%未満']] },
                { key: 'trainer-strong', conditionGroups: [['直近3年間の出走回数20回以上'], ['複勝率TOP5以内かつ複勝回収率100%以上']] },
                { key: 'trainer-weak', conditionGroups: [['直近3年間の出走回数20回以上'], ['複勝率10%以下'], ['複勝回収率30%未満']] },
              ].find(item => item.key === modalState.subsectionKey)?.conditionGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="condition-group">
                  {group.map((condition, itemIndex) => (
                    <div key={itemIndex} className="condition-item-wrapper">
                      <span className="condition-number">{itemIndex + 1}</span>
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
