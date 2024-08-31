import * as THREE from "three";
import * as CANNON from "cannon-es";
import {
  vehicleOptions,
  defaultWheelOptions,
  mass,
  segmentCount,
} from "../config/vehicle.config";
import { groundOptions } from "../config/ground.config";
import { IGameState } from "../models/user.models";
import { sessionFields } from "../config/user.config";
import { RedPickup } from "./objects/redPickup";
import { VehicleControls } from "./controls";
import { threeToCannon, ShapeType } from "three-to-cannon";

const fwdWheelsOffset = 0.85; // вынос передних колес (колесная база)
const bckWheelsOffset = 0.47; // вынос задних колес (колесная база)
const wheelsWidth = 0.55; // ширина колеи

const wheelPosition: Record<number, number[]> = {
  0: [-fwdWheelsOffset, 0, -wheelsWidth], // Переднее правое колесо
  1: [-fwdWheelsOffset, 0, wheelsWidth], // Переднее левое колесо
  2: [bckWheelsOffset, 0, -wheelsWidth], // Заднее правое колесо
  3: [bckWheelsOffset, 0, wheelsWidth], // Заднее левое колесо
};

export class Car {
  scene: THREE.Scene;
  world: CANNON.World;
  vehicle: CANNON.RaycastVehicle;
  gltf: RedPickup = null;
  chassisBody: CANNON.Body;
  wheelBodies: CANNON.Body[] = [];
  wheelMaterial = new CANNON.Material("wheelMaterial");
  state: IGameState;

  constructor(
    scene: THREE.Scene,
    world: CANNON.World,
    canControl: boolean,
    state?: IGameState
  ) {
    this.scene = scene;
    this.world = world;
    this.state = {
      id: sessionStorage.getItem(sessionFields.playerId) || "",
      x: 0,
      y: 4,
      z: 0,
      qx: 0,
      qy: 0,
      qz: 0,
      w: 0,
      whInfo: [],
      ...state,
    };

    const redPickup = new RedPickup(this.scene);

    redPickup.init().then((res) => {
      this.gltf = res;
      this.addChasis();
      this.addWheels();
      if (canControl) {
        this.initControls();
      }
    });
  }

  addChasis() {
    const { shape } = threeToCannon(this.gltf.chasis, { type: ShapeType.HULL });

    this.chassisBody = new CANNON.Body({
      shape,
      mass: mass.vehicle,
      position: new CANNON.Vec3(this.state.x, this.state.y, this.state.z),
      quaternion: new CANNON.Quaternion(
        this.state.qx,
        this.state.qy,
        this.state.qz
      ),
      linearDamping: 0.1,
      angularDamping: 0.1,
    });

    this.vehicle = new CANNON.RaycastVehicle({
      ...vehicleOptions,
      chassisBody: this.chassisBody,
    });

    this.vehicle.addToWorld(this.world);
    this.world.addBody(this.chassisBody);
  }

  isFwdWheel(index: number) {
    return index === 0 || index === 1;
  }

  isLeftWheel(index: number) {
    return index === 1 || index === 3;
  }

  addWheels() {
    const wheelOptions = (i: number): CANNON.WheelInfoOptions => ({
      ...defaultWheelOptions,
      chassisConnectionPointLocal: new CANNON.Vec3(...wheelPosition[i]),
      isFrontWheel: this.isFwdWheel(i),
    });

    // Add wheels to the vehicle
    this.vehicle.addWheel(wheelOptions(0)); // Front right wheel
    this.vehicle.addWheel(wheelOptions(1)); // Front left wheel
    this.vehicle.addWheel(wheelOptions(2)); // Rear right wheel
    this.vehicle.addWheel(wheelOptions(3)); // Rear left wheel

    this.vehicle.wheelInfos.forEach((wheel) => {
      const wheelShape = new CANNON.Cylinder(
        wheel.radius,
        wheel.radius,
        wheel.radius / 1,
        segmentCount.wheel
      );

      const wheelBody = new CANNON.Body({
        mass: mass.wheel,
        material: this.wheelMaterial,
        type: CANNON.Body.DYNAMIC,
        collisionFilterGroup: 0,
      });

      const quat = new CANNON.Quaternion().setFromEuler(Math.PI / 2, 0, 0);
      wheelBody.addShape(wheelShape, new CANNON.Vec3(), quat);
      this.wheelBodies.push(wheelBody);
      this.world.addBody(wheelBody);

      // Update the wheel bodies
      this.world.addEventListener("postStep", () => {
        for (let i = 0; i < this.vehicle.wheelInfos.length; i++) {
          this.vehicle.updateWheelTransform(i);
          const transform = this.vehicle.wheelInfos[i].worldTransform;
          const wheelBody = this.wheelBodies[i];
          wheelBody.position.copy(transform.position);
          wheelBody.quaternion.copy(transform.quaternion);
        }
      });
    });

    const wheelGroundContactMaterial = new CANNON.ContactMaterial(
      this.wheelMaterial,
      groundOptions.material,
      { friction: 0.3, restitution: 0, contactEquationStiffness: 1000 }
    );
    this.world.addContactMaterial(wheelGroundContactMaterial);
  }

  initControls() {
    new VehicleControls(this.vehicle);
  }

  updateFrame() {
    if (!this.gltf) return;

    this.gltf.chasis.position.copy(this.chassisBody.position);
    this.gltf.chasis.quaternion.copy(this.chassisBody.quaternion);

    for (let i = 0; i < this.vehicle.wheelInfos.length; i++) {
      const wheelBody = this.wheelBodies[i];
      this.gltf.wheels[i].position.copy(wheelBody.position);
      this.gltf.wheels[i].quaternion.copy(wheelBody.quaternion);
      this.gltf.wheels[i].rotateZ(Math.PI / 2);
      this.gltf.wheels[i].translateZ((this.isLeftWheel(i) ? 1 : -1) * 0.05);
    }

    this.state = {
      ...this.state,
      x: this.chassisBody.position.x,
      y: this.chassisBody.position.y,
      z: this.chassisBody.position.z,
      qx: this.chassisBody.quaternion.x,
      qy: this.chassisBody.quaternion.y,
      qz: this.chassisBody.quaternion.z,
      w: this.chassisBody.quaternion.w,
      whInfo: this.vehicle.wheelInfos.map((w) => ({
        st_wh: w.steering,
        engFrc: w.engineForce,
      })),
    };
  }

  setState(state: IGameState) {
    const { x, y, z, qx, qy, qz, w, whInfo } = state;

    this.state = state;
    this.vehicle.chassisBody.position.copy(new CANNON.Vec3(x, y, z));
    this.vehicle.chassisBody.quaternion.copy(
      new CANNON.Quaternion(qx, qy, qz, w)
    );
    whInfo.forEach((w, i) => {
      this.vehicle.wheelInfos[i].steering = w.st_wh;
      this.vehicle.wheelInfos[i].engineForce = w.engFrc;
    });
  }

  removeCar() {
    const car = this;
    this.scene.remove(car.gltf.chasis);

    car.gltf.chasis.remove();
    car.vehicle.removeFromWorld(this.world);
    car.gltf.wheels.forEach((w) => {
      this.scene.remove(w);
      w.remove();
      removeMaterial(w);
    });

    car.wheelBodies.forEach((w) => {
      this.world.removeBody(w);
    });

    if (this.world && car) {
      this.world.removeBody(car.chassisBody);
    }
  }
}

function removeMaterial(mesh: THREE.Object3D<THREE.Object3DEventMap>) {
  // if (mesh?.material) {
  //   if (Array.isArray(mesh?.material)) {
  //     mesh?.material.forEach((mat) => mat.dispose());
  //   } else {
  //     mesh?.material.dispose();
  //   }
  // }
}
