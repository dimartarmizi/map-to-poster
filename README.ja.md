<p align="center">
  <img src="public/logo.webp" alt="MapToPoster JS ロゴ" width="192">
</p>

# MapToPoster JS

[English](README.md) | [简体中文](README.zh-CN.md) | 日本語

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML) [![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS) [![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript) [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/) [![Leaflet](https://img.shields.io/badge/Leaflet-199903?style=for-the-badge&logo=Leaflet&logoColor=white)](https://leafletjs.com/) [![MapLibre](https://img.shields.io/badge/MapLibre-212121?style=for-the-badge&logo=maplibre&logoColor=white)](https://maplibre.org/) [![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)


MapToPoster JS は、カスタム地図ポスターを簡単に生成できるよう設計された、プロフェッショナル品質のクライアントサイド Web アプリケーションです。ミニマルな都市アートを作りたい場合も、鮮やかな地理的記念品を作りたい場合も、世界中のあらゆる場所を検索し、完全にカスタマイズ可能なテーマやレイアウト、高品質なエクスポートオプションを使って美しい地図ポスターへ変換できます。多用途な地図ポスタージェネレーターとして、大判印刷に適した高解像度出力に重点を置いており、個性的なウォールアートやパーソナライズされたギフトの制作に最適です。

![MapToPoster JS プレビュー](public/screenshot.webp)

## 🚀 主な機能

- **ハイブリッドレンダリングシステム**：効率的なタイルベースの地図（Leaflet）と、プロシージャルなベクターアート（MapLibre GL）をシームレスに切り替えられます。
- **高精度ジオコーディング**：Nominatim API を利用して、世界中の場所をすぐに検索できます。
- **動的マーカー**：複数の位置マーカーを配置・ドラッグし、さまざまなアイコンや調整可能なサイズでスタイルを設定できます。
- **カスタム移動経路**：統合されたルート描画と動的な経路取得により、旅程や特定の移動ルートを視覚化できます。
- **マット / Passepartout フレーム**：幅、枠線の太さ、不透明度をカスタマイズできる、クラシックなギャラリー風の額装効果を適用できます。
- **上品なタイポグラフィ**：厳選された高品質フォントを備え、カスタムテキストと座標の上書きに完全対応しています。
- **ドラッグ可能な UI オーバーレイ**：端からはみ出さないよう自動調整し、左右対称の安全余白を確保する滑らかな都市名オーバーレイです。
- **背景のエッジ効果**：柔らかなビネットシェーディングや端のわずかな透過効果で、読みやすさを向上させます。
- **柔軟なレイアウト**：国名、地理座標、地図ラベルを個別に切り替え、用途に合った外観にできます。
- **プロ品質のエクスポート**：カスタム解像度または超高解像度（最大 50,000px）の高品質 PNG ファイルを生成できます。
- **プライバシーとパフォーマンス**：LocalStorage で設定を永続化し、100% クライアントサイドでレンダリングします。データがブラウザーの外へ送信されることはありません。

## 🎨 テーマ

MapToPoster JS では、地図をスタイリングするための 2 種類の方法を用意しています。

### 標準テーマ（Leaflet）
実績あるプロバイダーの高品質なラスタータイルを使用しています。
- **Minimal White**：クリーンでモダン（CartoDB Positron）。
- **Midnight Dark**：洗練されたダークモード（CartoDB Dark Matter）。
- **Classic Street**：標準的な OpenStreetMap の地図表現。
- **Modern Voyager**：カラフルで詳細（CartoDB Voyager）。
- **Satellite View**：高解像度画像（Esri World Imagery）。

### アートテーマ（MapLibre GL）
プロシージャルカラーを用いた手作りのベクタースタイルです。
- **Arctic Frost**：淡いブルーと鮮明なホワイト。
- **Aurora Glow**：玉虫色に輝くグリーンとピンク。
- **Cyber Glitch**：デジタル感のあるネオンアクセント。
- **Paper Heritage**：ヴィンテージ調のセピアとインクで描いた道路。
- **Volcanic Ash**：深いチャコールに、燃える残り火のようなアクセント。
- **Blueprint Classic**：建築的な雰囲気を持つ、技術図面風のシアノタイプ。
- このほかにも Retro Synth、Charcoal Sketch、Sakura Bloom など、多彩な独自テーマがあります。

### テーマのカスタマイズ
[src/core/artistic-themes.js](src/core/artistic-themes.js) を編集することで、独自のアートテーマを簡単に追加できます。

1. `artistic-themes.js` を開きます。
2. `artisticThemes` のエクスポートに新しいオブジェクトを追加します。
```javascript
your_theme_key: {
    name: "Your Theme Name",
    description: "Brief description of the style",
    bg: "#HEXCODE",
    text: "#HEXCODE",
    water: "#HEXCODE",
    parks: "#HEXCODE",
    road_motorway: "#HEXCODE",
    road_primary: "#HEXCODE",
    road_secondary: "#HEXCODE",
    road_default: "#HEXCODE"
}
```
アプリケーションが新しいテーマを自動的に認識し、選択メニューに表示します。

## 🛠️ 技術スタック

- **フレームワーク**：Vanilla JavaScript（ES Modules）
- **バンドラー**：[Vite 5](https://vitejs.dev/)
- **マッピング**：[Leaflet](https://leafletjs.com/)（ラスター）と [MapLibre GL](https://maplibre.org/)（ベクター）
- **スタイリング**：[Tailwind CSS 3](https://tailwindcss.com/)
- **レンダリング**：[html2canvas](https://html2canvas.hertzen.com/)
- **タイポグラフィ**：Outfit、Playfair Display、Cormorant Garamond などの Google Fonts
- **API**：Nominatim（検索）と OSRM（ルーティング）

## 📦 はじめに

以下の手順でローカルコピーを取得し、実行できます。

### 前提条件

* **Node.js**：バージョン 18.0.0 以上
* **npm**：通常は Node.js に付属しています

### インストールとセットアップ

1. **リポジトリをクローン**
   ```bash
   git clone https://github.com/dimartarmizi/map-to-poster.git
   cd map-to-poster
   ```

2. **依存関係をインストール**
   ```bash
   npm install
   ```

3. **開発サーバーを起動**
   ```bash
   npm run dev
   ```
   アプリは `http://localhost:5173` で利用できます。

4. **本番用にビルド**
   ```bash
   npm run build
   ```
   最適化されたファイルが `dist/` フォルダーに生成されます。

## 🐳 Docker でデプロイ

このプロジェクトは、マルチステージビルドを用いた軽量 Docker コンテナとして実行できます。

- **ビルドステージ**：Node.js を使用して依存関係をインストールし、Vite の本番ビルドを生成します。
- **ランタイムステージ**：Nginx Alpine を使用して、`dist/` の静的ファイルを配信します。

### イメージをビルド

```bash
docker build -t map-to-poster .
```

### コンテナを実行

```bash
docker run -d -p 8080:80 --name map-to-poster map-to-poster
```

その後、`http://localhost:8080` を開きます。

### デプロイを更新

新しい変更をプルした後、コンテナを再ビルドして作り直します。

```bash
docker build -t map-to-poster .
docker rm -f map-to-poster
docker run -d -p 8080:80 --name map-to-poster map-to-poster
```

### 含まれる Docker ファイル

- `Dockerfile` — マルチステージの本番イメージ
- `.dockerignore` — ビルドコンテキストを小さく保つための設定
- `docker/nginx.conf` — `index.html` への SPA フォールバックを備えた Nginx 設定

## 📜 技術概要

1. **リアクティブな状態管理**：オブザーバーパターンに基づくストア（[src/core/state.js](src/core/state.js)）を使用し、UI、Leaflet、MapLibre の各エンジン間で変更を同期します。すべてのユーザー設定は `localStorage` に永続化されます。
2. **ハイブリッドマッピングエンジン**：Leaflet（ラスタータイル）と MapLibre GL（ベクターテーマ）の間で双方向にビューポートを同期し、使用中のレンダリングモードにかかわらずレイアウトの一貫性を保ちます。
3. **ドラッグ可能なオーバーレイシステム**：リアルタイムの境界ボックス計算でラベル位置を制限し、ポスターの端から左右対称に最低 8px の安全な間隔を確保します。
4. **動的アセット統合**：カスタム GeoJSON ルートと複数のマーカーインスタンスを管理し、両方のマップエンジンでインタラクティブなドラッグ＆ドロップに対応します。
5. **マットフレームレイヤー**：内側の余白と枠線をカスタマイズできる仮想「Mat/Passepartout」インターフェースを実装し、ギャラリー風の仕上がりを実現します。
6. **高品質レンダリングパイプライン**：エクスポート時には [src/core/export.js](src/core/export.js) のマルチステージ処理を使用し、`html2canvas` と `onclone` コールバックによって高解像度の地図スナップショットを生成します。

## 🤝 クレジット

- **着想**：[originalankur/maptoposter](https://github.com/originalankur/maptoposter) から着想を得ています。本プロジェクトは、異なる技術スタックとアーキテクチャで独自に実装されています。
- **コントリビューター**：コード、バグ報告、提案を通じて本プロジェクトの改善に協力してくださったすべての方々に心から感謝します。皆さまの支援によって、このツールはさらに良いものになっています。

## 📧 連絡先

ご質問やご提案、その他のお問い合わせは、[dimartarmizi@gmail.com](mailto:dimartarmizi@gmail.com) までお気軽にご連絡ください。

## ⚖️ ライセンス

本プロジェクトはオープンソースで、[MIT License](LICENSE) の下で提供されています。
