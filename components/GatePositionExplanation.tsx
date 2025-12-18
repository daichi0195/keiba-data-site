'use client';

import { useState } from 'react';

interface GatePositionExplanationProps {
  pageType?: 'jockey' | 'trainer' | 'course';
}

export default function GatePositionExplanation({ pageType = 'course' }: GatePositionExplanationProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isJockeyOrTrainerPage = pageType === 'jockey' || pageType === 'trainer';

  const explanationPoints = isJockeyOrTrainerPage ? [
    '芝とダートの複勝率を比較し、得意なコース傾向を判定しています。'
  ] : [
    '内枠（1-4枠）と外枠（5-8枠）の複勝率を比較し、内有利〜外有利を判定しています。'
  ];

  const title = isJockeyOrTrainerPage ? '得意なコース傾向について' : '枠順傾向について';
  const ariaLabel = isJockeyOrTrainerPage ? '得意なコース傾向について' : '枠順傾向について';

  const evaluationItems = isJockeyOrTrainerPage ? [
    'ダートの複勝率が芝より5%以上高い：ダートが得意',
    'ダートの複勝率が芝より2%以上高い：ややダートが得意',
    '複勝率の差がほぼない：差分なし',
    '芝の複勝率がダートより2%以上高い：やや芝が得意',
    '芝の複勝率がダートより5%以上高い：芝が得意',
  ] : [
    '内枠の複勝率が外枠より5%以上高い：内有利',
    '内枠の複勝率が外枠より2%以上高い：やや内有利',
    '複勝率の差がほぼない：差分なし',
    '外枠の複勝率が内枠より2%以上高い：やや外有利',
    '外枠の複勝率が内枠より5%以上高い：外有利',
  ];

  return (
    <>
      <button
        className="info-btn"
        onClick={() => setIsModalOpen(true)}
        aria-label={ariaLabel}
        title={ariaLabel}
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
            <h3 className="modal-title">{title}</h3>
            <div className="explanation-content">
              {explanationPoints.map((point, index) => (
                <p key={index} className="explanation-paragraph">{point}</p>
              ))}
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>評価方法</strong></p>
                <ul style={{ margin: '0.5rem 0 0 1.5rem', paddingLeft: 0, fontSize: '0.85rem' }}>
                  {evaluationItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
