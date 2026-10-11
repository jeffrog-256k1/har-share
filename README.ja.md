# HAR Share

[English](README.md) · [한국어](README.ko.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [Español](README.es.md)

HAR を共有する前に、最小限のネットワーク記録を再構成します。ヘッダー・Cookie・本文・クエリ名/値・元アドレス・拡張フィールドは新しいファイルに含めません。

[試す](https://jeffrog-256k1.github.io/har-share/) · [MIT](LICENSE) · [Changelog](CHANGELOG.md)

![HAR Share](assets/preview.png)

## ローカルで実行

Node.js 22.12+ · npm

```sh
git clone https://github.com/jeffrog-256k1/har-share.git
cd har-share
npm ci
npm run build
npm run dev
# Open the local URL printed by Vite.
```

UTF-8 HAR 1.2 を選択・ドロップするか、架空サンプルを読み込みます。削除件数と残るウォーターフォールを確認し、最小化 HAR または独立 HTML を保存。ファイル名は固定です。クリアは現在の結果を消し、自動保存しません。UI と文書は5言語対応です。

## 仕組み

許可した HTTP メソッド・状態・MIME・応答サイズ・時間フェーズ・順序で新しく構築します。ホスト/パスは一貫した example.invalid 別名となり、同じリソースは同じ別名です。クエリ名/値・フラグメントは全削除。日付は2000-01-01に元の相対間隔を加えます。元タイトル・IP・接続 ID・リダイレクト先・ヘッダー・Cookie・本文・拡張・ファイル名は残しません。

GET、POST、PUT、PATCH、DELETE、HEAD、OPTIONS、CONNECT、TRACE 以外は OTHER。MIME 許可一覧は src/core.ts、不明な型は application/octet-stream、パラメーターは除去。HTTP バージョンは仮の HTTP/1.1、状態説明は空、ヘッダーサイズと要求本文サイズは -1。全体時間は残したフェーズから再計算し、connect 内の SSL を重複加算しません。入力/出力フィールド数の差は削除した秘密の数ではありません。

## 対応範囲と制限

10 MiB、HAR 1.2、HTTP(S) 1〜2,000件、開始時刻の幅7日以内、各フェーズ・全体時間24時間以内、サイズ1 TB以下。数値は有限、サイズ・状態は整数。send/wait/receive は非負、任意フェーズは -1 も可。必須時間/サイズ不足、data: URL、WebSocket、未対応エンコード・構造は拒否。10秒で処理終了、ZIP は不可。

順序・応答サイズ・状態・時間・関係性は情報として残ります。共有前に確認し、匿名性を保証しません。本文がないため元要求の再現や本文分析には使えません。HAR 1.2 Schema と Playwright の HAR 読み込みを検証し、すべての外部ビューアー対応は保証しません。HTML は全件、画面は50件ずつ表示します。

## 開発

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
npm run format:check
```

[Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Dependencies](THIRD_PARTY_NOTICES.md)

Built by [jeffrog-256k1](https://github.com/jeffrog-256k1) · [leejungjae.app](https://leejungjae.app)
