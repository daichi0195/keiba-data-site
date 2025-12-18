'use client';

import { useState } from 'react';

interface VolatilityExplanationProps {
  pageType?: 'jockey' | 'trainer' | 'course';
}

export default function VolatilityExplanation({ pageType = 'course' }: VolatilityExplanationProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isJockeyOrTrainerPage = pageType === 'jockey' || pageType === 'trainer';
  const personType = pageType === 'jockey' ? '騎手' : pageType === 'trainer' ? '調教師' : '';

  const explanationPoints = isJockeyOrTrainerPage ? [
    '人気時の複勝率が高いほど、信頼度が高いことを示します。',
    `各${personType}の1番人気時の複勝率を全${personType}で相対比較し、5段階で評価しています。`
  ] : [
    '三連単の中央値（配当額）が高いほど、レース展開が予測しづらく荒れやすいことを示します。',
    '各コースの中央値を全コースで相対比較し、5段階で評価しています。'
  ];

  const title = isJockeyOrTrainerPage ? '信頼度の評価方法について' : '荒れやすさの評価方法について';
  const ariaLabel = isJockeyOrTrainerPage ? '信頼度の評価方法について' : '荒れやすさの評価方法について';
  const detailTitle = isJockeyOrTrainerPage ? `対象${personType}` : '対象コース';
  const detailItems = isJockeyOrTrainerPage ? [
    '直近3年間のレースデータを使用',
    pageType === 'jockey' ? '1番人気での騎乗が10回以上の騎手のみを対象' : '1番人気での出走が10回以上の調教師のみを対象',
  ] : [
    '直近3年間のレースデータを使用',
    '障害のコースは除外',
    '3年間の実施回数が20回未満のコースは除外'
  ];

  return (
    <>
      <button
        className="volatility-info-btn"
        onClick={() => setIsModalOpen(true)}
        aria-label={ariaLabel}
        title={ariaLabel}
      >
        ?
      </button>

      {isModalOpen && (
        <div className="volatility-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="volatility-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setIsModalOpen(false)}
            >
              ×
            </button>
            <h3 className="modal-title">{title}</h3>
            <div className="volatility-explanation">
              {explanationPoints.map((point, index) => (
                <p key={index} className="explanation-paragraph">{point}</p>
              ))}
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>{detailTitle}</strong></p>
                <ul style={{ margin: '0.5rem 0 0 1.5rem', paddingLeft: 0, fontSize: '0.85rem' }}>
                  {detailItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
