# YugemaruAR

QRコードを入口と画像マーカーとして使用する、カメラとモーション・SLAMを使うブラウザAR。QR中央へモデルの底面中央を置き、QRの位置・回転へ追従する。QRを見失うと最後の世界座標・大きさ・向きで表示を保持し、再検出すると位置を更新する。端末を動かすと周囲から眺められる。位置推定の誤差やドリフトはあり得る。

初期の船の全長はQR幅の約10倍。ピンチで拡大縮小、左右スワイプで回転。「置き直す」は操作量と配置を直接初期化し、次のQR検出で配置する。ページ再読み込みやエンジンのrecenterは行わない。

## 利用

1. marker.html のQRを白い余白ごと印刷。
2. スマートフォンでリンクを開き、カメラと、必要な場合はモーションを許可。
3. 平らに置いたQR全体をカメラに映す。

配信先: https://yugemaru-ar.inaphy-ai.chatgpt.site （所有者限定）

## 技術・検証

8th Wall engine-binary 1.0.0とthree.js 0.160.1を使用。XrControllerは起動前にdisableWorldTracking:false、scale:responsiveへ設定。メートル単位の推定は使わず、画像ターゲットのscaleとscaledWidthをモデルへ反映する。QRがない状態では空間追跡でモデル位置を保持。iOSでは未許可のモーションにタップが必要なため許可ボタンを表示する。

許可確認用カメラは取得直後に停止。エラー・離脱でエンジンを停止、非表示で一時停止。model.htmlはカメラ不要の3Dビューア。

node --test tests/*.test.mjs で検証。実機でのQR追跡精度は別途確認が必要。

モデル: https://www.yuge.ac.jp/yugemaru3d/yugemaru.glb
モデルの権利は提供元に帰属。XR Engine License Agreementはdist/vendor/xr/LICENSE、three.jsはdist/vendor/three/LICENSEを参照。
