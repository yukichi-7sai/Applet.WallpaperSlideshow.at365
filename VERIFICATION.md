# 検証記録

## 2026-10-19: GitHub更新元変更のコミット確認

- 固定EXE GUIとpublish成功を再利用。標準回帰8群を今回追加しすべて成功。
- 実装時の全追跡入力（検証文書を除く）・成功ログ・配布ファイル・共通GUI結果とスクリプト・本体treeをSHA256/IDで再照合し一致。製品追加修正・再発行なし。レビューで新たな指摘なし。保存済み設定と実利用先は保持。
- `.artifacts/commit-validation-github-account-20261019/`へ再利用根拠・追加試験のログ・stage/commit treeを記録。今回対象だけをコミットし、その後、本体と合わせて登録済みGitHub/AQUAへの通常pushと先端一致を確認する。過去/今回の再利用資料と未確認状態のテスト資料は保持し削除0件。Release・実利用先deployなし。

## 2026-10-19: GitHub更新元の新アカウント対応（0.5.2）

- 開始時main／clean、現在のorigin/mainからpull --ff-only成功（Already up to date）。更新元を`yukichi-7sai/Applet.WallpaperSlideshow.at365`へ統一。既存updateRepositoryの旧アカウント名を置換。.NET発行ビルドとruntime/manifestの版一致を確認。

- 発行前レビューは指摘なし。設定項目・保存ファイル・公開APIの追加削除なしのためパッチ更新。保存済みupdateSourceは変更・移行せず、既定復帰で新しいmanifestの更新元へ戻す。既存publish.batで自身の40.ARTIFACT配下へ発行成功。ZIP/feed/同梱manifestのID・版・size・SHA256・runtimeの存在が一致。

- 最終AppDock 0.62.4 EXE（SHA256 043d72acd4f4176d0417bbc4166a111cecc5aaa7e8740baf21b8d6647b0e85ab）と最終Applet一式を隔離コピー。全6Appletを停止した状態で、保存済み旧指定の保持、新しい既定値の説明、版表示、「既定に戻す」後の画面／メモリ／settings.jsonの一致、停止状態維持を各Appletで確認。正常終了0。

- 証跡: `.artifacts/github-account-20261019/validation.json`。共通GUI/画像: `../AppDock.at365/.artifacts/applet-github-account-20261019/profile-1792345747763/`。入力hashは前後一致、hostはb27bd046b704e1a27ad31fdc2f481f80ea086b31。変更と無関係な全回帰・実アカウント・実Google受信・実GitHub Release取得・各機能の実Windows効果は未実施。今回と過去の成功/失敗・再利用資料を保持し削除0件。

- 本体のGitHub参照修正は先にb27bd04へコミット済み。今回のApplet変更は未コミット。push・Release・実利用先deployなし。

## 2026-10-18: 表示時のバッファリング（0.5.1）

- 0.5.0の利用者コミット`0744076`を基点とし、DesktopHostだけを局所修正。Surface専用の`BufferedGraphicsContext`へ切り出し・拡縮を含む描画を完了してから`Render`でDCへ転送する。互換Bitmapを再利用し、paint DCを保持せず、Surface終了時にcontextも解放する。画像交換時の`SetWindowPos`は初回表示だけに限定した。画像所有権、停止/復旧、設定/保存形式・公開APIは維持。
- 発行前レビューは[指摘なし](.artifacts/buffered-drawing-20261018/review.md)。設定項目・保存ファイル・互換性の変更がないためパッチ0.5.1、最低本体版0.46.0を維持。Releaseビルドは警告0/エラー0、標準回帰8群が成功。制限環境の初回ビルドは診断なしで失敗し、同じReleaseビルドを通常ユーザー権限で成功させた。初回ログも保持。
- [固定した発行EXEの実試験](.artifacts/memory-native-1792261133074/result.json)が成功。2画面のピクセル出力、8回の手動切り替えとタイマー更新中のHWND/配置/DPI/入力透過style保持、自分の表示窓破棄後の再接続、停止・再開、限定HWNDへの終了通知と正常終了を確認。Themes変更通知0、背景レジストリとTranscodedWallpaperのhash・更新時刻を保持した。
- KAGUYA / Windows build 26300 / .NET SDK 10.0.402 / Node 24.21.0。5120×2160と3840×2160、両方144dpi。短時間9サンプルのPrivate Bytesは初回202.1MiB・最終205.8MiB、GDIは主に23（一時25）。Surfaceごとの描画バッファ分が常駐する。長時間のリーク検証ではない。
- `publish.bat`終了0。発行EXEは**51,753,922 bytes / SHA256 `6544cd3933b7f2a7f3ee107bce7e84de611e314b10252ad8f14120ceadeff9d8`**。更新ZIPは**46,311,269 bytes / SHA256 `e036aa2f879f677a82f729970692e3d1301ca469c8e3313ed9a572747b249d41`**。EXE/manifest/feedの0.5.1一致、ZIP内2ファイルのhash、配置ファイルの存在を照合。[入力・依存・コマンド・ログ・成果物の記録](.artifacts/buffered-drawing-20261018/validation.json)。
- 利用者が0.5.1で、切り替え時のちらつきと上から描画過程が見える現象の両方が改善したことを目視確認し、2026-10-18に報告。これは利用者の実環境での確認であり、自動試験による再現・判定とは区別する。実入力、Explorer本体再起動、Win+D/仮想デスクトップ、ロック/RDP、混在DPI変更は未確認。変更外の本体全回帰、設定GUI、RPC/性能fixture全項目は再実行していない。
- テストフォルダーはsource実行の成功1件、発行EXE実行の直近成功3件、以前の移行証跡・失敗/不明を保持し、削除候補なし。main上の実装・発行まで。コミット、push、Release、実利用先deployは未実施。

## 2026-10-18: デスクトップへのメモリ描画（0.5.0）

- [設計](docs/desktop-memory-rendering-design.md)に沿い、合成BitmapをPresenterへ所有権移動してモニター別の背面ウィンドウへ表示する方式へ置換。表示用BMP保存、壁紙API、背景レジストリ書換え、Themesキャッシュ読取り、黒塗り終了処理を撤去した。旧ファイルは削除しない。`prepare-background`だけを廃止し、既存設定・paused生成ID・背景設定画面の起動は維持。
- 発行前に実装差分・所有権・停止/復旧・保存境界・公開操作・関連試験をレビューした。[レビュー記録](.artifacts/memory-desktop-20261018/review.md)。EXEのWindows互換宣言不足を実apphostで再現し、app.manifest追加で修正。解放順序、WinEventの対象判定、重なり順と描画例外処理も確認・補強した。保存仕様/公開操作の廃止により0.4.8→0.5.0、最低ホスト版0.46.0は維持。
- .NET 10 Releaseビルドは警告0/エラー0。標準回帰8群、RPCの設定/履歴/削除/コマンド/ログ/EOF、実hidden HWNDを限定した終了取消・終了確定・ログオフ・二重停止防止、性能fixtureが成功。通常回帰とRPC fixtureはfake接続先で、実壁紙やExplorerへ接続しない。
- AppDock 0.56.0の固定EXE＋native fixtureで設定GUI4群が成功。背景変更ボタンの撤去、保持した設定画面の起動、即時保存と手動停止維持、通常/狭幅を確認。[結果とスクリーンショット](.artifacts/memory-settings-ui-1792258437513/result.json)。初期の試験失敗は折りたたみsummaryを開いていない旧selectorを修正したもので、製品UI変更は不要だった。
- 発行EXEの固定コピーで、KAGUYA / Windows 11 build 26300のProgman配下の構成、5120×2160＋3840×2160（両144dpi）への配置と赤画像の実描画ピクセルを確認。切り替え、自プロセスの表示HWNDだけを閉じた後の再接続、手動停止・再開、限定HWNDへの終了通知と正常終了が成功。[実native結果](.artifacts/memory-native-1792259210035/result.json)。Explorer本体は再起動していない。
- 同試験で壁紙レジストリ値とTranscodedWallpaperのSHA256/更新時刻を保持し、Themesの対象ファイル変更通知は0件だった。通常コードに壁紙変更APIや表示画像の保存が残っていないことも照合した。ファイル変更通知と状態比較による確認であり、ETWによる全I/Oバイト計測ではない。履歴サムネイルとホストの設定/ログ保存は既存仕様どおり。
- 短時間の連続切り替え9標本でGDIオブジェクトは21～21、USERオブジェクトは26～28、Private Bytesは初回128.1MiB/最終131.1MiB。長時間リーク試験とは区別する。別の16画像/1920×1080の性能fixtureでは合成151ms、追加ピーク22.2MiB。[性能ログ](.artifacts/memory-desktop-20261018/final-performance.log)。
- `publish.bat`成功。発行先は`A:\40.ARTIFACT\Applet.WallpaperSlideshow.at365`。EXE 51,753,782 bytes / SHA256 `435659b5b0426ecc8deb72b7cc0d7c8ecf9e651efc98416ead69d5206e5c96ba`。update.zip 46,310,996 bytes / SHA256 `548c6b5fbde611fa92970d79bd50496cfb897f9ce152d96b5ed3212ff424ea8b`。EXE/manifest/feedの0.5.0一致、ZIP内2ファイルと発行物の全hash、配置スクリプトの存在を確認。発行EXEの不正設定拒否・共通ログ・終了通知・正常終了も成功。本体や他Appletの再発行、全体ZIP作成は行っていない。
- [検証一覧・入力/ログ/成果物のhash](.artifacts/memory-desktop-20261018/validation.json)。初回ビルドと実デスクトップ接続は制限環境で失敗し、同じ処理を通常ユーザー実行で切り分けた。初期native生成失敗、透明だった試験画像と廃止済みコマンドの旧期待値などの失敗記録も保持し、修正後の成功ログを区別した。
- 未確認: 物理入力でのアイコン/背景メニュー/ドラッグ、Win+D、仮想デスクトップ切替、Explorer本体の再起動、実ロック/RDP・実OS終了、混在DPI変更、Windows 10の従来WorkerW構成。変更外の本体全回帰・モニター編集専用GUIは未実行。fixtureと実HWNDの成功をこれらの実操作の成功へ読み替えない。
- main上の実装・発行まで。コミット、push、GitHub Release、実利用先へのdeployは未実施。

## 2026-10-16: モニター一覧とフォーカス余白のコミット確認

- 本体の共通編集テンプレートの余白修正に合わせ、`test-monitor-list-ui.cjs`へ入力のfocusと左右のoutline境界検査を追加。製品ソースと発行Applet0.4.8は実装時から同一。入力・依存・成功ログ・配布資産を照合してApplet8群/RPC/native smokeを再利用した。
- 修正した最終AppDock0.46.0の固定EXEで[モニターGUI7群](.artifacts/monitor-list-ui-1792077765049/result.json)が成功。明暗/狭幅のフォーカス枠、64フォルダーと固定フッター、保存/取消/競合/並べ替えと両入口を確認。実壁紙を変更せず実Appletは無効のまま。source GUIのフォルダー選択はnative dialog応答のstub、固定EXEは手入力。
- 本体の標準回帰485件（今回432件、照合再利用53件）とWeb一覧7群/AI16群も成功。Appletの再publishなし。ZIP/manifest/EXEのhashは前節と一致。[両repoのレビュー・再利用・検証証跡](../AppDock.at365/.artifacts/commit-validation-monitor-list-20261016/validation.json)を保存し、stage treeとcommitの一致を確認する。コミットのみで、push・Release・実利用先deployは未実施。

## 2026-10-16: モニターごとの画像設定を共通一覧へ移行（0.4.8）

- `monitors.list`で番号・画像ソースフォルダー・表示モード・タイル枚数の共通一覧を宣言。歯車から全項目をまとめて編集し、追加/編集はOK保存、取消では破棄、削除は確認、順序は共通ダイアログを使う。Applet独自フォームや保存フィールドは追加せず、既存の配列位置によるモニター割り当て・壁紙エンジンを保持。表示変更のパッチ0.4.8、共通番号列/フォルダー選択に必要な最低本体版0.46.0。
- 発行前レビューと本体の関連15件が成功。当Appletの`dotnet run --project Applet.WallpaperSlideshow.RegressionTests -c Release`は**8群、終了0**。`scripts/test-protocol.cjs`のfixture RPC8群と発行native EXEの不正設定拒否・限定HWNDメッセージ・正常終了が成功。`.artifacts/monitor-list-20261015/regression.log`、`protocol.log`に記録。実デスクトップの壁紙変更は行っていない。
- [最終固定EXEのモニターGUI7群](.artifacts/monitor-list-ui-1792076415525/result.json)で旧JSON文字列/Folder/数値Mode、入力検証と保存/取消、他項目保持、追加/削除/並べ替え、外部競合拒否、明暗/狭幅、設定と詳細の両入口、64フォルダー時の上限・スクロール・フッターを確認。実Appletは無効のまま、発行資産をそのまま隔離配置した。フォルダー選択の応答は[source GUI7群](.artifacts/monitor-list-ui-1792076265412/result.json)でstub、固定EXEでは手入力を使う。UI画像を目視し、本体共通フレームの重なりを修正後に最終確認した。
- `publish.bat`終了0。manifest/feed/EXEは0.4.8、minimumHostVersionは0.46.0。EXE **51,747,236 bytes / SHA256 58001ffe720a9f561fea9d7d588c7057979e7c5940245188f614333b1605e67f**。個別ZIP **46,305,160 bytes / SHA256 9056b0dec619cdd3fe854db6f81cf9def07eac1badb31c9a80456216d05abb72**。ZIP2ファイルと配布フォルダー、GUIへ置いた実資産を照合。[ZIP記録](.artifacts/monitor-list-20261015/archive.json)と[両repoの入力・ログ・レビュー](../AppDock.at365/.artifacts/monitor-list-20261015/validation.json)を保存。
- 初回portable inspector接続timeout、64件試験の描画待ち不足、旧フレームの画像は本体側の記録と合わせて保持。既存の全機能`test-ui.cjs`は旧inline/save UI用であり、今回の成功とは扱わない。現行一覧用の`test-monitor-list-ui.cjs`を追加。未コミット、push・Release・実利用先deploy・全体ZIPは未実施。

## 2026-10-14: 設定テンプレートの仕上げとコミット前検証

- 標準回帰 **8群** が終了0。設定宣言と版以外の実行処理を変更していないこと、manifestの既存設定/コマンドを保持していることを再レビューし、未解決指摘なし。
- 最終AppDock 0.36.8の固定EXEと当Appletの発行物で、共通フォーム・全項目・即時保存・明暗テーマ・狭い幅を確認。本体標準回帰410件と、設定/検索/Shell/画面遷移/WebAppletの必要GUIが成功。実OS操作/実サービスを模擬試験の成功に含めない。
- 前回のpublishの版を維持し、個別ZIPと発行ファイルの全hash一致を再確認。本体だけが余白・グループ背景の修正により再発行されている。
- [今回の標準回帰・検証証跡](.artifacts/commit-validation-settings-template-20261014/validation.json)と[本体のGUI証跡](../AppDock.at365/.artifacts/commit-validation-applet-settings-20261014/validation.json)を保存。検証treeを照合後、VERIFICATIONのみを追記してコミットする。固定配布物と再利用資料を保持。push・Release・実利用先deployなし。


## 2026-10-14: 共通設定テンプレートへの統一（0.4.7）

- extension.jsonのsettingSectionsで用途別のカードを宣言し、最低本体版を0.36.8へ統一。既存設定のキー/型/既定値、操作・コマンドは旧HEADとJSON比較で同一。描画と保存は本体の共通テンプレートへ委譲し、実行処理や保存領域は変更していない。
- 発行前レビューで設定/操作の参照・重複・配置漏れ、設定互換性、版と最低本体版、共通ガイドへの参照を確認。未解決指摘なし。設定項目・保存ファイルの増減や破壊的変更がないためパッチ更新。
- publish.bat終了0。manifest/feed/配布フォルダーの版は0.4.7、minimumHostVersionは0.36.8。update.zipは46304989 bytes、SHA256 c4ca7b02893dccb9216f411e33634c0cc49ecb6f841fe01b33d5d462343c47ee。ZIP全ファイルと配布フォルダーのhash一致を確認。[発行ログと照合](.artifacts/settings-template-20261014/)を保存。
- 固定AppDock 0.36.8と今回の発行物を隔離配置し、設定を停止状態で表示・保存できること、全項目と共通起動欄、明暗テーマ/1280・760幅を確認。本体GUI全4群・検索7群・画面遷移が成功。[共通GUI結果](../AppDock.at365/.artifacts/applet-settings-1791960532161/result.json)と[本体検証記録](../AppDock.at365/VERIFICATION.md)を参照。本体の標準回帰は410/410、fail/skip 0。
- 今回は設定宣言と版のみを変更したため、Applet固有のOS実操作・実サービス・全回帰は対象外。実壁紙・ロック・消灯・認証は操作していない。未変更Appletの発行、commit/push/Release/実利用先deployなし。GUI資料は本体側の隔離profileへ保持。

## 2026-10-11: 公開設定拡充のコミット前確認

- stageしたtree `8c741df3b30d6999a8b33af0f14c572e88572013`の標準回帰と発行ホスト/実AppletのGUI・MCPを再実行して成功。壁紙はRPC/発行native EXEも終了0。検証前後の製品・テスト・発行物hash不変を確認し、再発行なし。
- 証跡は.artifacts/commit-validation-public-settings-20261011。完全ログ/終了コード/hash、対象tree/commit、兄弟ホストとツールの入力を記録。検証後の変更は本記録の追加のみで、最終treeを保存する。実サービス/実消灯・ロック/実デスクトップ壁紙は未操作。ローカルコミットまで。

## 2026-10-11: 0.4.6 単純な設定の外部公開

- 既存公開2項目にtileMargin/historyLimit/thumbnailWidth/thumbnailHeight/maxFileNameLength/historyPageSizeを追加し、公開8項目。monitorsや画像フォルダーは非公開。runtime実装の変更なし。
- Release標準回帰、RPC8群、発行native EXEの不正設定拒否・共通ログ・実HWND/終了が成功。発行ホスト＋native fixture GUI6群（ui-1791667790639）で公開schema/値/更新、範囲外・monitorsの拒否、dryRun・revision・書込拒否、2件/ページと32×24上限のサムネイルへの反映を確認。実デスクトップ壁紙はfakeで代替。
- 必要本体版0.26.30。自身のpublish/update.zipは46267537 bytes、SHA256 9153da59a4b911e1d49c0a2ef6f97285b5d8b3d4a26a64467d05919ab3ef586c。manifest/feed/ZIP全2ファイルの内容一致を確認。未変更本体/Gmail等の再発行、依存更新、commit/push/Release/deployなし。
- 証跡は.artifacts/public-settings-20261011。GUI試験を現行のApplet詳細タブ/保存操作へ更新し、試験用ポート固定・起動完了待ち・意図した拒否ログ・画像の縦横比の期待値を修正。途中失敗ログは保持し、最終試験は終了0。認証・実メール・実OS更新は対象外。古い成功profileは方式別で3件以下、その他の失敗/不明/再利用資料は保持し削除対象なし。

## 2026-10-11: 設定コマンドのコミット前確認

- 対象8ファイルをstage後、標準.NET Release回帰、RPC8群と発行native EXEの不正設定拒否/共通ログ/実HWND/終了、発行ホストのGUI5群を再実行し、すべて終了0。実デスクトップの壁紙APIはfakeで代替。
- 検証前後treeは`0f22db87f6cf04d2705897819dbbed742f01a926`。発行ZIP/EXE/manifestのhash不変を確認し、再発行は不要。兄弟ホストの標準221件とGUI10群も成功。
- 証跡は`.artifacts/commit-validation-settings-commands-20261011/`。検証後の編集は本記録のみで最終tree/commit SHAを保存。GUI成功3件と失敗/不明/再利用資料を保持し削除対象なし。今回の依頼範囲はローカルコミットまで。

## 2026-10-11: 0.4.5 設定宣言から生成する停止/再開コマンド

- 最低本体0.26.30。paused/intervalSecondsを公開し、paused.on/off/toggleは本体生成。旧start/stop/toggleとresume/pause aliasを削除し、パネルも生成IDへ置換。既存割当の移行なし。画像設定の検証より先に手動停止を反映し、不正設定時も最後の有効構成で停止/再開できる。
- .NET Release回帰成功、変更後native fixtureのRPC8項目成功。発行実EXE0.4.5の不正設定による起動拒否/ホストログ/実HWND query-cancel-end/正常終了を確認。デスクトップへの壁紙操作はfakeで代替。
- 現行の詳細タブにGUIスクリプトを更新。将来版拒否fixtureの無効なsettingActions参照を除去し、生成コマンドの停止中表示/実行不可、明示的な起動、パネルから停止/再開/反転と保存、画像履歴/プレビュー/削除/ページ設定など5群成功。source .artifacts/ui-1791665379827、発行host .artifacts/ui-1791665912760。fixtureの意図した画像エラー1回以外のエラーなし。旧GitHub更新表示モックは現在のupdate.json方式に非対応のため本スクリプトから分離し、本体portable-updates回帰へ委ねた。
- publish.bat終了0。自己完結EXE/manifest/feed版一致、ZIP46267538bytes、SHA256 0b2ae5e0321a0e4cff51768af6985c17f07f924bb44212ee6e54f11ffeb4b08b。ZIP全2ファイルとpublish内容一致。証跡.artifacts/settings-commands-20261011。
- 実PCの壁紙変更、Google等の外部サービス、OS自体の終了は未実施。今回の壁紙生成コマンドの実機試験はnative fixture＋発行ホストであり、実画像のデスクトップ反映まで保証するものではない。commit/push/Release/deployなし。

## 2026-10-10: 0.4.3 コミット前の全回帰確認

- 共通ログ/Windows終了対応のコミット依頼により、対象19ファイルをstageしてからRelease標準回帰8グループを再実行して成功。検証開始/終了のtreeは`7b385e05185f67aa748c7fdb2013758c40dde874`で一致し、未stage/未追跡の入力なし。
- `test-protocol.cjs`のRPC8項目と発行native EXEの起動失敗ログ・実HWND query/cancel/end、`test-session-shutdown.cjs`の確定/logoff/通常停止3群、`test-host-logging-ui.cjs`の固定本体/実AppletログGUI4群も再実行してすべて終了0。結果は`.artifacts/session-shutdown-1791638882618/result.json`と`.artifacts/host-logging-1791638884710/result.json`。取消後再生、通知から戻る前の黒BMP生成、1回のcleanup、停止時errorレベルの共通ログ排出を確認。
- 兄弟AppDockは型検査、標準回帰192/192、変更コード書式確認が成功。発行物0.26.18/0.4.3のhash/size、feed/ZIP全2ファイル、文書リンク95件、既存全体ZIP不変を照合。製品ソース/テスト/依存/発行物は検証前後で不変のため再発行は不要。
- 再利用用証跡は`.artifacts/commit-validation-20261010-logging-shutdown/`。各コマンド/終了コード/完全ログSHA256、tracked入力、兄弟SDK/Runtime、toolchain/lockfile/依存状態と発行物を保存。検証後の変更は本VERIFICATIONへの記録追加のみで、最終treeとコミットSHAを同証跡に記録する。
- 完了時整理: 古い成功のhost-logging/session-shutdown各1件を、専用プロセス終了・直下の絶対パス・reparse pointなしを確認して削除。方式別最新成功3件・失敗記録・再利用証跡を保持（cleanup.json）。PC自体のshutdown/reboot/logoff・実壁紙APIは未試験で、隔離実HWND/fake APIの境界を維持。今回の明示依頼は両repoのローカルコミットまで。

## 2026-10-10: 0.4.3 共通ログとWindows終了時クリーンアップ

- 0.4.2で独自errors.logを廃止し、エンジン/監視/画像処理/設定/履歴のエラーを既存のLog.ErrorAsyncへ接続。重複抑制（1分）と上限128件の直列送信、通信失敗のstderr、停止後の最大1秒排出待ちを確認。既存errors.logの内容を変更せず、新規ファイルも作らない回帰が成功。起動失敗は送信完了を最大1秒待ってから元のエラーを返す。
- 追加依頼のWindows終了対応を含む最終版は0.4.3。非表示DispatcherFormがWM_QUERYENDSESSIONを許可し、取消で再生を変えず、WM_ENDSESSIONの確定時に同期的に同じStopEngineを実行。終了優先度0x2ffと、リソース解放の例外時も壁紙消去を試みるfinallyを追加。通常停止との重複は1回。ログの停止中受付修正のため最低AppDockは0.26.18。
- 最終Release回帰8グループ成功（.artifacts/session-shutdown-regression.log）。画像/背景API/描画・監視の既存回帰、Logの送信・重複・再接続・切断・無応答・キュー上限、実HWNDへのquery/取消/確定/logoffと黒BMPを確認。デスクトップAPIはfake。
- test-protocol.cjsの8項目と発行native EXEの不正設定拒否・起動失敗ログ・実透明tool HWNDへのquery/cancel/end・正常終了が成功（.artifacts/session-shutdown-native-protocol.log）。WinFormsの補助HWNDも同じWindowクラスだったため、最初の列挙試験は失敗。実測した透明tool-windowの拡張styleで対象を限定して最終成功。製品コードには試験用コマンドを追加していない。
- test-session-shutdown.cjsは別プロセスの実DispatcherFormへ限定メッセージを送信。確定終了・logoff・通常deactivateの3群で、取消後の再生、通知から戻る前の黒BMP生成/空の壁紙パスへの適用、重複停止の防止、クリーンアップログの排出・正常RPC終了を確認（.artifacts/session-shutdown-1791637415929/result.json）。
- 最終固定AppDock 0.26.18単一EXEと0.4.3のGUIは4群成功（.artifacts/host-logging-1791637417933/result.json）。fixture内部の画像エラーと実発行Appletの起動エラーについて、全体/個別ログ画面・Applet ID/errorレベル・ホストログファイル・重複抑制・正常終了・独自errors.logなしを確認。画面画像を目視。停止処理中のfixtureエラーもerrorとして保存。旧本体では起動失敗の即時終了と停止中API拒否があり、前者をAppletで短い送信待ち、後者を本体0.26.18のログだけの受付で修正した。
- publish.bat終了0。EXE0.4.3は51,710,580bytes/SHA256 75ef53ac044be384c546fc3dfdd62151aaceb68970103c1c69574056e0bbfb89。update.zipは46,268,101bytes/SHA256 855a94bbe98219e450d91514a73338be3ea16be6fadb75c18edbe04afbf2c2fe。ソース/発行manifest・最低host・feed・ZIP全2ファイル・GUI検証コピーが一致（.artifacts/logging-shutdown-final-check.json）。関連文書リンク95件と差分検査成功。
- 完了時整理: host-loggingの成功3回とsession-shutdownの成功3回を保持。解決済み失敗profileと、旧ui群の結果/利用状況が不明な記録は保持し、.artifactsの追加削除0。旧GUI fixtureが残した自身のTemp画像3フォルダーは、ログのGUID/親パス/画像だけの内容/非転送/プロセス終了を確認して限定削除（logging-fixture-temp-cleanup.json）。今後のfixtureはdeactivate応答前に自身の一時画像を削除する。
- 実PCのシャットダウン/再起動/logoff、Windows壁紙APIの実状態、強制終了/電源断は未試験。Windowsの終了順全体や別アプリによる終了取消は実OS操作での確認が必要。ユーザーの壁紙・画像・設定と旧ログは変更していない。実装とローカルpublishまでで、commit/push/Release/deployなし。

## 2026-10-10: 開発生成物を`.artifacts`へ改名

- ユーザー指定でartifacts→.artifactsを改名。移動直後に既存1876項目の相対パス/size/mtime/ディレクトリ・リンク属性が一致し、検証終了時も元の全項目のsize/mtime/属性が不変。配布物4ファイルのSHA256も検証前後で一致。保存済みログ/JSONは内部パスを含めて保持し、過去記録の当repoのartifacts/は.artifacts/へ読み替える。
- テスト/開発用の参照とGit除外/開発手順を更新。6repo合計の変更CJS18件の構文、Gmail start-dev.ps1の構文/UTF-8 BOM、各repoのgit diff --checkが成功。旧artifactsの再生成なし、新.artifactsのGit除外を確認。
- 既存.NET回帰5群成功、scripts/test-protocol.cjsのfixture7群と発行済みnativeの不正設定拒否/終了確認成功。実利用の壁紙は変更していない。
- ログは.artifacts/rename-20261010-regression.log。Gmail/Wallpaper/Watchの元の統合試験ログは.artifacts/rename-20261010-integration.log。残りの開始/停止確認の再現スクリプト/ログはA:/XX.TEMP/applets-artifacts-rename-startstop-20261010.cjsと同.log。確認スクリプトのsnapshot非同期取得/待機の途中失敗は修正し、最終は4件すべて終了0。棚卸し/最終照合はA:/XX.TEMP/applets-artifacts-rename-20261010-{before,after,final}.json。
- 製品実装は変更せず、manifest版0.4.0と既存publishを保持。再発行/commit/push/Release/実利用deployなし。同期・バックアップ設定はユキちゃんが担当。今回の成功した新規profileは各方式で直近3回以下、古い証跡は使用終了/再利用要否を一括確定していないため保持し削除0。

## 2026-10-09: 更新配布物の自動生成

- `codex/update-packages`で発行スクリプトだけを更新。Applet本体の版は0.4.0を維持し、`publish.bat`終了コード0。共通パッカーはAppDock 0.23.0のソースから発行。
- `publish/update.json`のID・版をmanifestと照合し、ZIPのサイズ46263136bytesとSHA256 `695eebf2dfbc81f603b505eaf3ba93ab16f16fdc59680c201beb308e1488a998`を照合。ZIP内2ファイルすべてを通常発行フォルダーとバイト単位で比較し一致。収録: `Applet.WallpaperSlideshow.at365.exe`, `extension.json`。
- 旧SDK/旧DLLの生成物が残るWatch・WindowMover・WindowsToolsでは、既存deployと一致する配布内容へ整理する処理を追加。任意のユーザーファイルの再帰削除は行わない。
- 共通検証結果はAppDockの`artifacts/applet-update-packages.json`、発行ログは`artifacts/Applet.WallpaperSlideshow.at365-update-publish.log`。実利用先deploy・外部公開・pushは未実施。実GitHub/HTTP(S)/UNC配布先の確認はユーザーが後で行う。Applet固有機能・実アカウント操作の再試験は今回の発行変更の対象外。

## 2026-10-08: 実利用先へのdeploy

- 配置後の実利用について、ユーザーが正常動作を確認したと報告（2026-10-08）。

- ユーザーの明示指示により、AppDockと全6Appletの`deploy.bat`を引数なしで実行し、7件すべて終了コード0。配置先は`A:\00.ESSENTIAL\00.MainTools\AppDock.at365`。5つの.NET Appletは現ソース/SDKで`publish.bat`を先に実行し、Gmailはdeploy内で再発行した。
- AppDock0.16.2、Gmail0.5.1、WallpaperSlideshow0.3.0、Watch0.1.1（native）、WebBrowserTools0.2.4、WindowMover0.2.1、WindowsTools0.1.1を配置。Watchの古いDLL版manifestを配置せず、現ソースのnative版へ更新。
- 配置対象21ファイルのSHA256はすべて発行元と一致。現ソースと配置manifestの版/runtime/entry、minimumHostVersionも照合。settings.json・avatar.png・Gmail accounts.jsonの3ファイルは配置前後のハッシュ不変。
- 配置前後とも関連プロセスなし。実利用アプリは起動していないため、次回起動で反映する。旧ファイル退避は行わず、設定・認証領域を配置スクリプトで変更していない。結果は`../AppDock.at365/artifacts/deploy-2026-10-08-result.json`（本体では`artifacts/deploy-2026-10-08-result.json`）。

## 2026-10-08: 依存パッケージ確認

- 外部NuGet PackageReferenceなし。slnxの`dotnet list package --outdated`も更新なし。依存定義や製品コード・版の変更は不要。参照するAppDockのnpm更新詳細は[本体検証記録](../AppDock.at365/VERIFICATION.md)を参照。
- 現AppDock SDK/RuntimeでRelease build警告0/エラー0、既存RegressionTests成功。実アプリ/ハードウェアに作用するnative検証、publish/deployは今回実施していない。

2026-10-06 JST。Applet.WallpaperSlideshow.at365 v0.1.0 / AppDock v0.5.0。

## 成功した確認

- .NET Releaseビルド、0警告・0エラー。Windows SDKパスのsandbox拒否（MSB4184）は、アクセス可能な実行環境で再確認した。
- 複数フォルダーの混合、親子・重複・欠落フォルダー、旧Folder設定、1巡まで重複なし、無効設定の拒否。
- タイル・負のモニター座標・クリッピング・画像の独立した寿命・キャンセル・直列化・古い結果の破棄・UI応答・一時BMPの終了時削除。
- フォルダー監視の再接続、削除・再作成、エラー復旧、部分走査、ログ世代交代と重複抑制、終了時のリソース解放。
- 実際のAppDock.Runtimeとテスト専用エンジンでactivate / command / settings.changed / deactivate / EOFを往復。トレイ項目0、13コマンド、停止状態の保存、不正設定時の前回設定維持、履歴4件/3件ページ、JPEGサムネイル、操作へ戻る際の画像解放。
- 製品EXEのWinFormsエントリーポイントを起動。不正設定をWindows壁紙APIに入る前に拒否し、deactivateとEOFで正常終了。
- パッケージ版AppDock（win-unpacked）で30秒既定値、JSON設定・保存、開始待ち、無効化、今すぐ開始、履歴・ページ送り、1280px/900pxの幅と画像表示、停止の保存を確認。JSページエラーなし。
- 必要ホスト99.0.0を持つテストAppletを同じAppDockで拒否し、開始待ち予約を作らないことを確認。
- AppDock本体・Applet両方の更新確認UIとリリースURLを、模擬GitHubレスポンスで確認。外部への問い合わせ・ブラウザー起動は行わない。
- AppDockの39件の自動テスト成功。既存Watch 8/8、WindowMover 23/23、WindowsTools 11/11成功。各Applet再publish成功。
- 壁紙Applet publish.bat成功。manifest・プロジェクト・発行EXEのバージョン一致。deploy.batで兄弟AppDockのpublish/extensionsへ配置し、EXE・manifestのSHA256一致。バッチはCP932の往復変換とCRLFを確認。

## 描画負荷の比較

テスト専用PerformanceProbeで、生成画像16枚（各2560×1440）を1920×1080の画面へTile合成。同じPC・各1回・別プロセス。ユーザー画像、Windows壁紙API、レジストリに触れない合成のみ。

| 指標 | 元実装 | 新Applet |
| --- | ---: | ---: |
| Private Memoryの描画前 | 10.9 MiB | 10.9 MiB |
| 合成中のピーク | 247.5 MiB | 34.9 MiB |
| 合成による追加ピーク | 236.6 MiB | 24.0 MiB |
| 合成時間 | 173 ms | 153 ms |
| CPU時間 | 187 ms | 156 ms |

追加ピークは約90%減。これはタイル合成の限定測定で、実際の常駐メモリや全画面構成に対する上限・CPU削減率を保証しない。デコーダー・画像サイズ・画面解像度・ファイル環境で変わる。

## 成果物

`publish/Applet.WallpaperSlideshow.at365/Applet.WallpaperSlideshow.at365.exe`

- ProductVersion: 0.1.0
- 51,697,863 bytes
- SHA256: D7AEFDCDCAE7BE9D2DC7E2A6EB2C2FE17B54098D7B03C078432F210740E487AC
- win-x64・自己完結型・単一EXE。extension.jsonを同梱。

## 検証境界

実際のWindows壁紙への適用、ロック/解除、RDP/ローカル切替、ネットワーク共有の切断復帰は今回実機で再現していない。元アプリのWindows APIと停止理由の処理を引き継ぎ、BMP生成と状態遷移・監視復旧は隔離テストで確認した。GitHubの実通信は未確認で、正式リリースが公開されていない場合は更新確認できない。
## 2026-10-06: v0.2.0 再生コマンド

- `start`（開始）と`stop`（停止）を追加。`toggle`（開始／停止の切り替え）と`next`（次の壁紙に更新）の表示名を整理し、操作パネルに4ボタンを表示。
- 従来の`pause` / `resume`コマンドIDは維持。履歴・データフォルダー・履歴ページ操作を含め15コマンド。
- 手動停止状態を保存。設定の再読込に依存せず再生状態を変更するため、保存済み画像設定に誤りがあっても前回の有効設定で開始・停止できる。ロック/RDPによる停止理由は維持。
- Release回帰テスト、公開EXEの安全な起動確認、実プロトコル往復成功。4コマンド、停止中の次画像抑制、旧ID、不正設定後の開始・停止を確認。
- パッケージ版AppDockのGUIで開始・停止・次の壁紙・開始停止切り替えと保存を確認。テスト専用エンジンなので、実際のWindows壁紙は変更していない。
- publish / deploy成功。兄弟AppDockのpublish/extensionsのEXE・manifestは発行元とSHA256一致。
- 最新EXE: ProductVersion 0.2.0、51,698,163 bytes。
- SHA256: 819D2BB4E590121FB27954DA91C890F15559945F569665F4F70A1EF77B997C16。
## 2026-10-06: v0.3.0 / AppDock v0.6.0

- モニターごとのフォームを実装。複数フォルダー、フォルダー選択、表示モード、タイル枚数、上下左右のPadding、追加・並べ替え・削除を確認。旧JSON文字列・Folder・数値enumと未知フィールドを保持。
- 元アプリの履歴設定範囲を復元。1000pxのサムネイルを実表示し、ファイル名1～1024文字と相対Folderを受け付ける。更新間隔・タイル間余白・モニター別Padding・履歴保存件数はすべて設定可能。
- 開始／再開をstartへ統合。resume / pauseはホストの別名として旧ショートカットを保持。停止・切り替え・次画像、履歴・ページ送り・操作画面・データフォルダーの9コマンド。画像ごとのopen/deleteやモニター選択は一般コマンドへ登録せずパネル専用操作で実行。
- manifest宣言でロード前からコマンド・ショートカット設定が可能。明示startは無効・開始待ちから有効化して即時起動し、互換性チェック・起動キュー・タイマー取消を共有。
- 履歴をモニター別タブに分割し、件数・ページ位置を別々に管理。1ページ表示件数は既定4件、1～1000件。GUI保存とRPCで2 / 4 / 16件を確認。
- ローカルPNG画像を専用キャッシュから表示。通信量による画質や解像度の引き下げなし。表示ページの画像のみ逐次生成し、ページ切替・操作画面・deactivateでファイルを解放。大きな一時画像が200000 bytesを超えても表示でき、1000pxの設定サイズを保つことを確認。
- 拡大プレビュー、元ファイルのツールチップ、「画像を開く」の隣の「画像を削除」を実装。削除対象の確認とキャンセル、成功後の全モニター履歴からの除去・更新を確認。古いページ世代のボタンと二重確認を拒否。
- Windows IFileOperationのごみ箱処理を一意な4-byte一時ファイルで実機確認。ごみ箱に存在すること、復元後の全バイト一致を確認し、一時ファイルを片付けた。GUI/RPCテストの削除はテスト専用画像だけを対象にした。
- .NET Release回帰、0警告・0エラー、公開EXEの不正設定拒否と正常終了、実RuntimeのRPC往復成功。
- AppDockの44件の回帰テスト成功。キャッシュ外の画像拒否、local-images能力検査、現パネルの操作だけ許可、宣言コマンドの旧ID・同時開始・必要ホスト拒否を含む。
- win-unpackedの実GUIで1280 / 900px、旧設定からのフォーム編集・保存、モニタータブ、表示件数変更、拡大、削除確認・キャンセル・再表示、開始再開・停止・切り替えを確認。JSページエラーなし。スクリーンショットも目視確認。
- AppDock単一EXE v0.6.0の隔離smoke成功（bridge・sandbox・アバター・設定）。本体とAppletの更新確認は模擬GitHub応答で確認し、外部公開・実通信なし。
- 最新Applet EXE: ProductVersion 0.3.0、51,703,190 bytes、SHA256 01A12DE0131FDE033C3DD1F3CAC90837D3D0F81F9365FB4E871C5DEAD6E34293。

実際のユーザー壁紙の切り替え、ロック/RDP、共有の切断復帰は今回のUIテストでは操作していない。前節の描画・監視・停止理由の回帰で確認し、実機検証の境界は維持する。

- 対応AppDock EXE: v0.6.0、100,413,527 bytes、SHA256 DB616106277E010FAC5E1D593504E0DA62C1027BABD193F3DC2C42F0082C1C9B。
- 実利用先 `A:\00.ESSENTIAL\00.MainTools\AppDock.at365` のAppDock v0.6.0と壁紙Applet v0.3.0へ配置。ユーザーが設定を保存してAppDockを完全終了してから実施した。ホストEXE・Applet EXE・manifestのSHA256は発行元と一致し、既存settings.jsonは前後のSHA256が同一。

## 2026-10-08: 0.4.0 Windowsの背景設定

- 必要AppDockを0.21.0へ更新。設定ページに「Windowsの背景を『画像・スパン』に設定」と「Windowsの背景設定を開く」を追加し、近くに手動手順を表示。
- Release build（警告0/エラー0）、全既存回帰＋BackgroundTests、test-protocol.cjs、publish.bat成功。BackgroundTestsはキャッシュの画像保持、停止中の黒背景、種類/スパン不一致、API失敗、キャッシュ欠落、COM解放/一時ファイル整理をfakeで確認。
- 通信fixtureは背景設定の成功/失敗と停止維持、背景設定ページを開くコマンドを確認。既存の開始/停止/次/設定エラー維持/モニター別履歴/削除/終了も成功。
- 最終AppDock0.21.0の配布GUI: `artifacts/background-settings-1791464780421/result.json`、ok:true。手動案内、実行中無効化、成功/失敗表示、未保存入力/停止状態保持、設定データに操作情報が入らないこと、停止時ボタン無効化、900×720 DIP横はみ出しなしを確認。success/small画像を目視確認。
- 実Windows COMの読み取り: --inspect-backgroundでpicture:true/span:true。実際の壁紙・Windows設定は変更していない。Windowsスライドショー/Spotlight/単色から画像への実切替、組織ポリシー/RDP制限、実設定ページを開く操作は未確認。BackgroundTypeとThemesキャッシュはWindows実装に依存し、API/状態確認が失敗すれば手動手順付きエラーを返す。
- 発行manifestはソースとSHA256一致。実利用先deploy、commit、pushなし。
- 初回sandboxの.NET buildは理由を伴わず失敗したが、許可された通常Windows環境でbuild/回帰/publish成功。
- 最終Applet EXE: 51705880 bytes、SHA256 4462DD32341C2F57F11EA2315009F146526838FFF4FDA1B1F6EBB0BED985BFD0。
## 2026-10-10: 0.4.1 生成画像をLOCALAPPDATAへ保存

- Const.AppDataFolderをLocalApplicationDataへ変更し、生成BMP（windows-background.bmpを含む）・errors.log・データフォルダー操作を%LOCALAPPDATA%/at365/Applets/WallpaperSlideshowへ統一。Windows自身のAPPDATA/Microsoft/Windows/Themes/TranscodedWallpaperは読み取り元として維持。旧Roamingファイルの移動・削除なし。設定はホストSettings、履歴サムネイルはホストPC専用imageDirectory。
- Release回帰6グループ成功。既定保存先も検査し、生成画像/停止時黒背景/キャッシュ欠落/API失敗/COMとファイル解放/描画/監視復旧をfakeで確認（.artifacts/localappdata-regression.log）。RPC fixture7項目と発行native EXEの不正設定拒否・正常終了が成功（localappdata-protocol.log）。実ユーザーの壁紙やWindows設定は変更していない。
- publish.bat終了0。EXE ProductVersion0.4.1、51707296bytes、SHA256 703ce4cfd8a120a35fe902d26511e63f198d534f634f44e363aff9d3bb02310e。update.zip46264607bytes、SHA256 ab2170b748a33d5741ebe89159e910326bd12773e2de0c6abc52371223d05f7b。最低host0.21.0維持。feedサイズ/hash/ZIP全2ファイルと発行元一致（localappdata-final-check.json）。
- protocol一時画像はランナー終了時に削除済み。完了時整理で成功の実行方式・利用状況が不明な旧記録/再利用資料を保持し追加削除0。新規AGENTSと利用/開発文書を整備。ユーザー指定により今回変更をコミットする。push/Release/実利用deployなし。

## 2026-10-11: 0.4.4 外部公開宣言

- manifestのstart/stop/nextだけにautomation:trueを宣言し、最低AppDock0.26.29へ更新。壁紙処理の変更なし。共通契約はホストdocs/automation.md。
- publish.bat exit0、manifestと実EXE製品版0.4.4一致。既存test-protocol.cjs成功: fake背景APIでコマンド/設定/履歴/ログ/停止、今回発行した実EXEで不正設定拒否/実HWND query-cancel-end/共通ログ/正常終了を確認。実壁紙変更は行っていない。証跡.artifacts/automation-declarations-20261011。
- update.zip 46268114bytes / SHA256 829600e35e9f3278639b8af744b35e155dad8119e1ba6ddbcc244decc05b81ad、feed/manifest/ZIP2ファイル一致。ホストreadManifestで宣言3件の読込確認。今回のprotocol一時画像は既存試験が回収、追加の成功フォルダー整理対象なし。commit/push/Release/deployなし。

## 2026-10-11: 0.4.4 コミット前検証

- 対象stage tree 6bd877aec997504e3eb49f58d46ffda26c727a91のソースを維持してdotnet標準回帰とtest-protocol.cjs成功。発行実EXEの不正設定拒否/実HWND終了/ログ、fake APIでコマンド・設定・履歴を確認。実壁紙変更なし。証跡.artifacts/commit-validation-automation-20261011。追跡入力51件とログ/配布物hashを保存、既存発行物不変。
- 検証後の変更はこの記録のみ。protocol一時領域は既存試験が回収。追加の古い成功整理対象なし、失敗/不明/再利用資料保持。最終tree/commitは証跡へ記録し、push/Release/deployなし。

## 2026-10-16 発行先の40.ARTIFACTへの移行

- 発行先: `A:\40.ARTIFACT\Applet.WallpaperSlideshow.at365`。publish.batとビルド・更新梱包・関連検証の参照を変更。配置用正本はdeployment/へ移動し、成功後に発行先へ追加。deployは発行済み成果物を使い、既存deploy.bat・関連スクリプト・deploy.local.txtを保持する。配置先設定はハッシュ一致を確認して旧repo直下から移動。旧publishの過去成果物は保持。
- レビュー: 発行パス・削除境界・配置の独立動作・設定保持・梱包/Release参照を確認。GmailのWeb出力ガード、配置時の再ビルド依存、試験fixtureの分離、文書参照を修正して再確認。未解決指摘なし。発行基盤のみの変更のため製品版は0.4.8を維持。
- 検証: publish.batを2回実行し両方終了0（`.artifacts/publish-relocation-20261016/publish.log`、`.artifacts/publish-relocation-20261016/republish.log`）。7repo合計24配置用ファイルのハッシュ保持。全7repoの独立配置fixture28ケースとWebApplet専用6ケース、WebApplet単体2件、梱包/Release fixture11件、本体型検査・最終EXE隔離起動が成功。全feedの版・サイズ・SHA256、Applet ZIPの全収録ファイルと発行物を照合。
- 発行物SHA256: `7297da3da0c97d45a8ded273e1285c69e7cd93c3ead4958916e00ad2f5ae33fa`。共通証跡: [検証一覧](../AppDock.at365/.artifacts/publish-relocation-20261016/validation.json)、[出力照合](../AppDock.at365/.artifacts/publish-relocation-20261016/artifact-validation.json)、[再発行保持](../AppDock.at365/.artifacts/publish-relocation-20261016/republish-result.json)。
- 制限環境のpnpm STATUS_STACK_OVERFLOWとEXE spawn失敗、fixtureのrename EPERMは通常ユーザー権限で同一処理を再実行して成功。依存版・lockfile・検証方針は維持。実利用先deploy・commit・push・外部公開は未実行。製品機能の変更がないため無関係な全回帰・実アカウント操作は実行していない。

## 2026-10-16 発行先移行のコミット前確認

- 実装時の入力スナップショット全7repoとログSHA256、最終発行EXE・各ZIP/feed・配置用24ファイルを照合し、型検査・ビルド・発行2回・配置・隔離起動・梱包Release fixture11件・WebApplet単体2件/配置6ケース・WebBrowserTools単体2件を再利用。製品と発行物の変更はないため再発行・版更新は不要。
- 不足分として本体標準回帰の残り487件、Gmail22件、Watch8件、WindowsTools38件、WallpaperSlideshow標準回帰を確認。本体486件は初回で成功、実行ディレクトリに依存するnode-invocationの1件は正しいrepoディレクトリから単独再実行して成功。既存11件と合わせ本体498件・skipなし。初回コマンドの終了1は保持し、全体成功へ読み替えず試験単位で照合。
- 通常ユーザー実行でfixtureビルドとネットワーク依存の.NET検証・Git fetchが成功。全7repoの入力と発行物を維持。失敗時の作業ディレクトリに生成された今回の試験資料は共通証跡内のinitial-cwd-artifactsへ移動して保持。
- 共通証跡: [コミット検証](../AppDock.at365/.artifacts/commit-validation-publish-relocation-20261016/validation.json)。stage treeとcommit tree、プッシュ先mainの一致を同フォルダーへ記録する。実利用先deployとGitHub Releaseは対象外。
