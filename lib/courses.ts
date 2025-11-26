// 全85コースの定義
export const ALL_COURSES = [
  // 中山競馬場
  { racecourse: 'nakayama', racecourse_ja: '中山競馬場', surface: 'dirt', surface_ja: 'ダート', distance: 2400 },
  { racecourse: 'nakayama', racecourse_ja: '中山競馬場', surface: 'turf', surface_ja: '芝', distance: 1200 },
  { racecourse: 'nakayama', racecourse_ja: '中山競馬場', surface: 'dirt', surface_ja: 'ダート', distance: 1200 },
  { racecourse: 'nakayama', racecourse_ja: '中山競馬場', surface: 'turf', surface_ja: '芝', distance: 1600 },
  { racecourse: 'nakayama', racecourse_ja: '中山競馬場', surface: 'dirt', surface_ja: 'ダート', distance: 1800 },
  { racecourse: 'nakayama', racecourse_ja: '中山競馬場', surface: 'turf', surface_ja: '芝', distance: 2000 },
  { racecourse: 'nakayama', racecourse_ja: '中山競馬場', surface: 'turf', surface_ja: '芝', distance: 1800 },
  { racecourse: 'nakayama', racecourse_ja: '中山競馬場', surface: 'turf', surface_ja: '芝', distance: 2500 },
  { racecourse: 'nakayama', racecourse_ja: '中山競馬場', surface: 'turf', surface_ja: '芝', distance: 2200 },

  // 東京競馬場
  { racecourse: 'tokyo', racecourse_ja: '東京競馬場', surface: 'dirt', surface_ja: 'ダート', distance: 2100 },
  { racecourse: 'tokyo', racecourse_ja: '東京競馬場', surface: 'dirt', surface_ja: 'ダート', distance: 1300 },
  { racecourse: 'tokyo', racecourse_ja: '東京競馬場', surface: 'turf', surface_ja: '芝', distance: 1400 },
  { racecourse: 'tokyo', racecourse_ja: '東京競馬場', surface: 'dirt', surface_ja: 'ダート', distance: 1400 },
  { racecourse: 'tokyo', racecourse_ja: '東京競馬場', surface: 'dirt', surface_ja: 'ダート', distance: 1600 },
  { racecourse: 'tokyo', racecourse_ja: '東京競馬場', surface: 'turf', surface_ja: '芝', distance: 1600 },
  { racecourse: 'tokyo', racecourse_ja: '東京競馬場', surface: 'turf', surface_ja: '芝', distance: 1800 },
  { racecourse: 'tokyo', racecourse_ja: '東京競馬場', surface: 'turf', surface_ja: '芝', distance: 2000 },
  { racecourse: 'tokyo', racecourse_ja: '東京競馬場', surface: 'turf', surface_ja: '芝', distance: 2400 },

  // 阪神競馬場
  { racecourse: 'hanshin', racecourse_ja: '阪神競馬場', surface: 'turf', surface_ja: '芝', distance: 2200 },
  { racecourse: 'hanshin', racecourse_ja: '阪神競馬場', surface: 'dirt', surface_ja: 'ダート', distance: 1200 },
  { racecourse: 'hanshin', racecourse_ja: '阪神競馬場', surface: 'turf', surface_ja: '芝', distance: 1400 },
  { racecourse: 'hanshin', racecourse_ja: '阪神競馬場', surface: 'dirt', surface_ja: 'ダート', distance: 1400 },
  { racecourse: 'hanshin', racecourse_ja: '阪神競馬場', surface: 'turf', surface_ja: '芝', distance: 1600 },
  { racecourse: 'hanshin', racecourse_ja: '阪神競馬場', surface: 'dirt', surface_ja: 'ダート', distance: 2000 },
  { racecourse: 'hanshin', racecourse_ja: '阪神競馬場', surface: 'turf', surface_ja: '芝', distance: 1200 },
  { racecourse: 'hanshin', racecourse_ja: '阪神競馬場', surface: 'turf', surface_ja: '芝', distance: 1800 },
  { racecourse: 'hanshin', racecourse_ja: '阪神競馬場', surface: 'dirt', surface_ja: 'ダート', distance: 1800 },
  { racecourse: 'hanshin', racecourse_ja: '阪神競馬場', surface: 'turf', surface_ja: '芝', distance: 2000 },
  { racecourse: 'hanshin', racecourse_ja: '阪神競馬場', surface: 'turf', surface_ja: '芝', distance: 2400 },

  // 京都競馬場
  { racecourse: 'kyoto', racecourse_ja: '京都競馬場', surface: 'turf', surface_ja: '芝', distance: 1200 },
  { racecourse: 'kyoto', racecourse_ja: '京都競馬場', surface: 'dirt', surface_ja: 'ダート', distance: 1200 },
  { racecourse: 'kyoto', racecourse_ja: '京都競馬場', surface: 'dirt', surface_ja: 'ダート', distance: 1400 },
  { racecourse: 'kyoto', racecourse_ja: '京都競馬場', surface: 'dirt', surface_ja: 'ダート', distance: 1800 },
  { racecourse: 'kyoto', racecourse_ja: '京都競馬場', surface: 'dirt', surface_ja: 'ダート', distance: 1900 },
  { racecourse: 'kyoto', racecourse_ja: '京都競馬場', surface: 'turf', surface_ja: '芝', distance: 2400 },
  { racecourse: 'kyoto', racecourse_ja: '京都競馬場', surface: 'turf', surface_ja: '芝', distance: 2200 },
  { racecourse: 'kyoto', racecourse_ja: '京都競馬場', surface: 'turf', surface_ja: '芝', distance: 2000 },
  { racecourse: 'kyoto', racecourse_ja: '京都競馬場', surface: 'turf', surface_ja: '芝', distance: 1800 },
  { racecourse: 'kyoto', racecourse_ja: '京都競馬場', surface: 'turf', surface_ja: '芝', distance: 1400, variant: 'inner' },
  { racecourse: 'kyoto', racecourse_ja: '京都競馬場', surface: 'turf', surface_ja: '芝', distance: 1400, variant: 'outer' },
  { racecourse: 'kyoto', racecourse_ja: '京都競馬場', surface: 'turf', surface_ja: '芝', distance: 1600, variant: 'inner' },
  { racecourse: 'kyoto', racecourse_ja: '京都競馬場', surface: 'turf', surface_ja: '芝', distance: 1600, variant: 'outer' },

  // 小倉競馬場
  { racecourse: 'kokura', racecourse_ja: '小倉競馬場', surface: 'turf', surface_ja: '芝', distance: 1200 },
  { racecourse: 'kokura', racecourse_ja: '小倉競馬場', surface: 'turf', surface_ja: '芝', distance: 2000 },
  { racecourse: 'kokura', racecourse_ja: '小倉競馬場', surface: 'dirt', surface_ja: 'ダート', distance: 1700 },
  { racecourse: 'kokura', racecourse_ja: '小倉競馬場', surface: 'turf', surface_ja: '芝', distance: 1800 },
  { racecourse: 'kokura', racecourse_ja: '小倉競馬場', surface: 'turf', surface_ja: '芝', distance: 2600 },
  { racecourse: 'kokura', racecourse_ja: '小倉競馬場', surface: 'dirt', surface_ja: 'ダート', distance: 1000 },

  // 福島競馬場
  { racecourse: 'fukushima', racecourse_ja: '福島競馬場', surface: 'turf', surface_ja: '芝', distance: 1800 },
  { racecourse: 'fukushima', racecourse_ja: '福島競馬場', surface: 'turf', surface_ja: '芝', distance: 2000 },
  { racecourse: 'fukushima', racecourse_ja: '福島競馬場', surface: 'dirt', surface_ja: 'ダート', distance: 1700 },
  { racecourse: 'fukushima', racecourse_ja: '福島競馬場', surface: 'turf', surface_ja: '芝', distance: 2600 },
  { racecourse: 'fukushima', racecourse_ja: '福島競馬場', surface: 'dirt', surface_ja: 'ダート', distance: 1150 },
  { racecourse: 'fukushima', racecourse_ja: '福島競馬場', surface: 'turf', surface_ja: '芝', distance: 1200 },

  // 新潟競馬場
  { racecourse: 'niigata', racecourse_ja: '新潟競馬場', surface: 'turf', surface_ja: '芝', distance: 1400 },
  { racecourse: 'niigata', racecourse_ja: '新潟競馬場', surface: 'turf', surface_ja: '芝', distance: 1000 },
  { racecourse: 'niigata', racecourse_ja: '新潟競馬場', surface: 'dirt', surface_ja: 'ダート', distance: 1200 },
  { racecourse: 'niigata', racecourse_ja: '新潟競馬場', surface: 'dirt', surface_ja: 'ダート', distance: 1800 },
  { racecourse: 'niigata', racecourse_ja: '新潟競馬場', surface: 'turf', surface_ja: '芝', distance: 1200 },
  { racecourse: 'niigata', racecourse_ja: '新潟競馬場', surface: 'turf', surface_ja: '芝', distance: 1600 },
  { racecourse: 'niigata', racecourse_ja: '新潟競馬場', surface: 'turf', surface_ja: '芝', distance: 1800 },
  { racecourse: 'niigata', racecourse_ja: '新潟競馬場', surface: 'turf', surface_ja: '芝', distance: 2200 },
  { racecourse: 'niigata', racecourse_ja: '新潟競馬場', surface: 'turf', surface_ja: '芝', distance: 2000, variant: 'inner' },
  { racecourse: 'niigata', racecourse_ja: '新潟競馬場', surface: 'turf', surface_ja: '芝', distance: 2000, variant: 'outer' },

  // 函館競馬場
  { racecourse: 'hakodate', racecourse_ja: '函館競馬場', surface: 'turf', surface_ja: '芝', distance: 2000 },
  { racecourse: 'hakodate', racecourse_ja: '函館競馬場', surface: 'turf', surface_ja: '芝', distance: 1200 },
  { racecourse: 'hakodate', racecourse_ja: '函館競馬場', surface: 'dirt', surface_ja: 'ダート', distance: 1700 },
  { racecourse: 'hakodate', racecourse_ja: '函館競馬場', surface: 'turf', surface_ja: '芝', distance: 1800 },
  { racecourse: 'hakodate', racecourse_ja: '函館競馬場', surface: 'dirt', surface_ja: 'ダート', distance: 1000 },

  // 札幌競馬場
  { racecourse: 'sapporo', racecourse_ja: '札幌競馬場', surface: 'turf', surface_ja: '芝', distance: 2600 },
  { racecourse: 'sapporo', racecourse_ja: '札幌競馬場', surface: 'turf', surface_ja: '芝', distance: 1200 },
  { racecourse: 'sapporo', racecourse_ja: '札幌競馬場', surface: 'turf', surface_ja: '芝', distance: 2000 },
  { racecourse: 'sapporo', racecourse_ja: '札幌競馬場', surface: 'dirt', surface_ja: 'ダート', distance: 1700 },
  { racecourse: 'sapporo', racecourse_ja: '札幌競馬場', surface: 'turf', surface_ja: '芝', distance: 1500 },
  { racecourse: 'sapporo', racecourse_ja: '札幌競馬場', surface: 'dirt', surface_ja: 'ダート', distance: 1000 },
  { racecourse: 'sapporo', racecourse_ja: '札幌競馬場', surface: 'turf', surface_ja: '芝', distance: 1800 },

  // 中京競馬場
  { racecourse: 'chukyo', racecourse_ja: '中京競馬場', surface: 'dirt', surface_ja: 'ダート', distance: 1200 },
  { racecourse: 'chukyo', racecourse_ja: '中京競馬場', surface: 'dirt', surface_ja: 'ダート', distance: 1400 },
  { racecourse: 'chukyo', racecourse_ja: '中京競馬場', surface: 'turf', surface_ja: '芝', distance: 1400 },
  { racecourse: 'chukyo', racecourse_ja: '中京競馬場', surface: 'dirt', surface_ja: 'ダート', distance: 1800 },
  { racecourse: 'chukyo', racecourse_ja: '中京競馬場', surface: 'turf', surface_ja: '芝', distance: 1200 },
  { racecourse: 'chukyo', racecourse_ja: '中京競馬場', surface: 'turf', surface_ja: '芝', distance: 1600 },
  { racecourse: 'chukyo', racecourse_ja: '中京競馬場', surface: 'dirt', surface_ja: 'ダート', distance: 1900 },
  { racecourse: 'chukyo', racecourse_ja: '中京競馬場', surface: 'turf', surface_ja: '芝', distance: 2200 },
  { racecourse: 'chukyo', racecourse_ja: '中京競馬場', surface: 'turf', surface_ja: '芝', distance: 2000 },
];

// コースURL生成ヘルパー
export function getCourseUrl(course: typeof ALL_COURSES[number]): string {
  if (course.variant === 'inner') {
    return `/courses/${course.racecourse}/${course.surface}/${course.distance}-inner`;
  } else if (course.variant === 'outer') {
    return `/courses/${course.racecourse}/${course.surface}/${course.distance}-outer`;
  }
  return `/courses/${course.racecourse}/${course.surface}/${course.distance}`;
}

// 競馬場ごとにグルーピング
export function getCoursesByRacecourse() {
  const grouped = new Map<string, typeof ALL_COURSES>();

  ALL_COURSES.forEach(course => {
    const key = course.racecourse;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(course);
  });

  // 指定された順序
  const racecourseOrder = [
    'sapporo',    // 札幌
    'hakodate',   // 函館
    'fukushima',  // 福島
    'niigata',    // 新潟
    'tokyo',      // 東京
    'nakayama',   // 中山
    'chukyo',     // 中京
    'kyoto',      // 京都
    'hanshin',    // 阪神
    'kokura',     // 小倉
  ];

  return racecourseOrder
    .filter(racecourse => grouped.has(racecourse))
    .map(racecourse => ({
      racecourse,
      racecourse_ja: grouped.get(racecourse)![0].racecourse_ja,
      courses: grouped.get(racecourse)!.sort((a, b) => {
        // Sort by surface (turf first), then distance
        if (a.surface !== b.surface) {
          return a.surface === 'turf' ? -1 : 1;
        }
        return a.distance - b.distance;
      })
    }));
}

// コース名の表示（「芝1400m(内)」）
export function getCourseDisplayName(course: typeof ALL_COURSES[number]): string {
  let name = `${course.surface_ja}${course.distance}m`;
  if (course.variant === 'inner') {
    name += '(内)';
  } else if (course.variant === 'outer') {
    name += '(外)';
  }
  return name;
}
