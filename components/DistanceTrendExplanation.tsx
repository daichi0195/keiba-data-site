'use client';

import { useState } from 'react';

export default function DistanceTrendExplanation() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const explanationPoints = [
    '短距離・マイルと中距離・長距離の複勝率を比較し、得意な距離傾向を判定しています。'
  ];

  return (
    <>
      <button
        className="info-btn"
        onClick={() => setIsModalOpen(true)}
        aria-label="得意な距離傾向について"
        title="得意な距離傾向について"
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
            <h3 className="modal-title">得意な距離傾向について</h3>
            <div className="explanation-content">
              {explanationPoints.map((point, index) => (
                <p key={index} className="explanation-paragraph">{point}</p>
              ))}
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>評価方法</strong></p>
                <ul style={{ margin: '0.5rem 0 0 1.5rem', paddingLeft: 0, fontSize: '0.85rem' }}>
                  <li>短距離・マイルの複勝率が中距離・長距離より5%以上高い：短距離が得意</li>
                  <li>短距離・マイルの複勝率が中距離・長距離より2%以上高い：やや短距離が得意</li>
                  <li>複勝率の差がほぼない：差分なし</li>
                  <li>中距離・長距離の複勝率が短距離・マイルより2%以上高い：やや長距離が得意</li>
                  <li>中距離・長距離の複勝率が短距離・マイルより5%以上高い：長距離が得意</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
