# 検証記録

## 2026-10-31: 履歴メモリ化のコミット前照合

- 本体と合わせた1,084入力、実装時ログと発行物のSHA256を照合し、一致を確認した。0.8.0のRelease build、native回帰/RPC/長パス1,000件、JS4件、ソースと固定EXEの履歴GUI各11群、発行EXEの不正設定拒否・自身のHWND処理・正常終了を再利用する。本体標準161ファイル1,448件も再利用と未実施分の追加で成功が揃った。
- 共通Storage・元画像参照・表示寿命、索引保存が不確かな場合の回収、開く/削除の対象固定・再送抑止、既存の設定/描画/停止契約を再確認し、阻害指摘なし。製品・試験・依存とWeb資産は発行時から不変で、版更新・再発行は行わない。今回の29ファイルだけをstageし、作業内容・stage tree・commit treeを照合する。push・Release・実利用先deployは行わない。
- 正本は`../AppDock.at365/.artifacts/commit-validation-memory-history-20261031/`の入力照合・再利用判断・追加回帰・レビューとstage/commit記録。元の実装/GUI証跡を保持し、追加の実行用コピー・削除対象は0件。実壁紙・Explorer再起動・実ロック/RDP・実際のごみ箱/関連付けアプリは今回も実行していない。

## 2026-10-31: 履歴をメモリStorageとJS表示へ変更 0.8.0

- main/2b7785dのclean状態からpull --ff-onlyで更新なしを確認して着手。.NETは背面描画と履歴パスの記録を担当し、`HistoryPublisher`が共通StorageのMemory scopeへパスの区間と索引を公開する。JSが元画像の取得・縮小・表示を行い、履歴JSONと画像キャッシュはファイル保存しない。既存の設定・操作・端末別カード幅保存は維持した。共通仕様は本体`docs/memory-storage.md`、固有仕様は`docs/history-page-design.md`。
- 履歴用画像ファイルを保存仕様から除いたため0.7.6→0.8.0へマイナー更新し、最低本体版を0.112.2とした。権限はlocal-imagesからsource-imagesへ変更。旧.NET画像ページ処理を除去し、カード幅の保存失敗/明示再試行・破損/未知形式保護の回帰は実担当のJSへ移した。既存の描画・停止・共通ログ契約は保持した。
- 発行前レビューで、読込失敗時の旧画像残留、閉じた後の遅延decode、公開途中の世代変更、索引保存の受付不明、重複画像の情報表示を確認・修正し、関連回帰が成功。拒否された索引は旧値を維持し、受付不明の区間は次の保存成功まで保持する。削除は対象を固定して1回だけ送り、通知失敗による自動再送をしない。
- Release buildは警告・エラー0、native回帰とRPC fixtureが終了0。パスのメモリ公開、削除の全モニター反映、旧区間回収、索引の拒否/受付不明後の復旧、設定の拒否/復元と正常終了が成功。400文字超のパス1,000件も区間のRPC上限・並び順・回収を確認した。JSの保存と画像寿命4件を含む本体との関連**71/71、失敗・skip 0**。
- ソース・発行済み固定EXEそれぞれの履歴GUI**11群**が成功。画像キャッシュ非生成、読めない元画像の非表示と旧画像除去、Windowを閉じた後のURL解放と再取得、カード幅のView再生成/Applet再起動での復元、モニター/ページ位置、プレビュー/確認/フォーカス、設定8項目、明暗/狭幅、表示先往復、停止時回収を確認した。発行EXEの不正設定拒否・共通ログ・自身のHWNDへのquery/cancel/end・正常終了も成功した。
- publish.batは終了0。`A:\40.ARTIFACT\Applet.WallpaperSlideshow.at365`へ0.8.0を発行し、EXE **51761131 bytes / SHA256 `249acbfdab818ef47d7d402af0b3ca379476265c85f7a69b9bc56866c79c37aa`**、manifest/feedの版・最低本体版を照合。update.zip **46338490 bytes / SHA256 `d49258512152a674c1aae94fa10b8025557d1ce3231cfb40ef597f745a8f6f1e`**、ZIP全10ファイルと発行先、元Web資産8件が一致した。既存の利用者所有deployスクリプトは保持した。
- 証跡の正本は`../AppDock.at365/.artifacts/wallpaper-memory-history-20261031/`の入力・完全ログ・レビュー・配布照合・最終validation。固定GUIは`.artifacts/history-page-ui-long-cache-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-1793454048931/`。外部操作は隔離fixtureで、実壁紙・Explorer再起動・実ロック/RDP・実際のごみ箱/関連付けアプリは未実施。既存の利用者キャッシュは自動削除していない。
- 整理は古い成功GUIのEXE5個だけを除去し、最新同方式のコピー、結果/画像/設定/manifestと失敗・方式不明・再利用記録を保持した。共通の削除前検査と保持hash照合は本体の`cleanup.json`を参照。フォルダー全体の削除・コミット・push・Release・実利用先deployは行っていない。

## 2026-10-31: スターター再発行時の共通ギャラリー情報同期

- AppDock 0.109.1の正式リリース準備で、既存の発行処理が`web/vendor/image-gallery/manifest.json`の生成元バージョンを0.101.6から0.109.1へ更新した。JS/CSSの内容と記録SHA256、Appletの実装・設定・依存・版0.7.6は不変。新たな製品修正を伴わない再発行のため、Applet版を増やさない。
- 発行、ZIP/feedとスターターのファイル照合、隔離した本体0.109.1と6Appletの起動に成功。最後のclean検査で自動生成された1行を検出して公開前に停止したため、この関連変更をコミット・プッシュして新しいplanで準備を継続する。ギャラリー入力の一致を含む146入力・ログの照合は`../AppDock.at365/.artifacts/release-0.109.1-20261031/source-evidence.json`、初回の完全ログと起動結果は同フォルダーを参照する。
- 本体の型検査・標準1389件は同じ本体treeの成功証跡を再利用し、新しい配布物の生成・起動・更新試験は次のplanで再実行する。公開結果の正本は本体`VERIFICATION.md`と`.artifacts/release-0.109.1-20261031-final/`へ記録する。

## 2026-10-30: KAGUYAの古いテスト生成物整理

- 共通の整理手順に従い、成功・終了・参照なしを確認した古いフォルダー1件と、最新1回を除く実行用EXEコピー6個、合計1199104346バイトを削除した。直近3回の通常試験フォルダー、結果・ログ・画像・設定・最新コピーは保持し、失敗・状態不明・固定出力は対象外とした。
- 全体の保護15,993ファイルのSHA256一致と削除対象の不在を確認し、削除失敗は0件。製品・版・発行物は変更せず、整理記録だけを追加した。全体の計画・結果・保持検証は../AppDock.at365/.artifacts/cleanup-20261030-kaguya/を参照する。

## 2026-10-29: 情報metadataのコミット前照合

- icon/taglineと版の変更、配置manifest/entry、更新ZIP/feedを先行発行時の入力とSHA256へ照合し一致。本体0.101.9の固定EXEでも既存8Appletの情報表示を確認した。実装入力は不変で、先行の発行・表示試験を再利用し、追加の版更新・再発行は行わない。
- 共通レビューと再利用判断は`../AppDock.at365/.artifacts/commit-validation-applet-information-20261029/{review,reuse,validation}.json`、stage/commitとGitHub origin/mainの照合結果は同じ場所の`stage.json`・`commits.json`・`push.json`を参照する。先行の検証資料は保持。実サービス・実利用のApplet起動・GitHub Release・実利用deployは今回の検証対象外。

対象の現行版は`0.7.6`。以下は記録した条件での検証結果であり、外部サービスや実機条件の現在の動作保証とは区別する。

## 2026-10-29: Applet情報のアイコンとキャッチコピー 0.7.6

- main/追跡先とcleanを確認し、通常環境のpull --ff-only後に、manifestの任意表示情報 `icon: image` と `tagline: お気に入りの景色を、デスクトップに。` を設定。設定・コマンド・保存・権限・最低本体版は変更せず、0.7.5→0.7.6のパッチ更新として関連する版の正本を揃えた。発行前にmetadataと版の差分をレビューし、阻害事項なし。
- 標準publish.batで40.ARTIFACTへ発行。配置manifest/ZIP内manifest/feedのID・版・icon/tagline、ZIPのサイズ/SHA256を照合し成功。native/.NETはProductVersionも一致。本体0.101.6の固定EXEへ発行物をコピーし、停止状態で情報パネルの表示を確認した。通常のApplet起動や外部サービス・実入力は実行していない。
- 標準発行の共通ギャラリー同期で生成JS/CSS/manifestを0.101.6へ更新。元ソース/出力hashを検証し、共通ギャラリー21件と発行済みWeb資産を使う専用native履歴GUI9群が成功。デスクトップや実利用画像を操作せず、生成差分もレビューした。
- 共通の入力・完全ログ・配布照合は`../AppDock.at365/.artifacts/applet-branding-20261029/`、本体の`VERIFICATION.md`、本repoの`.artifacts/applet-branding-20261029/validation.json`を参照。機能別の標準全回帰は今回実行せず、表示情報と配布の影響に必要な範囲を検証した。既存の再利用資料を保持し、今回の整理による削除なし。コミット/プッシュ/Release/実利用deployは行っていない。

## 2026-10-28: 取り消し版のコミット照合

- 取り消し版0.7.5の全77入力、完全ログのSHA256、発行物全8ファイル・ZIP/feedを実装時の証跡と照合し、一致を確認。Releaseビルド、標準回帰、fakeエンジンのRPC8項目、発行EXEの不正設定拒否・自身のHWND操作・正常終了の成功を再利用する。製品の追加修正・版更新・再発行はない。
- コミット対象は版番号・取り消し記録・標準ビルドによるギャラリー生成元メタデータだけで、起動コードと開発文書は試行前のまま。JS/CSSのGit blobは試行前と一致。本体の並行作業は対象外。必要範囲に不足はなく、製品テストの再実行は行わない。
- 証跡: `.artifacts/commit-validation-app-id-rollback-20261028/`のreuse.json、stage.json、result.json。stage treeとcommit treeを照合し、GitHub origin/mainへ通常pushした結果とリモート先端の一致を記録する。Release・実利用deployは行わない。

## 2026-10-28: AppUserModelIDの試行を取り消し（0.7.5）

- 0.7.4で本体と共通のAppUserModelIDを設定したが、利用者の実機ではタスクマネージャーの統合表示に効果がなかったため、依頼に従って取り消した。Program.csとDEVELOPMENT.mdは試行前のmain/c8fe3fbとGit blob一致。設定・保存形式・公開API・終了管理は変更していない。
- 発行済み試行版より新しい取り消し版として0.7.5へパッチ更新。発行前レビューで識別子設定・P/Invoke・追加説明の除去と既存処理の復元を確認し、阻害指摘なし。
- Releaseビルドは警告・エラー0、既存回帰とfakeエンジンのRPC試験8項目が成功。発行EXEでも不正設定の実デスクトップ接続前の拒否・共通エラーログ・自身のHWNDへのquery/cancel/end・正常終了を確認。実Explorer表示・壁紙変更は行っていない。
- publish.batは終了コード0。EXE/manifest/feedの版一致、ZIP全8ファイルのサイズ/SHA256、既存配置スクリプト保持を確認。標準ビルドに伴うギャラリー生成元0.99.16のメタデータは維持し、JS/CSSのGit正規化後の内容は試行前と一致。取り消し版の実利用deployは行っていない。
- 証跡: `.artifacts/process-app-id-rollback-20261028/`のreview.json、build.log、regression.log、publish.log、published-protocol.log、package-result.json、validation.json。検証前入力一覧は時計repoの同名フォルダー。試行時のAPI検証・初回発行の改行差診断・未達結果は`.artifacts/process-app-id-20261028/`に保持し、今回の方式の成功は2回で削除0件。
- Appletの検証前後の入力は文書追記以外一致。本体では並行する画像関連9ファイルと新規試験の変更を検出して保持した。SDK/Runtime・ギャラリー生成元・ビルド依存・固定配布物は不変で、今回の検証に影響しない。本作業による本体ソース変更・commit・push・Releaseなし。

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
