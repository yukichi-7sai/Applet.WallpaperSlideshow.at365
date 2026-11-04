# 検証記録

## 2026-11-05 設定ボタン修正のコミット・プッシュ前照合

- 利用者から実利用が正常に動いたとの確認と、コミット・プッシュ依頼を受領。実装時のApplet67入力/本体1,059入力、完全ログ/終了コード、0.13.3の発行11ファイルと更新ZIP/feedを照合した。
- Releaseビルド/発行、履歴JS14件、開発GUI2群、発行GUI18群、自動更新GUI6群、RPC6群と発行EXEの起動/終了は成功結果を再利用。nativeコード変更後に未実行だった標準回帰9群をビルド済みfixtureで追加実行して成功した。例外ログは拒否/復旧の意図的なfixtureで、終了コード0と全PASSを確認。実利用の壁紙/設定は操作していない。
- originをfetchし、開始時mainとorigin/mainが`f7c8c84`で一致することを確認。対象10ファイルの差分レビューで阻害指摘なし。今回の追記は検証文書だけで、製品変更・版更新・再発行は不要。
- 再利用判定、追加回帰、stage/commit tree、通常push後のリモート照合を`.artifacts/commit-validation-settings-navigation-20261105/`へ記録する。新しい実行物コピーはなく、標準回帰の専用一時フォルダーは試験終了時に削除済み。既存の検証証跡は保持。GitHub Release・実利用先への配置は含めない。

## 2026-11-05 設定ボタンと共通設定コマンドの経路統一（0.13.3）

- mainは開始時clean、`pull --ff-only`で`f7c8c8469140a6c23c85c19a7a6a507d514fbc61`の最新状態を確認。本体もclean/latestのmainから対応した。
- 既存のhomeコマンドIDを保ち、`Ui.OpenSettingsAsync`への取り次ぎに集約。設定移動前のView破棄・snapshot消去・再公開を取り除き、パレットの設定コマンドと同じ経路で移動する。非表示時は既存JSが一覧/画像/Blob URL/世代保持を解放し、再表示時に読み直す。旧パス区間の回収は.NETの次の履歴公開時に行う。独立Windowはパレット実行時と同様に表示を維持する。
- 修正前の発行AppDock 0.147.1と旧native fixtureでは、新しい検査が「戻る1回で壁紙履歴へ戻る」で失敗し、報告された不具合を再現。初回ログと隔離profile`history-page-ui-settings-navigation-1793805480015`を保持した。修正後の開発GUI2群は成功（`history-page-ui-settings-navigation-1793805678861`）。
- Release solution buildは初回に共有Runtime参照DLLのCS0009/CS0234で失敗。ログを保持し、`dotnet build Applet.WallpaperSlideshow.at365.slnx -c Release -m:1`で直列再実行して警告/エラー0で成功した。履歴JSモジュール14件も成功。
- 発行前レビューで、共通設定コマンドへの集約、既存ID、画像/世代保持の解放、設定保存不変、停止時View破棄を確認し、阻害指摘なし。設定・保存形式・公開API・最低本体0.140.0の変更がないため0.13.2から0.13.3へパッチ更新した。
- `publish.bat`終了0。発行本体0.147.2と発行Web資産を使うGUI18群が成功（`history-page-ui-long-cache-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-1793805805497`）。実ボタンと実パレットからの設定移動、各1回の戻る/進む、View保持、非表示時の画像/Blob URL/世代保持の解放、設定不変、従来のプレビュー/選択/明暗/独立Window/MCP/停止回収を確認した。
- 自動更新専用GUI6群も成功（`history-page-ui-refresh-mode-1793805847008`）。OFF時の固定履歴、明示更新、ON/OFF切替、設定から再表示した際の最新履歴、ホスト/プロセス再起動後の保存値を確認。RPC fixture6群はhomeが自己設定APIだけへ取り次ぐことを含め成功し、発行EXEの起動/不正設定拒否/共通ログ/限定HWNDのquery-cancel-end/正常終了も成功した。
- `A:\40.ARTIFACT\Applet.WallpaperSlideshow.at365`のEXE/manifest/feedの0.13.3、最低本体0.140.0、ソースWeb資産と発行物、ZIP全11ファイルが一致。ZIP SHA256=`56f0314e4f6da1fcbcf8e2b615ba43a64d9b74add7ad10ab56c7f6cbd154e97f`、46,338,078 bytes。
- 証跡は`.artifacts/settings-navigation-20261105/`。Applet67入力と本体1,059入力、完全ログ/終了コード、レビュー、配布物と実行物のSHA256、最終入力一致を記録。実行環境は固定Node 26.13.0/pnpm12.15.0、.NET SDK10.0.403、Windows10.0.26300。背面描画/監視の全native回帰は今回の変更対象外のため追加実行していない。
- 今回4profileのプロセス終了・実パス・再解析ポイントを確認し、専用EXE/DLL等56ファイル（3,180,308 bytes）を削除。383ファイルの結果/画像/設定等はハッシュ一致で保持。発行Web資産GUIの成功最新3件を残し、旧成功`history-page-ui-long-cache-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-1793800752943`を1件整理。失敗証跡と共用本体/固定build出力は保持した。
- 実利用の壁紙・画像・設定、実Explorer/実NAS/実ごみ箱/関連付けアプリは操作していない。ユーザー環境での実利用確認、commit・push・GitHub Release・実利用先への配置は未実施。

## 2026-11-05 プレビュー移動・選択・スクロール追従のコミット前照合

- 利用者から0.13.2のスクロールを含む実利用の確認と、ここまでのコミット/プッシュ依頼を受領。`origin`をfetchし、開始時のmainとorigin/mainが`6eea479`で一致することを確認した。
- 最終入力92ファイル、発行ビルド・ソース/発行GUI各16群・RPC fixture 6群と発行EXE起動の完全ログ/終了コード、GUI結果と固定ホストEXEを照合して成功結果を再利用。0.13.2の配布11ファイル・ZIP・feedも一致した。
- native標準回帰9群は記録済みの50入力を照合し、Versionだけの変更を今回の発行ビルド/起動確認で補完。試験が読む文書のJSON設定例も同一だった。履歴JS14件は試験と直接参照する4モジュールの同一性を照合して再利用した。
- 今回の追記は検証文書のみで、製品変更・追加試験・再発行なし。再利用判定、対象16ファイル、stage/commit tree、プッシュ先との一致を`.artifacts/commit-validation-preview-navigation-20261105/`へ記録する。GitHub Releaseと実利用先への配置は含めない。

## 2026-11-04 選択カードへのスクロール追従（0.13.2）

- mainの0.13.1作業中の変更を保持して継続。未コミット変更があるためpull/stash/resetは行わず、開始時の差分と入力ハッシュを保存した。本体の既存変更は編集していない。
- カード選択時とプレビュー移動時に、対象カードが見える最小限の距離を即時スクロールする。プレビューでページをまたぐ場合は、開いた時点のモニター内の一覧から該当ページを表示して追従する。ダイアログ内のフォーカスとキー操作、閉じた後の選択を維持し、選択後の手動スクロールを通常の画像読み込みで引き戻さない。
- 発行前レビューで、明示操作時だけのスクロール、固定した履歴順でのページ追従、フォーカス、保留中の更新、画像の解放、既存の欠損画像処理を確認。画面画像を目視確認し、阻害指摘なし。設定・保存ファイル・公開API・最低本体版0.140.0の変更がないため0.13.2へパッチ更新した。
- 固定本体EXEのソースGUI16群、発行Web資産と長いprofileパスを使うGUI16群が成功。一部だけ見えるカードのクリック、狭幅の複数行での連続前後移動、ダイアログを開いたままでのページ追従とカード可視性、ダイアログ内のフォーカス、閉じた後の選択、手動スクロールを確認。既存の半透明/明暗/85%サイズ/欠損画像/削除fixture/画像解放も成功した。
- `publish.bat`のRelease build・発行が終了0。発行EXEの起動、不正設定拒否、共通ログ、限定HWNDのquery/cancel/end、正常終了とRPC fixture 6群が成功。今回変更していないJS状態/保存モジュール単体、native描画/監視の全回帰、自動更新専用GUIは追加実行していない。GUIのnative fixtureは同一ソース/SDK/Runtimeの既存build出力を使用し、実行物ハッシュを保存した。
- 発行先は`A:\40.ARTIFACT\Applet.WallpaperSlideshow.at365`。EXE/manifest/feedの0.13.2、最低本体0.140.0、ソースとWeb資産、更新ZIPの全11エントリーと配布ファイルが一致。ZIP SHA256は`8807749ad5cfef450cb27abb1d2996384a1e7cc7a79fb6c56af62a39154acc63`（46,338,200 bytes）。
- 証跡は`.artifacts/selection-scroll-20261104/`。入力92ファイル、開始差分、レビュー、完全ログ/終了コード、実行物/配布物ハッシュと最終照合を保存。GUI画像/結果は`history-page-ui-1793804044503/`と`history-page-ui-long-cache-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-1793804152527/`。
- プロセス終了・実パスを確認して今回の専用EXE/.NETコピー28ファイル（1,591,906 bytes）を削除し、248ファイルの証跡をハッシュ一致で保持。発行GUI成功分の最新3件を残し、古い成功フォルダー`history-page-ui-long-cache-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-1793790692910/`を1件整理。削除前の結果とファイル一覧/ハッシュを保存し、失敗分・共用本体・固定build出力は保持した。
- 実利用の壁紙・画像・設定、実Explorer/実NAS/実ごみ箱/関連付けアプリは操作していない。実利用確認、commit・push・GitHub Release・実利用先への配置は未実施。

## 2026-11-04 プレビューの前後移動・カード選択（0.13.1）

- 開始時のmainはclean、`pull --ff-only`で`6eea479`の最新状態を確認。本体の既存変更は編集せず、発行済みAppDock 0.146.0を固定ホストとして使用した。
- プレビューに←/→キー、画像表示領域の左右端ボタン、現在位置/総件数を追加。同じモニターの表示順でページをまたぎ、先頭・末尾で止まる。中央クリックとドラッグでは移動・閉鎖しない。開いた一覧を固定し、移動中の遅延decodeで新しい画像を上書きしない。元画像が読めない場合も前後へ移動できる。
- クリックしたカードとプレビュー中の項目をView内の単一選択として保持。画像を含むカード全体の枠で表示し、ほかへフォーカスを移しても残す。キーボードフォーカスの表示は別に維持した。背景・Esc・閉じるボタンで戻る際、保留した更新を待って最後に見た項目の現在のページへ戻し、カードへフォーカスを移す。履歴から消えた項目の選択は解除する。
- 一覧ページと現在のプレビュー画像だけを保持し、ページ外の通過済み画像を解放する。既存の85%サイズ、ファイル名タイトル、テーマ背景、元画像APIを維持。設定項目・保存ファイル・公開API・最低ホスト版0.140.0に変更がないため、0.13.0から0.13.1へパッチ更新した。`history-navigation.js`を発行時の資産照合へ追加した。
- 発行前に操作契約、非同期更新とフォーカス、画像参照の寿命、保存/API、版と試験範囲をレビュー。初回GUIでは追加したページ移動を既存の初期DOM安定性検査が数えて失敗したため、測定区間を分けた。選択枠が画像に隠れないよう疑似要素で重ね、修正後のソースGUI15群が成功。初回失敗ログも保持し、選択枠とプレビューの画面画像を目視確認した。発行阻害指摘なし。
- .NET SDK 10.0.403のRelease solution build成功（警告/エラー0）、固定Node 26.13.0の履歴JSモジュール14件成功。重複パス、開いた順序の維持、選択の更新追従/解除、画像の解放を含む。自動更新専用GUI6群も成功し、OFF/ON、凍結した履歴のページ送り、View/ホスト再起動後の端末別保存を確認した。
- `publish.bat`終了0。発行Web資産と長いprofileパスによる固定本体GUI15群が成功。キー/端のクリック、連続移動の遅延decode、3通りの閉じ方、フォーカスを外した後の選択、設定変更後のページ復帰、欠損画像、単一画像の別モニター、既存の半透明/明暗/狭幅/独立Window/削除fixture/画像解放を確認した。発行native EXEの起動・不正設定拒否・共通エラーログ・限定HWNDのquery/cancel/end・正常終了と、RPC fixture 6群も成功した。
- 発行先は`A:\40.ARTIFACT\Applet.WallpaperSlideshow.at365`。EXE/manifest/feedの0.13.1、最低本体0.140.0、Web資産とソース、更新ZIPの全11エントリーと発行ファイルが一致。ZIP SHA256は`e7d5c1f658d6e886d7a89c5f55dc34c30280b22ebdfba3cfc4bd48df4ace5679`（46,338,022 bytes）。
- 証跡は`.artifacts/preview-navigation-20261104/`。入力92ファイル、fixture実行物、完全ログ/終了コード、レビュー、配布物照合を保存。GUI結果と画像は`history-page-ui-1793802936430/`、`history-page-ui-refresh-mode-1793803044838/`、`history-page-ui-long-cache-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-1793803151283/`。失敗分`history-page-ui-1793802635882/`も保持した。
- 今回の4試験のプロセス終了・実パスを確認して、専用EXE/.NETコピー56ファイル（3,183,812 bytes）を削除。結果・画像・manifest・Web fixture・dataの444ファイルをハッシュ一致で保持。各実行方式の成功分は3件以下のためフォルダー全体の削除なし。共用本体ランタイム・固定build出力は保持した。
- 変更のない背面描画/フォルダー監視の全native回帰は追加実行していない。実Explorer・実NAS・実ごみ箱・関連付けアプリや利用者の実画像/設定を操作していない。ユーザー環境での実利用確認、commit・push・GitHub Release・実利用先への配置は未実施。

## 2026-11-04 プレビュー改善のコミット前照合

- 利用者から実利用の受け入れとコミット依頼を受領。今回の半透明背景・85%サイズ・ファイル名タイトル・最低本体版の整合に関する10ファイルを対象とした。個別項目の手動検証範囲は追加で推定しない。
- 実装時の89入力、6成功コマンドの完全ログと終了コード、発行先12ファイルのSHA256が一致。Release build、ソース/発行Web資産のGUI各13群、RPC fixture 6群、発行EXEの起動/終了確認を再利用した。
- 標準native回帰9群はフォルダー監視変更時の成功ログとnativeソース/SDK/Runtime/ビルド定義を照合して再利用。製品Versionだけの差分は今回のbuild・配布EXE試験で確認済み。文書を読む試験のJSON設定例も同一。履歴JSモジュール11件はギャラリー分離時の成功ログ、試験と参照する3モジュールの同一性を照合して再利用した。
- 今回の追記は検証文書のみで、製品変更・追加試験・再発行なし。再利用判定、対象一覧、stage treeとcommit treeの照合を`.artifacts/commit-validation-preview-dialog-20261104/`へ保存する。push・Release・実利用先への配置は行わない。次/前の画像へのプレビュー移動は後続の相談事項であり、このコミットに実装を含めない。

## 2026-11-04 プレビューの半透明背景・拡大・ファイル名タイトル（0.13.0）

- 開始時のmainはclean、`pull --ff-only`で最新を確認（`6e32a90`、origin/mainより1 commit先）。本体の既存変更は編集せず、共通配色CSSの公開契約と発行済みAppDock 0.145.0を利用した。
- `dialog::backdrop`の透明固定を`--appdock-overlay-background`へ置き換え、プレビューと削除確認が本体の透明・半透明・ブラーへ表示中も追従するようにした。新しい本体APIや設定保存処理は追加していない。
- プレビューをページの幅・高さの60%から、指定された85%へ拡大。タイトルと画像の代替テキストに元パスのファイル名を使い、カードの表示文字数設定で省略しない。タイトルはtextContentで設定し、長い名前を折り返す領域と縮まない閉じるボタンを設けた。画像比率、背景/閉じるボタン/Esc、ドラッグ中の保持、閉鎖後のフォーカス復帰を維持した。
- 半透明背景の共通CSS変数を利用できる最低本体版0.140.0へmanifestと文書を整合。最低ホスト版の引き上げを含むため0.12.2から0.13.0へマイナー更新し、EXEプロジェクトとmanifestを揃えた。設定項目・保存形式・履歴/画像の寿命は変更していない。
- 発行前に差分と影響先をレビュー。文字列の安全な表示、公開配色契約、サイズと閉じる操作、設定/保存/API、版と必要検証を確認し、阻害指摘なし。明るいテーマの半透明と暗いテーマの狭幅プレビュー画像を目視確認した。記録は`.artifacts/preview-dialog-20261104/review.json`。
- .NET SDK 10.0.403のRelease solution build成功、警告/エラー0。制限環境では終了1・警告/エラー0だったため、同じビルドを通常Windowsユーザー環境で再実行し成功。初回ログも保持。固定Node 26.13.0をdev.bat経由で使用し、JavaScript構文確認が成功した。
- ソースWeb資産の固定本体GUI13群と、`--published-assets --long-cache`で発行Web資産を使用するGUI13群が成功。明暗テーマの半透明、透明/ブラー/影の即時変更、表示画像の保持、85%のサイズ、カード名を3文字へ短縮しても完全なファイル名を使うタイトル、背景/Esc/閉じる操作とフォーカスを確認。削除確認の半透明、取消/fixture削除、900px本体と独立Window、View/プロセス再生成、画像の解放・元画像消失、設定/MCP連携を含む。通常GUIに含まれる狭幅ページ検査も成功した。
- `publish.bat`終了0。発行EXEの起動・不正設定拒否・共通エラーログ・限定HWNDのquery/cancel/end・正常終了と、RPC fixture 6群が成功。今回の変更と無関係なデスクトップ描画/監視の全native回帰、JS保存モジュールの全回帰、実Explorer/実NAS/実ごみ箱/関連付けアプリの操作は追加実行していない。
- 発行先は`A:\40.ARTIFACT\Applet.WallpaperSlideshow.at365`。EXE/manifest/feedの0.13.0と最低本体0.140.0、Web資産とソース、更新ZIPの全10エントリーと発行ファイルを照合。ZIP SHA256は`c3be90c8c7bd82c281a9f238c599f0c901c9cc920db2066a61e48d8f1dcbf970`（46,335,781 bytes）。
- 証跡は`.artifacts/preview-dialog-20261104/`の入力89ファイル、fixtureの実行物ハッシュ、6成功コマンドの完全ログ/終了コード、レビュー、配布物のハッシュと最終照合。ソースGUI以降の入力と最終配布物は不変。GUI結果・画像は`.artifacts/history-page-ui-1793800622161/`と`.artifacts/history-page-ui-long-cache-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-1793800752943/`。
- 今回の試験プロセス終了とパス/ハッシュを確認して、隔離profile内の専用EXE/.NETコピー28ファイル（1,591,906 bytes）を削除。結果・画像・manifest・Web fixture・dataの234ファイルはハッシュ一致で保持。方式ごとの成功フォルダーは3件以下のためフォルダー全体の削除なし。共用本体ランタイムと固定build出力を保持した。
- 実利用の壁紙・画像・設定は変更していない。ユーザー環境での実利用確認、commit・push・GitHub Release・実利用先への配置は未実施。

## 2026-11-04 フォルダー監視の補助確認変更・コミット前照合

- 利用者から0.12.2の動作確認完了とコミット依頼を受領。個別の実NAS・OSロック・RDP等の確認項目は指定されていないため、実装時の未確認範囲はそのまま保持する。
- 検証入力79ファイル、完全ログ6件、成功結果5件（build・native回帰9群・publish・RPC fixture 6群と発行EXE起動・固定EXE実背面試験6群）、発行先10ファイルと更新ZIPのSHA256、feedの版/サイズが一致した。対象と依存が変わっていないため成功結果を再利用し、追加回帰・版更新・再発行は行わない。
- 今回の追加はこの検証記録のみ。レビュー済みの製品・試験・文書・版更新の8ファイルをコミット対象とし、本体repoは変更しない。再利用判定、stage/作業ファイルとcommit treeの照合は`.artifacts/commit-validation-folder-watch-20261104/`へ保存する。push・Release・実利用先への配置は依頼範囲に含めない。

## 2026-11-04 フォルダー監視の補助確認を壁紙更新へ移動（0.12.2）

- 開始時はmain clean、追跡先origin/main。制限環境のpullはDNS解決に失敗し、通常ユーザー環境で同じ`git pull --ff-only`を実行して最新を確認（`2824eac808133d2ad03c5ebd737198c8b56e80ff`）。参照した本体の開始commitは`056289501050cb3de917ee9d5fb6c2b6835f7041`。本体の既存変更は編集せず、SDK/Runtime・共通発行/試験ヘルパーを参照した。
- `ApplicationController`の5秒タイマーから`RefreshWatchers`を外し、自動更新・手動の「次の壁紙」・停止からの再開時へ移した。起動時・設定変更時、通常のFileSystemWatcher通知、非同期確認の重複抑止・終了後の破棄を維持。デスクトップ表示の健全性確認は引き続き5秒ごと。画像一覧の毎回全走査、同期確認完了待ち、本体補助APIへの接続は追加していない。確認完了後の変更フラグは従来どおり更新時の再初期化へ反映するため、次回更新で反映される場合がある。
- 発行前レビューで呼出し位置、停止/再開、遅い確認の重複抑止、通常通知、デスクトップ復旧、保存/APIへの影響を確認。阻害指摘なし。固定EXE試験の既存fixtureに現行のMemory Storage応答が不足していたため補い、自動更新による履歴進行の検査を追加した。製品の設定・保存形式・公開API・最低ホスト版0.115.0を変えない内部処理変更として、0.12.1から0.12.2へパッチ更新した。
- `.NET SDK 10.0.403`でRelease build成功、警告/エラー0。制限環境では終了1・警告/エラー0でビルドできず、通常ユーザー環境で同じコマンドを実行して成功。初回ログも保持した。native回帰9群が成功。追加した復旧試験は実際の一時フォルダーとFileSystemWatcherを使用し、タイマー通知を明示発火、表示接続はfakeとした。定期保守での再接続なし、停止中の自動/手動更新抑止、再開/自動/手動での復旧、通常変更通知、処理中の重複抑止、表示接続切断の検出を確認した。
- `publish.bat`終了0。固定Node 26.13.0を`dev.bat`経由で使用し、`scripts/test-protocol.cjs`のRPC fixture 6群と発行EXEの起動・不正設定拒否・エラーログ・限定HWNDへのquery/cancel/end・正常終了が成功。
- `scripts/test-memory-native.cjs`は発行EXEを`prepareTestApplet`で共用ランタイムへ配置し、元EXEとのSHA256を照合。試験用画像による実背面表示・自動更新と履歴進行・手動更新・HWND/配置保持・自身のHWND破棄からの復旧・停止/再開・限定HWNDへの終了通知の6群が成功。Windows壁紙設定/キャッシュの前後一致、Themes変更通知0件、エラーログ0件。結果は`.artifacts/memory-native-1793799340474/`。
- `A:\40.ARTIFACT\Applet.WallpaperSlideshow.at365`へ発行。EXE/manifest/feedの0.12.2、最低本体版0.115.0、ZIPのサイズと全10エントリーのSHA256を発行物と照合。EXE SHA256: `341c56a50d486afc0b938b16f9cf2ed213a2760d039c30aa48dba60f707e5a87`。ZIP SHA256: `c3f6d3a2fa0b4ea0d5d9eae74b90539905274f74356fb1810d2ba3373945c1ca`（46,335,748 bytes）。
- 証跡は`.artifacts/validation-folder-watch-20261104/`。開始時/発行前の入力79ファイル、最終照合、各コマンドの完全ログ・終了コード、レビュー、成果物照合を保存。発行前の変更は試験用JSのみで、build/native回帰対象は不変。発行前から最終確認までの79入力も一致した。
- UI/Web/設定保存/共通APIを変更していないため履歴GUIや本体全回帰は追加していない。実NASの切断/復帰、物理操作、実OSロック/RDP、Explorer本体の再起動、混在DPI変更は未確認。通常のmemory-native成功フォルダーは今回の1件のみで直近3件以内のため保持。専用EXEコピーは追加せず共用ランタイムを使用し、試験プロセスの正常終了を確認。commit・push・Release・実利用先への配置は行っていない。

## 2026-11-04 ギャラリー分離のコミット前照合

- 利用者から動作確認完了と、本体・WallpaperSlideshow両方のコミット依頼を受領した。個別の手動確認項目は指定されていないため、自動試験の未確認範囲を確認済みへ変更しない。
- 実装終了時の入力71ファイル、成功コマンド7件の完全ログ、発行先10ファイルと更新ZIPのSHA256が一致した。build・native回帰8群・履歴JS11件・固定本体と発行Web資産のGUI19群を再利用した。本体側の入力・ログ・発行物も照合し、画像選択GUIによる実Appletの接続・設定保存・停止の成功を再利用した。
- 今回の追記は検証文書のみ。製品・試験・依存・版・発行物は変更せず、追加回帰・再発行は行わない。対象差分、再利用判定、stage/commit treeの照合は`.artifacts/commit-validation-gallery-split-20261104/`へ記録する。push・Releaseは依頼範囲に含めない。

## 2026-11-04 壁紙履歴のギャラリーを独立所有（0.12.1）

- 開始時のmainはclean、`pull --ff-only`で最新確認（`8407cab`）。同梱されていた0.115.0のギャラリーmanifestとSHA256が一致する本体の元ソース`507f04c807dfb5ddc859b00acf19dceabc36dfca`を確認し、履歴専用の`web/history-gallery.js`・CSSとして読みやすいソースへ分離した。現在の本体ギャラリーの見た目を取り込んでいない。
- カード一覧・操作ボタン・180〜360px/20px刻み/初期260pxのサイズ操作・拡大表示・遅延読み込み・安定したDOM/フォーカス/表示位置・古い画像応答の拒否と回収を維持。本体用の複数選択・矩形選択・ドラッグ整理を除去した。モニター・履歴・削除確認・元画像参照・Blob URL・Storageの保存形式は既存実装を維持した。
- `BuildSharedGallery`、`scripts/sync-gallery.ps1`、`web/vendor/image-gallery`を削除。本体のギャラリーをビルド/コピー/版同期しない。製品buildにはNode/pnpmが不要となり、Runtime/SDKと共通発行手順への参照は継続する。発行時は専用JS/CSSを同梱・ハッシュ照合し、以前の同梱ギャラリー3ファイルだけを発行先から除去する。利用者データは対象にしない。
- 内部UIの所有分離として0.12.0から0.12.1へ更新し、最低本体0.115.0と公開APIを維持。発行前レビューで現行同梱版の再現・サイズ保存・画像寿命・外部依存・発行資産を確認し、未使用の選択CSSを除去。阻害指摘なし。
- .NET buildは警告/エラー0、native回帰8群、履歴JS回帰11件、ソースWeb資産の履歴GUI13群成功。JS回帰の初回コマンドはdev.batによるcwd変更で相対パスを見失ったため、絶対パスで再実行して成功した。製品エラーではなく、初回ログも保持した。
- 発行本体0.143.0と発行Web資産を隔離native fixtureへ配置し、履歴GUI13群と自動更新/再起動保存6群が成功。画像カード・プレビュー/背景/Escape/フォーカス・開く/削除のfixture・モニター/ページ送り・サイズ復元・View/プロセス再生成・画像の解放・元画像消失・設定/MCP連携を確認した。実配布EXEの接続・パネル・設定保存・停止は、本体の固定画像選択GUIのnative Applet連携でも確認した。
- `publish.bat`終了0。`A:\40.ARTIFACT\Applet.WallpaperSlideshow.at365`へ発行。更新ZIPの全10ファイルと発行物、Web資産とrepoソース、EXE/manifest/feedの0.12.1・最低本体版を照合し、旧vendorギャラリーが含まれないことを確認。ZIP SHA256は`061f37028a4b5da4f811fc0481c5e6086f7e871213cb6d25f04071af74908d7b`。
- 証跡は`.artifacts/gallery-split-20261104/`の各コマンドJSON/完全ログ、入力ハッシュ、旧同梱版の元ソース照合、`review.json`、`commands-summary.json`、`artifacts.json`。試験終了後に本repoの専用native/.NETコピー42ファイルを整理した。結果・画像・設定・data・manifest・Web fixture・固定buildを保持。合計60ファイルの整理一覧は本体側の同名証跡の`cleanup-files-before.json`にある。
- 実利用の壁紙・画像・設定は変更していない。実Explorer背面表示・物理入力/複数モニターDPI・実NAS・実関連付けアプリ/ごみ箱操作は今回未実施。コミット・push・GitHub Release・実利用先deployは行っていない。

## 2026-11-03 配置ツール整理のコミット前照合

- 実装時の最終差分と削除状態、試験入力・成功ログ・発行先185ファイルのSHA256を照合した。関連試験6件と構文・参照検査の成功を再利用し、追加の製品回帰・再発行は行っていない。
- 共通指示と本体・8Appletの今回差分だけをコミット対象とした。再利用判定、stage treeとcommit treeの照合結果は`../AppDock.at365/.artifacts/commit-validation-deploy-removal-20261103/`に保存する。push・Release・実利用先配置は行わない。

## 2026-11-03 開発用配置スクリプトの除去

- deployment一式と40.ARTIFACT内の配置用スクリプト・記入例・配置先設定を、存在する範囲で削除した。publishから専用コピー処理を外し、開発文書と不要なGit除外規則を整理した。
- 差分レビューで既存のビルドと更新ZIP/JSON生成を保持していることを確認した。変更スクリプトの構文・現行の廃止ファイル参照・git diff --checkと、本体を含む全9repoの発行先計算を確認した。発行先の配置ツール以外のファイルは削除前後のSHA256が一致した。
- 製品コード・manifest・依存・設定/保存仕様と配布payloadは変更していない。開発用配置ツールの整理として製品版更新・再ビルド・再発行なし。製品回帰・GUI・実利用先配置・commit・push・Releaseは実施していない。共通の削除一覧・ハッシュ・検証結果は../AppDock.at365/.artifacts/deploy-removal-20261103/を参照する。過去の検証記録は履歴として保持する。

## 2026-11-02 Applet共通実行場所のコミット前照合

- 利用者の受け入れとコミット依頼を受け、今回のテスト基盤/開発文書7ファイルをコミット対象として再確認した。変更はGUI/開発テストの起動・隔離設定で、製品コード・標準製品回帰・依存・SDKは不変。実装時の共通ヘルパー52件、8種類のprofile分離と関連するランチャー/GUIの成功ログを照合して再利用した。無関係な製品回帰の一律再実行は追加しない。
- 実装入力1,249件・配布物706ファイル・成功ログと保存対象6,347ファイルのハッシュが一致し、不要コピー55組の整理結果も維持されている。入力や対象機能の変更がないため成功結果を再利用する。版更新・publish・pushは追加しない。
- 証跡は本repoの`.artifacts/commit-validation-applet-shared-runtime-20261102/` の `validation.json`、`stage.json`、`commit.json`。共同の照合結果はAppDock側の同フォルダーの `reuse.json` を参照する。

## 2026-11-02 テスト実行場所の共通化

- AppDock本体の共通EXEを利用し、既存の`--test-profile`等で本repoの設定・data・必要なextensionsと結果・ログを分離する。対象スクリプト5本を切り替え、設定fixtureは現行のdata/settings.jsonへ揃えた。
- 発行済みmanifestを無効のまま隔離profileへ読み込み、同じ固定EXEとprofile内のChromium状態を実機確認。無効の実Appletによるモニター設定GUI9項目と、固定ネイティブ配布物のEOF終了が成功。実壁紙・ユーザー画像は変更しない。直接起動のmemory-native試験も固定配布物を再利用するが、今回の実Explorer描画試験は未実施。
- 不要と確認した旧成功コピー7組を整理した。ログ・設定・data・manifest・必要なfixtureは保持し、失敗・状態不明・保全用・固定build出力は削除しない。共通ヘルパーの52件、本体MCP7項目、8種類の分離・再起動保持、ランチャー2方式、ネイティブ2種類の検証結果と整理監査はAppDockの`.artifacts/applet-runtime-20261102/`を参照する。
- レビューではprofile境界・排他・配布物全体のSHA256・再起動・fixture保持・削除範囲を確認。テスト基盤と開発文書のみの変更で、製品の版更新・publishは対象外。コミット・pushは今回行わない。

## 2026-11-01: モニター別タイル設定・再生ON/OFFのコミット前照合

- 今回のmain差分20ファイルをレビュー。モニター別TileMarginと既定10px/旧値不使用、Tile時の編集条件と値保持、slideshowEnabledのON再生/OFF停止、共通UIと最低本体0.115.0、描画/ロック/リモート停止条件を確認した。利用説明の冒頭に残っていた旧「停止」の表記だけを訂正。製品コードの追加修正なし、0.12.0の発行物は不変。
- 実装時の全入力SHA256・native回帰8群/RPC6群の完全ログ、固定設定GUI9群・履歴/MCP GUI13群、発行物のEXE/ZIP/manifest/feedを照合し、成功を再利用。履歴JS契約11件は不変の4入力と以前の成功ログ（全13件成功）を照合して再利用。実壁紙/実NAS/Explorer再起動/物理ロック/RDP/実ごみ箱は操作しない。
- 本体の標準全167ファイル1,496件は、追加123ファイル1,261件と再利用235件でfail/skip 0。追加試験前後の入力一致、共通ギャラリーのJS/CSS不変・生成元0.115.0、パネル/説明リンクと新しい生成コマンド名・保存を確認。
- 正本は本体`.artifacts/commit-validation-wallpaper-settings-20261101/`と自身の同名フォルダー。実装時の原ログ/入力/GUI/成果物証跡への参照を保持し、検証記録の追記以外は再発行しない。旧実行コピーの整理は実装時に完了し、新規GUIコピーなし。対象20ファイルをmainへコミットし、SHA/treeとstage一致をcommit.jsonへ記録する。push/Release/実利用deployなし。

## 2026-11-01: モニター別タイル余白・Tile時の編集・再生スイッチ 0.12.0

- mainで実装。開始時の既存差分は共通ギャラリーmanifestの生成元0.114.2だけで、追跡先との履歴差は0。自動pull/stash/破棄をせず保持し、標準buildで生成元を本体0.115.0へ更新。JS/CSSの内容は不変。
- `TileMargin`をモニターごとの設定/検証/描画へ移し、既定10px・0～4096pxとした。旧共通tileMarginは参照せず、既存のモニターは10pxになる。TileCountとTileMarginはMode=Tile時だけ編集でき、他モードでも値を保持。共通ダイアログのOK/取消・競合・フォーカスを維持。
- 「壁紙のスライドショー」は`slideshowEnabled`、既定true、ONで再生・OFFで停止。生成コマンドはsettings.slideshowEnabled.on/off/toggleへ変更し、パネルと説明リンクを更新。旧pausedと共通tileMarginは保存データから削除せず参照対象から外す。旧pausedの生成コマンドは提供しない。画像設定の検証前に手動停止を反映し、ロック/リモートの独立した停止理由は保持。設定の追加/削除と最低本体版0.115.0への引上げにより0.11.0→0.12.0。
- 発行前レビューでmodel/validation/render、設定/公開コマンド、共通入力条件、既定値・保存境界・最低版を照合し、製品の阻害指摘なし。native回帰8群終了0。2画面で余白0/40pxの描画差、旧共通値300を継承しない10px、負値/上限超過/NaN拒否を確認。RPC6群と発行nativeの不正設定拒否・限定HWND終了処理・正常終了も成功。
- 固定本体0.115.0と発行Appletで設定GUI9群成功（`.artifacts/monitor-list-ui-1793512989188/`）。10px、Tile時のみ入力、24/48pxの独立保存/再表示、モード切替時の値保持、取消・競合・並べ替え・フォーカス・明暗/狭幅を確認。旧GUI手順の画面名/操作/保存先/配布コピー/既定省略を修正して成功。固定本体/発行Web資産/native fixtureの履歴GUI13群成功（`.artifacts/history-page-ui-1793513004079/`）。MCP7設定・公開schema・旧/非公開キー拒否・権限/dryRun/競合・新しいコマンド名とON/OFF/toggle保存・nativeサムネイル反映を確認。
- publish.bat終了0、`A:\40.ARTIFACT\Applet.WallpaperSlideshow.at365`へ発行。EXE SHA256 `dd104fed97e80e8d433889c0bbf2a592255b6bde87a9feb44109ce9a96e82375`、ZIP 46341148bytes / SHA256 `cd498646fd32a9ed4b5d93ed066c90a7ff93879ca4ef4e020eed4e5a919efbda`。ZIP全11ファイルと発行物、manifest/feedの版・最低版を照合。配置スクリプトと利用者データ保持。
- 証跡`.artifacts/monitor-settings-20261101/{validation,review,inputs-before-publish,inputs-final}.json`と各完全ログ。本体側`.artifacts/wallpaper-settings-20261101/cleanup.json`で終了/リンクなし/絶対パスを照合し、旧成功2件と解消済み失敗5件の実行コピーだけ整理。結果/失敗記録/画像/設定/manifestは保持。
- 実利用の壁紙・画像・設定は変更していない。実背面配置・Explorer再起動・物理ロック/RDP・実NAS/関連付けアプリ/ごみ箱は未実施。commit/push/Release/実利用deployなし。

## 2026-11-01: 履歴と設定の表示調整のコミット前照合

- 利用者から表示調整の受入を確認された。実装入力と完全ログ、native fixture、発行した本体0.114.0/壁紙0.11.0の全704ファイル・ZIP/feedとGUI結果のSHA256が一致し、Release build・native回帰/RPC・JS11件と、ソース/固定EXEの履歴/設定13群・NASを模した削除13群・固定自動更新6群を再利用する。本体の標準166ファイル1,492件も、再利用と未実施分の追加でfail/skip 0が揃った。
- 今回の壁紙13ファイルと共通UI APIの本体17ファイルだけを別々にコミットし、stage/commit treeと作業内容を照合する。製品修正・版更新・再発行はない。共通の再利用・追加回帰・最終treeは`../AppDock.at365/.artifacts/commit-validation-wallpaper-history-ui-20261101/`を正本とする。push・Release・実利用deployは行わない。

## 2026-11-01: 履歴と設定画面の表示調整 0.11.0

- 自動更新ON/OFFを先に`41d4b1c`へコミットし、その差分を今回へ混ぜずに着手。削除確定ボタンの空アイコン領域を除いて文字を中央に置き、右上を「設定を開く」へ変更した。homeの既存IDとView/メモリの回収を維持し、`Ui.OpenSettingsAsync`でWallpaperSlideshowの設定本文へ直接移る。履歴ページ下部の保持期間の文言を削除した。
- プレビューと削除確認は既存の共通preloadから背景/影を受け取り、透明/2pxブラーと影ON/OFFへ表示中も追従する。設定の「停止」の説明にON/OFF/toggleの共通コマンドリンクを追加し、開いた時点では実行せず、取消後のフォーカスを戻す。Windows背景設定ボタンは既存のfilled面を使い、ライトでグレーとした。
- 設定を直接開く本体0.114.0・SDK/Runtime 0.28.0のAPIを使うため、最低本体版を0.114.0へ上げ、0.10.0→0.11.0へマイナー更新。設定キー/既定値/保存形式・壁紙エンジンは変更していない。詳細と共通API/版更新の判断は`../AppDock.at365/docs/applet-pages.md`と本体の検証記録。
- 発行前レビューで、設定変更を保留したプレビューを閉じるとフォーカスが消える場合を修正した。更新処理の完了後に復帰し、新しい操作先のフォーカス・非表示状態を保護する。本体側も、履歴を破棄したときの既定ページへの移動と設定選択との競合を修正し、表示本文と編集状態の一致を確認した。阻害指摘なし。
- Releaseの直列Rebuildは警告/エラー0、native回帰/RPCと発行EXEの安全な起動拒否/自身のHWND/正常終了が成功。共通APIと設定/配色/履歴の計97件がfail/skip 0。ソースと発行済み固定EXEの履歴/設定GUI13群・NASを模したGUI13群、固定EXEの自動更新6群が成功した。プレビューの背景/影を開いたまま独立して変更できること、クリック/ドラッグ/Esc/フォーカス、設定直行、3つのリンクの選択/非実行/取消、PC専用保存と画像解放も確認した。中央寄せ、コマンドリンク、グレーボタンを目視確認した。
- publish.batは終了0。`A:\40.ARTIFACT\Applet.WallpaperSlideshow.at365`へ0.11.0を発行し、EXE **51761801 bytes / SHA256 `b0fabed3c29e0fa111edbe9671a8e909cdee9b9c334efc6d48d41e8e18256dfe`**、ZIP **46341094 bytes / SHA256 `979db548495db0845c81dd09bff11dec68d68b0d42b0cc59bca67d74dd1c03a6`**。全11ファイル/元Web資産9件、manifest/feed/EXEの版と最低本体版が一致した。共通ギャラリーの生成元manifestは本体0.114.0へ更新され、JS/CSSは不変。運用者所有の配置スクリプトと利用者データを保持した。
- 共通の正本は`../AppDock.at365/.artifacts/wallpaper-history-ui-20261101/`のレビュー・完全ログ・入力・発行物照合・整理・最終記録。本repoの`.artifacts/wallpaper-history-ui-20261101/validation.json`から参照する。固定通常/NAS/自動更新の成功profileはそれぞれ`.artifacts/history-page-ui-long-cache-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-1793504347256/`、`.artifacts/history-page-ui-network-delete-long-cache-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-1793504359085/`、`.artifacts/history-page-ui-refresh-mode-long-cache-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-1793504370927/`。一時画像/fixtureの検証であり、実NAS・実壁紙・Explorer再起動・実ロック/RDP・関連付けアプリ/実ごみ箱・Windows背景設定の起動は操作していない。
- 旧固定コピーの整理は本体と合わせて4件/管理72項目、保護473ファイルのhash一致・失敗0・全フォルダー削除0。結果・画像・設定・data・extensions・manifestと再利用/失敗/調査記録を保持した。今回の履歴/設定表示の差分は未コミットで、push・Release・実利用deployは行っていない。

## 2026-11-01: 自動更新ON/OFFのコミット前照合

- 0.10.0の実装入力1,094件、完全ログ23件、発行ZIP全11ファイルと配置ファイル、manifest/feed、本体0.113.0の固定配布物をSHA256で照合し、一致した。Release build、native回帰/RPC、JS契約11件、長いパス1,000件、ソース/固定EXEの自動更新GUI6群と従来/NASを模したGUI各11群を再利用する。ホスト・SDK/API・依存は不変で、追加の製品修正・版更新・再発行はない。
- 今回の21ファイルだけをコミットし、stage/commit treeと作業内容を照合する。次に依頼された履歴・設定画面の表示変更は含めない。再利用判断と最終treeの正本は`.artifacts/commit-validation-history-auto-refresh-20261101/`。push・Release・実利用deployは行わない。

## 2026-11-01: 履歴の自動更新ON/OFF 0.10.0

- NAS削除対応を先に本体`079d020`・壁紙`89831c7`へコミットし、両repoのcleanを確認した。その後、本repoのpull --ff-onlyで更新なしを確認して着手。履歴に「自動更新」を追加し、初期OFF、OFF中は更新ボタンまで同じ履歴世代を保持、ONへの切り替えで即時更新・以降追従とした。ON/OFFは既存の端末別Storage `gallery-view`へ任意booleanのautoRefreshとして保存し、従来のカード幅だけのデータも読み込む。UI設定追加のため0.9.0→0.10.0へマイナー更新。最低本体版0.113.0とSDK/Runtime・公開APIは維持し、本体は変更・再発行していない。
- 全モニター/ページのパス一覧をJSの表示用メモリへ取得し、privateなMemory Storage `history-snapshot`で表示中・取得中の世代を保持する。これにより、背景で履歴が変わっても旧ページの元画像参照が無効にならない。画像の取得は引き続き遅延実行し、パス/画像のキャッシュファイルは作らない。非表示でJSの一覧・画像を解放し、homeではnativeも保持を解除して旧区間を回収する。明示的に削除した画像はOFFでも表示用一覧から除き、背景の新しい履歴を混ぜない。
- 発行前レビューで、ON中の取得がOFF後に遅れて表示を変える競合、初期読込中の切替が保存済みカード幅を失う競合、取得拒否/受付不明時に表示済み区間が失われる問題を確認・修正した。非同期の区間整理を導入した際の失敗注入タイミングも明示的な待機へ合わせ、初回の失敗ログを保護した。最終のJS契約**11/11、fail/skip 0**、Release build警告/エラー0、native回帰・RPC・400文字超のパス1,000件の保持/解除が終了0。阻害指摘なし。
- 最終ソースと発行済み固定EXEで自動更新の**6群**が成功。初期OFF・背景更新中のカード維持、旧世代でのページ送り、明示更新と旧区間回収、ON即時反映/後続追従、OFFで再固定/再表示、PC専用保存のホスト/native再起動での復元を確認した。従来の履歴GUIとNASを模した削除GUIも、それぞれソース/固定EXEの**11群**が成功。明暗/狭幅、プレビュー/確認/フォーカス、カード幅、画像解放と元画像不在の扱いを維持し、確認画面と新しいスイッチを目視確認した。発行native EXEの起動拒否・自身のHWND処理・正常終了も成功。
- publish.batは終了0。`A:\40.ARTIFACT\Applet.WallpaperSlideshow.at365`へ0.10.0を発行し、EXE **51761733 bytes / SHA256 `ec2479fda4eaa94fca1061537e8c0554eea90074679cbeb1346f7b4fcfdd5fe9`**、ZIP **46341021 bytes / SHA256 `6f8a4faa4344263a5e4b1a4cb3017779d24d90ebd60b0dae0a3f35769c08ec53`**を照合。ZIP全11ファイル、元Web資産9件、manifest/feedの版・最低本体版が一致し、本体0.113.0のZIPは先行発行時と不変。配置テンプレートも9資産に対応し、利用者所有の既存deployスクリプトは保持した。
- 証跡は`.artifacts/history-auto-refresh-20261101/`の入力・完全ログ・`review.json`・`payload-validation.json`・`validation.json`。固定自動更新GUIは`.artifacts/history-page-ui-refresh-mode-long-cache-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-1793502081897/`。実NAS、実壁紙、Explorer再起動、実ロック/RDP・関連付けアプリ/実ごみ箱は操作せず、隔離したnative fixtureと一時画像で検証した。
- 古い成功GUI2件の実行用コピー36管理項目を整理した。論理サイズ1,262,805,368 bytes、保持234ファイルと最新3コピーのhashは前後一致、削除失敗0。結果・画像・設定・manifestと失敗/不明/再利用資料を保護し、フォルダー全体の削除は0。今回追加した自動更新の差分は未コミットで、push・Release・実利用deployは行っていない。

## 2026-11-01: NAS画像削除のコミット前照合

- 0.9.0の実装時入力・ログ・発行物のSHA256が一致し、利用者からも実NASで削除できたことを確認された。Release build、native回帰/RPC、壁紙JS4件、ソースと固定EXEの通常/NAS履歴GUI各11群、発行EXEの起動/終了を再利用する。本体標準165ファイル1,491件も再利用と未実施分の追加で成功が揃った。
- 本体側の梱包試験にあったShift_JIS固定読み取りだけをUTF-8環境へ対応し、製品コード・版・配布物は変更していない。今回のNAS対応10ファイルをstageし、作業内容・stage/commit treeを照合する。コミット後に依頼された自動更新ON/OFFの作業へ進み、その差分をこのコミットへ混ぜない。push・Release・実利用deployは行わない。
- 正本は`../AppDock.at365/.artifacts/commit-validation-wallpaper-network-delete-20261101/`の再利用・追加回帰・レビューとstage/commit記録。前工程のGUI/発行物・本体の失敗ログを保持し、新たな削除対象は0件。

## 2026-11-01: NAS上の履歴画像を確認後に削除 0.9.0

- main/cd9ca40のclean状態でpull --ff-onlyを実行し、更新なしを確認して着手。履歴の新しい画像APIがごみ箱専用だったため、NAS画像の削除が失敗していた。登録結果の削除方式に応じ、ローカルは「ごみ箱へ移す」、ネットワークはWindowsのごみ箱へ入らず復元できない可能性を明示した「削除する」とした。キャンセル、対象固定、確認消費、失敗時の元画像/履歴保持、成功後の全モニター反映を維持する。
- `sourceImages.delete`を使うため最低本体版を0.113.0へ上げ、共通ルールに従って0.8.0→0.9.0へマイナー更新。nativeは版以外を変更せず、メモリ描画・履歴パスの公開・設定・停止は従来どおり。ごみ箱失敗から直接削除へ自動で切り替えない。仕様は本体`docs/memory-storage.md`と本repo`docs/history-page-design.md`。
- Release buildは警告/エラー0、native回帰と公開EXE/RPCが終了0。共通APIのネットワーク判定/ローカル保護と壁紙JSを含む関連94件がfail/skip 0。ソースと発行済み固定EXEの両方で通常/NASの履歴GUI各11群が成功し、NAS確認文、キャンセル、アクセス拒否時保持・非再送、再確認後の削除、既存の表示・操作・保存・解放を確認した。ネットワーク実体の解決は専用一時画像で模擬し、実NASや利用中の画像には接続・操作していない。
- publish.batは終了0。40.ARTIFACTへ0.9.0を発行し、EXE **51761126 bytes / SHA256 `fd4205377b46733e4ca3253034b8e653f7ef95cd83de77803f3333519314e863`**、ZIP **46338686 bytes / SHA256 `bdc4b74c0391910512fe576ef2c545694ff5b7685e09a356c85172d836083dda`**、manifest/feedの版・最低本体版、ZIP全10ファイル・元Web資産8件が一致した。ギャラリーの版情報を0.113.0へ同期し、JS/CSS本体は不変。
- 正本は`../AppDock.at365/.artifacts/wallpaper-network-delete-20261101/`の入力/完全ログ/レビュー/配布照合/最終validationとcleanup。固定NAS GUIは`.artifacts/history-page-ui-network-delete-long-cache-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-1793499006538/`。古い成功GUIの実行用コピーだけを整理し、結果・画像・設定・最新コピー・再利用資料を保持した。実壁紙・Explorer再起動・実ロック/RDP・実ごみ箱/関連付けアプリ、コミット・push・Release・実利用先deployは行っていない。

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
