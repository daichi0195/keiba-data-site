#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
lib/jockeys.ts を BigQuery から生成するスクリプト
"""

from google.cloud import bigquery
import sys

PROJECT_ID = 'umadata'
DATASET = 'umadata.keiba_data'


def main():
    """騎手リストをBigQueryから取得してTypeScriptファイルを生成"""
    try:
        client = bigquery.Client(project=PROJECT_ID)

        # 現役中央騎手で過去3年間に30レース以上出走している騎手を取得
        query = f"""
        SELECT DISTINCT
          j.jockey_id as id,
          j.jockey_name as name,
          j.jockey_kana as kana,
          COUNT(*) as recent_races
        FROM `{DATASET}.jockey` j
        JOIN `{DATASET}.race_result` rr ON j.jockey_id = rr.jockey_id
        JOIN `{DATASET}.race_master` rm ON rr.race_id = rm.race_id
        WHERE rm.race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
          AND j.is_active = true
          AND j.region <> '地方'
          AND j.jockey_id IS NOT NULL
          AND j.jockey_name IS NOT NULL
        GROUP BY j.jockey_id, j.jockey_name, j.jockey_kana
        HAVING recent_races >= 30
        ORDER BY recent_races DESC
        """

        result = client.query(query).result()
        jockeys = [(row.id, row.name, row.kana or '') for row in result]

        print(f"Found {len(jockeys)} active jockeys")

        # TypeScriptファイルを生成
        ts_content = """/**
 * 全騎手のIDリスト
 *
 * 過去3年間に30レース以上出走している現役中央騎手のリスト
 * BigQueryから自動生成（TIMESTAMP時点: COUNT騎手）
 */

export interface JockeyInfo {
  id: number;
  name: string;
  kana: string;
}

export const ALL_JOCKEYS: JockeyInfo[] = [
JOCKEY_LIST
];
"""

        # 騎手リストを生成
        jockey_lines = []
        for jockey_id, name, kana in jockeys:
            jockey_lines.append(f"  {{ id: {jockey_id}, name: '{name}', kana: '{kana}' }},")

        ts_content = ts_content.replace('JOCKEY_LIST', '\n'.join(jockey_lines))

        # タイムスタンプとカウントを更新
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y-%m-%d')
        ts_content = ts_content.replace('TIMESTAMP', timestamp)
        ts_content = ts_content.replace('COUNT', str(len(jockeys)))

        # ファイルに書き込み
        import os
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(script_dir)
        output_path = os.path.join(project_root, 'lib', 'jockeys.ts')

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(ts_content)

        print(f"✅ Generated {output_path} with {len(jockeys)} jockeys")

    except Exception as e:
        print(f"❌ Error: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
