import { sessionFields } from "../config/user.config";
import { Car } from "./car";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { PlayerCamera } from "./camera";

export class Player {
  scene: THREE.Scene;
  world: CANNON.World;
  playerCamera: PlayerCamera;
  readonly id: string | null;
  readonly name: string | null;
  car: Car | null;

  constructor(
    scene: THREE.Scene,
    world: CANNON.World,
    playerCamera: PlayerCamera
  ) {
    this.scene = scene;
    this.world = world;
    this.playerCamera = playerCamera;
    this.name = sessionStorage.getItem(sessionFields.playerName);
    this.id = sessionStorage.getItem(sessionFields.playerId);
  }

  isExist() {
    return this.id !== null;
  }

  initCar() {
    this.car = new Car(this.scene, this.world);
    this.car.initControls();
  }

  removeCar() {
    this.car = null;
  }

  updateFrame() {
    this.car.updateFrame();
    this.playerCamera.updateCamera(this.car);
  }
}
