'use client';

import { useState } from 'react';

export default function VolatilityExplanation() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const explanationPoints = [
    '三連単の中央値（配当額）が高いほど、レース展開が予測しづらく荒れやすいことを示します。',
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
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>計算対象データ：</strong></p>
                <ul style={{ margin: '0.5rem 0 0 1.5rem', paddingLeft: 0, fontSize: '0.85rem' }}>
                  <li>直近3年間のレースデータを使用</li>
                  <li>障害のコースは除外</li>
                  <li>3年間の実施回数が20回未満のコースは除外</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
