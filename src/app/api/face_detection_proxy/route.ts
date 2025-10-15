export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 顔検出APIのURLとキー
const FACE_API_URL = process.env.FACE_API_URL;
const FACE_API_KEY = process.env.FACE_API_KEY;
const TIMEOUT_MS = Number(process.env.FACE_API_TIMEOUT_MS) || 10000;  // タイムアウト時間：8000ミリ秒

// エラーメッセージ
function toHumanMessage(raw: string): string {
  const s = raw.toLowerCase();
  if (s.includes("no face")) return "画像内に顔が見つかりませんでした。";
  if (s.includes("invalid image")) return "画像の形式が正しくありません。";
  if (s.includes("api key")) return "APIキーの認証に失敗しました。";
  if (s.includes("timeout")) return "サーバーの応答がタイムアウトしました。";
  return "画像の処理中にエラーが発生しました。";
}

// 顔検出APIのポイント
export async function POST(req: Request) {
  if (!FACE_API_URL || !FACE_API_KEY) {
    return Response.json(
      { message: "FACE_API_URL または FACE_API_KEY が設定されていません。" },
      { status: 500 }
    );
  }

  // フォームデータからファイルを取得
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ message: "ファイルが送信されていません。" }, { status: 400 });
  }

  const out = new FormData();
  out.set("file", file, file.name || "image.jpg");

  // タイムアウト付きのAbortControllerを作成
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  // 顔検出APIにリクエストを転送
  try {
    const res = await fetch(FACE_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": FACE_API_KEY,
        accept: "application/json",
      },
      body: out,
      signal: ctrl.signal,
      cache: "no-store",
    });

    clearTimeout(timer);

    const text = await res.text();
    let body: unknown = text;

    try {
      body = JSON.parse(text);
    } catch {
    }

    // エラー応答の処理
    if (!res.ok) {
      const rawMsg =
        typeof body === "object" && body && "message" in body
          ? String((body as { message: string }).message)
          : String(text);

      const msg = toHumanMessage(rawMsg);
      console.error("[CompreFace エラー]", res.status, rawMsg);

      return Response.json({ message: msg }, { status: res.status });
    }

    return Response.json(body, { status: 200 });
  } catch (e) {
    clearTimeout(timer);

    // ネットワークエラーやタイムアウト
    const isAbort = e instanceof Error && e.name === "AbortError";
    const msg = isAbort
      ? `顔検出サーバーへのリクエストがタイムアウトしました（${TIMEOUT_MS}ミリ秒）`
      : "ネットワークまたはサーバーに接続できません。";
    console.error("[プロキシ通信エラー]", e);

    return Response.json({ message: msg }, { status: 502 });
  }
}
