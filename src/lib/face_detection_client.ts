import type { DetectResponse } from "@/lib/types";

const ENDPOINT = "/api/face_detection_proxy" as const;

// JSONを安全にパースするユーティリティ関数
function parseJSONSafe<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

// 顔検出APIを呼び出す関数
export async function detect_faces(file: File): Promise<DetectResponse> {
  const fd = new FormData();
  fd.set("file", file, file.name || "image.jpg");

  // API呼び出し
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      body: fd,
      cache: "no-store",
      headers: {
        accept: "application/json",
      },
      redirect: "manual",
    });
  } catch {
    throw new Error("ネットワークに接続できません。もう一度お試しください。");
  }

  const text = await res.text();
  const ct = res.headers.get("content-type") || "";

  // エラー応答の処理
  if (!res.ok) {
    const j = ct.includes("application/json")
      ? parseJSONSafe<{ message?: string }>(text)
      : parseJSONSafe<{ message?: string }>(text);

    const message =
      (j && typeof j.message === "string" && j.message) ||
      (text && text.trim()) ||
      `エラーが発生しました（${res.status}）`;

    throw new Error(message);
  }

  // 正常な応答をJSONとしてパース
  const data = ct.includes("application/json")
    ? parseJSONSafe<DetectResponse>(text)
    : parseJSONSafe<DetectResponse>(text);

  if (!data) throw new Error("検出サーバーからの応答が不正です。");
  return data;
}
