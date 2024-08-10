import { sessionFields } from "../config/user.config";

export class Player {
  readonly id: string | null;
  readonly name: string | null;

  constructor() {
    this.name = sessionStorage.getItem(sessionFields.playerName);
    this.id = sessionStorage.getItem(sessionFields.playerId);
  }

  isExist() {
    return this.id !== null;
  }
}
