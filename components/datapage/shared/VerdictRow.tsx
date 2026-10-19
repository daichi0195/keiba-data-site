import s from '@/components/course/course.module.css';
import { Dots } from '@/components/course/CourseParts';
import r from './shared.module.css';

/**
 * 結論カードの行の入れ物。行どうしで5段階の位置が揃うよう、列幅をここで決める
 */
export function VerdictRows({ children }: { children: React.ReactNode }) {
  return <div className={`${s.vRows} ${r.vRowsFit}`}>{children}</div>;
}

/**
 * 結論カードの1行（指標名｜5段階｜判定）。騎手・種牡馬・調教師ページ共通。
 * 判定の文言が長い（「やや逃げ・先行が得意」など）ときも幅320pxではみ出さないよう、
 * 判定の列は縮められるようにして、収まらなければ「やや」の後ろで折り返す。
 */
export default function VerdictRow({ label, value, result, href }: { label: string; value: number; result: string; href: string }) {
  const m = result.match(/^(やや)(.+)$/);
  return (
    <a className={`${s.vRow} ${r.vRowFit}`} href={href}>
      <span className={s.vKey}>{label}</span>
      <Dots value={value} />
      <span className={s.vVal}>
        {m ? (
          <>
            <span>{m[1]}</span>
            <wbr />
            <span>{m[2]}</span>
          </>
        ) : (
          <span>{result}</span>
        )}
      </span>
    </a>
  );
}
