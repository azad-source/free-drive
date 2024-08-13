import * as THREE from "three";
import { GLTFLoader, GLTF, DRACOLoader } from "three/examples/jsm/Addons.js";

const gltfCar = new URL("../../assets/models/car/scene.gltf", import.meta.url);

export class RedPickup {
  scene: THREE.Scene;
  model: GLTF["scene"];
  wheel1: THREE.Object3D;
  wheel2: THREE.Object3D;
  wheel3: THREE.Object3D;
  wheel4: THREE.Object3D;
  chasis: THREE.Object3D;
  wheels: THREE.Object3D[] = [];
  models: THREE.Object3D<THREE.Object3DEventMap>[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.init();
  }

  init() {
    const gltfLoader = new GLTFLoader();

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("libs/draco3dgltf");
    dracoLoader.preload();

    gltfLoader.load(gltfCar.href, (gltf) => {
      this.model = gltf.scene;

      // this.model.traverse((node) => {
      //   if (node.name.toLowerCase().includes("object_30")) {
      //     node.position.set(0, 1, 0);
      //     this.models.push(node);
      //   }
      // });

      // this.processItems();

      this.wheels.push(
        this.model.getObjectByName("RFwheel_3"),
        this.model.getObjectByName("LFwheel_1"),
        this.model.getObjectByName("RRwheel_8"),
        this.model.getObjectByName("LRwheel_6")
      );

      const wheelScale = 2.4;
      const chasisScale = 2.5;

      this.wheels.forEach((w) => {
        w.scale.set(wheelScale, wheelScale, wheelScale);
        // if (w?.material?.wireframe) {
        //   w.material.wireframe = true;
        // }

        this.scene.add(w);
      });

      this.chasis = this.model.getObjectByName("Object_30");
      this.chasis.scale.set(chasisScale, chasisScale, chasisScale);
      // this.chasis.material.wireframe = true;
      this.scene.add(this.chasis);
    });

    gltfLoader.setDRACOLoader(dracoLoader);
  }

  async processItems() {
    for (const item of this.models) {
      await this.doAsyncWork(item); // Ожидание завершения асинхронной работы
    }
  }

  async doAsyncWork(item: THREE.Object3D<THREE.Object3DEventMap>) {
    return new Promise((resolve) => {
      this.scene.add(item);
      alert(item.name);

      setTimeout(() => {
        this.scene.remove(item);
        resolve(0);
      }, 1000);
    });
  }
}
