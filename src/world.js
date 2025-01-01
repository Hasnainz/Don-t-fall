import * as THREE from "three";
import { CharacterController } from "./character";
import { ThirdPersonCamera } from "./camera";
import RAPIER from "https://cdn.skypack.dev/@dimforge/rapier3d-compat";

export class World {
  constructor(level) {
    this.level = level;
    RAPIER.init().then(() => {
      this._Initialize(RAPIER);
    });
  }
  Cleanup() {
    this._threejs.domElement.remove();
  }

  _Initialize(RAPIER) {
    this._threejs = new THREE.WebGLRenderer();
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this._threejs.domElement);

    window.addEventListener(
      "resize",
      () => {
        this._OnWindowResize();
      },
      false
    );

    const fov = 70;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(75, 1, 0);

    this._scene = new THREE.Scene();

    //Background
    const loader = new THREE.CubeTextureLoader();
    const background_texture = loader.load([
      "../assets/background/right.jpg", //right
      "../assets/background/left.jpg", //left
      "../assets/background/top.jpg", //top
      "../assets/background/bottom.jpg", //Bottom
      "../assets/background/front.jpg", //front
      "../assets/background/back.jpg", //back
    ]);
    this._scene.background = background_texture;

    if (this.level == 1) {
      this.LoadLevel1();
    } else if (this.level == 2) {
      this.LoadLevel2();
    }

    this._mixers = [];
    this._previousRAF = 0;

    this._LoadAnimatedModel(RAPIER);

    let light = new THREE.DirectionalLight(0xffffff, 1.0);
    light.position.set(200, 100, -200);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 2048;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.left = 100;
    light.shadow.camera.right = -100;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = -100;
    this._scene.add(light);
    this._scene.add(light.target);

    light = new THREE.HemisphereLight(0xffff80, 0x4040ff, 0.2);
    this._scene.add(light);

    light = new THREE.AmbientLight(0xffffff, 0.1);
    this._scene.add(light);

    this._RequestAnimationFrame();
  }

  _LoadAnimatedModel(RAPIER) {
    const params = {
      camera: this._camera,
      scene: this._scene,
      RAPIER: RAPIER,
      world: this.world,
      start: { x: -670, y: 755, z: 905 },
    };
    this._controls = new CharacterController(params);

    this._thirdPersonCamera = new ThirdPersonCamera({
      camera: this._camera,
      target: this._controls,
    });
  }

  AlignBodys() {
    this.bodys.forEach((body) => {
      let position = body.rigid.translation();
      let rotation = body.rigid.rotation();
      body.mesh.position.x = position.x;
      body.mesh.position.y = position.y;
      body.mesh.position.z = position.z;

      body.mesh.setRotationFromQuaternion(
        new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w)
      );
    });
  }

  AddFixedCube(size, location, color, texture, rotation) {
    const R = new THREE.Quaternion().setFromEuler(rotation);
    const cube1 = { x: size.x, y: size.y, z: size.z };
    let bodydesc = RAPIER.RigidBodyDesc.fixed()
      .setTranslation(location.x, location.y, location.z)
      .setRotation({ w: R.w, x: R.x, y: R.y, z: R.z });
    let cubebody = this.world.createRigidBody(bodydesc);
    let cubecollider = RAPIER.ColliderDesc.cuboid(cube1.x, cube1.y, cube1.z);
    this.world.createCollider(cubecollider, cubebody);
    let box;
    if (texture) {
      box = new THREE.Mesh(
        new THREE.BoxGeometry(cube1.x * 2, cube1.y * 2, cube1.z * 2),
        new THREE.MeshPhongMaterial({ map: texture })
      );
    } else {
      box = new THREE.Mesh(
        new THREE.BoxGeometry(cube1.x * 2, cube1.y * 2, cube1.z * 2),
        new THREE.MeshPhongMaterial({ color: color })
      );
    }

    box.receiveShadow = true;
    box.castShadow = true;
    this._scene.add(box);

    this.bodys.push({ rigid: cubebody, mesh: box });
    this.AlignBodys();
  }
  LoadLevel1() {
    let gravity = new RAPIER.Vector3(0.0, -9.81, 0.0);
    this.world = new RAPIER.World(gravity);
    this.bodys = [];
    const loader = new THREE.TextureLoader();
    const wood = loader.load("../assets/textures/wood.jpg");
    const rotation = new THREE.Euler(0, 0, 0);

    this.AddFixedCube(
      { x: 50.0, y: 0.1, z: 350 },
      { x: 0, y: 0, z: 320 },
      0,
      wood,
      rotation
    );

    for (let i = 0; i < 19; i++) {
      this.AddFixedCube(
        { x: 15, y: 1, z: 8 },
        { x: 45 + i * 15, y: 15 + i * 10, z: 15 + i * 30 },
        0x1000fa,
        wood,
        new THREE.Euler(0, 1.4 - 0.4 * i, 0)
      );
    }
    this.AddFixedCube(
      { x: 25, y: 1, z: 30 },
      { x: 345, y: 215, z: 615 },
      0x1000fa,
      wood,
      new THREE.Euler(0, 0, 0)
    );

    for (let i = 1; i < 30; i++) {
      this.AddFixedCube(
        { x: 8, y: 1, z: 20 },
        { x: 345 - i * 35, y: 215 + i * 15, z: 615 + i * 10 },
        0x1000fa,
        wood,
        new THREE.Euler(0, 1.4 - 0.2 * i, 0)
      );
    }

    this.AddFixedCube(
      { x: 30, y: 1, z: 30 },
      { x: -705, y: 155, z: 915 },
      0x1000fa,
      wood,
      new THREE.Euler(0, 0, 0)
    );

    // this.AddFixedCube(
    //   { x: 15, y: 1, z: 8 },
    //   { x: 65, y: 30, z: 25 },
    //   0x1000fa,
    //   wood,
    //   new THREE.Euler(0, 1.2, 0)
    // );
  }
  LoadLevel2() {
    let gravity = new RAPIER.Vector3(0.0, -9.81, 0.0);
    this.world = new RAPIER.World(gravity);
    this.bodys = [];
    const loader = new THREE.TextureLoader();
    const brick = loader.load("../assets/textures/brick.jpg");
    const rotation = new THREE.Euler(0, 0, 0);

    this.AddFixedCube(
      { x: 350.0, y: 0.1, z: 350 },
      { x: 0, y: 0, z: 0 },
      0xafafaf,
      brick,
      rotation
    );
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }
  _RequestAnimationFrame() {
    requestAnimationFrame((t) => {
      this._RequestAnimationFrame();
      this._threejs.render(this._scene, this._camera);
      this._Step(t - this._previousRAF);
      this._previousRAF = t;
    });
  }

  _Step(timeElapsed) {
    const timeElapsedSeconds = timeElapsed * 0.001;
    this.world.step();

    if (this._mixers) {
      this._mixers.map((m) => m.update(timeElapsedSeconds));
    }

    if (this._controls) {
      this._controls.Update(timeElapsedSeconds);
    }

    if (this._thirdPersonCamera) {
      this._thirdPersonCamera.Update(timeElapsedSeconds);
    }
  }
}
