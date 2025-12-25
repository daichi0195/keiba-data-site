#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BigQueryから種牡馬リストを取得してTypeScriptファイルを生成
"""

import os
import sys
from google.cloud import bigquery
from datetime import datetime

# BigQuery設定
PROJECT_ID = 'umadata'
BUCKET_NAME = 'umadata'
DATASET = f"{PROJECT_ID}.keiba_data"

def get_sire_list():
    """過去3年間に産駒が出走している種牡馬リストを取得"""
    client = bigquery.Client(project=PROJECT_ID)
    
    query = f"""
    WITH recent_races AS (
      SELECT race_id
      FROM `{DATASET}.race_master`
      WHERE race_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 YEAR)
    ),
    sire_stats AS (
      SELECT
        h.father as name,
        rr.race_id,
        h.horse_id
      FROM `{DATASET}.race_result` rr
      JOIN `{DATASET}.horse` h ON h.horse_id = rr.horse_id
      WHERE
        rr.race_id IN (SELECT race_id FROM recent_races)
        AND h.father IS NOT NULL
        AND h.father != ''
    )
    SELECT
      name,
      COUNT(DISTINCT race_id) as race_count,
      COUNT(DISTINCT horse_id) as horse_count
    FROM sire_stats
    GROUP BY name
    HAVING
      COUNT(DISTINCT race_id) >= 50
      AND COUNT(DISTINCT horse_id) >= 10
    ORDER BY race_count DESC
    LIMIT 300
    """
    
    try:
        results = client.query(query).result()
        sires = []
        for i, row in enumerate(results, 1):
            sires.append({
                'id': i,
                'name': row['name'],
                'race_count': row['race_count'],
                'horse_count': row['horse_count']
            })
        return sires
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return []

def generate_typescript_file(sires):
    """TypeScriptファイルを生成"""
    output_path = os.path.join(os.path.dirname(__file__), 'lib', 'sires.ts')
    
    content = f"""/**
 * 全種牡馬のIDリスト
 *
 * 過去3年間に産駒が出走している主要種牡馬のリスト
 * 生成日時: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
 * 種牡馬数: {len(sires)}
 */

export interface SireInfo {{
  id: number;
  name: string;
}}

export const ALL_SIRES: SireInfo[] = [
"""
    
    for sire in sires:
        content += f"  {{ id: {sire['id']}, name: '{sire['name']}' }},\n"
    
    content += "];\n"
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Generated {output_path}")
    print(f"   Total sires: {len(sires)}")

if __name__ == "__main__":
    print("Fetching sire list from BigQuery...")
    sires = get_sire_list()
    
    if sires:
        generate_typescript_file(sires)
        print(f"\n種牡馬リスト:")
        for sire in sires[:10]:  # 最初の10件を表示
            print(f"  {sire['id']:3d}. {sire['name']:20s} (レース数: {sire['race_count']:4d}, 産駒数: {sire['horse_count']:3d})")
        if len(sires) > 10:
            print(f"  ... and {len(sires) - 10} more")
    else:
        print("❌ No sires found")
        sys.exit(1)
