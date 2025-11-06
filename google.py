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
        
        # クエリの構築（CUSTOMER レベルでサポートされているすべてのメトリクス）
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
                metrics.conversions_from_interactions_rate,
                metrics.cost_per_conversion,
                metrics.value_per_conversion,
                metrics.all_conversions,
                metrics.all_conversions_value,
                metrics.active_view_impressions,
                metrics.active_view_measurability,
                metrics.active_view_viewability,
                metrics.bounce_rate,
                metrics.engagement_rate,
                metrics.engagements,
                metrics.interaction_rate,
                metrics.interactions,
                metrics.average_cost,
                metrics.average_cpe,
                metrics.cross_device_conversions,
                metrics.invalid_clicks,
                metrics.invalid_click_rate,
                metrics.video_views,
                metrics.video_quartile_p25_rate,
                metrics.video_quartile_p50_rate,
                metrics.video_quartile_p75_rate,
                metrics.video_quartile_p100_rate,
                metrics.video_trueview_views,
                metrics.video_trueview_view_rate,
                metrics.trueview_average_cpv,
                metrics.search_impression_share,
                metrics.search_top_impression_share,
                metrics.search_absolute_top_impression_share,
                metrics.search_budget_lost_impression_share,
                metrics.search_budget_lost_top_impression_share,
                metrics.search_budget_lost_absolute_top_impression_share,
                metrics.search_rank_lost_impression_share,
                metrics.search_rank_lost_top_impression_share,
                metrics.search_rank_lost_absolute_top_impression_share,
                metrics.search_click_share,
                metrics.search_exact_match_impression_share,
                metrics.content_impression_share,
                metrics.content_budget_lost_impression_share,
                metrics.content_rank_lost_impression_share,
                metrics.absolute_top_impression_percentage,
                metrics.top_impression_percentage,
                metrics.view_through_conversions,
                metrics.gmail_forwards,
                metrics.gmail_saves,
                metrics.gmail_secondary_clicks,
                metrics.conversions_by_conversion_date,
                metrics.conversions_value_by_conversion_date,
                metrics.all_conversions_by_conversion_date,
                metrics.all_conversions_value_by_conversion_date,
                metrics.cost_per_all_conversions,
                metrics.value_per_all_conversions,
                metrics.average_page_views,
                metrics.average_time_on_site,
                metrics.percent_new_visitors,
                metrics.phone_calls,
                metrics.phone_impressions,
                metrics.phone_through_rate,
                metrics.relative_ctr,
                metrics.biddable_app_install_conversions,
                metrics.biddable_app_post_install_conversions,
                metrics.optimization_score_uplift,
                metrics.optimization_score_url,
                metrics.historical_creative_quality_score,
                metrics.historical_landing_page_quality_score,
                metrics.historical_quality_score,
                metrics.historical_search_predicted_ctr,
                metrics.average_cart_size,
                metrics.average_order_value_micros,
                metrics.orders,
                metrics.revenue_micros,
                metrics.units_sold,
                metrics.cost_of_goods_sold_micros,
                metrics.gross_profit_micros,
                metrics.gross_profit_margin,
                metrics.cross_sell_cost_of_goods_sold_micros,
                metrics.cross_sell_gross_profit_micros,
                metrics.cross_sell_revenue_micros,
                metrics.cross_sell_units_sold,
                metrics.lead_cost_of_goods_sold_micros,
                metrics.lead_gross_profit_micros,
                metrics.lead_revenue_micros,
                metrics.lead_units_sold,
                metrics.new_customer_lifetime_value,
                metrics.all_new_customer_lifetime_value,
                metrics.auction_insight_search_impression_share,
                metrics.auction_insight_search_top_impression_percentage,
                metrics.auction_insight_search_absolute_top_impression_percentage,
                metrics.auction_insight_search_outranking_share,
                metrics.auction_insight_search_overlap_rate,
                metrics.auction_insight_search_position_above_rate,
                metrics.clicks_unique_query_clusters,
                metrics.impressions_unique_query_clusters,
                metrics.conversions_unique_query_clusters,
                metrics.active_view_cpm,
                metrics.active_view_ctr,
                metrics.active_view_measurable_cost_micros,
                metrics.active_view_measurable_impressions,
                metrics.benchmark_average_max_cpc,
                metrics.biddable_cohort_app_post_install_conversions,
                metrics.conversion_last_conversion_date,
                metrics.conversion_last_received_request_date_time,
                metrics.cost_converted_currency_per_platform_comparable_conversion,
                metrics.cost_per_current_model_attributed_conversion,
                metrics.cost_per_platform_comparable_conversion,
                metrics.cross_device_conversions_value_micros,
                metrics.current_model_attributed_conversions,
                metrics.current_model_attributed_conversions_from_interactions_rate,
                metrics.current_model_attributed_conversions_from_interactions_value_per_interaction,
                metrics.current_model_attributed_conversions_value,
                metrics.current_model_attributed_conversions_value_per_cost,
                metrics.platform_comparable_conversions,
                metrics.platform_comparable_conversions_by_conversion_date,
                metrics.platform_comparable_conversions_from_interactions_rate,
                metrics.platform_comparable_conversions_from_interactions_value_per_interaction,
                metrics.platform_comparable_conversions_value,
                metrics.platform_comparable_conversions_value_by_conversion_date,
                metrics.platform_comparable_conversions_value_per_cost,
                metrics.value_per_current_model_attributed_conversion,
                metrics.value_per_platform_comparable_conversion,
                metrics.value_per_platform_comparable_conversions_by_conversion_date,
                metrics.value_per_all_conversions_by_conversion_date,
                metrics.value_per_conversions_by_conversion_date,
                metrics.all_conversions_from_interactions_rate,
                metrics.all_conversions_from_interactions_value_per_interaction,
                metrics.all_conversions_value_per_cost,
                metrics.conversions_from_interactions_value_per_interaction,
                metrics.conversions_value_per_cost,
                metrics.general_invalid_click_rate,
                metrics.general_invalid_clicks,
                metrics.video_average_watch_time_duration_millis,
                metrics.video_watch_time_duration_millis
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

            # マイクロ単位の値を変換するメトリクスの定義（変換後のカラム名にマッピング）
            micros_metrics_mapping = {
                'active_view_measurable_cost_micros': 'active_view_measurable_cost',
                'average_order_value_micros': 'average_order_value',
                'cost_micros': 'cost',
                'cost_of_goods_sold_micros': 'cost_of_goods_sold',
                'cross_device_conversions_value_micros': 'cross_device_conversions_value',
                'cross_sell_cost_of_goods_sold_micros': 'cross_sell_cost_of_goods_sold',
                'cross_sell_gross_profit_micros': 'cross_sell_gross_profit',
                'cross_sell_revenue_micros': 'cross_sell_revenue',
                'gross_profit_micros': 'gross_profit',
                'lead_cost_of_goods_sold_micros': 'lead_cost_of_goods_sold',
                'lead_gross_profit_micros': 'lead_gross_profit',
                'lead_revenue_micros': 'lead_revenue',
                'revenue_micros': 'revenue',
            }

            # SELECT句の順番に従ってメトリクスを追加（74行目〜213行目の順序と同じ）
            metrics_in_select_order = [
                ('impressions', 'impressions'),
                ('clicks', 'clicks'),
                ('cost_micros', 'cost'),
                ('conversions', 'conversions'),
                ('conversions_value', 'conversions_value'),
                ('ctr', 'ctr'),
                ('average_cpc', 'average_cpc'),
                ('average_cpm', 'average_cpm'),
                ('conversions_from_interactions_rate', 'conversions_from_interactions_rate'),
                ('cost_per_conversion', 'cost_per_conversion'),
                ('value_per_conversion', 'value_per_conversion'),
                ('all_conversions', 'all_conversions'),
                ('all_conversions_value', 'all_conversions_value'),
                ('active_view_impressions', 'active_view_impressions'),
                ('active_view_measurability', 'active_view_measurability'),
                ('active_view_viewability', 'active_view_viewability'),
                ('bounce_rate', 'bounce_rate'),
                ('engagement_rate', 'engagement_rate'),
                ('engagements', 'engagements'),
                ('interaction_rate', 'interaction_rate'),
                ('interactions', 'interactions'),
                ('average_cost', 'average_cost'),
                ('average_cpe', 'average_cpe'),
                ('cross_device_conversions', 'cross_device_conversions'),
                ('invalid_clicks', 'invalid_clicks'),
                ('invalid_click_rate', 'invalid_click_rate'),
                ('video_views', 'video_views'),
                ('video_quartile_p25_rate', 'video_quartile_p25_rate'),
                ('video_quartile_p50_rate', 'video_quartile_p50_rate'),
                ('video_quartile_p75_rate', 'video_quartile_p75_rate'),
                ('video_quartile_p100_rate', 'video_quartile_p100_rate'),
                ('video_trueview_views', 'video_trueview_views'),
                ('video_trueview_view_rate', 'video_trueview_view_rate'),
                ('trueview_average_cpv', 'trueview_average_cpv'),
                ('search_impression_share', 'search_impression_share'),
                ('search_top_impression_share', 'search_top_impression_share'),
                ('search_absolute_top_impression_share', 'search_absolute_top_impression_share'),
                ('search_budget_lost_impression_share', 'search_budget_lost_impression_share'),
                ('search_budget_lost_top_impression_share', 'search_budget_lost_top_impression_share'),
                ('search_budget_lost_absolute_top_impression_share', 'search_budget_lost_absolute_top_impression_share'),
                ('search_rank_lost_impression_share', 'search_rank_lost_impression_share'),
                ('search_rank_lost_top_impression_share', 'search_rank_lost_top_impression_share'),
                ('search_rank_lost_absolute_top_impression_share', 'search_rank_lost_absolute_top_impression_share'),
                ('search_click_share', 'search_click_share'),
                ('search_exact_match_impression_share', 'search_exact_match_impression_share'),
                ('content_impression_share', 'content_impression_share'),
                ('content_budget_lost_impression_share', 'content_budget_lost_impression_share'),
                ('content_rank_lost_impression_share', 'content_rank_lost_impression_share'),
                ('absolute_top_impression_percentage', 'absolute_top_impression_percentage'),
                ('top_impression_percentage', 'top_impression_percentage'),
                ('view_through_conversions', 'view_through_conversions'),
                ('gmail_forwards', 'gmail_forwards'),
                ('gmail_saves', 'gmail_saves'),
                ('gmail_secondary_clicks', 'gmail_secondary_clicks'),
                ('conversions_by_conversion_date', 'conversions_by_conversion_date'),
                ('conversions_value_by_conversion_date', 'conversions_value_by_conversion_date'),
                ('all_conversions_by_conversion_date', 'all_conversions_by_conversion_date'),
                ('all_conversions_value_by_conversion_date', 'all_conversions_value_by_conversion_date'),
                ('cost_per_all_conversions', 'cost_per_all_conversions'),
                ('value_per_all_conversions', 'value_per_all_conversions'),
                ('average_page_views', 'average_page_views'),
                ('average_time_on_site', 'average_time_on_site'),
                ('percent_new_visitors', 'percent_new_visitors'),
                ('phone_calls', 'phone_calls'),
                ('phone_impressions', 'phone_impressions'),
                ('phone_through_rate', 'phone_through_rate'),
                ('relative_ctr', 'relative_ctr'),
                ('biddable_app_install_conversions', 'biddable_app_install_conversions'),
                ('biddable_app_post_install_conversions', 'biddable_app_post_install_conversions'),
                ('optimization_score_uplift', 'optimization_score_uplift'),
                ('optimization_score_url', 'optimization_score_url'),
                ('historical_creative_quality_score', 'historical_creative_quality_score'),
                ('historical_landing_page_quality_score', 'historical_landing_page_quality_score'),
                ('historical_quality_score', 'historical_quality_score'),
                ('historical_search_predicted_ctr', 'historical_search_predicted_ctr'),
                ('average_cart_size', 'average_cart_size'),
                ('average_order_value_micros', 'average_order_value'),
                ('orders', 'orders'),
                ('revenue_micros', 'revenue'),
                ('units_sold', 'units_sold'),
                ('cost_of_goods_sold_micros', 'cost_of_goods_sold'),
                ('gross_profit_micros', 'gross_profit'),
                ('gross_profit_margin', 'gross_profit_margin'),
                ('cross_sell_cost_of_goods_sold_micros', 'cross_sell_cost_of_goods_sold'),
                ('cross_sell_gross_profit_micros', 'cross_sell_gross_profit'),
                ('cross_sell_revenue_micros', 'cross_sell_revenue'),
                ('cross_sell_units_sold', 'cross_sell_units_sold'),
                ('lead_cost_of_goods_sold_micros', 'lead_cost_of_goods_sold'),
                ('lead_gross_profit_micros', 'lead_gross_profit'),
                ('lead_revenue_micros', 'lead_revenue'),
                ('lead_units_sold', 'lead_units_sold'),
                ('new_customer_lifetime_value', 'new_customer_lifetime_value'),
                ('all_new_customer_lifetime_value', 'all_new_customer_lifetime_value'),
                ('auction_insight_search_impression_share', 'auction_insight_search_impression_share'),
                ('auction_insight_search_top_impression_percentage', 'auction_insight_search_top_impression_percentage'),
                ('auction_insight_search_absolute_top_impression_percentage', 'auction_insight_search_absolute_top_impression_percentage'),
                ('auction_insight_search_outranking_share', 'auction_insight_search_outranking_share'),
                ('auction_insight_search_overlap_rate', 'auction_insight_search_overlap_rate'),
                ('auction_insight_search_position_above_rate', 'auction_insight_search_position_above_rate'),
                ('clicks_unique_query_clusters', 'clicks_unique_query_clusters'),
                ('impressions_unique_query_clusters', 'impressions_unique_query_clusters'),
                ('conversions_unique_query_clusters', 'conversions_unique_query_clusters'),
                ('active_view_cpm', 'active_view_cpm'),
                ('active_view_ctr', 'active_view_ctr'),
                ('active_view_measurable_cost_micros', 'active_view_measurable_cost'),
                ('active_view_measurable_impressions', 'active_view_measurable_impressions'),
                ('benchmark_average_max_cpc', 'benchmark_average_max_cpc'),
                ('biddable_cohort_app_post_install_conversions', 'biddable_cohort_app_post_install_conversions'),
                ('conversion_last_conversion_date', 'conversion_last_conversion_date'),
                ('conversion_last_received_request_date_time', 'conversion_last_received_request_date_time'),
                ('cost_converted_currency_per_platform_comparable_conversion', 'cost_converted_currency_per_platform_comparable_conversion'),
                ('cost_per_current_model_attributed_conversion', 'cost_per_current_model_attributed_conversion'),
                ('cost_per_platform_comparable_conversion', 'cost_per_platform_comparable_conversion'),
                ('cross_device_conversions_value_micros', 'cross_device_conversions_value'),
                ('current_model_attributed_conversions', 'current_model_attributed_conversions'),
                ('current_model_attributed_conversions_from_interactions_rate', 'current_model_attributed_conversions_from_interactions_rate'),
                ('current_model_attributed_conversions_from_interactions_value_per_interaction', 'current_model_attributed_conversions_from_interactions_value_per_interaction'),
                ('current_model_attributed_conversions_value', 'current_model_attributed_conversions_value'),
                ('current_model_attributed_conversions_value_per_cost', 'current_model_attributed_conversions_value_per_cost'),
                ('platform_comparable_conversions', 'platform_comparable_conversions'),
                ('platform_comparable_conversions_by_conversion_date', 'platform_comparable_conversions_by_conversion_date'),
                ('platform_comparable_conversions_from_interactions_rate', 'platform_comparable_conversions_from_interactions_rate'),
                ('platform_comparable_conversions_from_interactions_value_per_interaction', 'platform_comparable_conversions_from_interactions_value_per_interaction'),
                ('platform_comparable_conversions_value', 'platform_comparable_conversions_value'),
                ('platform_comparable_conversions_value_by_conversion_date', 'platform_comparable_conversions_value_by_conversion_date'),
                ('platform_comparable_conversions_value_per_cost', 'platform_comparable_conversions_value_per_cost'),
                ('value_per_current_model_attributed_conversion', 'value_per_current_model_attributed_conversion'),
                ('value_per_platform_comparable_conversion', 'value_per_platform_comparable_conversion'),
                ('value_per_platform_comparable_conversions_by_conversion_date', 'value_per_platform_comparable_conversions_by_conversion_date'),
                ('value_per_all_conversions_by_conversion_date', 'value_per_all_conversions_by_conversion_date'),
                ('value_per_conversions_by_conversion_date', 'value_per_conversions_by_conversion_date'),
                ('all_conversions_from_interactions_rate', 'all_conversions_from_interactions_rate'),
                ('all_conversions_from_interactions_value_per_interaction', 'all_conversions_from_interactions_value_per_interaction'),
                ('all_conversions_value_per_cost', 'all_conversions_value_per_cost'),
                ('conversions_from_interactions_value_per_interaction', 'conversions_from_interactions_value_per_interaction'),
                ('conversions_value_per_cost', 'conversions_value_per_cost'),
                ('general_invalid_click_rate', 'general_invalid_click_rate'),
                ('general_invalid_clicks', 'general_invalid_clicks'),
                ('video_average_watch_time_duration_millis', 'video_average_watch_time_duration_millis'),
                ('video_watch_time_duration_millis', 'video_watch_time_duration_millis'),
            ]

            # データを処理
            for batch in stream:
                for row in batch.results:
                    result = {}

                    # SELECT句の順番通りにメトリクスを追加
                    result['date'] = row.segments.date
                    result['customer_id'] = row.customer.id

                    # SELECT句の順番に従ってメトリクスを追加
                    for original_name, output_name in metrics_in_select_order:
                        metric_value = getattr(row.metrics, original_name, None)
                        if original_name in micros_metrics_mapping:
                            # マイクロ単位のメトリクスは変換
                            if metric_value is not None:
                                result[output_name] = metric_value / 1_000_000
                            else:
                                result[output_name] = None
                        else:
                            # マイクロ単位ではないメトリクスはそのまま
                            result[output_name] = metric_value

                    results.append(result)

            # DataFrameに変換
            df = pd.DataFrame(results)

            # metrics_in_select_orderから列順を生成
            column_order = ['date', 'customer_id'] + [output_name for _, output_name in metrics_in_select_order]

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
    # Google Ads顧客ID（ハイフンなし、例: "1234567890"）
    # 環境変数 GOOGLE_ADS_CUSTOMER_ID から取得可能
    CUSTOMER_ID = os.getenv("GOOGLE_ADS_CUSTOMER_ID", "1234567890")

    # 取得期間（過去30日間の例）
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    START_DATE = start_date.strftime("%Y-%m-%d")
    END_DATE = end_date.strftime("%Y-%m-%d")

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

    # データ取得
    df = report.get_customer_metrics(CUSTOMER_ID, START_DATE, END_DATE)

    # CSV ファイルに出力
    if len(df) > 0:
        df.to_csv(output_file, index=False, encoding="utf-8")
    else:
        sys.stderr.write("警告: 出力するデータがありません\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
