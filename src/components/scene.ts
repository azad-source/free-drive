import * as THREE from "three";

export function getScene() {
  const scene = new THREE.Scene();
  const axes = new THREE.AxesHelper(50);
  const grid = new THREE.GridHelper(50, 40);

  const dLight = new THREE.DirectionalLight(0xffffff, 20.0);
  dLight.position.setScalar(10);
  dLight.position.set(-30, 50, 0);
  dLight.castShadow = true;
  dLight.shadow.camera.bottom = -5;
  dLight.shadow.camera.scale.set(5, 5, 5);
  const dLightHelper = new THREE.DirectionalLightHelper(dLight, 10);
  const dLightShadowHelper = new THREE.CameraHelper(dLight.shadow.camera);
  const ambLight = new THREE.AmbientLight(0xffffff);

  scene.background = new THREE.Color(0xa0a0a0);
  scene.add(axes, grid, dLight, ambLight, dLightHelper, dLightShadowHelper);

  return scene;
}
