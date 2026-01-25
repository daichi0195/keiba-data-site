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
          <AllVenues />
          <JockeyLeading data={jockeyLeading} />
          <SireLeading data={sireLeading} />
          <TrainerLeading data={trainerLeading} />
        </div>
      </div>
    </div>
  );
}
