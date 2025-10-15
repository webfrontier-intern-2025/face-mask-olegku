export type Rect = {
  x: number; // 左上のX座標
  y: number; // 左上のY座標
  w: number; // 幅
  h: number; // 高さ
};

export type FaceBox = {
  x_min: number; // 顔の左端
  y_min: number; // 顔の上端
  x_max: number; // 顔の右端
  y_max: number; // 顔の下端
  probability?: number; // 検出の信頼度
};

export type DetectResponse = {
  result: Array<{ box: FaceBox }>;
};
