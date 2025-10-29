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
      jockey: { strong: HighlightsItem[]; weak: HighlightsItem[] };
      pedigree: { strong: HighlightsItem[]; weak: HighlightsItem[] };
      trainer: { strong: HighlightsItem[]; weak: HighlightsItem[] };
    };
  };
}

export default function HighlightsSection({ courseInfo }: HighlightsSectionProps) {
  const [expandedCards, setExpandedCards] = useState<{
    [key: string]: boolean;
  }>({});

  const toggleCard = (cardId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const renderCards = (items: HighlightsItem[], isStrong: boolean, sectionId: string) => {
    return (
      <div className="highlight-cards">
        {items.map((item) => {
          const cardId = `${sectionId}-${item.name}`;
          const isExpanded = expandedCards[cardId];

          return (
            <div
              key={item.name}
              className={`highlight-card ${
                isStrong ? 'highlight-card-strong' : 'highlight-card-weak'
              } ${isExpanded ? 'expanded' : ''}`}
              onClick={() => toggleCard(cardId)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  toggleCard(cardId);
                }
              }}
            >
              <div className="card-header">
                <div className="card-name">{item.name}</div>
                <span className={`card-toggle-icon ${isExpanded ? 'expanded' : ''}`}>
                  ▼
                </span>
              </div>
              {isExpanded && (
                <div className="card-stats">
                  <div className="stat-item">
                    <span className="stat-label">勝率</span>
                    <span className="stat-value">{item.win_rate}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">複勝率</span>
                    <span className="stat-value">{item.place_rate}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">単勝</span>
                    <span className="stat-value">{item.win_payback}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">複勝</span>
                    <span className="stat-value">{item.place_payback}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderSubsection = (
    sectionId: string,
    title: string,
    items: HighlightsItem[],
    isStrong: boolean
  ) => {
    return (
      <div key={sectionId} className="highlight-subsection">
        <h4 className="highlight-subsection-title">{title}</h4>
        {renderCards(items, isStrong, sectionId)}
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
            'jockey-strong',
            'このコースが得意な騎手',
            courseInfo.buying_points.jockey.strong,
            true
          )}
          {renderSubsection(
            'jockey-weak',
            'このコースが苦手な騎手',
            courseInfo.buying_points.jockey.weak,
            false
          )}
          <div className="section-divider"></div>
        </div>

        {/* 血統セクション */}
        <div className="highlight-item">
          <h3 className="gauge-label">血統</h3>
          {renderSubsection(
            'pedigree-strong',
            'このコースが得意な血統',
            courseInfo.buying_points.pedigree.strong,
            true
          )}
          {renderSubsection(
            'pedigree-weak',
            'このコースが苦手な血統',
            courseInfo.buying_points.pedigree.weak,
            false
          )}
          <div className="section-divider"></div>
        </div>

        {/* 調教師セクション */}
        <div className="highlight-item">
          <h3 className="gauge-label">調教師</h3>
          {renderSubsection(
            'trainer-strong',
            'このコースが得意な調教師',
            courseInfo.buying_points.trainer.strong,
            true
          )}
          {renderSubsection(
            'trainer-weak',
            'このコースが苦手な調教師',
            courseInfo.buying_points.trainer.weak,
            false
          )}
          <div className="section-divider"></div>
        </div>
      </div>
    </section>
  );
}
