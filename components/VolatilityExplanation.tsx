'use client';

import { useState } from 'react';

export default function VolatilityExplanation() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const explanationPoints = [
    'このコースの「荒れやすさ」は、中央競馬の全てのコースにおける三連単の中央値（配当額）を基準に評価しています。',
    '三連単の中央値が高いほど、購入者の予想が外れやすく、本来の人気度よりも配当が高くなる傾向があります。',
    'これは、馬場状態や競走条件などの要因により、レース展開が予測しづらい（荒れやすい）ことを示しています。',
    '各コースの中央値を全コースで相対比較し、5段階で評価しています。'
  ];

  return (
    <>
      <button
        className="volatility-info-btn"
        onClick={() => setIsModalOpen(true)}
        aria-label="荒れやすさの評価方法について"
        title="荒れやすさの評価方法について"
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
            <h3 className="modal-title">荒れやすさの評価方法について</h3>
            <div className="volatility-explanation">
              {explanationPoints.map((point, index) => (
                <p key={index} className="explanation-paragraph">{point}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
