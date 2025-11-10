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
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569', lineHeight: '1.6' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>評価方法</strong></p>
                <p style={{ margin: '0.3rem 0' }}>内枠の複勝率が外枠より5%以上高い場合は「内有利」、2%以上高い場合は「やや内有利」と評価します。逆に外枠の複勝率が内枠より高い場合は「外有利」「やや外有利」と評価し、差がほぼない場合は「互角」と判定します。</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
