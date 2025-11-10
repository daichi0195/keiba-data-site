'use client';

import { useState } from 'react';

export default function RunningStyleExplanation() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const explanationPoints = [
    '逃げ・先行（逃、先）と差し・追込（差、追）の複勝率を比較し、逃げ・先行有利〜差し・追込有利を判定しています。'
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
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>脚質の定義</strong></p>
                <ul style={{ margin: '0.5rem 0 0 1.5rem', paddingLeft: 0, fontSize: '0.85rem' }}>
                  <li><strong>逃げ</strong>：コーナーのいずれかが1位通過</li>
                  <li><strong>先行</strong>：最終コーナーで第1集団（出走馬数の上位1/3）</li>
                  <li><strong>差し</strong>：最終コーナーで第2集団かつ上がり（ラスト3F）が5位以内</li>
                  <li><strong>追込</strong>：最終コーナーで第3集団かつ上がり（ラスト3F）が5位以内</li>
                </ul>
              </div>
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>評価方法</strong></p>
                <ul style={{ margin: '0.5rem 0 0 1.5rem', paddingLeft: 0, fontSize: '0.85rem' }}>
                  <li>逃げ・先行の複勝率が差し・追込より5%以上高い：逃げ・先行有利</li>
                  <li>逃げ・先行の複勝率が差し・追込より2%以上高い：やや逃げ・先行有利</li>
                  <li>複勝率の差がほぼない：互角</li>
                  <li>差し・追込の複勝率が逃げ・先行より2%以上高い：やや差し・追込有利</li>
                  <li>差し・追込の複勝率が逃げ・先行より5%以上高い：差し・追込有利</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
