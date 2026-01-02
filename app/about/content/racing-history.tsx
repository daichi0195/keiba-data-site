import styles from '@/components/article-content.module.css';

export default function RacingHistory() {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>競馬歴について</h2>
      <p className={styles.text}>
        2020年のアイビスサマーダッシュが競馬デビューです！<br />
        ジョーカナチャンで馬券を取って以来、菱田騎手を応援しています📣
      </p>
      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%', margin: '1rem 0' }}>
        <iframe
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
          src="https://www.youtube.com/embed/x3HBXEIdhgM"
          title="2020年アイビスサマーダッシュ"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <p className={styles.text}>
        好きな馬はグランアレグリアで、好きなレースは2020年のスプリンターズステークス（ラジオ日経実況版）です。
      </p>
      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%', margin: '1rem 0' }}>
        <iframe
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
          src="https://www.youtube.com/embed/OyHexM0B17w"
          title="2020年スプリンターズステークス"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <p className={styles.text}>

      </p>
    </section>
  );
}
