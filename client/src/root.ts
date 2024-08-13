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

export class Root {
  ws: WebSocket;
  scene: THREE.Scene;
  playerCamera: PlayerCamera;
  renderer: THREE.WebGLRenderer;
  world: CANNON.World;
  ground: Ground;
  cars: Record<string, Car> = {};
  users: IGame;
  player?: Player;
  orbit: OrbitControls;
  debug: typeof cannonDebugger.prototype;
  lastSentTime = Date.now();
  sendInterval = 50;

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
    const host = "ws://m-azad.ru:8080";
    const localhost = "ws://localhost:8080";

    this.ws = new WebSocket(host);

    this.ws.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    this.ws.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      this.users = data;

      console.log("=== data", data);

      for (const userId in this.users) {
        const state = this.users[userId];

        if (userId in this.cars) {
          this.cars[userId].setState(state);
        } else {
          const car = new Car(this.scene, this.world, state);
          this.cars[userId] = car;
        }
      }

      this.clearUnusedData();
    };

    this.ws.onclose = () => {
      console.log("Disconnected from WebSocket server");
    };
  }

  clearUnusedData() {
    Object.keys(this.cars).forEach((key) => {
      if (!Object.keys(this.users).includes(key)) {
        const car = this.cars[key];
        car.removeCar();
        delete this.cars[key];
      }
    });
  }

  sendGameState(gameState: any) {
    const currentTime = Date.now();

    if (currentTime - this.lastSentTime > this.sendInterval) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(gameState));
      }
      this.lastSentTime = currentTime;
    }
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

    for (const car in this.cars) {
      this.cars[car].updateFrame();
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
