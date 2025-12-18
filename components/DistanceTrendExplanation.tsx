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
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
                <p style={{ margin: '0 0 0.75rem 0' }}><strong>距離の定義</strong></p>
                <div style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem' }}>
                  <p style={{ margin: '0 0 0.5rem 0' }}><strong>短距離</strong>：1000m～1300m</p>
                  <p style={{ margin: '0 0 0.5rem 0' }}><strong>マイル</strong>：1301m～1899m</p>
                  <p style={{ margin: '0 0 0.5rem 0' }}><strong>中距離</strong>：1900m～2100m</p>
                  <p style={{ margin: '0 0 0.5rem 0' }}><strong>長距離</strong>：2101m～</p>
                </div>
                <p className="note-text">※IFHA（国際競馬統括機関連盟）の基準を採用</p>
                <p className="note-text" style={{ marginTop: '0.25rem' }}>※長距離レースが少ないため中長距離は長距離に分類</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
