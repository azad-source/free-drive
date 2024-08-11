import * as THREE from "three";
import { Car } from "./car";

// Create a camera
const fov = 45; // AKA Field of View
const aspect = window.innerWidth / window.innerHeight;
const near = 0.1; // the near clipping plane
const far = 1000; // the far clipping plane

export const defaultCameraPosition = {
  x: -15,
  y: 15,
  z: 10,
};

export class PlayerCamera {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  followCam: THREE.Object3D;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.init();
  }

  init() {
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.set(
      defaultCameraPosition.x,
      defaultCameraPosition.y,
      defaultCameraPosition.z
    );

    this.followCam = new THREE.Object3D();
    this.followCam.position.copy(this.camera.position);
    this.scene.add(this.followCam);
  }

  updateCamera(car: Car) {
    this.camera.position.lerp(
      this.followCam.getWorldPosition(new THREE.Vector3()),
      0.05
    );

    const targetPosition = car?.gltf?.chasis?.position;

    if (targetPosition) {
      const angle = 0;
      const distance = 0;
      const height = 0;

      const targetX = targetPosition.x + distance * Math.cos(angle);
      const targetY = targetPosition.y + height;
      const targetZ = targetPosition.z + distance * Math.sin(angle);

      const offset = new THREE.Vector3(0, 5, 10); // Отступ камеры
      const carRotation = new THREE.Matrix4().makeRotationY(targetPosition.y);
      const cameraPosition = offset
        .applyMatrix4(carRotation)
        .add(targetPosition);

      this.camera.position.copy(cameraPosition);
      this.camera.lookAt(targetPosition);
      // const { x, y, z } = defaultCameraPosition;
      // this.camera.position.set(x + targetX, y + targetY, z + targetZ);
    }

    // if (this.helper.sun != undefined) {
    //   this.helper.sun.position.copy(this.camera.position);
    //   this.helper.sun.position.y += 10;
    // }
  }
}
