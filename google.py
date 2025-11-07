"""
Google Ads API - アカウント単位レポート取得スクリプト

このスクリプトは、Google Ads APIを使用してアカウント単位のパフォーマンスデータを取得し、
CSV ファイルに出力します。
サーチキャンペーンとディスプレイキャンペーン両方に対応しています。
"""

from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException
import pandas as pd
import json
from datetime import datetime, timedelta, timezone
import sys
import os


class GoogleAdsCustomerReport:
    """Google Ads アカウント単位レポート取得クラス"""

    def __init__(self):
        """
        初期化（環境変数から認証情報を取得）

        環境変数:
            GOOGLE_ADS_DEVELOPER_TOKEN: Developer Token
            GOOGLE_ADS_CLIENT_ID: OAuth2 Client ID
            GOOGLE_ADS_CLIENT_SECRET: OAuth2 Client Secret
            GOOGLE_ADS_REFRESH_TOKEN: OAuth2 Refresh Token
            GOOGLE_ADS_LOGIN_CUSTOMER_ID: ログインカスタマーID
        """
        # 環境変数から認証情報を取得
        credentials = {
            "developer_token": os.getenv("GOOGLE_ADS_DEVELOPER_TOKEN"),
            "client_id": os.getenv("GOOGLE_ADS_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_ADS_CLIENT_SECRET"),
            "refresh_token": os.getenv("GOOGLE_ADS_REFRESH_TOKEN"),
            "use_proto_plus": True,
        }

        # ログインカスタマーIDがあれば追加
        login_customer_id = os.getenv("GOOGLE_ADS_LOGIN_CUSTOMER_ID")
        if login_customer_id:
            credentials["login_customer_id"] = login_customer_id

        # 必須項目の確認
        required_keys = ["developer_token", "client_id", "client_secret", "refresh_token"]
        missing_keys = [k for k in required_keys if not credentials[k]]
        if missing_keys:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_keys)}")

        # クライアント作成
        self.client = GoogleAdsClient.load_from_dict(credentials)
    
    def get_customer_metrics(self, customer_id, start_date, end_date):
        """
        アカウント単位のメトリクスを取得
        
        Args:
            customer_id (str): Google Ads顧客ID（例: "1234567890"）
            start_date (str): 開始日（YYYY-MM-DD形式）
            end_date (str): 終了日（YYYY-MM-DD形式）
            
        Returns:
            pd.DataFrame: アカウント単位のメトリクスデータ
        """
        ga_service = self.client.get_service("GoogleAdsService")
        
        # クエリの構築（主要メトリクス：campaign/ad_groupと同じ37メトリクス）
        query = f"""
            SELECT
                segments.date,
                customer.id,
                metrics.impressions,
                metrics.clicks,
                metrics.cost_micros,
                metrics.conversions,
                metrics.conversions_value,
                metrics.ctr,
                metrics.average_cpc,
                metrics.average_cpm,
                metrics.cost_per_conversion,
                metrics.value_per_conversion,
                metrics.all_conversions,
                metrics.all_conversions_value,
                metrics.cost_per_all_conversions,
                metrics.value_per_all_conversions,
                metrics.engagement_rate,
                metrics.engagements,
                metrics.interaction_rate,
                metrics.interactions,
                metrics.invalid_clicks,
                metrics.invalid_click_rate,
                metrics.absolute_top_impression_percentage,
                metrics.top_impression_percentage,
                metrics.search_impression_share,
                metrics.search_absolute_top_impression_share,
                metrics.search_top_impression_share,
                metrics.search_budget_lost_impression_share,
                metrics.search_budget_lost_absolute_top_impression_share,
                metrics.search_budget_lost_top_impression_share,
                metrics.search_rank_lost_impression_share,
                metrics.search_rank_lost_absolute_top_impression_share,
                metrics.search_rank_lost_top_impression_share,
                metrics.content_impression_share,
                metrics.content_budget_lost_impression_share,
                metrics.content_rank_lost_impression_share,
                metrics.video_trueview_views,
                metrics.video_trueview_view_rate,
                metrics.view_through_conversions
            FROM
                customer
            WHERE
                segments.date BETWEEN '{start_date}' AND '{end_date}'
            ORDER BY
                segments.date ASC
        """
        
        try:
            # データ取得
            stream = ga_service.search_stream(customer_id=customer_id, query=query)

            # 結果をリストに格納
            results = []


            # SELECT句の順番に従ってメトリクスを追加（37メトリクス：campaign/ad_groupと統一）
            metrics_in_select_order = [
                'impressions',
                'clicks',
                'cost_micros',
                'conversions',
                'conversions_value',
                'ctr',
                'average_cpc',
                'average_cpm',
                'cost_per_conversion',
                'value_per_conversion',
                'all_conversions',
                'all_conversions_value',
                'cost_per_all_conversions',
                'value_per_all_conversions',
                'engagement_rate',
                'engagements',
                'interaction_rate',
                'interactions',
                'invalid_clicks',
                'invalid_click_rate',
                'absolute_top_impression_percentage',
                'top_impression_percentage',
                'search_impression_share',
                'search_absolute_top_impression_share',
                'search_top_impression_share',
                'search_budget_lost_impression_share',
                'search_budget_lost_absolute_top_impression_share',
                'search_budget_lost_top_impression_share',
                'search_rank_lost_impression_share',
                'search_rank_lost_absolute_top_impression_share',
                'search_rank_lost_top_impression_share',
                'content_impression_share',
                'content_budget_lost_impression_share',
                'content_rank_lost_impression_share',
                'video_trueview_views',
                'video_trueview_view_rate',
                'view_through_conversions',
            ]

            # データを処理
            for batch in stream:
                for row in batch.results:
                    result = {}

                    # SELECT句の順番通りにメトリクスを追加
                    result['date'] = row.segments.date
                    result['customer_id'] = row.customer.id

                    # SELECT句の順番に従ってメトリクスを追加（マイクロ単位の変換はしない）
                    for metric_name in metrics_in_select_order:
                        metric_value = getattr(row.metrics, metric_name, None)
                        result[metric_name] = metric_value

                    results.append(result)

            # DataFrameに変換
            df = pd.DataFrame(results)

            # metrics_in_select_orderから列順を生成
            column_order = ['date', 'customer_id'] + metrics_in_select_order

            # 存在する列のみを、指定された順番で選択
            existing_columns = [col for col in column_order if col in df.columns]

            # デバッグ出力
            sys.stderr.write(f"列順確認: {len(existing_columns)}個の列\n")
            sys.stderr.write(f"最初の5列: {existing_columns[:5]}\n")
            sys.stderr.write(f"最後の5列: {existing_columns[-5:]}\n")

            df = df[existing_columns]

            return df
            
        except GoogleAdsException as ex:
            sys.stderr.write(f"Google Ads APIエラー (Request ID: {ex.request_id}):\n")
            for error in ex.failure.errors:
                sys.stderr.write(f"  {error.message}\n")
            sys.exit(1)



def main():
    """メイン処理"""

    # ===== 設定 =====
    # Google Ads顧客IDリスト（ハイフンなし）
    CUSTOMER_IDS = [
        "4961469341",
        "6894368146",
        "2783604345",
        "6859985803",
        "9406791086",
        "5789491088",
        "1398700707",
        "9248803011",
        "8904889601",
        "3473772260",
        "9282755845",
        "9756568719",
        "7141717397",
        "3326796703",
        "2146065998",
        "7008943696",
        "8948393517",
        "5901735533",
        "1604315242",
        "8014870713",
        "9188915901",
        "2376279764",
        "6784714046",
        "3186702349",
        "5241802133",
        "8811177595",
        "2426916146",
        "2351271327",
        "6843241868",
        "6516219701",
        "1524340564",
        "7287455480",
        "4921536963",
        "5923713050",
        "6849143343",
        "1127698641",
        "9579881713",
        "6346981731",
        "1633684295",
        "1048539674",
        "2431781756",
        "5176818378",
        "5274109209",
        "3610617294",
        "4764030511",
        "9766426811",
        "7673899894",
        "1882201996",
        "9812385017",
        "3108309417",
        "9056742960",
        "3628708276",
        "3343639468",
        "8524288797",
        "5617914717",
        "6988015696",
        "1753365409",
        "2184325696",
        "4646105268",
    ]

    # 取得期間（2024年10月1日〜10月31日）
    START_DATE = "2024-10-01"
    END_DATE = "2024-10-31"

    # ===== CSV出力パスの設定 =====
    output_dir = "google/account"
    os.makedirs(output_dir, exist_ok=True)

    # タイムスタンプをファイル名に含める
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = os.path.join(output_dir, f"customer_report_{timestamp}.csv")

    # ===== データ取得 =====
    # レポート取得インスタンスを作成（環境変数から認証情報を取得）
    try:
        report = GoogleAdsCustomerReport()
    except ValueError as e:
        sys.stderr.write(f"設定エラー: {str(e)}\n")
        sys.exit(1)

    # 全アカウントのデータを格納するリスト
    all_dfs = []

    # 各アカウントのデータを取得
    for i, customer_id in enumerate(CUSTOMER_IDS, 1):
        sys.stderr.write(f"[{i}/{len(CUSTOMER_IDS)}] アカウント {customer_id} のデータを取得中...\n")
        try:
            df = report.get_customer_metrics(customer_id, START_DATE, END_DATE)
            if len(df) > 0:
                all_dfs.append(df)
                sys.stderr.write(f"  → {len(df)}行のデータを取得しました\n")
            else:
                sys.stderr.write(f"  → データがありませんでした\n")
        except Exception as e:
            sys.stderr.write(f"  → エラー: {str(e)}\n")
            continue

    # 全データを結合
    if len(all_dfs) > 0:
        combined_df = pd.concat(all_dfs, ignore_index=True)
        sys.stderr.write(f"\n合計 {len(combined_df)}行のデータを取得しました\n")

        # CSV ファイルに出力
        combined_df.to_csv(output_file, index=False, encoding="utf-8")
        sys.stderr.write(f"ファイルに出力しました: {output_file}\n")
    else:
        sys.stderr.write("警告: 出力するデータがありません\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
