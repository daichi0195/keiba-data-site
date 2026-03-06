import styles from '@/components/article-content.module.css';

export default function SiteAbout() {
  return (
    <>
      <h2 className={styles.heading}>競馬データ.comについて</h2>
      <p className={styles.text}>
        競馬データ.comは、競馬予想に役立つデータやコラム等を発信するサイトです！
      </p>
      <p className={styles.text}>
        会員登録不要・完全無料で、怪しい予想サイトへの誘導も一切ありません。「世界で1番使いやすい競馬メディア」を目指して頑張ります！
      </p>
    </>
  );
}
