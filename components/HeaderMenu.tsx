'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './HeaderMenu.module.css';
import { getCoursesByRacecourse, getCourseUrl, getCourseDisplayName } from '@/lib/courses';
import { ALL_JOCKEYS, type JockeyInfo } from '@/lib/jockeys';
import { ALL_TRAINERS, type TrainerInfo } from '@/lib/trainers';
import { ALL_SIRES, type SireInfo } from '@/lib/sires';

const racecoursesData = getCoursesByRacecourse().map(group => ({
  name: group.racecourse_ja,
  nameEn: group.racecourse,
  courses: group.courses
}));

// 騎手データを五十音順にグループ化
const getKanaGroup = (kana: string): string => {
  // kanaが空の場合は「その他」に分類
  if (!kana) return 'その他';

  const first = kana.charAt(0);

  // あ行
  if (/[あいうえおアイウエオ]/.test(first)) return 'あ行';
  // か行
  if (/[かきくけこがぎぐげごカキクケコガギグゲゴ]/.test(first)) return 'か行';
  // さ行
  if (/[さしすせそざじずぜぞサシスセソザジズゼゾ]/.test(first)) return 'さ行';
  // た行
  if (/[たちつてとだぢづでどタチツテトダヂヅデド]/.test(first)) return 'た行';
  // な行
  if (/[なにぬねのナニヌネノ]/.test(first)) return 'な行';
  // は行
  if (/[はひふへほばびぶべぼぱぴぷぺぽハヒフヘホバビブベボパピプペポ]/.test(first)) return 'は行';
  // ま行
  if (/[まみむめもマミムメモ]/.test(first)) return 'ま行';
  // や行
  if (/[やゆよヤユヨ]/.test(first)) return 'や行';
  // ら行
  if (/[らりるれろラリルレロ]/.test(first)) return 'ら行';
  // わ行
  if (/[わをんワヲン]/.test(first)) return 'わ行';

  // 記号・外国人名など
  return 'その他';
};

const jockeysData = (() => {
  const grouped: Record<string, JockeyInfo[]> = {};

  ALL_JOCKEYS.forEach(jockey => {
    const group = getKanaGroup(jockey.kana);
    if (!grouped[group]) {
      grouped[group] = [];
    }
    grouped[group].push(jockey);
  });

  // 五十音順に並び替え
  const kanaOrder = ['あ行', 'か行', 'さ行', 'た行', 'な行', 'は行', 'ま行', 'や行', 'ら行', 'わ行', 'その他'];

  return kanaOrder
    .filter(kana => grouped[kana])
    .map(kana => ({
      kana,
      jockeys: grouped[kana].sort((a, b) => a.kana.localeCompare(b.kana, 'ja'))
    }));
})();

// 調教師データを五十音順にグループ化
const trainersData = (() => {
  const grouped: Record<string, TrainerInfo[]> = {};

  ALL_TRAINERS.forEach(trainer => {
    const group = getKanaGroup(trainer.kana);
    if (!grouped[group]) {
      grouped[group] = [];
    }
    grouped[group].push(trainer);
  });

  // 五十音順に並び替え
  const kanaOrder = ['あ行', 'か行', 'さ行', 'た行', 'な行', 'は行', 'ま行', 'や行', 'ら行', 'わ行', 'その他'];

  return kanaOrder
    .filter(kana => grouped[kana])
    .map(kana => ({
      kana,
      trainers: grouped[kana].sort((a, b) => a.kana.localeCompare(b.kana, 'ja'))
    }));
})();

// 種牡馬データを五十音順にグループ化
const siresData = (() => {
  const grouped: Record<string, SireInfo[]> = {};

  ALL_SIRES.forEach(sire => {
    // カタカナの種牡馬名から50音グループを判定
    const group = getKanaGroup(sire.name);
    if (!grouped[group]) {
      grouped[group] = [];
    }
    grouped[group].push(sire);
  });

  // 五十音順に並び替え
  const kanaOrder = ['あ行', 'か行', 'さ行', 'た行', 'な行', 'は行', 'ま行', 'や行', 'ら行', 'わ行', 'その他'];

  return kanaOrder
    .filter(kana => grouped[kana])
    .map(kana => ({
      kana,
      sires: grouped[kana].sort((a, b) => a.name.localeCompare(b.name, 'ja'))
    }));
})();

// 既存の型定義（後方互換性のため残す）
const _oldRacecoursesData_UNUSED = [
  {
    name: '札幌競馬場',
    nameEn: 'sapporo',
    courses: [
      { name: '芝 1000m', distance: 1000, surface: 'turf' },
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1500m', distance: 1500, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2600m', distance: 2600, surface: 'turf' },
      { name: 'ダート 1000m', distance: 1000, surface: 'dirt' },
      { name: 'ダート 1700m', distance: 1700, surface: 'dirt' },
      { name: 'ダート 2400m', distance: 2400, surface: 'dirt' },
    ],
  },
  {
    name: '函館競馬場',
    nameEn: 'hakodate',
    courses: [
      { name: '芝 1000m', distance: 1000, surface: 'turf' },
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2600m', distance: 2600, surface: 'turf' },
      { name: 'ダート 1000m', distance: 1000, surface: 'dirt' },
      { name: 'ダート 1700m', distance: 1700, surface: 'dirt' },
      { name: 'ダート 2400m', distance: 2400, surface: 'dirt' },
    ],
  },
  {
    name: '福島競馬場',
    nameEn: 'fukushima',
    courses: [
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2600m', distance: 2600, surface: 'turf' },
      { name: 'ダート 1150m', distance: 1150, surface: 'dirt' },
      { name: 'ダート 1700m', distance: 1700, surface: 'dirt' },
      { name: 'ダート 2400m', distance: 2400, surface: 'dirt' },
    ],
  },
  {
    name: '中山競馬場',
    nameEn: 'nakayama',
    courses: [
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1600m', distance: 1600, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2200m', distance: 2200, surface: 'turf' },
      { name: '芝 2500m', distance: 2500, surface: 'turf' },
      { name: '芝 3600m', distance: 3600, surface: 'turf' },
      { name: 'ダート 1200m', distance: 1200, surface: 'dirt' },
      { name: 'ダート 1800m', distance: 1800, surface: 'dirt' },
      { name: 'ダート 2400m', distance: 2400, surface: 'dirt' },
      { name: 'ダート 2500m', distance: 2500, surface: 'dirt' },
    ],
  },
  {
    name: '東京競馬場',
    nameEn: 'tokyo',
    courses: [
      { name: '芝 1400m', distance: 1400, surface: 'turf' },
      { name: '芝 1600m', distance: 1600, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2300m', distance: 2300, surface: 'turf' },
      { name: '芝 2400m', distance: 2400, surface: 'turf' },
      { name: '芝 2500m', distance: 2500, surface: 'turf' },
      { name: '芝 3400m', distance: 3400, surface: 'turf' },
      { name: 'ダート 1300m', distance: 1300, surface: 'dirt' },
      { name: 'ダート 1400m', distance: 1400, surface: 'dirt' },
      { name: 'ダート 1600m', distance: 1600, surface: 'dirt' },
      { name: 'ダート 2100m', distance: 2100, surface: 'dirt' },
      { name: 'ダート 2400m', distance: 2400, surface: 'dirt' },
    ],
  },
  {
    name: '新潟競馬場',
    nameEn: 'niigata',
    courses: [
      { name: '芝 1000m', distance: 1000, surface: 'turf' },
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1400m', distance: 1400, surface: 'turf' },
      { name: '芝 1600m', distance: 1600, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m（内）', distance: 2000, surface: 'turf', variant: 'inner' },
      { name: '芝 2000m（外）', distance: 2000, surface: 'turf', variant: 'outer' },
      { name: '芝 2200m', distance: 2200, surface: 'turf' },
      { name: '芝 2400m', distance: 2400, surface: 'turf' },
      { name: 'ダート 1200m', distance: 1200, surface: 'dirt' },
      { name: 'ダート 1800m', distance: 1800, surface: 'dirt' },
    ],
  },
  {
    name: '中京競馬場',
    nameEn: 'chukyo',
    courses: [
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1400m', distance: 1400, surface: 'turf' },
      { name: '芝 1600m', distance: 1600, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2200m', distance: 2200, surface: 'turf' },
      { name: 'ダート 1200m', distance: 1200, surface: 'dirt' },
      { name: 'ダート 1400m', distance: 1400, surface: 'dirt' },
      { name: 'ダート 1800m', distance: 1800, surface: 'dirt' },
      { name: 'ダート 1900m', distance: 1900, surface: 'dirt' },
    ],
  },
  {
    name: '京都競馬場',
    nameEn: 'kyoto',
    courses: [
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1400m（内）', distance: 1400, surface: 'turf', variant: 'inner' },
      { name: '芝 1400m（外）', distance: 1400, surface: 'turf', variant: 'outer' },
      { name: '芝 1600m（内）', distance: 1600, surface: 'turf', variant: 'inner' },
      { name: '芝 1600m（外）', distance: 1600, surface: 'turf', variant: 'outer' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2200m', distance: 2200, surface: 'turf' },
      { name: '芝 2400m', distance: 2400, surface: 'turf' },
      { name: '芝 3000m', distance: 3000, surface: 'turf' },
      { name: '芝 3200m', distance: 3200, surface: 'turf' },
      { name: 'ダート 1200m', distance: 1200, surface: 'dirt' },
      { name: 'ダート 1400m', distance: 1400, surface: 'dirt' },
      { name: 'ダート 1800m', distance: 1800, surface: 'dirt' },
      { name: 'ダート 1900m', distance: 1900, surface: 'dirt' },
    ],
  },
  {
    name: '阪神競馬場',
    nameEn: 'hanshin',
    courses: [
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1400m', distance: 1400, surface: 'turf' },
      { name: '芝 1600m', distance: 1600, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2200m', distance: 2200, surface: 'turf' },
      { name: '芝 2400m', distance: 2400, surface: 'turf' },
      { name: '芝 2600m', distance: 2600, surface: 'turf' },
      { name: '芝 3000m', distance: 3000, surface: 'turf' },
      { name: 'ダート 1200m', distance: 1200, surface: 'dirt' },
      { name: 'ダート 1400m', distance: 1400, surface: 'dirt' },
      { name: 'ダート 1800m', distance: 1800, surface: 'dirt' },
      { name: 'ダート 2000m', distance: 2000, surface: 'dirt' },
    ],
  },
  {
    name: '小倉競馬場',
    nameEn: 'kokura',
    courses: [
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1700m', distance: 1700, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2600m', distance: 2600, surface: 'turf' },
      { name: 'ダート 1000m', distance: 1000, surface: 'dirt' },
      { name: 'ダート 1700m', distance: 1700, surface: 'dirt' },
      { name: 'ダート 2400m', distance: 2400, surface: 'dirt' },
    ],
  },
];

type MenuType = 'course' | 'jockey' | 'sire' | 'trainer' | null;

export default function HeaderMenu() {
  const [openMenu, setOpenMenu] = useState<MenuType>(null);
  const [expandedRacecourse, setExpandedRacecourse] = useState<Record<string, boolean>>({});

  const toggleRacecourse = (racecourseNameEn: string) => {
    setExpandedRacecourse((prev) => ({
      ...prev,
      [racecourseNameEn]: !prev[racecourseNameEn],
    }));
  };

  const closeMenu = () => setOpenMenu(null);

  // getCourseUrl はlib/courses.tsからインポートしたものを使用

  return (
    <>
      {/* ===== モバイル：下部固定メニューボタン（4つ） ===== */}
      <div className={styles.fixedMenuBar}>
        <button
          className={styles.menuButton}
          onClick={() => setOpenMenu('course')}
          type="button"
          aria-label="コース別データを開く"
        >
          <span className={styles.menuIcon}><i className="fa-solid fa-flag"></i></span>
          <span className={styles.menuText}>コースデータ</span>
        </button>
        <button
          className={styles.menuButton}
          onClick={() => setOpenMenu('jockey')}
          type="button"
          aria-label="騎手別データを開く"
        >
          <span className={styles.menuIcon}><i className="fa-solid fa-helmet-safety"></i></span>
          <span className={styles.menuText}>騎手データ</span>
        </button>
        <button
          className={styles.menuButton}
          onClick={() => setOpenMenu('sire')}
          type="button"
          aria-label="血統別データを開く"
        >
          <span className={styles.menuIcon}><i className="fa-solid fa-horse"></i></span>
          <span className={styles.menuText}>血統データ</span>
        </button>
        <button
          className={styles.menuButton}
          onClick={() => setOpenMenu('trainer')}
          type="button"
          aria-label="調教師別データを開く"
        >
          <span className={styles.menuIcon}><i className="fa-solid fa-user"></i></span>
          <span className={styles.menuText}>調教師データ</span>
        </button>
      </div>

      {openMenu && (
        <>
          <div
            className={styles.menuOverlay}
            onClick={closeMenu}
          />
          <div className={styles.fullscreenModal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {openMenu === 'course' && 'コース別データ'}
                {openMenu === 'jockey' && '騎手別データ'}
                {openMenu === 'sire' && '血統（種牡馬）別データ'}
                {openMenu === 'trainer' && '調教師別データ'}
              </h2>
              <button
                className={styles.closeButton}
                onClick={closeMenu}
                type="button"
                aria-label="メニューを閉じる"
              >
                ✕
              </button>
            </div>
            <div className={styles.mobileMenuContent}>
              {openMenu === 'course' && (
                <>
              {racecoursesData.map((racecourse) => (
                <div key={racecourse.nameEn} className={styles.accordionItem}>
                  <button
                    className={`${styles.accordionTrigger} ${expandedRacecourse[racecourse.nameEn] ? styles.expanded : ''}`}
                    onClick={() => toggleRacecourse(racecourse.nameEn)}
                  >
                    <span className={`${styles.accordionIcon} ${expandedRacecourse[racecourse.nameEn] ? styles.expanded : ''}`}>
                      {expandedRacecourse[racecourse.nameEn] ? '▼' : '▶'}
                    </span>
                    {racecourse.name}
                  </button>

                  {expandedRacecourse[racecourse.nameEn] && (
                    <div className={styles.accordionContent}>
                      <div className={styles.surfaceGroup}>
                        {racecourse.courses
                          .filter((course) => course.surface === 'turf')
                          .map((course) => (
                            <Link
                              key={`${racecourse.nameEn}-${course.racecourse}-${course.surface}-${course.distance}${course.variant || ''}`}
                              href={getCourseUrl(course)}
                              className={`${styles.courseLink} ${styles.turf}`}
                              onClick={closeMenu}
                            >
                              {getCourseDisplayName(course)}
                            </Link>
                          ))}
                      </div>
                      <div className={styles.surfaceGroup}>
                        {racecourse.courses
                          .filter((course) => course.surface === 'dirt')
                          .map((course) => (
                            <Link
                              key={`${racecourse.nameEn}-${course.racecourse}-${course.surface}-${course.distance}${course.variant || ''}`}
                              href={getCourseUrl(course)}
                              className={`${styles.courseLink} ${styles.dirt}`}
                              onClick={closeMenu}
                            >
                              {getCourseDisplayName(course)}
                            </Link>
                          ))}
                      </div>
                      {racecourse.courses.some((course) => course.surface === 'steeplechase') && (
                        <div className={styles.surfaceGroup}>
                          {racecourse.courses
                            .filter((course) => course.surface === 'steeplechase')
                            .map((course) => (
                              <Link
                                key={`${racecourse.nameEn}-${course.racecourse}-${course.surface}-${course.distance}${course.variant || ''}`}
                                href={getCourseUrl(course)}
                                className={`${styles.courseLink} ${styles.steeplechase}`}
                                onClick={closeMenu}
                              >
                                {getCourseDisplayName(course)}
                              </Link>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              </>
              )}

              {openMenu === 'jockey' && (
                <>
              {jockeysData.map((group) => (
                <div key={group.kana} className={styles.accordionItem}>
                  <button
                    className={`${styles.accordionTrigger} ${expandedRacecourse[`jockey-${group.kana}`] ? styles.expanded : ''}`}
                    onClick={() => toggleRacecourse(`jockey-${group.kana}`)}
                  >
                    <span className={`${styles.accordionIcon} ${expandedRacecourse[`jockey-${group.kana}`] ? styles.expanded : ''}`}>
                      {expandedRacecourse[`jockey-${group.kana}`] ? '▼' : '▶'}
                    </span>
                    {group.kana}
                  </button>

                  {expandedRacecourse[`jockey-${group.kana}`] && (
                    <div className={styles.accordionContent}>
                      <div className={styles.dataCardGrid}>
                        {group.jockeys.map((jockey) => (
                          <Link
                            key={jockey.id}
                            href={`/jockeys/${jockey.id}`}
                            className={styles.dataCard}
                            onClick={closeMenu}
                          >
                            {jockey.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              </>
              )}

              {openMenu === 'sire' && (
                <>
              {siresData.map((group) => (
                <div key={group.kana} className={styles.accordionItem}>
                  <button
                    className={`${styles.accordionTrigger} ${expandedRacecourse[`sire-${group.kana}`] ? styles.expanded : ''}`}
                    onClick={() => toggleRacecourse(`sire-${group.kana}`)}
                  >
                    <span className={`${styles.accordionIcon} ${expandedRacecourse[`sire-${group.kana}`] ? styles.expanded : ''}`}>
                      {expandedRacecourse[`sire-${group.kana}`] ? '▼' : '▶'}
                    </span>
                    {group.kana}
                  </button>

                  {expandedRacecourse[`sire-${group.kana}`] && (
                    <div className={styles.accordionContent}>
                      <div className={styles.dataCardGrid}>
                        {group.sires.map((sire) => (
                          <Link
                            key={sire.id}
                            href={`/sires/${sire.id}`}
                            className={styles.dataCard}
                            onClick={closeMenu}
                          >
                            {sire.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              </>
              )}

              {openMenu === 'trainer' && (
                <>
              {trainersData.map((group) => (
                <div key={group.kana} className={styles.accordionItem}>
                  <button
                    className={`${styles.accordionTrigger} ${expandedRacecourse[`trainer-${group.kana}`] ? styles.expanded : ''}`}
                    onClick={() => toggleRacecourse(`trainer-${group.kana}`)}
                  >
                    <span className={`${styles.accordionIcon} ${expandedRacecourse[`trainer-${group.kana}`] ? styles.expanded : ''}`}>
                      {expandedRacecourse[`trainer-${group.kana}`] ? '▼' : '▶'}
                    </span>
                    {group.kana}
                  </button>

                  {expandedRacecourse[`trainer-${group.kana}`] && (
                    <div className={styles.accordionContent}>
                      <div className={styles.dataCardGrid}>
                        {group.trainers.map((trainer) => (
                          <Link
                            key={trainer.id}
                            href={`/trainers/${trainer.id}`}
                            className={styles.dataCard}
                            onClick={closeMenu}
                          >
                            {trainer.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
