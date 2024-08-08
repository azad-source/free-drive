import * as THREE from "three";
import * as THREE_S from "three/examples/jsm/curves/NURBSSurface.js";
import * as CANNON from "cannon-es";
import { getScene } from "./components/scene";
import { defaultCameraPosition, getCamera } from "./components/camera";
import { getRenderer } from "./components/renderer";
import { checkWebGlAvailability } from "./components/detectWebGL";
import cannonDebugger from "cannon-es-debugger";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import {
  defaultVehicleOptions,
  defaultWheelOptions,
  mass,
} from "./config/vehicle.config";
import { VehicleControls } from "./components/controls";

export class Root {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  physics = {};
  world: CANNON.World;
  groundMesh: THREE.Mesh;
  groundBody: CANNON.Body;
  followCam: THREE.Object3D;
  vehicle: CANNON.RaycastVehicle;
  debug: { update: () => void };
  orbit: OrbitControls;
  chassisMesh: THREE.Mesh;
  chassisBody: CANNON.Body;
  wheelMeshes: THREE.Mesh[] = [];
  wheelBodies: CANNON.Body[] = [];
  wheelMaterial = new CANNON.Material("wheelMaterial");

  constructor() {
    checkWebGlAvailability();

    window.addEventListener(
      "resize",
      () => {
        this.onWindowResize();
      },
      false
    );
    this.init();
  }

  init() {
    this.scene = getScene();
    this.camera = getCamera();
    this.renderer = getRenderer();

    this.orbit = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbit.update();

    this.initPhysics();
    this.addShapes();
  }

  addShapes() {
    const chassisGeometry = new THREE.BoxGeometry(2, 1, 4);
    const chassisMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    this.chassisMesh = new THREE.Mesh(chassisGeometry, chassisMaterial);
    this.scene.add(this.chassisMesh);
  }

  addGround() {
    // Add the ground
    const sizeX = 64;
    const sizeZ = 64;
    const matrix: number[][] = [];

    for (let i = 0; i < sizeX; i++) {
      matrix.push([]);
      for (let j = 0; j < sizeZ; j++) {
        if (i === 0 || i === sizeX - 1 || j === 0 || j === sizeZ - 1) {
          const height = 3;
          matrix[i].push(height);
          continue;
        }

        const height =
          Math.cos((i / sizeX) * Math.PI * 5) *
            Math.cos((j / sizeZ) * Math.PI * 5) *
            2 +
          2;
        matrix[i].push(height);
      }
    }

    const controlPoints: THREE.Vector4[][] = [];
    for (let i = 0; i < sizeX; i++) {
      const row: THREE.Vector4[] = [];
      for (let j = 0; j < sizeZ; j++) {
        row.push(new THREE.Vector4(i, matrix[i][j], j, 1)); // Use homogeneous coordinates
      }
      controlPoints.push(row);
    }

    const uKnots = [0, 0, 0, 1, 1, 1]; // Example: uniform knots for degree 2
    const vKnots = [0, 0, 0, 1, 1, 1]; // Example: uniform knots for degree 2

    // Create the NURBS surface
    const nurbsSurface = new THREE_S.NURBSSurface(
      2,
      2,
      uKnots,
      vKnots,
      controlPoints
    );

    const geometry = new THREE.BufferGeometry();

    const groundMeshMaterial = new THREE.MeshStandardMaterial({
      color: "red",
      side: THREE.DoubleSide,
    });

    this.groundMesh = new THREE.Mesh(geometry, groundMeshMaterial);
    this.groundMesh.rotation.x = -Math.PI / 2; // Rotate to align with CANNON
    this.groundMesh.position.set(0, -1, 0); // Set position to match CANNON's position
    this.scene.add(this.groundMesh);

    const groundMaterial = new CANNON.Material("groundMaterial");
    const heightfieldShape = new CANNON.Heightfield(matrix, {
      elementSize: 100 / sizeX,
    });
    this.groundBody = new CANNON.Body({ mass: 0, material: groundMaterial });
    this.groundBody.addShape(heightfieldShape);
    this.groundBody.position.set(
      // -((sizeX - 1) * heightfieldShape.elementSize) / 2,
      -(sizeX * heightfieldShape.elementSize) / 2,
      -1,
      // ((sizeZ - 1) * heightfieldShape.elementSize) / 2
      (sizeZ * heightfieldShape.elementSize) / 2
    );
    this.groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(this.groundBody);

    const wheelGroundContactMaterial = new CANNON.ContactMaterial(
      this.wheelMaterial,
      groundMaterial,
      { friction: 0.3, restitution: 0, contactEquationStiffness: 1000 }
    );
    this.world.addContactMaterial(wheelGroundContactMaterial);
  }

  initPhysics() {
    this.world = new CANNON.World();
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.gravity.set(0, -10, 0);
    this.world.defaultContactMaterial.friction = 0;
    this.addGround();

    this.chassisBody = new CANNON.Body({
      shape: new CANNON.Box(new CANNON.Vec3(1, 0.5, 0.5)),
      mass: mass.vehicle,
      position: new CANNON.Vec3(0, 4, 0),
      linearDamping: 0.1,
      angularDamping: 0.1,
      // type: CANNON.BODY_TYPES.DYNAMIC,
      // angularVelocity: new CANNON.Vec3(0, 0.5, 0),
    });

    this.followCam = new THREE.Object3D();
    this.followCam.position.copy(this.camera.position);
    this.scene.add(this.followCam);

    const wheelPosition: Record<number, number[]> = {
      0: [1, 0, 1], // Переднее правое колесо
      1: [-1, 0, 1], // Переднее левое колесо
      2: [1, 0, -1], // Заднее правое колесо
      3: [-1, 0, -1], // Заднее левое колесо
    };

    const wheelOptions = (index: number): CANNON.WheelInfoOptions => ({
      ...defaultWheelOptions,
      chassisConnectionPointLocal: new CANNON.Vec3(...wheelPosition[index]),
      isFrontWheel: index === 0 || index === 1,
    });

    this.vehicle = new CANNON.RaycastVehicle({
      ...defaultVehicleOptions,
      chassisBody: this.chassisBody,
    });

    // Add wheels to the vehicle
    this.vehicle.addWheel(wheelOptions(0)); // Front right wheel
    this.vehicle.addWheel(wheelOptions(1)); // Front left wheel
    this.vehicle.addWheel(wheelOptions(2)); // Rear right wheel
    this.vehicle.addWheel(wheelOptions(3)); // Rear left wheel

    this.vehicle.addToWorld(this.world);
    new VehicleControls(this.vehicle);
    this.world.addBody(this.chassisBody);

    const wheelSegmentCount = 20;

    this.vehicle.wheelInfos.forEach((wheel, index) => {
      const wheelMeshGeometry = new THREE.CylinderGeometry(
        wheel.radius,
        wheel.radius,
        wheel.radius / 1,
        wheelSegmentCount
      );
      const wheelMeshMaterial = new THREE.MeshStandardMaterial({
        color: 0x0000ff,
      });
      const wheelMesh = new THREE.Mesh(wheelMeshGeometry, wheelMeshMaterial);
      wheelMesh.position.copy(new THREE.Vector3(...wheelPosition[index]));
      wheelMesh.quaternion.copy(
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0))
      );

      this.wheelMeshes.push(wheelMesh);
      this.scene.add(wheelMesh);

      const wheelShape = new CANNON.Cylinder(
        wheel.radius,
        wheel.radius,
        wheel.radius / 2,
        wheelSegmentCount
      );
      const wheelBody = new CANNON.Body({
        mass: mass.wheel,
        material: this.wheelMaterial,
        // position: new CANNON.Vec3(...wheelPosition[index]),
        quaternion: new CANNON.Quaternion().setFromEuler(0, 0, -Math.PI / 2),
        type: CANNON.Body.KINEMATIC,
        collisionFilterGroup: 0,
      });

      wheelBody.position.x = wheelMesh.position.x;
      wheelBody.position.y = wheelMesh.position.y;
      wheelBody.position.z = wheelMesh.position.z;

      const quaternion = new CANNON.Quaternion().setFromEuler(
        0,
        0,
        -Math.PI / 2
      );
      wheelBody.addShape(wheelShape, new CANNON.Vec3(), quaternion);
      this.wheelBodies.push(wheelBody);
      this.world.addBody(wheelBody);

      // Update the wheel bodies
      this.world.addEventListener("postStep", () => {
        for (let i = 0; i < this.vehicle.wheelInfos.length; i++) {
          this.vehicle.updateWheelTransform(i);
          const transform = this.vehicle.wheelInfos[i].worldTransform;
          const wheelBody = this.wheelBodies[i];
          wheelBody.position.copy(transform.position);
          wheelBody.quaternion.copy(transform.quaternion);
        }
      });
    });

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

    this.chassisMesh?.position.copy(this.chassisBody.position);
    this.chassisMesh?.quaternion.copy(this.chassisBody.quaternion);

    for (let i = 0; i < this.vehicle.wheelInfos.length; i++) {
      const wheelBody = this.wheelBodies[i];
      const wheelMesh = this.wheelMeshes[i];
      const wheelInfo = this.vehicle.wheelInfos[i];

      // wheelMesh.position.copy(wheelBody.position);
      // wheelMesh.quaternion.copy(wheelBody.quaternion);

      // this.vehicle.updateWheelTransform(i);
      // const transform = wheelInfo.worldTransform;
      // wheelMesh.position.copy(transform.position);
      // wheelMesh.quaternion.copy(transform.quaternion);
      // wheelBody.position.copy(transform.position);
      // wheelBody.quaternion.copy(transform.quaternion);
      wheelMesh.position.copy(wheelBody.position);
      wheelMesh.quaternion.copy(wheelBody.quaternion);
      wheelMesh.rotateZ(Math.PI / 2);
    }

    this.updateCamera();

    this.debug.update();
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  updateCamera() {
    this.camera.position.lerp(
      this.followCam.getWorldPosition(new THREE.Vector3()),
      0.05
    );

    if (this.chassisMesh) {
      const targetPosition = this.chassisMesh.position;

      const angle = 0;
      const distance = 0;
      const height = 0;

      const targetX = targetPosition.x + distance * Math.cos(angle);
      const targetY = targetPosition.y + height;
      const targetZ = targetPosition.z + distance * Math.sin(angle);

      this.camera.lookAt(this.chassisMesh.position);
      const { x, y, z } = defaultCameraPosition;
      this.camera.position.set(x + targetX, y + targetY, z + targetZ);
    }

    // if (this.helper.sun != undefined) {
    //   this.helper.sun.position.copy(this.camera.position);
    //   this.helper.sun.position.y += 10;
    // }
  }
}
