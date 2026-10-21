# Applet.WallpaperSlideshow.at365 開発ガイド

機能の説明・操作方法・設定・既定値・動作環境は[機能・操作・設定](docs/usage.md)を参照してください。共通の文書構成は[ドキュメント方針](../AppDock.at365/docs/documentation.md)に従います。

## 発行・配置ファイルの保存先

標準発行先は `A:\40.ARTIFACT\Applet.WallpaperSlideshow.at365` です。`publish.bat`はソースrepo、`deploy.bat`は発行先から実行します。配置用ファイル・設定の保持とテンプレートの更新は[共通発行手順](../AppDock.at365/docs/publishing.md)を参照してください。

実装時のテスト選択、コミット前の必要回帰、リリース前のコミット/プッシュ確認と検証証跡の再利用は、[本体・Applet共通手順](../AppDock.at365/docs/development-workflow.md)に従います。この文書の試験コマンドは、その段階に応じて実行します。

インストールとビルドの概要は[README.md](README.md)、実測結果と未確認事項は[VERIFICATION.md](VERIFICATION.md)を参照してください。

## 設計文書

- [最近使った壁紙の独立ページ設計](docs/history-page-design.md)：.NETページと画像の寿命・操作契約。
実装仕様と実機確認の範囲を記載します。

## ビルド・発行・配置

Windows、.NET 10 SDK、隣の`AppDock.at365`ソースが必要です。

共通ギャラリーのビルドには本体の固定Node/pnpm環境も使用します。`scripts/sync-gallery.ps1`が本体の`build:image-gallery`を実行し、版・元ソース・出力のSHA256を確認して`web/vendor/image-gallery/`へ同期します。実行時は同梱bundleを使用し、隣のソースrepoは不要です。公開モデル・CSS・adapterの追加規則は[共通ギャラリー](../AppDock.at365/docs/image-gallery.md)を参照してください。

```powershell
dotnet build Applet.WallpaperSlideshow.at365.slnx -c Release
dotnet run --project Applet.WallpaperSlideshow.RegressionTests -c Release
.\publish.bat
A:\40.ARTIFACT\Applet.WallpaperSlideshow.at365\deploy-with-gallery.bat "C:\Tools\AppDock"
```

発行EXEはwin-x64・自己完結型です。AppDock EXE隣の`extensions/Applet.WallpaperSlideshow.at365`へ配置します。引数なしの`deploy.bat`はGit除外の`deploy.local.txt`先頭行、未指定ならエラーになります。スクリプトは実行中アプリを強制終了しません。AppDockを起動し直すと認識します。

`scripts/test-protocol.cjs` / `scripts/test-ui.cjs`はテスト専用エンジンと一時画像を使用し、ユーザーの壁紙・画像フォルダーを変更しません。

EXE・manifestと`web/history.html`・`history.js`・`history.css`、`web/vendor/image-gallery/`のJS/CSS/manifestを一式で発行します。配置テンプレートも6つのweb資産をコピーします。再発行は運用者所有の既存deployスクリプトを上書きしません。`deploy-with-gallery.bat`は既存`deploy.bat`の成功後に6つのページ資産をコピーするため、古い配置スクリプトを保持していても一式で配置できます。引数と`deploy.local.txt`は従来と同じです。

履歴のGUI試験は`scripts/test-history-page-ui.cjs [固定ホストEXE]`、設定一覧は`scripts/test-monitor-list-ui.cjs [固定ホストEXE]`です。`scripts/test-ui.cjs`はこの2本を直列で実行します。履歴はfixtureのnative EXEと一時画像を使い、画像カード・開く／削除・プレビュー・明暗テーマ・ページ送り・表示先の往復・停止時の回収を確認します。実際のごみ箱と関連付けアプリは通常試験で操作しません。

発行後の履歴GUIには`--published-assets --long-cache`を付け、発行先のweb一式を隔離したnative fixtureへコピーして検証します。カードサイズの独立保存、View再生成とApplet再起動での復元、共有設定の不変も確認します。通常回帰の`GalleryPreferencesTests`は保存失敗・明示再試行・不正幅・破損／未知版の非上書きを検査します。

表示サイズは`storage` capabilityを宣言してホストStorageの`gallery-view`キーへ保存します。schemaVersion 1とcardWidthだけを持ち、180〜360 CSS px、20px刻み、初期260pxです。初回readでは書かず、スライダー確定時だけ保存します。保存は直列、失敗した値は画面に留め、未知版は再起動して読み直すまで上書きしません。Settingsや履歴サムネイルの寸法と分離します。既存Storage/pageActionsの範囲なので最低ホスト版0.66.1は維持します。

## デスクトップのメモリ描画

Windowsの壁紙設定を変更せず、合成Bitmapをメモリ上でDesktopPresenterへ移し、モニター別のNativeWindowへ表示します。配置先の探索・世代・復旧、画像の所有権と停止条件は[メモリ描画設計](docs/desktop-memory-rendering-design.md)を参照してください。native Applet自身のSTAメッセージループを使用し、本体APIは変更しません。

Layered子ウィンドウを利用するため、EXEのapp.manifestでWindows 10/11対応を明示します（[Windowsの要件](https://learn.microsoft.com/en-us/windows/win32/winmsg/using-windows)）。dotnet.exe経由だけの検証ではなく、実apphostと発行EXEで起動を確認します。

DesktopHostは従来のWorkerW構成とProgman配下の背景構成を検出します。親のDPIコンテキストで非表示の子ウィンドウを生成し、物理画面矩形を親座標へ変換して配置します。Layered/Transparentにより入力を透過し、通常アプリの最前面への代替表示は行いません。画像更新とWM_PAINTだけで描画します。

、各Surface専用の`BufferedGraphicsContext`で表示サイズの画像を完成させ、`Render`でDCへまとめて転送します。互換Bitmapは再利用し、描画ごとのpaint DCは保持せず、Surface終了時にバッファも解放します。`WM_PRINTCLIENT`も同じ描画経路を使います。`SetWindowPos`による表示・配置は初回だけとし、通常の画像交換では再配置せず、再描画を要求します。ちらつきの改善は実環境での目視確認を必要とします。

接続先の破棄とTaskbarCreatedで表示先を取り直し、最大5回の間隔付き再接続を行います。停止中の遅延結果は表示しません。接続失敗は既存パネルとホストログへ表示し、「次の壁紙」で明示的に再試行できます。Windows背景設定への退避は行いません。旧prepare-backgroundコマンドは削除し、background-settingsは停止中に見えるWindows背景を確認する入口として維持します。

通常回帰はfakeを使用します。`--inspect-desktop`は構成の読み取りだけ、`--desktop-smoke`は約1秒の実背面配置を行う明示的な試験です。`scripts/test-memory-native.cjs [EXE]`はEXEの固定コピーで実表示、切り替え、自身の表示HWNDを閉じた後の復旧、停止・再開、限定HWNDへの終了通知、Themesキャッシュの変更通知を確認します。利用者のExplorer本体・ロック・RDP・入力設定は操作しません。これらの成功と、実操作による互換性確認は区別します。

## 画像処理・キャッシュの実装

表示用のrender-*.bmp、wallpaper.bmp、windows-background.bmpの生成を廃止しました。旧Local/Roaming領域とWindowsのThemesキャッシュは自動移動・削除しません。

画像の走査・合成は直列に実行し、更新を重ねず、キャンセル済みの結果を適用しません。設定が同じなら描画をやり直さず、監視の保守は5秒間隔です。抽選のシャッフルは線形時間。タイル画像は1枚ずつ読み込み・縮小・解放し、全タイルの原寸画像を同時に保持しません。

履歴画像は選択したモニターの表示ページだけ順次生成します。指定サイズのPNGをローカルファイルとして読み込み、通信量による画質・解像度の縮小は行いません。ページ変更・操作画面へ戻る・終了時にサムネイルを削除します。ブラウザー側でも画面外の画像を遅延読み込みします。専用トレイアイコン・トレイ項目・独自の履歴ウィンドウは作りません。表示先はホストのページ基盤へ委ねます。

履歴サムネイルは従来どおりAppDockのPC専用保存先のcache/panel-images内へ保存し、ページ変更・終了時に解放します。描画の実測と検証範囲は[VERIFICATION.md](VERIFICATION.md)を参照してください。

内部のAppLogは既存の[ホストLogging API](../AppDock.at365/docs/extensions.md#sdkで使えるサービス)の`IExtensionContext.Log.ErrorAsync`へ接続します。開始前に接続し、エンジンの停止後に切り離します。操作名と例外詳細をエラーとして送り、同じ操作/メッセージは1分間抑制します。最大128件の待ち行列を1つのバックグラウンド処理で送信し、1件の通信と終了時の排出待ちはそれぞれ最大1秒。キュー満杯や通信失敗時はstderrへ出し、壁紙処理を失敗させません。独自`errors.log`の作成・追記・ローテーションを廃止し、既存ファイルは変更しません。設定反映エラーもこの経路へ統一します。起動失敗は最大1秒だけ送信完了を待ち、ホストが起動失敗のプロセスを停止する前に記録します。

画像の削除はWindowsの[IFileOperationのごみ箱指定](https://learn.microsoft.com/ja-jp/windows/win32/api/shobjidl_core/nf-shobjidl_core-ifileoperation-setoperationflags)を使用します。

## Windowsのシャットダウン・ログオフ

AppDockの通常終了はbefore-quitからdeactivateを呼ぶが、Electronの[before-quit](https://www.electronjs.org/docs/latest/api/app#event-before-quit)はWindowsのシャットダウン/再起動/ログオフでは発火しない。Appletの非表示DispatcherFormで[WM_ENDSESSION](https://learn.microsoft.com/en-us/windows/win32/shutdown/wm-endsession)を直接処理し、wParam=trueのとき、その通知から戻る前にengine.Stopを同期実行する。WM_QUERYENDSESSIONは許可だけを返し、wParam=falseの取消通知では何もしない。FormClosingのWindowsShutDownを確定通知と混同しない。

通常deactivate/通常FormClosing/セッション終了は同じStopEngineを使い、開始済みのエンジンだけを1回停止します。workerを無効化し、自前の背面ウィンドウ・Bitmap・再接続タイマー・通知購読を同期的に解放します。壁紙解除APIや黒BMP保存、ホストの非同期応答待ちは行いません。

[SetProcessShutdownParameters](https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-setprocessshutdownparameters)でAppletプロセスを0x2ffに設定する。Windowsは大きい値から終了させるため、デフォルト0x280の親より先に処理する。設定失敗は診断ログへ記録する。セッション通知を拒否したり、終了確認ダイアログを追加したりしない。

`scripts/test-session-shutdown.cjs`は別プロセスの実DispatcherForm HWNDだけへ終了メッセージを送り、取消後の再生・同期メモリ/Surface解放・二重停止防止・ログ排出を確認する。デスクトップ接続はfixtureで代替する。`scripts/test-host-logging-ui.cjs`は固定した発行AppDockとAppletを隔離起動し、全体/個別ログ画面とホストファイルを確認する。PC自体のシャットダウン、強制終了、電源断は自動試験しない。

## 外部コマンド宣言

AppDock 0.26.29以降のmanifest `commands[].automation`で公開対象を宣言します。本体側へApplet固有のIDを追加する必要はありません。公開契約・権限・動的登録の扱いは[共通操作API](../AppDock.at365/docs/automation.md#appletによる公開宣言)を参照してください。

## 設定コマンド

公開設定はmanifestのpaused/intervalSecondsで宣言し、pausedのon/off/toggleは本体生成へ置き換えました。旧start/stop/toggleとresume alias、独自PauseAsyncを削除。パネルは生成IDを参照します。画像設定の検証より先にsettings.changedのpausedをエンジンへ反映し、不正な画像設定があっても停止・再開を維持します。最低本体版0.26.30、公開/生成/競合/ログは[共通仕様](../AppDock.at365/docs/automation.md#設定宣言と自動生成コマンド)を参照。RPC試験は更新通知の保存値を実プロセスへ送り、生成コマンドの実行はホストGUIで検証します。

## 公開設定

外部公開項目はextension.jsonのsettings[].automationで宣言します。取得とrevision付き更新は[共通操作API](../AppDock.at365/docs/automation.md)を使い、Applet固有のAPIや本体側の許可一覧は追加しません。booleanのON/OFF/toggleはgenerateCommandsで明示生成します。設定反映は既存Settings.OnChangedを共用します。

GUI試験にscripts/settings-mcp-check.cjsによる隔離MCP確認を含みます。公開schema・読取り・更新、非公開項目/不正値の拒否、書込許可、dryRun、古いrevisionの拒否と、各Applet実プロセスへの反映を確認します。実利用Codex設定やモデルは使用しません。

## 設定画面の構成

`extension.json`の`settingSections`で用途別のカードを宣言します。描画・余白・入力・検索・保存は[本体の共通テンプレート](../AppDock.at365/docs/extensions.md#共通の設定ページ)へ委譲し、Applet固有の設定フォームやCSSを複製しません。`monitors.list`で番号付きの共通一覧と追加・編集・削除・並べ替えダイアログを使います。番号は配列順から表示し、保存データへIDや名前を追加しません。一覧設定の最低本体版は0.46.0ですが、0.6.0の履歴ページには本体0.66.1以上が必要です。

`scripts/test-monitor-list-ui.cjs`は実Appletを無効状態のまま隔離したホストで設定を編集し、旧JSON/Folder/数値Mode、フォルダー選択、登録単位の保存・取消・競合、並べ替え、テーマと狭幅を検証します。ホストのローカルNodeで実行し、発行ホストEXEを第1引数に渡すと固定コピーと発行Applet一式を使用します。壁紙は変更しません。

## 共通の運用

文書構成・生成物・版更新・配布は[共通手順](../AppDock.at365/docs/development-workflow.md)、[文書方針](../AppDock.at365/docs/documentation.md)、[発行と配置](../AppDock.at365/docs/publishing.md)、[更新パッケージ](../AppDock.at365/docs/updates.md)、[生成物の整理](../AppDock.at365/DEVELOPMENT.md#作業完了時のテストフォルダー整理)を参照する。Applet固有の実行条件と結果は[検証記録](VERIFICATION.md)へ記載する。
