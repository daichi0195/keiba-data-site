'use client';

import { useState } from 'react';

export default function RunningStyleExplanation() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const explanationPoints = [
    '逃げ・先行（逃、先）と差し・追込（差、追）の複勝率を比較し、逃げ・先行が得意〜差し・追込が得意を判定しています。'
  ];

  return (
    <>
      <button
        className="info-btn"
        onClick={() => setIsModalOpen(true)}
        aria-label="得意な脚質傾向について"
        title="得意な脚質傾向について"
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
            <h3 className="modal-title">得意な脚質傾向について</h3>
            <div className="explanation-content">
              {explanationPoints.map((point, index) => (
                <p key={index} className="explanation-paragraph">{point}</p>
              ))}
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>評価方法</strong></p>
                <ul style={{ margin: '0.5rem 0 0 1.5rem', paddingLeft: 0, fontSize: '0.85rem' }}>
                  <li>逃げ・先行の複勝率が差し・追込より5%以上高い：逃げ・先行が得意</li>
                  <li>逃げ・先行の複勝率が差し・追込より2%以上高い：やや逃げ・先行が得意</li>
                  <li>複勝率の差がほぼない：互角</li>
                  <li>差し・追込の複勝率が逃げ・先行より2%以上高い：やや差し・追込が得意</li>
                  <li>差し・追込の複勝率が逃げ・先行より5%以上高い：差し・追込が得意</li>
                </ul>
              </div>
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
                <p style={{ margin: '0 0 0.75rem 0' }}><strong>脚質の定義</strong></p>
                <div style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem' }}>
                  <p style={{ margin: '0 0 0.5rem 0' }}><strong>逃げ</strong>：コーナーのいずれかが1位通過</p>
                  <p style={{ margin: '0 0 0.5rem 0' }}><strong>先行</strong>：最終コーナーで第1集団</p>
                  <p style={{ margin: '0 0 0.5rem 0' }}><strong>差し</strong>：最終コーナーで第2集団かつ上がりが5位以内</p>
                  <p style={{ margin: '0 0 0.5rem 0' }}><strong>追込</strong>：最終コーナーで第3集団かつ上がりが5位以内</p>
                </div>
                <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>※出走頭数を3で割ったものを第1集団～第3集団とする</p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>※上記に該当しない場合は集計から除外する</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
