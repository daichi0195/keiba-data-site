import { StaticSection } from '@/components/StaticPageLayout';
import st from '@/components/datapage/static/static.module.css';

export default function RacingHistory() {
  return (
    <>
      <StaticSection title="競馬歴について">
        <p>
          競馬デビューは2020年のアイビスサマーダッシュです。新潟の直線1000mで外枠の馬が一斉に外ラチ沿いへ寄っていく光景に驚き、
          「コースごとにこんなに有利不利があるのか」と気づいたことが、のちにコース別データを集計するきっかけになりました。
        </p>
        <div className={st.video}>
          <iframe
            src="https://www.youtube.com/embed/x3HBXEIdhgM"
            title="2020年アイビスサマーダッシュ"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <p>
          好きな馬はグランアレグリア。好きなレースは2020年のスプリンターズステークスで、
          1200mの短距離戦でマイル王者が差し切った展開は、今でも「脚質と距離適性は数字だけでは測れない」と思い出させてくれる一戦です。
          応援している騎手は菱田裕二騎手です。
        </p>
        <div className={st.video}>
          <iframe
            src="https://www.youtube.com/embed/OyHexM0B17w"
            title="2020年スプリンターズステークス"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </StaticSection>
    </>
  );
}
