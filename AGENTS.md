# Applet.WallpaperSlideshow の作業指示

実装時のテスト選択、コミット前の必要回帰、リリース前のコミット/プッシュ確認と検証証跡の再利用は、[本体・Applet共通手順](../AppDock.at365/docs/development-workflow.md)に従います。この文書の試験コマンドは、その段階に応じて実行します。

作業開始時は[A:入口](../AGENTS.md)、[共通開発指示](../AGENTS.md)、[ホスト指示](../AppDock.at365/AGENTS.md)を確認する。実装したモジュールは版を更新して自身の40.ARTIFACT配下へ発行する。commit・公開・実利用先へのdeployは別指示。

- READMEはインストール方法とビルド方法だけとし、機能・操作・設定・既定値はdocs/usage.md、開発文書の入口はDEVELOPMENT、検証結果はVERIFICATIONへ分ける。
- [メモリ描画設計](docs/desktop-memory-rendering-design.md)に従い、メモリ内の合成Bitmapをモニター別の背面ウィンドウへ表示する。表示用BMPは生成せず、壁紙設定API・背景レジストリ書換え・WindowsのThemesキャッシュの読書きを行わない。保存済みの利用者データを変更しない。
- エラーは既存のホスト`IExtensionContext.Log`へ送り、AppDockの全体ログとApplet詳細のログに表示する。独自errors.logは作成・追記しない。既存ファイルは保持する。同期のエンジンからは上限付きキューで直列送信し、重複抑制・通信失敗時のstderr・停止処理後の短い排出待ちを維持する。共通APIは[Applet API](../AppDock.at365/docs/extensions.md)を参照する。
- 表示中Bitmapの所有権はDesktopPresenterへ移し、交換・停止・終了時に解放する。通常回帰はfakeの接続先を使い、実Explorerへの接続は明示的な対話試験に限定する。接続失敗時に旧壁紙方式へ退避しない。
- Windowsのセッション終了は非表示DispatcherFormのWM_ENDSESSION（wParam=true）内で同期的にengine.Stopへ渡す。WM_QUERYENDSESSIONは許可だけを返し、取消で壁紙/再生を変えない。通常deactivateと同じStopEngineで二重実行を防ぐ。Appletの終了優先度は0x2ffとし、デフォルト0x280の親ホストより先にクリーンアップする。実OS終了と、限定HWNDへのメッセージ/壁紙API fakeによる試験の範囲を区別する。
- 設定はホストSettingsへ保存する。今後追加する共有素材やホスト管理の端末固有状態は[ホストの保存境界](../AppDock.at365/docs/settings-sync.md)に従う。履歴サムネイルはホストが渡すPC専用imageDirectoryを使う。
- 回帰とRPC fixtureではユーザーの壁紙・設定・画像を変更しない。背面表示はfakeで検証し、公開EXEの通常RPC smokeは不正設定を拒否させて正常終了を確認する。`test-memory-native.cjs`だけは隔離プロセスの実背面表示・自身のHWND閉鎖による復旧を明示的に確認する。Explorer本体の再起動や実ロック/RDPは別途実行範囲を確認する。
- GUI試験は直列で行い、実行中にホストのoutやpublishを再ビルドしない。作業完了時のテストフォルダー整理は[ホスト開発ガイド](../AppDock.at365/DEVELOPMENT.md#作業完了時のテストフォルダー整理)に従う。

- 外部公開コマンドは自身のextension.jsonで宣言する。ホストへ壁紙専用の許可一覧を戻さない。契約は[共通操作API](../AppDock.at365/docs/automation.md#appletによる公開宣言)を参照する。
