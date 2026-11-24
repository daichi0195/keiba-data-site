import { ICON_DATA, type IconName } from './iconData';

/**
 * サイト共通のアイコン（自前の SVG。元は components/layout/svg/*.svg、作り直しは node scripts/build-icons.mjs）。
 * 以前は Font Awesome を使っていた。キーは以前のものを残している（col＝コラム など）。
 */
export const FRAME_ICONS = {
  home: 'home',
  race: 'race',
  ai: 'ai',
  course: 'course',
  jockey: 'jockey',
  sire: 'sire',
  trainer: 'trainer',
  col: 'column',
  menu: 'menu',
  close: 'close',
  chevronRight: 'chevron-right',
  chevronDown: 'chevron-down',
  search: 'search',
} as const satisfies Record<string, IconName>;

export type FrameIconKey = keyof typeof FRAME_ICONS;

/** 1em 四方のインライン SVG（色は currentColor）。大きさは親の font-size か className の width/height で決める */
export function FrameIcon({ icon, className }: { icon: IconName; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: ICON_DATA[icon] }}
    />
  );
}
