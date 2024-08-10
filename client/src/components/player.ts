import { sessionFields } from "../config/user.config";
import { Car } from "./car";

export class Player {
  readonly id: string | null;
  readonly name: string | null;
  car: Car;

  constructor() {
    this.name = sessionStorage.getItem(sessionFields.playerName);
    this.id = sessionStorage.getItem(sessionFields.playerId);
  }

  isExist() {
    return this.id !== null;
  }

  defineCar(car: Car) {
    this.car = car;
  }
}
