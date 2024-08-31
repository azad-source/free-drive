import * as THREE from "three";
import { GLTFLoader, GLTF, DRACOLoader } from "three/examples/jsm/Addons.js";

const gltfCar = new URL("../../assets/models/car/scene.gltf", import.meta.url);
const dracoLoaderUrl = new URL("../../libs/draco/", import.meta.url);

export class RedPickup {
  scene: THREE.Scene;
  model: GLTF["scene"];
  chasis: THREE.Mesh;
  wheels: THREE.Mesh[] = [];
  models: THREE.Object3D<THREE.Object3DEventMap>[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  async init(): Promise<RedPickup> {
    return new Promise((resolve) => {
      const gltfLoader = new GLTFLoader();

      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath(dracoLoaderUrl.href);
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
          this.model.getObjectByName("RFwheel_3") as THREE.Mesh,
          this.model.getObjectByName("LFwheel_1") as THREE.Mesh,
          this.model.getObjectByName("RRwheel_8") as THREE.Mesh,
          this.model.getObjectByName("LRwheel_6") as THREE.Mesh
        );

        this.wheels.forEach((w) => {
          // if (w?.material?.wireframe) {
          //   w.material.wireframe = true;
          // }

          this.scene.add(w);
        });

        this.chasis = this.model.getObjectByName("Object_30") as THREE.Mesh;
        // this.chasis.material.wireframe = true;
        this.scene.add(this.chasis);

        resolve(this);
      });

      gltfLoader.setDRACOLoader(dracoLoader);
    });
  }

  // async processItems() {
  //   for (const item of this.models) {
  //     await this.doAsyncWork(item); // Ожидание завершения асинхронной работы
  //   }
  // }

  // async doAsyncWork(item: THREE.Object3D<THREE.Object3DEventMap>) {
  //   return new Promise((resolve) => {
  //     this.scene.add(item);
  //     alert(item.name);

  //     setTimeout(() => {
  //       this.scene.remove(item);
  //       resolve(0);
  //     }, 1000);
  //   });
  // }
}
