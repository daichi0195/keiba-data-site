import Image from 'next/image';
import { StaticSection, staticLink } from '@/components/StaticPageLayout';
import st from '@/components/datapage/static/static.module.css';

export default function OperatorInfo() {
  return (
    <>
      <StaticSection title="運営者について">
        <div className={st.profile}>
          <Image
            src="/images/authors/daichi.jpg"
            alt="運営者ダイチのアイコン"
            width={72}
            height={72}
            className={st.avatar}
          />
          <div>
            <p className={st.profileName}>ダイチ（競馬データ.com 運営者）</p>
            <p>
              <a href="https://x.com/daichikeibadata" target="_blank" rel="noopener noreferrer" className={staticLink}>
                X（旧Twitter）：@daichikeibadata
              </a>
            </p>
          </div>
        </div>
        <ul>
          {/* 【要確認】年齢・経歴は公開してよい範囲に調整してください */}
          <li>1990年代後半生まれ。会社員としてWebマーケティングに携わったのち、現在は個人のマーケターとして活動しています。</li>
          <li>データの収集・集計基盤の構築（SQL・Python）、サイトの開発（Next.js）、記事の執筆まで、すべて運営者本人が行っています。</li>
          <li>2020年の競馬デビュー以来、毎週データを見ながら馬券を買い続けており、2025年からは一口馬主としても競馬に関わっています。</li>
          <li>競馬のほかにサウナが好きです。</li>
        </ul>
      </StaticSection>

      <StaticSection title="データとの向き合い方">
        <p>
          当サイトの統計はすべて、運営者が自分の予想に使うために作った集計をそのまま公開したものです。
          「よく言われる定説は本当にデータで支持されるのか」を確かめることを一貫したテーマにしており、
          コラムでは結論だけでなく集計の定義・対象期間・サンプル数を必ず示すようにしています。
        </p>
      </StaticSection>

      <StaticSection title="収益と広告について">
        <p>
          当サイトの運営費（データ基盤の利用料・サーバー代）は、サイト内に掲載する広告収入でまかなうことを予定しています。
          広告の掲載有無によってデータの内容や記事の結論が変わることはありません。
          また、有料の予想販売、予想会社や馬券購入サービスへの誘導、アフィリエイト目的の記事は行っていません。
        </p>
      </StaticSection>
    </>
  );
}
