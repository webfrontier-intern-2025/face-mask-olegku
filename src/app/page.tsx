"use client";

import { useRef, useState } from "react";
import UploadControls from "@/components/upload_controls";

// 顔ぼかしページのメインコンポーネント
export default function Page() {
  const [err, setErr] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <section className="grid gap-6">
      {/* 画像アップロード */}
      <div className="grid gap-4 rounded-2xl border border-neutral-800 p-6">
        <h2 className="text-lg font-semibold">画像アップロード</h2>
        <UploadControls canvas_ref={canvasRef} set_error={setErr} />
        {err && (
          <p className="text-sm text-red-400" role="status" aria-live="polite">
            {err}
          </p>
        )}
      </div>

      {/* 結果表示 */}
      <div className="grid gap-2 rounded-2xl border border-neutral-800 p-6">
        <canvas
          ref={canvasRef}
          className="w-full max-h-[70vh] rounded-xl border border-neutral-800 bg-black/40"
        />
      </div>
    </section>
  );
}
