# タイパ婚活マッチングアプリ

相性の良い相手を3〜5人に絞って紹介する婚活マッチングアプリ。

## 構成

```
matching-app/
├── client/   フロントエンド（React + Vite + Material UI）
│   └── src/
│       ├── pages/        各画面
│       ├── components/   共通部品（ヘッダーなど）
│       └── theme.js      色・フォントの設定
└── server/   バックエンド（Node.js + Express）
    └── index.js          APIの入口
```

## 初回の準備

`client/.env.example` をコピーして `client/.env` を作り、Supabase の Project URL と Publishable key を設定します。

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
