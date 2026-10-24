import type { IconDefinition } from '@fortawesome/fontawesome-common-types';

/**
 * Font Awesome のアイコンをインライン SVG で描画する
 * CDN の CSS・Webフォントを読み込まないため、初回描画をブロックしない
 */
export default function FaIcon({ icon, className }: { icon: IconDefinition; className?: string }) {
  const [width, height, , , path] = icon.icon;
  const paths = Array.isArray(path) ? path : [path];
  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      width={`${width / height}em`}
      height="1em"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'inline-block', verticalAlign: '-0.125em', overflow: 'visible' }}
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
