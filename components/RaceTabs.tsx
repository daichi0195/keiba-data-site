'use client';

import styles from './RaceTabs.module.css';
import FeaturedRaces from './FeaturedRaces';
import FeaturedVenues from './FeaturedVenues';
import AllVenues from './AllVenues';
import JockeyLeading from './JockeyLeading';
import SireLeading from './SireLeading';
import TrainerLeading from './TrainerLeading';
import { LeadingData } from '@/lib/getLeadingData';

interface RaceTabsProps {
  jockeyLeading: LeadingData[];
  trainerLeading: LeadingData[];
  sireLeading: LeadingData[];
}

export default function RaceTabs({ jockeyLeading, trainerLeading, sireLeading }: RaceTabsProps) {
  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabContent}>
        <div className={styles.contentArea}>
          <section className="section">
            <h2 className="section-title">ピックアップデータ</h2>

            <div className={`${styles.subsection} ${styles.comingSoonSection}`}>
              <h3 className={styles.subsectionTitle}>今週開催の注目レース</h3>
              <div className={styles.comingSoonOverlay}>
                <div className={styles.comingSoonLabel}>COMING SOON</div>
              </div>
              <div className={styles.greyedContent}>
                <FeaturedRaces />
              </div>
            </div>

            <div className={styles.subsection}>
              <h3 className={styles.subsectionTitle}>今週開催の競馬場データ</h3>
              <FeaturedVenues />
            </div>
          </section>

          <AllVenues />
          <JockeyLeading data={jockeyLeading} />
          <SireLeading data={sireLeading} />
          <TrainerLeading data={trainerLeading} />
        </div>
      </div>
    </div>
  );
}
