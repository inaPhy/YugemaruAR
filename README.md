# YugemaruAR

QRコードからアクセスし、印刷したHiroマーカー上にゆげまるを表示するブラウザAR。外部ARアプリへの遷移は使用しません。

## 起動

`python3 -m http.server 8080 --directory dist`

端末のカメラを使用するにはHTTPS（PC自身での開発はlocalhost）が必要です。`marker.html` を印刷または別画面に表示し、`ar.html` からカメラを許可してください。QRコードのリンク先は公開先URLです。QR自体は追跡用マーカーではありません。

## 構成

- A-Frame 1.6.0 / AR.js 3.4.7（同梱）
- GLB: https://www.yuge.ac.jp/yugemaru3d/yugemaru.glb （2026-10-15取得、3,288,264 bytes）
- 元配信のCORSヘッダーがないためモデルを同一オリジンで配信。更新時はGLBを再取得してください。
- 標準Hiroマーカー。任意画像の追跡には別途ターゲット生成・実装変更が必要です。
- カメラ映像をアプリからアップロードする処理はありません。

## 検証の範囲

デスクトップ表示・GLB構造・静的コードを確認。iOS Safari / Android Chromeでの実機カメラ追跡は別途確認が必要です。

## 出典

モデルの権利は提供元に帰属します。AR.js: https://github.com/AR-js-org/AR.js (MIT)、A-Frame: https://github.com/aframevr/aframe (MIT)。配布前にモデルの利用条件をご確認ください。
