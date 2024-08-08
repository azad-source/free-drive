import * as THREE from "three";

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

export function getCamera() {
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(
    defaultCameraPosition.x,
    defaultCameraPosition.y,
    defaultCameraPosition.z
  );
  return camera;
}
