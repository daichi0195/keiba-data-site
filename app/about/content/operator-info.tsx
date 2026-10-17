import Image from 'next/image';
import styles from '@/components/article-content.module.css';

export default function OperatorInfo() {
  return (
    <>
      <h2 className={styles.heading}>運営者について</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0 0 1rem 0' }}>
        <Image
          src="/images/authors/daichi.jpg"
          alt="運営者ダイチのアイコン"
          width={72}
          height={72}
          style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        />
        <div>
          <p className={styles.text} style={{ margin: 0, fontWeight: 700 }}>ダイチ（競馬データ.com 運営者）</p>
          <p className={styles.text} style={{ margin: 0 }}>
            <a href="https://x.com/daichikeibadata" target="_blank" rel="noopener noreferrer" className={styles.link}>
              X（旧Twitter）：@daichikeibadata
            </a>
          </p>
        </div>
      </div>
      <ul className={styles.list}>
        {/* 【要確認】年齢・経歴は公開してよい範囲に調整してください */}
        <li>1990年代後半生まれ。会社員としてWebマーケティングに携わったのち、現在は個人のマーケターとして活動しています。</li>
        <li>データの収集・集計基盤の構築（SQL・Python）、サイトの開発（Next.js）、記事の執筆まで、すべて運営者本人が行っています。</li>
        <li>2020年の競馬デビュー以来、毎週データを見ながら馬券を買い続けており、2025年からは一口馬主としても競馬に関わっています。</li>
        <li>競馬のほかにサウナが好きです。</li>
      </ul>

      <h2 className={styles.heading}>データとの向き合い方</h2>
      <p className={styles.text}>
        当サイトの統計はすべて、運営者が自分の予想に使うために作った集計をそのまま公開したものです。
        「よく言われる定説は本当にデータで支持されるのか」を確かめることを一貫したテーマにしており、
        コラムでは結論だけでなく集計の定義・対象期間・サンプル数を必ず示すようにしています。
      </p>

      <h2 className={styles.heading}>収益と広告について</h2>
      <p className={styles.text}>
        当サイトの運営費（データ基盤の利用料・サーバー代）は、サイト内に掲載する広告収入でまかなうことを予定しています。
        広告の掲載有無によってデータの内容や記事の結論が変わることはありません。
        また、有料の予想販売、予想会社や馬券購入サービスへの誘導、アフィリエイト目的の記事は行っていません。
      </p>
    </>
  );
}
