import * as THREE from "three";
import * as CANNON from "cannon-es";
import { getScene } from "./components/scene";
import { PlayerCamera } from "./components/camera";
import { getRenderer } from "./components/renderer";
import { checkWebGlAvailability } from "./components/detectWebGL";
import cannonDebugger from "cannon-es-debugger";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { Ground } from "./components/ground";
import { windowAutoResize } from "./components/windowResize";
import { Player } from "./components/player";
import { EntryForm } from "./components/form";
import { IGame, IGameState } from "./models/user.models";
import geckos, { ClientChannel } from "@geckos.io/client";
import { Users } from "components/users";
import pako from "pako";

const MSG = "msg";

export class Root {
  channel: ClientChannel;
  scene: THREE.Scene = getScene();
  playerCamera: PlayerCamera = new PlayerCamera(this.scene);
  renderer: THREE.WebGLRenderer = getRenderer();
  world: CANNON.World;
  ground: Ground;
  users: Users;
  player?: Player;
  orbit: OrbitControls = new OrbitControls(
    this.playerCamera.camera,
    this.renderer.domElement
  );
  debug: typeof cannonDebugger.prototype;

  constructor() {
    checkWebGlAvailability();
    this.init();
  }

  init() {
    this.orbit.update();
    this.initWorld();
    this.users = new Users(this.scene, this.world);
    this.initWebSocket();

    new EntryForm(() => {
      if (this.player?.car) {
        this.player.car.setState({ ...this.player.car.state, isRemoved: true });
      }
    });
    this.player = new Player(this.scene, this.world, this.playerCamera);

    if (this.player.isExist()) {
      this.player.initCar();
      windowAutoResize(this.playerCamera.camera, this.renderer);
    }
  }

  initWebSocket() {
    this.channel = geckos({ port: 9208 });

    this.channel.onConnect((error) => {
      if (error) {
        console.error(error.message);
        return;
      }

      this.channel.on(MSG, (unit8Array: Uint8Array) => {
        const data: IGame = JSON.parse(
          pako.ungzip(unit8Array, { to: "string" })
        );
        this.users.update(data, this.player);
      });
    });
  }

  sendGameState(gameState: IGameState) {
    const unit8Array: Uint8Array = pako.gzip(JSON.stringify(gameState));
    this.channel.emit(MSG, unit8Array);
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

  animate() {
    requestAnimationFrame(() => {
      this.animate();
    });
    this.updateFrame();
  }

  updateFrame() {
    this.world.step(1 / 60);
    this.users?.updateFrame();
    this.player?.updateFrame();

    if (this.player?.car) {
      this.sendGameState(this.player.car.state);
    }

    // this.debug.update();

    this.renderer.render(this.scene, this.playerCamera.camera);
  }
}
