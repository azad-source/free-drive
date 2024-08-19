export type IGame = Record<string, IGameState>;

export interface IGameState {
  id: string; // user id
  x: number; // car x position
  y: number; // car y position
  z: number; // car z position
  qx: number; // car qx (quaternion) position
  qy: number; // car qy (quaternion) position
  qz: number; // car qz (quaternion) position
  w: number; // scalar part of the quaternion
  whInfo: WhInfo[]; // wheels info
  isRemoved?: boolean;
}

export interface WhInfo {
  st_wh: number; // угол поворота передних колес
  engFrc: number; // скорость
}
