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

export class Root {
  ws: WebSocket;
  scene: THREE.Scene;
  playerCamera: PlayerCamera;
  renderer: THREE.WebGLRenderer;
  world: CANNON.World;
  ground: Ground;
  cars: Car[] = [];
  player: Player;
  orbit: OrbitControls;
  debug: typeof cannonDebugger.prototype;

  constructor() {
    checkWebGlAvailability();
    this.init();
  }

  init() {
    new EntryForm();

    this.player = new Player();

    if (this.player.isExist()) {
      this.initWebSocket();
      this.scene = getScene();
      this.playerCamera = new PlayerCamera(this.scene);
      this.renderer = getRenderer();
      this.orbit = new OrbitControls(
        this.playerCamera.camera,
        this.renderer.domElement
      );
      this.orbit.update();
      this.initPhysics();
      windowAutoResize(this.playerCamera.camera, this.renderer);
    }
  }

  initWebSocket() {
    this.ws = new WebSocket("ws://localhost:8080");

    this.ws.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    this.ws.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      console.log("Received data:", data);
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

  initPhysics() {
    this.world = new CANNON.World();
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.gravity.set(0, -10, 0);
    this.world.defaultContactMaterial.friction = 0;
    this.ground = new Ground(this.scene, this.world);
    this.cars.push(new Car(this.scene, this.world));
    this.cars.push(
      new Car(this.scene, this.world, { id: "", x: 5, y: 4, z: 0 })
    );
    new VehicleControls(this.cars[0].vehicle);

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

    this.cars.forEach((car) => {
      car.updateFrame();
    });

    this.playerCamera.updateCamera(this.cars[0]);

    this.debug.update();

    this.renderer.render(this.scene, this.playerCamera.camera);

    // TODO:
    // this.sendGameState("asd");
  }
}
