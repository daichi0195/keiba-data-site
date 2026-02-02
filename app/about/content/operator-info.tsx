import styles from '@/components/article-content.module.css';

export default function OperatorInfo() {
  return (
    <>
      <h2 className={styles.heading}>運営者について</h2>
      <p className={styles.text}>
        田舎に住んでいる競馬好きの27歳🐴
      </p>
      <p className={styles.text}>
        現在は個人でマーケター（<del>とは名ばかりのなんでも屋</del>）として活動しています。
      </p>
    </>
  );
}
