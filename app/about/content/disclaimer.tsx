import styles from '@/components/article-content.module.css';

export default function Disclaimer() {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>免責事項</h2>
      <p className={styles.text}>
        当サイトで提供する情報は、過去のレース結果に基づく統計データであり、将来のレース結果を保証するものではありません。馬券の購入は自己責任で行ってください。
      </p>
      <p className={styles.text}>
        当サイトの情報を利用して生じたいかなる損害についても、当サイトは一切の責任を負いかねます。また、掲載している情報は予告なく変更される場合があります。
      </p>
      <p className={styles.text}>
        データの正確性には最善を尽くしていますが、誤りや最新性の欠如がある可能性がございます。重要な情報については、必ず公式データをご確認ください。
      </p>
    </section>
  );
}
