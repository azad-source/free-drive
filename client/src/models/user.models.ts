export type IGame = Record<string, IGameState>;

export interface IGameState {
  id: string;
  x: number;
  y: number;
  z: number;
  qx: number;
  qy: number;
  qz: number;
  w: number;
  whInfo: WhInfo[];
  isRemoved?: boolean;
}

export interface WhInfo {
  st_wh: number; // угол поворота передних колес
  engFrc: number; // скорость
}
