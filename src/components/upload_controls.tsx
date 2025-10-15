"use client";

import { useRef } from "react";
import { draw_image, blur_region } from "@/lib/canvas_blur";
import { detect_faces } from "@/lib/face_detection_client";
import type { Rect, FaceBox } from "@/lib/types";

// 許可する画像フォーマットと制限
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;
const RADIUS_FACTOR = 0.015;

// 顔検出APIのボックス
function toRect(b: FaceBox, W: number, H: number): Rect {
  const norm = b.x_max <= 1 && b.y_max <= 1;
  const sx = norm ? W : 1;
  const sy = norm ? H : 1;
  const x1 = Math.round(b.x_min * sx);
  const y1 = Math.round(b.y_min * sy);
  const x2 = Math.round(b.x_max * sx);
  const y2 = Math.round(b.y_max * sy);
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

type Props = {
  canvas_ref: React.RefObject<HTMLCanvasElement | null>;
  set_error: (_m: string | null) => void;
};

export default function UploadControls({ canvas_ref, set_error }: Props) {
  const last = useRef<File | null>(null);

  // ファイルのバリデーション
  function validate(f: File): string | null {
    if (!ALLOWED.has(f.type)) return "画像ファイルを選択してください（jpg/png/webp/gif）。";
    if (f.size > MAX_BYTES) return "ファイルサイズは 5MB 未満にしてください。";
    return null;
  }

  // 画像をキャンバスに読み込み
  async function loadToCanvas(f: File) {
    const c = canvas_ref.current;
    if (!c) return set_error("キャンバスを利用できません。");
    await draw_image(c, f);
  }

  // ファイル選択
  async function choose(list: FileList | null) {
    set_error(null);
    const f = list?.[0];
    if (!f) return;
    const err = validate(f);
    if (err) return set_error(err);
    last.current = f;
    await loadToCanvas(f);
  }

  // ドロップ受け取り
  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    choose(e.dataTransfer.files);
  }

  // キャンバスと状態のクリア
  function clearAll() {
    set_error(null);
    const c = canvas_ref.current;
    if (!c) return;
    c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
    last.current = null;
  }

  // ぼかしマスクを実行
  async function maskNow() {
    const c = canvas_ref.current;
    const f = last.current;
    if (!c || !f) return set_error("先に画像を追加してください。");
    if (!c.width || !c.height) await loadToCanvas(f);

    const ctx = c.getContext("2d");
    if (!ctx) return set_error("キャンバスを利用できません。");

    try {
      const { result } = await detect_faces(f);
      const boxes = result.map(r => r.box);
      if (boxes.length === 0) return set_error("顔が見つかりませんでした。");

      const radius = Math.round(Math.min(c.width, c.height) * RADIUS_FACTOR);
      for (const b of boxes) {
        blur_region(ctx, toRect(b, c.width, c.height), radius);
      }
    } catch (e) {
      set_error(e instanceof Error ? e.message : "検出中にエラーが発生しました。");
    }
  }

  return (
    <div
      onDragOver={e => e.preventDefault()}
      onDrop={onDrop}
      className="grid place-items-center gap-3 rounded-xl border border-neutral-700 p-6 text-neutral-300"
    >
      <p>ここに画像をドラッグ＆ドロップするか、ファイルを選択してください</p>
      <div className="flex gap-3">
        <label className="cursor-pointer rounded-lg border border-neutral-700 px-3 py-1.5 hover:bg-neutral-900">
          ファイルを選択
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => choose(e.target.files)}
          />
        </label>
        <button
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm hover:bg-blue-500"
          onClick={maskNow}
        >
          マスクする
        </button>
        <button
          className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
          onClick={clearAll}
        >
          クリア
        </button>
      </div>
    </div>
  );
}
