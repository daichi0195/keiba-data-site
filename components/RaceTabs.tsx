'use client';

import { useState } from 'react';
import styles from './RaceTabs.module.css';
import FeaturedRaces from './FeaturedRaces';
import FeaturedVenues from './FeaturedVenues';
import AllVenues from './AllVenues';
import JockeyLeading from './JockeyLeading';

interface RaceTabsProps {
  onTabChange?: (tab: 'central' | 'local') => void;
}

export default function RaceTabs({ onTabChange }: RaceTabsProps) {
  const [activeTab, setActiveTab] = useState<'central' | 'local'>('central');

  const handleTabClick = (tab: 'central' | 'local') => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'central' ? styles.active : ''}`}
          onClick={() => handleTabClick('central')}
        >
          中央競馬
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'local' ? styles.active : ''}`}
          onClick={() => handleTabClick('local')}
        >
          地方競馬
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'central' && (
          <div className={styles.contentArea}>
            <section className="section">
              <h2 className="section-title">ピックアップ</h2>

              <div className={styles.subsection}>
                <h3 className={styles.subsectionTitle}>今週開催の注目レース</h3>
                <FeaturedRaces />
              </div>

              <div className={styles.subsection}>
                <h3 className={styles.subsectionTitle}>今週開催の競馬場データ</h3>
                <FeaturedVenues />
              </div>
            </section>

            <AllVenues />
            <JockeyLeading />
          </div>
        )}
        {activeTab === 'local' && (
          <div className={styles.contentArea}>
            <div className={styles.comingSoonBanner}>
              <h2 className={styles.comingSoonTitle}>COMING SOON</h2>
              <p className={styles.comingSoonText}>近日公開予定です！</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
