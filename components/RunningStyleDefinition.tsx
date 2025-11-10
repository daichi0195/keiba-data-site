'use client';

export default function RunningStyleDefinition() {
  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div className="running-style-detail-title">脚質の定義</div>
      <div style={{ margin: '0.75rem 0 0 0', fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
        <p style={{ margin: '0 0 0.5rem 0' }}>最終コーナーの位置で3集団に分類：</p>
        <ul style={{ margin: '0 0 0.75rem 1.5rem', paddingLeft: 0, fontSize: '0.85rem' }}>
          <li>第1集団：1位～出走馬数/3</li>
          <li>第2集団：出走馬数/3+1～2×出走馬数/3</li>
          <li>第3集団：2×出走馬数/3+1～</li>
        </ul>
        <ul style={{ margin: '0 0 0 1.5rem', paddingLeft: 0, fontSize: '0.85rem' }}>
          <li><strong>逃げ</strong>：コーナーのいずれかが1位通過</li>
          <li><strong>先行</strong>：最終コーナーで第1集団</li>
          <li><strong>差し</strong>：最終コーナーで第2集団かつ上がり（ラスト3F）が5位以内</li>
          <li><strong>追込</strong>：最終コーナーで第3集団かつ上がり（ラスト3F）が5位以内</li>
        </ul>
      </div>
    </div>
  );
}
