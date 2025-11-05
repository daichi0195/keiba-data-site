import Link from 'next/link';
import styles from './page.module.css';

interface Racecourse {
  name: string;
  nameEn: string;
  courses: number;
  turfCourses: number;
  dirtCourses: number;
  region: 'kanto' | 'kansai' | 'regional';
  featured?: boolean;
  sampleCourseUrl?: string;
}

const racecourses: Racecourse[] = [
  { name: '中山', nameEn: 'nakayama', courses: 11, turfCourses: 7, dirtCourses: 4, region: 'kanto', featured: true, sampleCourseUrl: '/courses/nakayama/dirt/1800' },
  { name: '東京', nameEn: 'tokyo', courses: 13, turfCourses: 8, dirtCourses: 5, region: 'kanto', featured: true },
  { name: '阪神', nameEn: 'hanshin', courses: 13, turfCourses: 9, dirtCourses: 4, region: 'kansai', featured: true },
  { name: '京都', nameEn: 'kyoto', courses: 15, turfCourses: 11, dirtCourses: 4, region: 'kansai', featured: true },
  { name: '札幌', nameEn: 'sapporo', courses: 9, turfCourses: 6, dirtCourses: 3, region: 'regional' },
  { name: '函館', nameEn: 'hakodate', courses: 8, turfCourses: 5, dirtCourses: 3, region: 'regional' },
  { name: '福島', nameEn: 'fukushima', courses: 7, turfCourses: 4, dirtCourses: 3, region: 'regional' },
  { name: '新潟', nameEn: 'niigata', courses: 11, turfCourses: 9, dirtCourses: 2, region: 'regional' },
  { name: '中京', nameEn: 'chukyo', courses: 9, turfCourses: 5, dirtCourses: 4, region: 'regional' },
  { name: '小倉', nameEn: 'kokura', courses: 8, turfCourses: 5, dirtCourses: 3, region: 'regional' },
];

export default function HomePage() {
  const featuredRacecourses = racecourses.filter(r => r.featured);
  const regionalRacecourses = racecourses.filter(r => !r.featured);

  return (
    <div className={styles.pageContainer}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroIcon}>🏇</div>
          <h1 className={styles.heroTitle}>
            競馬予想を、<br />
            データで変える
          </h1>
          <p className={styles.heroSubtitle}>
            全国10競馬場、直近3年間のデータを徹底分析<br />
            勝つための法則がここに
          </p>
          <div className={styles.heroStats}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>10</div>
              <div className={styles.statLabel}>競馬場</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>120+</div>
              <div className={styles.statLabel}>コース</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>3年分</div>
              <div className={styles.statLabel}>データ</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Racecourses */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>主要競馬場</h2>
          <p className={styles.sectionSubtitle}>中央4場の詳細データ</p>
        </div>
        <div className={styles.featuredGrid}>
          {featuredRacecourses.map((racecourse) => (
            <Link
              key={racecourse.nameEn}
              href={racecourse.sampleCourseUrl || '#'}
              className={styles.featuredCard}
            >
              <div className={styles.cardBadge}>注目</div>
              <div className={styles.cardTitle}>{racecourse.name}競馬場</div>
              <div className={styles.cardMeta}>
                <div className={styles.metaRow}>
                  <span className={styles.metaIcon}>🌿</span>
                  <span>芝 {racecourse.turfCourses}コース</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaIcon}>⛰️</span>
                  <span>ダート {racecourse.dirtCourses}コース</span>
                </div>
              </div>
              <div className={styles.cardFooter}>
                <span className={styles.cardLink}>
                  {racecourse.sampleCourseUrl ? 'データを見る' : '準備中'}
                </span>
                <span className={styles.cardArrow}>→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* All Racecourses */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>地方開催競馬場</h2>
          <p className={styles.sectionSubtitle}>札幌・函館・福島・新潟・中京・小倉</p>
        </div>
        <div className={styles.racecourseGrid}>
          {regionalRacecourses.map((racecourse) => (
            <Link
              key={racecourse.nameEn}
              href={racecourse.sampleCourseUrl || '#'}
              className={styles.racecourseCard}
            >
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>{racecourse.name}競馬場</div>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.courseCount}>
                  <span className={styles.countNumber}>{racecourse.courses}</span>
                  <span className={styles.countLabel}>コース</span>
                </div>
                <div className={styles.courseSplit}>
                  <div className={styles.splitItem}>
                    <span className={styles.splitIcon}>🌿</span>
                    <span>{racecourse.turfCourses}</span>
                  </div>
                  <div className={styles.splitDivider}>/</div>
                  <div className={styles.splitItem}>
                    <span className={styles.splitIcon}>⛰️</span>
                    <span>{racecourse.dirtCourses}</span>
                  </div>
                </div>
              </div>
              <div className={styles.cardHoverOverlay}>
                <span className={styles.hoverText}>詳細を見る →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>KEIBA DATA LABの特徴</h2>
        </div>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📊</div>
            <h3 className={styles.featureTitle}>圧倒的なデータ量</h3>
            <p className={styles.featureDescription}>
              直近3年間、全国10競馬場のレースデータを網羅。騎手、血統、枠順、脚質など、あらゆる角度から分析。
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎯</div>
            <h3 className={styles.featureTitle}>買いの法則を発見</h3>
            <p className={styles.featureDescription}>
              勝率・複勝率・回収率を多角的に分析。好走傾向と消しパターンを一目で把握できます。
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>⚡</div>
            <h3 className={styles.featureTitle}>使いやすいUI</h3>
            <p className={styles.featureDescription}>
              モバイル対応のレスポンシブデザイン。競馬場とコースを選ぶだけで、必要なデータにすぐアクセス。
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>今すぐ予想を始めよう</h2>
          <p className={styles.ctaSubtitle}>
            気になる競馬場を選んで、データ分析をスタート
          </p>
          <div className={styles.ctaButtons}>
            <Link href="/courses/nakayama/dirt/1800" className={styles.ctaButton}>
              サンプルデータを見る
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
