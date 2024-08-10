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

const wheelPosition: Record<number, number[]> = {
  0: [1, 0, 1], // Переднее правое колесо
  1: [-1, 0, 1], // Переднее левое колесо
  2: [1, 0, -1], // Заднее правое колесо
  3: [-1, 0, -1], // Заднее левое колесо
};

export class Car {
  scene: THREE.Scene;
  world: CANNON.World;
  vehicle: CANNON.RaycastVehicle;
  chassisMesh: THREE.Mesh;
  chassisBody: CANNON.Body;
  wheelMeshes: THREE.Mesh[] = [];
  wheelBodies: CANNON.Body[] = [];
  wheelMaterial = new CANNON.Material("wheelMaterial");
  state?: IGameState;

  constructor(scene: THREE.Scene, world: CANNON.World, state?: IGameState) {
    this.scene = scene;
    this.world = world;
    this.state = state;
    this.addChasis();
    this.addWheels();
  }

  addChasis() {
    const chassisGeometry = new THREE.BoxGeometry(2, 1, 4);
    const chassisMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    this.chassisMesh = new THREE.Mesh(chassisGeometry, chassisMaterial);
    this.scene.add(this.chassisMesh);

    this.chassisBody = new CANNON.Body({
      shape: new CANNON.Box(new CANNON.Vec3(1, 0.5, 0.5)),
      mass: mass.vehicle,
      position: new CANNON.Vec3(
        this.state?.x || 0,
        this.state?.y || 4,
        this.state?.z || 0
      ),
      quaternion: new CANNON.Quaternion(
        this.state?.qx || 0,
        this.state?.qy || 0,
        this.state?.qz || 0
      ),
      linearDamping: 0.1,
      angularDamping: 0.1,
      // type: CANNON.BODY_TYPES.DYNAMIC,
      // angularVelocity: new CANNON.Vec3(0, 0.5, 0),
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
      const wheelMeshGeometry = new THREE.CylinderGeometry(
        wheel.radius,
        wheel.radius,
        wheel.radius / 1,
        segmentCount.wheel
      );
      const wheelMeshMaterial = new THREE.MeshStandardMaterial({
        color: 0x0000ff,
      });
      const wheelMesh = new THREE.Mesh(wheelMeshGeometry, wheelMeshMaterial);
      wheelMesh.position.copy(new THREE.Vector3(...wheelPosition[index]));
      wheelMesh.quaternion.copy(
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0))
      );

      this.wheelMeshes.push(wheelMesh);
      this.scene.add(wheelMesh);

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
        type: CANNON.Body.KINEMATIC,
        collisionFilterGroup: 0,
      });

      wheelBody.position.x = wheelMesh.position.x;
      wheelBody.position.y = wheelMesh.position.y;
      wheelBody.position.z = wheelMesh.position.z;

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

  updateFrame() {
    this.chassisMesh?.position.copy(this.chassisBody.position);
    this.chassisMesh?.quaternion.copy(this.chassisBody.quaternion);

    for (let i = 0; i < this.vehicle.wheelInfos.length; i++) {
      const wheelBody = this.wheelBodies[i];
      const wheelMesh = this.wheelMeshes[i];
      // const wheelInfo = this.vehicle.wheelInfos[i];

      // wheelMesh.position.copy(wheelBody.position);
      // wheelMesh.quaternion.copy(wheelBody.quaternion);

      // this.vehicle.updateWheelTransform(i);
      // const transform = wheelInfo.worldTransform;
      // wheelMesh.position.copy(transform.position);
      // wheelMesh.quaternion.copy(transform.quaternion);
      // wheelBody.position.copy(transform.position);
      // wheelBody.quaternion.copy(transform.quaternion);
      wheelMesh.position.copy(wheelBody.position);
      wheelMesh.quaternion.copy(wheelBody.quaternion);
      wheelMesh.rotateZ(Math.PI / 2);
    }
  }
}
