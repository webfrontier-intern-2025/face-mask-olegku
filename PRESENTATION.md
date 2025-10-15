# 顔検出プロジェクト — 解説

このリポジトリは、画像から顔を検出し、検出された領域をマスク（ぼかし）するフロントエンド課題の実装です。  

---

## 1. 環境変数の読み込み（サーバー専用）

> ブラウザにAPIキーを見せないため、URLやキー、タイムアウト時間などを**環境変数**から読み込みます。  
これは**サーバー側だけで動くコード**なので、安全です。

```ts
const FACE_API_URL = process.env.FACE_API_URL;
const FACE_API_KEY = process.env.FACE_API_KEY;
const TIMEOUT_MS = Number(process.env.FACE_API_TIMEOUT_MS) || 10000;
```

> `process.env.` は サーバーだけ で使えます（クライアント側のTSX/JSでは使えません）。<br>
> TIMEOUT_MS は `.env.local` に無い場合、既定で 10000ms になります。

---

### 設定ファイル（ローカル専用）
---


```ts
FACE_API_TIMEOUT_MS=8000
FACE_API_URL=https://xxx.co.jp/api/v1/detection/detect
FACE_API_KEY=xxx-xxx-xxx-xxx-xxx
```

> 開発者の手元でだけ使う設定は `.env.local` に書きます。<br>
> このファイルは Git管理外（コミットしない）なので、公開されません。

- **ざっくり流れ**
  1. `.env.local` に値を書く（鍵はここに置く）
  2. サーバーの API ルート（`route.ts`）で `process.env.*` を読む
  3. サーバーが外部の顔検出APIにアクセスする（ブラウザにはキーを渡さない）

---

## 2. エラーを分かりやすく変換する関数

---

> エラーメッセージをユーザーに理解しやすく表示するため、生の英語メッセージをわかりやすい表現に直す関数を作りました。

```ts
function toHumanMessage(raw: string): string {
  const s = raw.toLowerCase();
  if (s.includes("no face")) return "画像内に顔が見つかりませんでした。";
  if (s.includes("invalid image")) return "画像の形式が正しくありません。";
  if (s.includes("api key")) return "APIキーの認証に失敗しました。";
  if (s.includes("timeout")) return "サーバーの応答がタイムアウトしました。";
  return "画像の処理中にエラーが発生しました。";
}
```

| エラー内容 | 表示されるメッセージ |
|-------------|----------------------|
| `no face` | 顔が見つからない |
| `invalid image` | 画像の形式が違う |
| `api key` | 認証失敗 |
| `timeout` | 応答が遅い |
| その他 | 一般的なエラー |

---

## 3. ステータスコードの処理

---

> APIから返るHTTPステータスに応じて、処理を分けています。

| ステータス | 意味 | 対応 |
|-------------|------|------|
| `200` | 成功 | 顔データを受け取る |
| `400` | リクエストエラー | ファイルが無効など |
| `502` | APIサーバーエラー | 外部APIの接続失敗 |

> これにより、どこで問題が起きたかを正確に特定できます。

---
