'use client';

import { useState } from 'react';

export default function GatePositionExplanation() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const explanationPoints = [
    '内枠（1-4枠）と外枠（5-8枠）の複勝率を比較し、内有利〜外有利を判定しています。'
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
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>評価方法</strong></p>
                <ul style={{ margin: '0.5rem 0 0 1.5rem', paddingLeft: 0, fontSize: '0.85rem' }}>
                  <li>内枠平均 - 外枠平均 ≥ 5%：内有利</li>
                  <li>内枠平均 - 外枠平均 ≥ 2%：やや内有利</li>
                  <li>-2% &lt; 差分 &lt; 2%：互角</li>
                  <li>内枠平均 - 外枠平均 ≤ -2%：やや外有利</li>
                  <li>内枠平均 - 外枠平均 ≤ -5%：外有利</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
