# 検証記録

対象の現行版は`0.7.3`。以下は記録した条件での検証結果であり、外部サービスや実機条件の現在の動作保証とは区別する。

## 2026-10-26: 全変更Appletのローカルコミット照合

- 標準9群と発行EXEの隔離RPC成功を再利用。galleryの生成元版だけ0.94.3→0.94.6へ変化しているが、files／sourcesのhashと実JS／CSSは不変で、描画・設定・回帰に影響しない。配布物の生成元表示0.94.3とソースの0.94.6は履歴用メタデータの差のみ。追加実装なしのため再発行・版更新なし。
- 各repoの実装時入力一覧と現在のソースを照合。host toolchain／lockfile／SDK／Runtimeは一致し、package.jsonのdependencies／devDependencies／scripts／packageManager／enginesも一致。UI側は実装時から更新されているため、最新の固定EXEで4Appletの表示名／版・起動停止を追加検証し成功。.artifacts/commit-validation-applets-20261026/reuse.jsonへ試験単位の判断を記録。
- 全4件のfeed／ZIP hashを確認。新たな製品修正はなく、現発行版を維持する。新GUI証跡は../Applet.WebBrowserTools.at365/.artifacts/commit-validation-applets-20261026/のpublished-smoke.log、smoke-result.json。設定は隔離profileのみで、既定ショートカット初期化をfixtureで抑止し、Pause／F13～F24の送信・OS登録なし。
- commit前後の入力・stage tree／commit treeとcommit SHAは各.artifacts/commit-validation-applets-20261026/へ保存する。今回の差分を1repoずつローカルcommitし、push・Release・実利用deployは行わない。旧検証資料は参照中として保持、削除0件。
## 2026-10-26: 表示名と発行（0.7.3）

- 既存のdisplayName変更を確認。表示名はWallpaperSlideshow、内部name／id／entry・設定・公開APIは保持。開始時はmainで未コミット変更があったため、自動pull／stashは行わず既存差分を保持した。通常修正としてパッチ番号を1つ更新。
- 発行前にmanifest／版／発行スクリプトと影響先をレビューし、阻害指摘なし。レビュー記録は.artifacts/displayname-publish-20261026/review.json。
- 既存回帰9群、test-protocol.cjsのRPC fixture 8群と発行EXEの不正設定拒否／共通ログ／専用HWND／正常終了が成功。実デスクトップへ接続せず確認。既存のギャラリー生成元0.94.3の差分を保持し、publish時にも同梱hash一致。
- publish.batは終了コード0。40.ARTIFACTの配布manifest／実行ファイル／update.jsonの版、ZIPの全エントリー・サイズ・SHA256と配布フォルダーの一致を確認。package-result.jsonに記録。既存deploy関連ファイルを保持。
- 固定の発行済みAppDock 0.94.4へ4つの発行物をそのままコピーし、コピーhash一致、snapshotの内部名／表示名／版と管理画面の4行を確認。Watch／WebBrowserTools／WindowsToolsの起動・停止、ホストの終了コード0を確認。共通証跡は../Applet.WebBrowserTools.at365/.artifacts/displayname-publish-20261026/のpublished-smoke.cjs、smoke-result.json、displaynames.png、host-inputs.json。参照ソースはAppDock main 0.94.3で、固定EXEは0.94.4。
- 各repoの同名.artifactsフォルダーへ入力hash、コマンド／終了コード、完全ログとそのhashを保存。検証後の製品入力は一致。使用方法と設計の版表記のみの文書修正は製品試験へ影響しない。ホスト全回帰／旧GUI全回帰／実ブラウザーや物理入力は変更範囲外として未実施。
- 整理は各.artifacts直下を列挙してcleanup.jsonへ記録。今回の試験は同じ方式の成功1回として保持。他の古い資料は参照・実行方式・所有が確定しないため保持、削除0件。隔離ホストとAppletは終了済み。commit／push／Release／実利用deployなし。
## 2026-10-25: 共通ギャラリーの生成元メタデータをコミット

- 既存の未コミット差分をレビューし、生成元版を0.83.0から0.86.4へ更新するmanifestだけを製品側の変更対象とした。JavaScript/CSSのGit blobはHEADと一致し、CSSおよび生成元3ファイルの記録hashの差はLF/CRLFの違いだけである。現在の同梱ファイル・生成元の実バイトのSHA256は更新後manifestと一致。阻害指摘なし。
- `dotnet run --project Applet.WallpaperSlideshow.RegressionTests -c Release`を通常ユーザー環境で実行し、標準回帰9群が成功（終了コード0）。制限環境での初回ビルド失敗ログも保存した。`git diff --check`成功。実行コード・設定・ビルド/試験定義に変更がないためGUIは再実行せず、過去のGUI成功を今回の実行結果として扱わない。
- 製品版0.7.2を維持し、再発行・Release・実利用先deployは行わない。照合結果、回帰ログとSHA256、最終tree/commitおよびプッシュ照合は`.artifacts/commit-validation-gallery-metadata-20261025/`に記録する。

## 2026-10-22: AppDock 0.83.0のセキュリティ更新版への同梱準備

- 本体のNode/Electron更新に合わせ、共通ギャラリーの生成元の版だけを0.83.0へ更新。JavaScript/CSS・元ソースのhashは0.82.0記録と一致し、Appletの製品コード・設定・保存・版0.7.2を維持する。メタデータ差分のレビューで阻害指摘なし。
- 全体ZIP・個別ZIP/feedの一致とGUI・公開後確認の最終記録先は本体`.artifacts/release-0.83.0-20261022/`。過去の公開Releaseを最新版だけに整理する指示は、全対象の公開後検証成功を条件に適用する。
## 2026-10-22: AppDock 0.82.0リリースへの同梱準備

- 再発行に伴い、共通ギャラリーのmanifestに記録する生成元の本体版を0.74.6から0.82.0へ更新。JavaScript/CSSのSHA256と元ソースの記録は同一であり、製品コード・設定・保存仕様の修正はないためAppletは未公開の0.7.2を使用する。
- 最終配布物の一致・固定EXE GUI・公開後の匿名取得/更新検出は、本体の[リリース計画](../AppDock.at365/.artifacts/release-0.82.0-20261022-final/plan.json)に記録する。下記の過去GUI成功と今回の確認を区別する。
## 2026-10-21: 共通画像カードの選択枠修正を反映（0.7.2）

- 共通bundleをAppDock 0.74.6の出力へ更新し、選択枠を画像の上にも一定幅で描くCSSを同梱。履歴の操作・nativeエンジン・保存仕様は変更せず、通常修正として0.7.2へ更新した。先行0.7.1の画面外画像解放も含めてコミット・push対象。
- 発行前レビューで共通部品・呼出元・保存/API境界を確認し、阻害指摘なし。Release fixture buildは警告0/エラー0、`publish.bat`成功。NuGet取得の制限エラーは同じコマンドを通常ユーザーで再実行して成功した。
- 固定AppDock 0.74.6と発行済み6 web資産を使い、`test-history-page-ui.cjs ... --long-cache --published-assets` **10群** が成功。長パスの生成/decode、カードサイズの保存・再起動復元、プレビュー/背景クリック、fixtureへの開く・削除、明暗・表示先往復・停止時回収を確認した。本体の管理/選択/共通ダイアログを含む固定GUIは計44群。
- EXE **0.7.2 / 51772879 bytes / SHA256 `312f8380f9bd225e8e52f9a5650085a272b461e978b5579aff5f11f3d9a4c3e3`**。manifest/feed、update.zipのsize/SHA256、6資産と共通bundleのソース/出力hashを照合。[本体側の統合証跡](../AppDock.at365/.artifacts/image-gallery-polish-20261021/validation.json)と[コミット判定](.artifacts/commit-validation-gallery-072/validation.json)を正本とする。native回帰9群は変更のないC#・試験・共通SDK/Runtimeを照合して既存成功を再利用する。
- 現在の成功GUIは1回。以前の再利用資料と失敗記録を保護し削除0、対象GUIプロセス残存0。実壁紙・Explorer・関連付けアプリ・ごみ箱・物理DPI/IME/実NASは未確認。GitHub Releaseと実利用先deployは行わない。
