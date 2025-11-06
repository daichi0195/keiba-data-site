"""
Google Ads API - ラベルデータ取得スクリプト

このスクリプトは、Google Ads APIを使用してラベル情報を取得し、
CSV ファイルに出力します。
"""

from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException
import pandas as pd
from datetime import datetime
import sys
import os


class GoogleAdsLabelReport:
    """Google Ads ラベルレポート取得クラス"""

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

    def get_labels(self, customer_id):
        """
        ラベル情報を取得

        Args:
            customer_id (str): Google Ads顧客ID（例: "1234567890"）

        Returns:
            pd.DataFrame: ラベル情報データ
        """
        ga_service = self.client.get_service("GoogleAdsService")

        # クエリの構築
        query = """
            SELECT
                customer.id,
                label.id,
                label.resource_name,
                label.name
            FROM
                label
            ORDER BY
                label.id ASC
        """

        try:
            # データ取得
            stream = ga_service.search_stream(customer_id=customer_id, query=query)

            # 結果をリストに格納
            results = []

            # データを処理
            for batch in stream:
                for row in batch.results:
                    result = {
                        'customer_id': row.customer.id,
                        'label_id': row.label.id,
                        'label_resource_name': row.label.resource_name,
                        'label_name': row.label.name,
                    }
                    results.append(result)

            # DataFrameに変換
            df = pd.DataFrame(results)

            # デバッグ出力
            sys.stderr.write(f"列順確認: {len(df.columns)}個の列\n")

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

    # ===== CSV出力パスの設定 =====
    output_dir = "google/label"
    os.makedirs(output_dir, exist_ok=True)

    # タイムスタンプをファイル名に含める
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = os.path.join(output_dir, f"label_report_{timestamp}.csv")

    # ===== データ取得 =====
    # レポート取得インスタンスを作成（環境変数から認証情報を取得）
    try:
        report = GoogleAdsLabelReport()
    except ValueError as e:
        sys.stderr.write(f"設定エラー: {str(e)}\n")
        sys.exit(1)

    # 全アカウントのデータを格納するリスト
    all_dfs = []

    # 各アカウントのデータを取得
    for i, customer_id in enumerate(CUSTOMER_IDS, 1):
        sys.stderr.write(f"[{i}/{len(CUSTOMER_IDS)}] アカウント {customer_id} のデータを取得中...\n")
        try:
            df = report.get_labels(customer_id)
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
