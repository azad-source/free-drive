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
import { IGameState } from "./models/user.models";

export class Root {
  ws: WebSocket;
  scene: THREE.Scene;
  playerCamera: PlayerCamera;
  renderer: THREE.WebGLRenderer;
  world: CANNON.World;
  ground: Ground;
  cars: Car[] = [];
  users: IGameState[] = [];
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

    new EntryForm((userId: string) => {
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
    const host = import.meta.env.VITE_WEB_SOCKET_HOST;

    this.ws = new WebSocket("ws://m-azad.ru:8080");

    this.ws.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    this.ws.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      this.users = data;

      const userIds = this.users.map((i) => i.id);
      const carsIds = this.cars.map((i) => i.state.id);

      this.users.forEach((state) => {
        if (state.id) {
          const carIndex = carsIds.findIndex((c) => c === state.id);

          if (carIndex !== -1) {
            this.cars[carIndex].setState(state);
          } else {
            const car = new Car(this.scene, this.world, state);
            this.cars.push(car);
          }
        }
      });

      const removedCarIndex = this.cars.findIndex(
        (c) => !userIds.includes(c.state.id)
      );

      if (removedCarIndex !== -1) {
        const car = this.cars[removedCarIndex];
        car.removeCar();
        this.cars.splice(removedCarIndex, 1);
      }
    };

    this.ws.onclose = () => {
      console.log("Disconnected from WebSocket server");
    };
  }

  sendGameState(gameState: any) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(gameState));
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

    this.cars.forEach((car) => {
      car.updateFrame();
    });

    this.player?.car?.updateFrame();

    if (this.player?.car) {
      this.playerCamera.updateCamera(this.player.car);
      this.sendGameState(this.player.car.state);
    }

    // this.debug.update();

    this.renderer.render(this.scene, this.playerCamera.camera);
  }
}
