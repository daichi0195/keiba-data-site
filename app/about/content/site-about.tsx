import styles from '@/components/article-content.module.css';

export default function SiteAbout() {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>競馬データ.comについて</h2>
      <p className={styles.text}>
        競馬データ.comは、競馬予想に役立つデータやコラム等を発信するサイトです！<br />コース別成績、騎手・調教師・種牡馬データなど、豊富な統計情報を見やすく整理し、皆様の競馬予想をサポートします。
      </p>
      <p className={styles.text}>
        当サイトは、過去3年間の中央競馬のレース結果を基に、様々な角度から分析したデータを提供しています。データは定期的に更新され、常に最新の傾向を把握できるよう努めています。
      </p>
    </section>
  );
}
