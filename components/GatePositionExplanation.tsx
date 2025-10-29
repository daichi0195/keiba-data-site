'use client';

import { useState } from 'react';

export default function GatePositionExplanation() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const explanationPoints = [
    '「枠順傾向」は、1〜8の各枠番号から出走した馬の複勝率を基準に評価しています。',
    '特定の枠番号から出走した馬が有利または不利になる傾向を示しており、馬場の広さ、コーナーまでの距離、競馬場の形状などの要因に影響されます。',
    '各コースの枠順データを全コースで相対比較し、5段階で評価しています。'
  ];

  return (
    <>
      <button
        className="info-btn"
        onClick={() => setIsModalOpen(true)}
        aria-label="枠順傾向について"
        title="枠順傾向について"
      >
        ?
      </button>

      {isModalOpen && (
        <div className="explanation-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="explanation-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setIsModalOpen(false)}
            >
              ×
            </button>
            <h3 className="modal-title">枠順傾向について</h3>
            <div className="explanation-content">
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
