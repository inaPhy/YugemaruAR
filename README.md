# YugemaruAR

同じQRコードをWebARへの入口と初期配置の画像ターゲットとして使用する。QRを約0.45秒以上安定検出し、SLAMがNORMAL状態になった時点の位置・回転・スケールを世界座標に保存する。その後はQRが見えなくなってもモデルを非表示にせず、カメラの6DoF移動を8th Wallで追跡する。後からQRを動かしても追従しない。「置き直す」でのみ再配置する。

## 利用

1. `marker.html` のQRを印刷（白い余白を保持、推奨約9cm角）。
2. スマートフォンでQRリンクを開き、カメラ・必要な場合はモーションを許可。
3. 同じQRを平らに置いて映す。周囲の模様も映しながら少し端末を動かし、位置認識が安定したらQRに向けて静止する。
4. 自動配置後はピンチで拡大縮小、左右スワイプで回転できる。周りから眺める。画角の外へモデルが出た場合は、その場所にカメラを戻す。

現在の配信先: https://yugemaru-ar.inaphy-ai.chatgpt.site （所有者限定）

`index.html` が直接ARを開始。`ar.html` は旧URLからの転送。`model.html` はカメラ不要の3D確認。

## 技術

- `@8thwall/engine-binary` 1.0.0（配布物を変更せず同梱、SLAMあり）
- three.js 0.160.1、GLTFLoader
- `@8thwall/image-target-cli` 1.0.0 による同じQR画像のPLANARターゲット
- `placement.mjs`: 不安定な検出の排除と一度限りの配置
- 元GLB: https://www.yuge.ac.jp/yugemaru3d/yugemaru.glb
- モデルはCORS制限を避けるため同一オリジン配信。モデルの更新は自動追従しない。
- QRのURL/模様を変更した場合は画像ターゲットも再生成する。任意のQRを追跡する実装ではない。

## 開発・検証

`python3 -m http.server 8080 --directory dist`

スマートフォンではHTTPSが必要。`node --test tests/*.test.mjs` で初期配置条件、QR消失・再検出時の不変性、置き直しを確認する。

ページ読み込み直後にcamera-start.jsがカメラ許可を要求し、その後ARエンジンを読み込む。初期カメラストリームはXR起動前・エラー時・離脱時に解放する。iOSは未許可のモーション許可にユーザージェスチャーが必要なため、その場合だけカメラ許可の後に許可ボタンを表示。許可済みの場合は自動で続行する。SLAMは照明・周囲の模様・端末性能に依存し、ドリフトや追跡喪失は起こりうる。追跡喪失時は案内を表示する。リロードをまたぐ位置保存は行わない。

実機での6DoF精度・QR認識成功率は未検証。一般公開前にiPhone SafariとAndroid Chromeで、QRを隠す・端末を横に移動・回り込む・画面回転・バックグラウンド復帰を確認すること。

## 出典・ライセンス

モデルの権利は提供元に帰属する。8th Wall配布バイナリはMITではなくXR Engine License Agreementに従う。Copyright © 2026 Niantic Spatial, Inc. All rights reserved. 契約本文・保証免責: `dist/vendor/xr/LICENSE`。three.jsはMIT（`dist/vendor/three/LICENSE`）。カメラ不要の3D確認にはA-Frame 1.6.0（MIT）を使用。
