import type { IconDefinition } from '@fortawesome/fontawesome-common-types';
import {
  faHouse,
  faRobot,
  faFlag,
  faHelmetSafety,
  faHorse,
  faUser,
  faPenToSquare,
  faBars,
} from '@fortawesome/free-solid-svg-icons';

/** 共通の枠で使うアイコン（見本 lib.mjs の I と同じ Font Awesome solid） */
export const FRAME_ICONS = {
  home: faHouse,
  ai: faRobot,
  course: faFlag,
  jockey: faHelmetSafety,
  sire: faHorse,
  trainer: faUser,
  col: faPenToSquare,
  menu: faBars,
} as const;

export type FrameIconKey = keyof typeof FRAME_ICONS;

/** 1em 四方のインライン SVG（色は currentColor）。大きさは親の font-size で決める */
export function FrameIcon({ icon, className }: { icon: IconDefinition; className?: string }) {
  const [w, h, , , p] = icon.icon;
  return (
    <svg className={className} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">
      <path d={Array.isArray(p) ? p.join(' ') : p} />
    </svg>
  );
}
