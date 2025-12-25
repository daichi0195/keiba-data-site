'use client';

import { useState } from 'react';

export default function AgeTrendExplanation() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const explanationPoints = [
    '2歳-3歳と古馬（4歳以上）の複勝率を比較し、早熟型か晩成型かを判定しています。'
  ];

  return (
    <>
      <button
        className="info-btn"
        onClick={() => setIsModalOpen(true)}
        aria-label="馬齢別傾向について"
        title="馬齢別傾向について"
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
            <h3 className="modal-title">馬齢別傾向について</h3>
            <div className="explanation-content">
              {explanationPoints.map((point, index) => (
                <p key={index} className="explanation-paragraph">{point}</p>
              ))}
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>評価方法</strong></p>
                <ul style={{ margin: '0.5rem 0 0 1.5rem', paddingLeft: 0, fontSize: '0.85rem' }}>
                  <li>2歳-3歳の複勝率が古馬（4歳以上）より5%以上高い：早熟型</li>
                  <li>2歳-3歳の複勝率が古馬（4歳以上）より2%以上高い：やや早熟型</li>
                  <li>複勝率の差がほぼない：差分なし</li>
                  <li>古馬（4歳以上）の複勝率が2歳-3歳より2%以上高い：やや晩成型</li>
                  <li>古馬（4歳以上）の複勝率が2歳-3歳より5%以上高い：晩成型</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
