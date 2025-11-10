'use client';

export default function RunningStyleDefinition() {
  return (
    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
      <p style={{ margin: '0 0 0.5rem 0' }}><strong>脚質の定義</strong></p>
      <ul style={{ margin: '0.5rem 0 0 1.5rem', paddingLeft: 0, fontSize: '0.85rem' }}>
        <li><strong>逃げ</strong>：コーナーのいずれかが1位通過</li>
        <li><strong>先行</strong>：最終コーナーで第1集団（出走馬数の上位1/3）</li>
        <li><strong>差し</strong>：最終コーナーで第2集団かつ上がり（ラスト3F）が5位以内</li>
        <li><strong>追込</strong>：最終コーナーで第3集団かつ上がり（ラスト3F）が5位以内</li>
      </ul>
    </div>
  );
}
