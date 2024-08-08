import { RaycastVehicle } from "cannon-es";
import nipplejs from "nipplejs";
import { joystickOptions } from "../config/nipple.config";
import { movementOptions } from "../config/vehicle.config";

interface IMoveParams {
  inverse?: boolean;
  force?: number;
}

interface ITurnParams {
  inverse?: boolean;
  angle?: number;
}

const { maxForce, maxSteerVal, brakeForce } = movementOptions;

export class VehicleControls {
  vehicle: RaycastVehicle;
  joystickManager: nipplejs.JoystickManager;

  constructor(vehicle: RaycastVehicle) {
    this.vehicle = vehicle;
    this.joystickManager = nipplejs.create(joystickOptions);
    this.initKeys();
    this.initJoystick();
  }

  initKeys() {
    document.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "w":
        case "ArrowUp":
          this.move();
          break;

        case "s":
        case "ArrowDown":
          this.move({ inverse: true });
          break;

        case "a":
        case "ArrowLeft":
          this.turn();
          break;

        case "d":
        case "ArrowRight":
          this.turn({ inverse: true });
          break;

        case "b":
        case " ":
          this.break();
          break;
      }
    });

    document.addEventListener("keyup", (event) => {
      switch (event.key) {
        case "w":
        case "ArrowUp":
          this.resetEngine();
          break;

        case "s":
        case "ArrowDown":
          this.resetEngine();
          break;

        case "a":
        case "ArrowLeft":
          this.resetSteering();
          break;

        case "d":
        case "ArrowRight":
          this.resetSteering();
          break;

        case "b":
        case " ":
          this.resetBreak();
          break;
      }
    });
  }

  initJoystick() {
    this.joystickManager.on("move", (evt, data) => {
      if (data && data.vector) {
        const { x, y } = data.vector;
        this.move({ force: -y * maxForce });
        this.turn({ angle: -x * maxSteerVal });
      }
    });

    this.joystickManager.on("end", () => {
      this.resetEngine();
      this.resetSteering();
    });
  }

  move(params?: IMoveParams) {
    const valueSign = params?.inverse ? 1 : -1;
    const accelValue = params?.force ? params.force : valueSign * maxForce;
    this.vehicle.applyEngineForce(accelValue, 0);
    this.vehicle.applyEngineForce(accelValue, 1);
  }

  turn(params?: ITurnParams) {
    const valueSign = params?.inverse ? -1 : 1;
    const turnAngle = params?.angle ? params?.angle : valueSign * maxSteerVal;
    this.vehicle.setSteeringValue(turnAngle, 0);
    this.vehicle.setSteeringValue(turnAngle, 1);
  }

  break() {
    for (let i = 0; i < 4; i++) {
      this.vehicle.setBrake(brakeForce, i);
    }
  }

  resetEngine() {
    for (let i = 0; i < 4; i++) {
      this.vehicle.applyEngineForce(0, i);
    }
  }

  resetSteering() {
    this.vehicle.setSteeringValue(0, 0);
    this.vehicle.setSteeringValue(0, 1);
  }

  resetBreak() {
    for (let i = 0; i < 4; i++) {
      this.vehicle.setBrake(0, i);
    }
  }
}
