# タイパ婚活マッチングアプリ

相性の良い相手を3〜5人に絞って紹介する婚活マッチングアプリ。

## 構成

```
matching-app/
├── client/   フロントエンド（React + Vite + Material UI）
│   └── src/
│       ├── pages/        各画面
│       ├── data/         診断の質問（サーバーからも読み込む）
│       ├── components/   共通部品（ヘッダーなど）
│       └── theme.js      色・フォントの設定
└── server/   バックエンド（Node.js + Express）
    ├── index.js          APIの入口
    ├── matching/         マッチング（rules.js=相性ルール, filter.js=必須条件, score.js=スコア計算）
    └── scripts/          テストユーザー作成など
```

## 初回の準備

`client/.env.example` をコピーして `client/.env` を作り、Supabase の Project URL と Publishable key を設定します。

`server/.env.example` をコピーして `server/.env` を作り、Supabase の Project URL と Secret key を設定します（Secret key は絶対に公開しないこと）。

`supabase/migrations/` の SQL を、ファイル名の順に Supabase の SQL Editor で実行します。

## テスト用コマンド（server フォルダで実行）

```bash
npm run seed                                        # テストユーザー20人を作り直す
npm run try-matching -- test-user-01@example.com    # 画面を使わずにマッチング結果を表示
```

相性ルールは `server/matching/rules.js` にまとまっています。

## 起動方法

ターミナルを2つ開いて、それぞれ実行します。

```bash
# ターミナル1：サーバー（http://localhost:3001）
cd server
npm install
npm run dev

# ターミナル2：フロント（http://localhost:5173）
cd client
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開きます。
