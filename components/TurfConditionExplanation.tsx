'use client';

import { useState } from 'react';

export default function TurfConditionExplanation() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const explanationPoints = [
    '良馬場と重馬場・不良馬場の複勝率を比較し、得意な馬場状態を判定しています。'
  ];

  return (
    <>
      <button
        className="info-btn"
        onClick={() => setIsModalOpen(true)}
        aria-label="得意な馬場傾向（芝）について"
        title="得意な馬場傾向（芝）について"
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
            <h3 className="modal-title">得意な馬場傾向（芝）について</h3>
            <div className="explanation-content">
              {explanationPoints.map((point, index) => (
                <p key={index} className="explanation-paragraph">{point}</p>
              ))}
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>評価方法</strong></p>
                <ul style={{ margin: '0.5rem 0 0 1.5rem', paddingLeft: 0, fontSize: '0.85rem' }}>
                  <li>良馬場の複勝率が重馬場・不良馬場より5%以上高い：良馬場が得意</li>
                  <li>良馬場の複勝率が重馬場・不良馬場より2%以上高い：やや良馬場が得意</li>
                  <li>複勝率の差がほぼない：差分なし</li>
                  <li>重馬場・不良馬場の複勝率が良馬場より2%以上高い：やや重馬場が得意</li>
                  <li>重馬場・不良馬場の複勝率が良馬場より5%以上高い：重馬場が得意</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
