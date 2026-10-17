import styles from '@/components/article-content.module.css';

export default function RacingHistory() {
  return (
    <>
      <h2 className={styles.heading}>競馬歴について</h2>
      <p className={styles.text}>
        競馬デビューは2020年のアイビスサマーダッシュです。新潟の直線1000mで外枠の馬が一斉に外ラチ沿いへ寄っていく光景に驚き、
        「コースごとにこんなに有利不利があるのか」と気づいたことが、のちにコース別データを集計するきっかけになりました。
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
        好きな馬はグランアレグリア。好きなレースは2020年のスプリンターズステークスで、
        1200mの短距離戦でマイル王者が差し切った展開は、今でも「脚質と距離適性は数字だけでは測れない」と思い出させてくれる一戦です。
        応援している騎手は菱田裕二騎手です。
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
    </>
  );
}
