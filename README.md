# YugemaruAR

同じQRコードをWebARへの入口と配置の画像ターゲットとして使用する。QRが見えている間は有効な位置・回転を毎回反映する。見失ったときだけ最後の世界座標を保持し、再検出したら新しいQR位置へ再配置する。ピンチの倍率とスワイプの回転は再検出後も維持。「置き直す」で配置と操作量をリセットする。

初期モデルのローカルX方向（横幅）を5mに合わせ、縦横比を維持する。8th Wallの `scale: absolute` でメートル単位の座標を使用。マーカーのscaleはモデル倍率へ掛けない。横幅は端末による実寸推定に依存するため約5mであり、実機での測量精度は未確認。

## 利用

1. `marker.html` のQRを印刷（白い余白を保持、推奨約9cm角）。
2. スマートフォンでQRリンクを開き、カメラ・必要な場合はモーションを許可。
3. 同じQRを平らに置いて映す。周囲の模様も映しながら少し端末を動かし、周囲の実寸が推定されるまでゆっくり動かす。
4. 自動配置後はピンチで拡大縮小、左右スワイプで回転できる。周りから眺める。画角の外へモデルが出た場合は、その場所にカメラを戻す。

現在の配信先: https://yugemaru-ar.inaphy-ai.chatgpt.site （所有者限定）

`index.html` が直接ARを開始。`ar.html` は旧URLからの転送。`model.html` はカメラ不要の3D確認。

## 技術

- `@8thwall/engine-binary` 1.0.0（配布物を変更せず同梱、SLAMあり）
- three.js 0.160.1、GLTFLoader
- `@8thwall/image-target-cli` 1.0.0 による同じQR画像のPLANARターゲット
- `placement.mjs`: QR追従・消失時の位置保持・再検出時の再配置
- 元GLB: https://www.yuge.ac.jp/yugemaru3d/yugemaru.glb
- モデルはCORS制限を避けるため同一オリジン配信。モデルの更新は自動追従しない。
- QRのURL/模様を変更した場合は画像ターゲットも再生成する。任意のQRを追跡する実装ではない。

## 開発・検証

`python3 -m http.server 8080 --directory dist`

スマートフォンではHTTPSが必要。`node --test tests/*.test.mjs` でQR追従・消失時の保持・再配置、初期横幅5m、タッチ操作、カメラ許可の順序を確認する。

ページ読み込み直後にcamera-start.jsがカメラ許可を要求し、その後ARエンジンを読み込む。初期カメラストリームはXR起動前・エラー時・離脱時に解放する。iOSは未許可のモーション許可にユーザージェスチャーが必要なため、その場合だけカメラ許可の後に許可ボタンを表示。許可済みの場合は自動で続行する。SLAMは照明・周囲の模様・端末性能に依存し、ドリフトや追跡喪失は起こりうる。追跡喪失時は案内を表示する。リロードをまたぐ位置保存は行わない。

実機での6DoF精度・QR認識成功率は未検証。一般公開前にiPhone SafariとAndroid Chromeで、QRを隠す・端末を横に移動・回り込む・画面回転・バックグラウンド復帰を確認すること。

## 出典・ライセンス

モデルの権利は提供元に帰属する。8th Wall配布バイナリはMITではなくXR Engine License Agreementに従う。Copyright © 2026 Niantic Spatial, Inc. All rights reserved. 契約本文・保証免責: `dist/vendor/xr/LICENSE`。three.jsはMIT（`dist/vendor/three/LICENSE`）。カメラ不要の3D確認にはA-Frame 1.6.0（MIT）を使用。
