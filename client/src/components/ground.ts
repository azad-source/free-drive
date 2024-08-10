import * as THREE from "three";
import * as CANNON from "cannon-es";
import { groundOptions } from "../config/ground.config";

export class Ground {
  scene: THREE.Scene;
  world: CANNON.World;
  groundMesh: THREE.Mesh;
  groundBody: CANNON.Body;
  sizeX: number = 64;
  sizeZ: number = 64;

  constructor(scene: THREE.Scene, world: CANNON.World) {
    this.scene = scene;
    this.world = world;

    this.addPlaneGround();
  }

  addPlaneGround() {
    const { sizeX, sizeZ } = this;

    const groundMeshMaterial = new THREE.MeshStandardMaterial({
      color: "red",
      side: THREE.DoubleSide,
    });

    this.groundMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(sizeX, sizeZ),
      groundMeshMaterial
    );
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.scene.add(this.groundMesh);

    const groundShape = new CANNON.Plane();
    this.groundBody = new CANNON.Body({
      mass: 0,
      material: groundOptions.material,
    });
    this.groundBody.addShape(groundShape);
    this.groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(this.groundBody);
  }

  addCurvedGround() {
    const { sizeX, sizeZ } = this;
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

    const groundMeshMaterial = new THREE.MeshStandardMaterial({
      color: "red",
      side: THREE.DoubleSide,
    });

    this.groundMesh = new THREE.Mesh(
      new THREE.BufferGeometry(),
      groundMeshMaterial
    );
    this.groundMesh.rotation.x = -Math.PI / 2; // Rotate to align with CANNON
    this.groundMesh.position.set(0, -1, 0); // Set position to match CANNON's position
    this.scene.add(this.groundMesh);

    const heightfieldShape = new CANNON.Heightfield(matrix, {
      elementSize: 100 / sizeX,
    });
    this.groundBody = new CANNON.Body({
      mass: 0,
      material: groundOptions.material,
    });
    this.groundBody.addShape(heightfieldShape);
    this.groundBody.position.set(
      -(sizeX * heightfieldShape.elementSize) / 2,
      -1,
      (sizeZ * heightfieldShape.elementSize) / 2
    );
    this.groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(this.groundBody);
  }
}
