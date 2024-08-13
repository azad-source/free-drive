import * as THREE from "three";
import * as CANNON from "cannon-es";
import { getScene } from "./components/scene";
import { PlayerCamera } from "./components/camera";
import { getRenderer } from "./components/renderer";
import { checkWebGlAvailability } from "./components/detectWebGL";
import cannonDebugger from "cannon-es-debugger";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { Car } from "./components/car";
import { Ground } from "./components/ground";
import { windowAutoResize } from "./components/windowResize";
import { Player } from "./components/player";
import { EntryForm } from "./components/form";
import { VehicleControls } from "./components/controls";
import { IGame } from "./models/user.models";
import geckos, { ClientChannel } from "@geckos.io/client";

export class Root {
  channel: ClientChannel;
  scene: THREE.Scene;
  playerCamera: PlayerCamera;
  renderer: THREE.WebGLRenderer;
  world: CANNON.World;
  ground: Ground;
  cars: Record<string, Car> = {};
  player?: Player;
  orbit: OrbitControls;
  debug: typeof cannonDebugger.prototype;

  constructor() {
    checkWebGlAvailability();
    this.init();
  }

  init() {
    this.scene = getScene();
    this.playerCamera = new PlayerCamera(this.scene);
    this.renderer = getRenderer();
    this.orbit = new OrbitControls(
      this.playerCamera.camera,
      this.renderer.domElement
    );
    this.orbit.update();
    this.initWorld();
    this.initWebSocket();

    new EntryForm(() => {
      if (this.player?.car) {
        this.player.car.setState({ ...this.player.car.state, isRemoved: true });
      }
    });
    this.player = new Player();

    if (this.player.isExist()) {
      this.initPlayerCar();
      windowAutoResize(this.playerCamera.camera, this.renderer);
    }
  }

  initWebSocket() {
    const host = "http://m-azad.ru";
    const localhost = "ws://localhost:8080";

    this.channel = geckos({ url: host, port: 8080 });

    this.channel.onConnect((error) => {
      if (error) {
        console.error(error.message);
        return;
      }

      this.channel.on("chat message", (data: IGame) => {
        delete data[this.player.id];

        for (const userId in data) {
          const state = data[userId];

          if (userId in this.cars) {
            this.cars[userId].setState(state);
          } else {
            const car = new Car(this.scene, this.world, state);
            this.cars[userId] = car;
          }
        }

        // this.clearUnusedData();
      });
    });
  }

  // clearUnusedData() {
  //   Object.keys(this.cars).forEach((key) => {
  //     if (!Object.keys(this.users).includes(key)) {
  //       const car = this.cars[key];
  //       car.removeCar();
  //       delete this.cars[key];
  //     }
  //   });
  // }

  sendGameState(gameState: any) {
    this.channel.emit("chat message", gameState);
  }

  initWorld() {
    this.world = new CANNON.World();
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.gravity.set(0, -10, 0);
    this.world.defaultContactMaterial.friction = 0;
    this.ground = new Ground(this.scene, this.world);
    this.debug = cannonDebugger(this.scene, this.world);
    this.animate();
  }

  initPlayerCar() {
    if (this.player) {
      this.player.defineCar(new Car(this.scene, this.world));
      if (this.player.car) {
        new VehicleControls(this.player.car.vehicle);
      }
    }
  }

  animate() {
    requestAnimationFrame(() => {
      this.animate();
    });
    this.updateFrame();
  }

  updateFrame() {
    this.world.step(1 / 60);

    for (const id in this.cars) {
      this.cars[id].updateFrame();
    }

    this.player?.car?.updateFrame();

    if (this.player?.car) {
      this.playerCamera.updateCamera(this.player.car);
      this.sendGameState(this.player.car.state);
    }

    // this.debug.update();

    this.renderer.render(this.scene, this.playerCamera.camera);
  }
}
