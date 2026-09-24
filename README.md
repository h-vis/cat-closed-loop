# ねこの、ひとふで。 — Closed-Loop Cat

[h-vis/close-loop](https://github.com/h-vis/close-loop) を元にした、猫の一筆書きパズルです。
元の Git 履歴を保持し、`upstream` から元ゲームを参照できます。

## 起動

このフォルダで以下を実行して、http://localhost:8080/?lang=ja を開きます。

```powershell
python -m http.server 8080 --bind 127.0.0.1
```

ビルド不要の静的 HTML / CSS / JavaScript アプリです。
`maker.html` はステージ作成画面です。

## 猫版の変更

- 主人公：猫5種類からランダム。犬も5種類からそれぞれランダムに選択。
- 同じステージの再描画やワープでは絵柄を固定。ステージ読み込み・リセットで再抽選。
- 鍵→魚、バケツ→骨、閉じた／開いたドア→閉じた／開いた段ボール。
- 先に発動するワープ→紙袋、後に発動するワープ→猫トンネル。
- クリーム色の画面、木の床、セージグリーンのボタンと手描きのキャラクター。
- 盤面は表示サイズ×画面のピクセル密度で描画し、リサイズ・画面移動に追従。操作座標は描画解像度から独立。
- 日本語・英語の遊び方とゲーム内チュートリアルを猫版に変更。
- 元作品用のストア誘導・購入アイコンは猫版Web画面では非表示。

ルール・ステージデータ・ソルバーの内部キーは元ゲームとの互換性を維持しています。
犬と骨は **猫がいない空間で、同じ数のときだけ** 消えます。
猫と犬が同じ空間になると、骨の判定より先にやり直しになります。

## 素材

ユーザー提供の `image/` を元に、`assets/cats/` に透過切り抜き16枚とアトラスを生成しています。
原画は変更していません。単体画像は原寸の細部を保持し、盤面用アトラスのみ256pxに最適化しています。再生成する場合のみ以下の Python パッケージが必要です。

```powershell
python -m pip install Pillow numpy scipy
python tools/cut-cat-assets.py
```

## 確認

```powershell
node --test tests/canvas-resolution.test.js tests/cat-theme.test.js tests/clear-advance.test.js tests/spotlight-tutorial.test.js
node --test tests/*.test.js
```

猫版追加・描画解像度・操作・チュートリアルの18テストは成功。
全体では元リポジトリの `medium/004 is solved in two moves` テストが失敗します。
そのテスト・`solver.js`・対象ステージは元リポジトリから未変更です。
猫版のブラウザ確認ではステージ001のドラッグ操作、魚取得、クリア、次ステージ移動を確認済みです。

`android/` は元ゲームのプロジェクトを保持していますが、猫版APKは未ビルドです。
