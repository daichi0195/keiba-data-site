'use client';

export default function RunningStyleDefinition() {
  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div className="running-style-detail-title">脚質の定義</div>
      <div style={{ margin: '0.75rem 0 0 0', fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
        <p style={{ margin: '0 0 0.5rem 0' }}><strong>逃げ</strong>：コーナーのいずれかが1位通過</p>
        <p style={{ margin: '0 0 0.5rem 0' }}><strong>先行</strong>：最終コーナーで第1集団</p>
        <p style={{ margin: '0 0 0.5rem 0' }}><strong>差し</strong>：最終コーナーで第2集団かつ上がりが5位以内</p>
        <p style={{ margin: '0 0 0.5rem 0' }}><strong>追込</strong>：最終コーナーで第3集団かつ上がりが5位以内</p>
        <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>※出走頭数を3で割ったものを第1集団～第3集団とする</p>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>※上記に該当しない場合は集計から除外する</p>
      </div>
    </div>
  );
}
