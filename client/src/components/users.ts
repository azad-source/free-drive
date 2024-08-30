import { IGame } from "models/user.models";
import { Car } from "./car";
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { Player } from "./player";

export class Users {
  scene: THREE.Scene;
  world: CANNON.World;
  cars: Record<string, Car> = {};

  constructor(scene: THREE.Scene, world: CANNON.World) {
    this.scene = scene;
    this.world = world;
  }

  update(data: IGame, player: Player) {
    delete data[player.id];

    for (const userId in data) {
      const state = data[userId];

      if (userId in this.cars) {
        this.cars[userId].setState(state);
      } else {
        const car = new Car(this.scene, this.world, state);
        this.cars[userId] = car;
      }
    }
  }

  updateFrame() {
    for (const id in this.cars) {
      this.cars[id].updateFrame();
    }
  }
}
