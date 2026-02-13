'use client';

export default function DistanceDefinition() {
  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div className="running-style-detail-title">距離の定義</div>
      <div style={{ margin: '0.75rem 0 0 0', fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
        <p style={{ margin: '0 0 0.5rem 0' }}><strong>短距離</strong>：1000m～1300m</p>
        <p style={{ margin: '0 0 0.5rem 0' }}><strong>マイル</strong>：1400m～1600m</p>
        <p style={{ margin: '0 0 0.5rem 0' }}><strong>中距離</strong>：1700m～2100m</p>
        <p style={{ margin: '0 0 0.5rem 0' }}><strong>長距離</strong>：2200m～</p>
        <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>※IFHA（国際競馬統括機関連盟）の基準を採用</p>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>※長距離レースが少ないため中長距離は長距離に分類</p>
      </div>
    </div>
  );
}
