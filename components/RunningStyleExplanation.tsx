'use client';

import { useState } from 'react';

export default function RunningStyleExplanation() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const explanationPoints = [
    '「脚質傾向」は、逃げ、先行、追込、差しなどの脚質ごとの複勝率を基準に評価しています。',
    'コースの特性（直線の長さ、カーブの大きさ、スタート地点など）により、特定の脚質が有利または不利になります。',
    '各コースの脚質データを全コースで相対比較し、5段階で評価しています。'
  ];

  return (
    <>
      <button
        className="info-btn"
        onClick={() => setIsModalOpen(true)}
        aria-label="脚質傾向について"
        title="脚質傾向について"
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
            <h3 className="modal-title">脚質傾向について</h3>
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
