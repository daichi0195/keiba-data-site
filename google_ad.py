"""
Google Ads API - 広告単位レポート取得スクリプト

このスクリプトは、Google Ads APIを使用して広告単位のパフォーマンスデータを取得し、
CSV ファイルに出力します。
"""

from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException
import pandas as pd
from datetime import datetime
import sys
import os


class GoogleAdsAdReport:
    """Google Ads 広告単位レポート取得クラス"""

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

    def get_ad_metrics(self, customer_id, start_date, end_date):
        """
        広告単位のメトリクスを取得

        Args:
            customer_id (str): Google Ads顧客ID（例: "1234567890"）
            start_date (str): 開始日（YYYY-MM-DD形式）
            end_date (str): 終了日（YYYY-MM-DD形式）

        Returns:
            pd.DataFrame: 広告単位のメトリクスデータ
        """
        ga_service = self.client.get_service("GoogleAdsService")

        # クエリの構築（79メトリクス）
        query = f"""
            SELECT
                segments.date,
                customer.id,
                campaign.id,
                ad_group.id,
                ad_group_ad.ad.id,
                metrics.absolute_top_impression_percentage,
                metrics.active_view_cpm,
                metrics.active_view_ctr,
                metrics.active_view_impressions,
                metrics.active_view_measurability,
                metrics.active_view_measurable_cost_micros,
                metrics.active_view_measurable_impressions,
                metrics.active_view_viewability,
                metrics.all_conversions,
                metrics.all_conversions_by_conversion_date,
                metrics.all_conversions_from_interactions_rate,
                metrics.all_conversions_value,
                metrics.all_conversions_value_by_conversion_date,
                metrics.all_new_customer_lifetime_value,
                metrics.average_cart_size,
                metrics.average_cost,
                metrics.average_cpc,
                metrics.average_cpe,
                metrics.average_cpm,
                metrics.average_order_value_micros,
                metrics.average_page_views,
                metrics.average_time_on_site,
                metrics.average_video_watch_time_duration_millis,
                metrics.bounce_rate,
                metrics.clicks,
                metrics.conversions,
                metrics.conversions_by_conversion_date,
                metrics.conversions_from_interactions_rate,
                metrics.conversions_value,
                metrics.conversions_value_by_conversion_date,
                metrics.cost_micros,
                metrics.cost_of_goods_sold_micros,
                metrics.cost_per_all_conversions,
                metrics.cost_per_conversion,
                metrics.cost_per_current_model_attributed_conversion,
                metrics.cross_device_conversions,
                metrics.cross_device_conversions_value_micros,
                metrics.cross_sell_cost_of_goods_sold_micros,
                metrics.cross_sell_gross_profit_micros,
                metrics.cross_sell_revenue_micros,
                metrics.cross_sell_units_sold,
                metrics.ctr,
                metrics.current_model_attributed_conversions,
                metrics.current_model_attributed_conversions_value,
                metrics.engagement_rate,
                metrics.engagements,
                metrics.gmail_forwards,
                metrics.gmail_saves,
                metrics.gmail_secondary_clicks,
                metrics.gross_profit_margin,
                metrics.gross_profit_micros,
                metrics.impressions,
                metrics.interaction_event_types,
                metrics.interaction_rate,
                metrics.interactions,
                metrics.lead_cost_of_goods_sold_micros,
                metrics.lead_gross_profit_micros,
                metrics.lead_revenue_micros,
                metrics.lead_units_sold,
                metrics.new_customer_lifetime_value,
                metrics.orders,
                metrics.percent_new_visitors,
                metrics.revenue_micros,
                metrics.top_impression_percentage,
                metrics.trueview_average_cpv,
                metrics.units_sold,
                metrics.value_per_all_conversions,
                metrics.value_per_all_conversions_by_conversion_date,
                metrics.value_per_conversion,
                metrics.value_per_conversions_by_conversion_date,
                metrics.value_per_current_model_attributed_conversion,
                metrics.video_quartile_p100_rate,
                metrics.video_quartile_p25_rate,
                metrics.video_quartile_p50_rate,
                metrics.video_quartile_p75_rate,
                metrics.video_trueview_view_rate,
                metrics.video_trueview_views,
                metrics.video_watch_time_duration_millis,
                metrics.view_through_conversions
            FROM
                ad_group_ad
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

            # SELECT句の順番に従ってメトリクスを追加（79メトリクス）
            metrics_in_select_order = [
                'absolute_top_impression_percentage',
                'active_view_cpm',
                'active_view_ctr',
                'active_view_impressions',
                'active_view_measurability',
                'active_view_measurable_cost_micros',
                'active_view_measurable_impressions',
                'active_view_viewability',
                'all_conversions',
                'all_conversions_by_conversion_date',
                'all_conversions_from_interactions_rate',
                'all_conversions_value',
                'all_conversions_value_by_conversion_date',
                'all_new_customer_lifetime_value',
                'average_cart_size',
                'average_cost',
                'average_cpc',
                'average_cpe',
                'average_cpm',
                'average_order_value_micros',
                'average_page_views',
                'average_time_on_site',
                'average_video_watch_time_duration_millis',
                'bounce_rate',
                'clicks',
                'conversions',
                'conversions_by_conversion_date',
                'conversions_from_interactions_rate',
                'conversions_value',
                'conversions_value_by_conversion_date',
                'cost_micros',
                'cost_of_goods_sold_micros',
                'cost_per_all_conversions',
                'cost_per_conversion',
                'cost_per_current_model_attributed_conversion',
                'cross_device_conversions',
                'cross_device_conversions_value_micros',
                'cross_sell_cost_of_goods_sold_micros',
                'cross_sell_gross_profit_micros',
                'cross_sell_revenue_micros',
                'cross_sell_units_sold',
                'ctr',
                'current_model_attributed_conversions',
                'current_model_attributed_conversions_value',
                'engagement_rate',
                'engagements',
                'gmail_forwards',
                'gmail_saves',
                'gmail_secondary_clicks',
                'gross_profit_margin',
                'gross_profit_micros',
                'impressions',
                'interaction_event_types',
                'interaction_rate',
                'interactions',
                'lead_cost_of_goods_sold_micros',
                'lead_gross_profit_micros',
                'lead_revenue_micros',
                'lead_units_sold',
                'new_customer_lifetime_value',
                'orders',
                'percent_new_visitors',
                'revenue_micros',
                'top_impression_percentage',
                'trueview_average_cpv',
                'units_sold',
                'value_per_all_conversions',
                'value_per_all_conversions_by_conversion_date',
                'value_per_conversion',
                'value_per_conversions_by_conversion_date',
                'value_per_current_model_attributed_conversion',
                'video_quartile_p100_rate',
                'video_quartile_p25_rate',
                'video_quartile_p50_rate',
                'video_quartile_p75_rate',
                'video_trueview_view_rate',
                'video_trueview_views',
                'video_watch_time_duration_millis',
                'view_through_conversions',
            ]

            # データを処理
            for batch in stream:
                for row in batch.results:
                    result = {}

                    # SELECT句の順番通りにフィールドを追加
                    result['date'] = row.segments.date
                    result['customer_id'] = row.customer.id
                    result['campaign_id'] = row.campaign.id
                    result['ad_group_id'] = row.ad_group.id
                    result['ad_id'] = row.ad_group_ad.ad.id

                    # メトリクスを追加（マイクロ単位の変換はしない）
                    for metric_name in metrics_in_select_order:
                        metric_value = getattr(row.metrics, metric_name, None)
                        result[metric_name] = metric_value

                    results.append(result)

            # DataFrameに変換
            df = pd.DataFrame(results)

            # metrics_in_select_orderから列順を生成
            column_order = ['date', 'customer_id', 'campaign_id', 'ad_group_id', 'ad_id'] + metrics_in_select_order

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
    output_dir = "google/ad"
    os.makedirs(output_dir, exist_ok=True)

    # タイムスタンプをファイル名に含める
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = os.path.join(output_dir, f"ad_report_{timestamp}.csv")

    # ===== データ取得 =====
    # レポート取得インスタンスを作成（環境変数から認証情報を取得）
    try:
        report = GoogleAdsAdReport()
    except ValueError as e:
        sys.stderr.write(f"設定エラー: {str(e)}\n")
        sys.exit(1)

    # 全アカウントのデータを格納するリスト
    all_dfs = []

    # 各アカウントのデータを取得
    for i, customer_id in enumerate(CUSTOMER_IDS, 1):
        sys.stderr.write(f"[{i}/{len(CUSTOMER_IDS)}] アカウント {customer_id} のデータを取得中...\n")
        try:
            df = report.get_ad_metrics(customer_id, START_DATE, END_DATE)
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
