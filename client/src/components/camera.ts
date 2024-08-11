import * as THREE from "three";
import { Car } from "./car";

// Create a camera
const fov = 45; // AKA Field of View
const aspect = window.innerWidth / window.innerHeight;
const near = 0.1; // the near clipping plane
const far = 1000; // the far clipping plane

export const defaultCameraPosition = {
  x: 25,
  y: 15,
  z: 0,
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

    const target = car?.gltf?.chasis;

    if (target) {
      const offset = new THREE.Vector3(
        defaultCameraPosition.x,
        defaultCameraPosition.y,
        defaultCameraPosition.z
      );

      const carRotation = new THREE.Matrix4().makeRotationFromQuaternion(
        new THREE.Quaternion(
          target.quaternion.x,
          target.quaternion.y,
          target.quaternion.z,
          target.quaternion.w
        )
      );

      const cameraPosition = offset
        .applyMatrix4(carRotation)
        .add(target.position);

      this.followCam.position.copy(cameraPosition);
      this.camera.lookAt(target.position);
    }
  }
}
