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

const wheelXOffset = 0.3; // вынос колес
const fWheelPos = 1.65;
const rWheelPos = -1.7;

const wheelPosition: Record<number, number[]> = {
  0: [1 + wheelXOffset, 0, fWheelPos], // Переднее правое колесо
  1: [-(1 + wheelXOffset), 0, fWheelPos], // Переднее левое колесо
  2: [1 + wheelXOffset, 0, rWheelPos], // Заднее правое колесо
  3: [-(1 + wheelXOffset), 0, rWheelPos], // Заднее левое колесо
};

export class Car {
  scene: THREE.Scene;
  world: CANNON.World;
  vehicle: CANNON.RaycastVehicle;
  gltf: RedPickup;
  chassisBody: CANNON.Body;
  wheelBodies: CANNON.Body[] = [];
  wheelMaterial = new CANNON.Material("wheelMaterial");
  state: IGameState;

  constructor(scene: THREE.Scene, world: CANNON.World, state?: IGameState) {
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

    this.gltf = new RedPickup(this.scene);

    this.addChasis();
    this.addWheels();
  }

  addChasis() {
    this.chassisBody = new CANNON.Body({
      shape: new CANNON.Box(new CANNON.Vec3(1.25, 0.8, 3)),
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

  addWheels() {
    const wheelOptions = (index: number): CANNON.WheelInfoOptions => ({
      ...defaultWheelOptions,
      chassisConnectionPointLocal: new CANNON.Vec3(...wheelPosition[index]),
      isFrontWheel: index === 0 || index === 1,
    });

    // Add wheels to the vehicle
    this.vehicle.addWheel(wheelOptions(0)); // Front right wheel
    this.vehicle.addWheel(wheelOptions(1)); // Front left wheel
    this.vehicle.addWheel(wheelOptions(2)); // Rear right wheel
    this.vehicle.addWheel(wheelOptions(3)); // Rear left wheel

    this.vehicle.wheelInfos.forEach((wheel, index) => {
      const wheelShape = new CANNON.Cylinder(
        wheel.radius,
        wheel.radius,
        wheel.radius / 2,
        segmentCount.wheel
      );
      const wheelBody = new CANNON.Body({
        mass: mass.wheel,
        material: this.wheelMaterial,
        quaternion: new CANNON.Quaternion().setFromEuler(0, 0, -Math.PI / 2),
        type: CANNON.Body.DYNAMIC,
        collisionFilterGroup: 0,
      });

      // wheelBody.position.x = wheelMesh.position.x;
      // wheelBody.position.y = wheelMesh.position.y;
      // wheelBody.position.z = wheelMesh.position.z;

      const quaternion = new CANNON.Quaternion().setFromEuler(
        0,
        0,
        -Math.PI / 2
      );
      wheelBody.addShape(wheelShape, new CANNON.Vec3(), quaternion);
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
    this.gltf.chasis?.position.copy(this.chassisBody.position);
    this.gltf.chasis?.quaternion.copy(this.chassisBody.quaternion);
    this.gltf.chasis?.rotateY(Math.PI / 2);
    this.gltf.chasis?.translateX(0.5);
    this.gltf.chasis?.translateY(0.1);

    for (let i = 0; i < this.vehicle.wheelInfos.length; i++) {
      const wheelBody = this.wheelBodies[i];
      this.gltf.wheels[i]?.position.copy(wheelBody.position);
      this.gltf.wheels[i]?.quaternion.copy(wheelBody.quaternion);
      this.gltf.wheels[i]?.rotateY(-Math.PI / 2);
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
