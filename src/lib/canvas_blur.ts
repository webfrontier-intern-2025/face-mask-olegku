import type { Rect } from "@/lib/types";

// 画像をキャンバスに描画する関数
export async function draw_image(canvas: HTMLCanvasElement, file: File) {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
  } finally {
    URL.revokeObjectURL(url);
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // キャンバスサイズを画像に合わせて調整
  canvas.width = img.width;
  canvas.height = img.height;

  ctx.drawImage(img, 0, 0);
}

// 指定された範囲をぼかす関数
export function blur_region(ctx: CanvasRenderingContext2D, r: Rect, radius: number) {
  if (radius <= 0) return;

  // 座標とサイズをキャンバス内に制限
  const x = Math.max(0, Math.floor(r.x));
  const y = Math.max(0, Math.floor(r.y));
  const w = Math.max(0, Math.floor(Math.min(r.w, ctx.canvas.width - x)));
  const h = Math.max(0, Math.floor(Math.min(r.h, ctx.canvas.height - y)));
  if (!w || !h) return;

  // 一時キャンバスを作成して、ぼかす部分を切り出す
  const tmp = document.createElement("canvas");
  tmp.width = w;
  tmp.height = h;
  const t = tmp.getContext("2d");
  if (!t) return;

  // 対象部分をコピー
  t.drawImage(ctx.canvas, x, y, w, h, 0, 0, w, h);

  // 対象範囲をクリッピングしてぼかし描画
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.filter = `blur(${radius}px)`;
  ctx.drawImage(tmp, x, y);
  ctx.restore();
}
