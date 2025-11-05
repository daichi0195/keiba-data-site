import Link from 'next/link';
import styles from './page.module.css';

export default function HomePage() {
  const racecourses = [
    {
      name: '中山競馬場',
      nameEn: 'Nakayama',
      slug: 'nakayama',
      description: 'フェブラリーS、皐月賞など重賞多数',
      gradient: 'linear-gradient(135deg, #1db854 0%, #0ea342 100%)',
      icon: '🏇'
    },
    {
      name: '東京競馬場',
      nameEn: 'Tokyo',
      slug: 'tokyo',
      description: '日本ダービー、ジャパンCの舞台',
      gradient: 'linear-gradient(135deg, #3bbf66 0%, #1db854 100%)',
      icon: '🏆'
    },
    {
      name: '阪神競馬場',
      nameEn: 'Hanshin',
      slug: 'hanshin',
      description: '桜花賞、宝塚記念などG1レース',
      gradient: 'linear-gradient(135deg, #1a9f47 0%, #0ea342 100%)',
      icon: '🌸'
    },
    {
      name: '京都競馬場',
      nameEn: 'Kyoto',
      slug: 'kyoto',
      description: '菊花賞、秋華賞など伝統のレース',
      gradient: 'linear-gradient(135deg, #0ea342 0%, #0d7535 100%)',
      icon: '⛩️'
    }
  ];

  const surfaces = [
    { name: '芝', slug: 'turf', color: '#1db854' },
    { name: 'ダート', slug: 'dirt', color: '#d97706' }
  ];

  const distances = [1200, 1400, 1600, 1800, 2000, 2400];

  const features = [
    {
      icon: '📊',
      title: 'データドリブン分析',
      description: '直近3年間の膨大なレースデータを分析し、勝率・複勝率・回収率を可視化'
    },
    {
      icon: '🎯',
      title: '買いの法則・消しの法則',
      description: 'コース別に高成績の騎手・血統・調教師と、避けるべき要素を明確化'
    },
    {
      icon: '🔍',
      title: 'コース特性を可視化',
      description: '脚質有利度・荒れやすさ・枠順有利度をビジュアルで一目で理解'
    },
    {
      icon: '⚡',
      title: 'シンプル＆高速',
      description: 'モバイル対応で外出先でもサクサク閲覧。欲しい情報にすぐアクセス'
    }
  ];

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            データで読み解く
            <br />
            <span className={styles.heroTitleAccent}>競馬の法則</span>
          </h1>
          <p className={styles.heroDescription}>
            コース別の統計から見える、勝利のパターン。
            <br />
            騎手、血統、脚質、枠順──全てのデータがあなたの予想を変える。
          </p>
          <div className={styles.heroButtons}>
            <Link href="#racecourses" className={styles.heroCta}>
              競馬場を選ぶ
            </Link>
            <Link href="#features" className={styles.heroCtaSecondary}>
              特徴を見る
            </Link>
          </div>
        </div>
        <div className={styles.heroBackground}></div>
      </section>

      {/* Racecourses Section */}
      <section id="racecourses" className={styles.racecoursesSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>競馬場を選択</h2>
          <p className={styles.sectionSubtitle}>
            各競馬場のコース別データを詳しく分析
          </p>
        </div>

        <div className={styles.racecourseGrid}>
          {racecourses.map((racecourse) => (
            <div key={racecourse.slug} className={styles.racecourseCard}>
              <div className={styles.racecourseCardHeader} style={{ background: racecourse.gradient }}>
                <div className={styles.racecourseIcon}>{racecourse.icon}</div>
                <h3 className={styles.racecourseName}>{racecourse.name}</h3>
                <p className={styles.racecourseNameEn}>{racecourse.nameEn}</p>
              </div>
              <div className={styles.racecourseCardBody}>
                <p className={styles.racecourseDescription}>{racecourse.description}</p>

                <div className={styles.surfaceSelection}>
                  {surfaces.map((surface) => (
                    <div key={surface.slug} className={styles.surfaceGroup}>
                      <div className={styles.surfaceLabel}>
                        <span className={styles.surfaceDot} style={{ backgroundColor: surface.color }}></span>
                        {surface.name}
                      </div>
                      <div className={styles.distanceLinks}>
                        {distances.map((distance) => (
                          <Link
                            key={distance}
                            href={`/courses/${racecourse.slug}/${surface.slug}/${distance}`}
                            className={styles.distanceLink}
                          >
                            {distance}m
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>KEIBA DATA LABの特徴</h2>
          <p className={styles.sectionSubtitle}>
            競馬予想を楽しくする、データ分析の新しいカタチ
          </p>
        </div>

        <div className={styles.featureGrid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.featureCard}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>さあ、データで競馬を楽しもう</h2>
          <p className={styles.ctaDescription}>
            コース別の詳細データで、あなたの予想精度が変わります
          </p>
          <Link href="#racecourses" className={styles.ctaButton}>
            今すぐ始める
          </Link>
        </div>
      </section>
    </div>
  );
}
