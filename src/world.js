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
    this.sound.stop();
    this.listener.setMasterVolume(0);
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

    const listener = new THREE.AudioListener();
    this._camera.add(listener);
    this.listener = listener;
    const sound = new THREE.Audio(listener);
    this.sound = sound;
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load("../assets/sounds/bgm.mp3", function (buffer) {
      sound.setBuffer(buffer);
      sound.setLoop(true);
      sound.setVolume(0.1);
      sound.play();
    });
    this.play = true;

    let audiotoggle = document.getElementById("mute-button");
    audiotoggle.addEventListener("click", (event) => {
      audiotoggle.blur();
      this.play = !this.play;
      if (this.play) {
        sound.setVolume(0.1);
        audiotoggle.style.setProperty("text-decoration", "");
      } else {
        sound.setVolume(0);
        audiotoggle.style.setProperty("text-decoration", "line-through");
      }
    });

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
    this._previousRAF = null;

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
      start: { x: 0, y: 10, z: 0 },
      // start: { x: -20, y: 200, z: 620 }, //Level 1 end
      // start: { x: -580, y: 820, z: 200 }, //Level 2 end
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

  AddFixedCylinder(size, location, color, texture, rotation) {
    const R = new THREE.Quaternion().setFromEuler(rotation);
    const cylinder = { radius: size.radius, height: size.height };
    let bodydesc = RAPIER.RigidBodyDesc.fixed()
      .setTranslation(location.x, location.y, location.z)
      .setRotation({ w: R.w, x: R.x, y: R.y, z: R.z });
    let cylinderBody = this.world.createRigidBody(bodydesc);
    let cylinderCollider = RAPIER.ColliderDesc.cylinder(
      size.height,
      size.radius
    );
    this.world.createCollider(cylinderCollider, cylinderBody);
    let box;
    if (texture) {
      box = new THREE.Mesh(
        new THREE.CylinderGeometry(size.radius, size.radius, size.height * 2),
        new THREE.MeshPhongMaterial({ map: texture })
      );
    } else {
      box = new THREE.Mesh(
        new THREE.CylinderGeometry(size.radius, size.radius, size.height),
        new THREE.MeshPhongMaterial({ color: color })
      );
    }

    box.receiveShadow = true;
    // box.castShadow = true;
    this._scene.add(box);

    this.bodys.push({ rigid: cylinderBody, mesh: box });
    this.AlignBodys();
  }

  AddNonFixedCube(size, location, color, texture, rotation) {
    const R = new THREE.Quaternion().setFromEuler(rotation);
    const cube1 = { x: size.x, y: size.y, z: size.z };
    let bodydesc = RAPIER.RigidBodyDesc.dynamic()
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
    // box.castShadow = true;
    this._scene.add(box);

    this.bodys.push({ rigid: cubebody, mesh: box });
    this.AlignBodys();
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
    // box.castShadow = true;
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
    this.wood = wood;
    const rotation = new THREE.Euler(0, 0, 0);

    this.AddFixedCube(
      { x: 50.0, y: 0.1, z: 350 },
      { x: 0, y: 0, z: 320 },
      0,
      wood,
      rotation
    );

    for (let i = 0; i < 5; i++) {
      this.AddFixedCube(
        { x: 15, y: 1, z: 8 },
        { x: 25, y: 15 + i * 25, z: i * 15 },
        0x1000fa,
        wood,
        new THREE.Euler(0, 0, 0)
      );
    }

    for (let i = 0; i < 5; i++) {
      this.AddFixedCube(
        { x: 15, y: 1, z: 8 },
        { x: -25, y: 30 + i * 25, z: 10 + i * 15 },
        0x1000fa,
        wood,
        new THREE.Euler(0, 0, 0)
      );
    }

    this.AddFixedCube(
      { x: 25, y: 1, z: 30 },
      { x: -15, y: 50, z: 165 },
      0x1000fa,
      wood,
      new THREE.Euler(0, 0, 0)
    );

    for (let i = 0; i < 5; i++) {
      this.AddFixedCylinder(
        { radius: 10, height: 1 },
        { x: -15, y: 50, z: 225 + i * 80 },
        0x1000fa,
        wood,
        new THREE.Euler(0, 0, 0.7)
      );
    }

    for (let i = 0; i < 5; i++) {
      this.AddFixedCylinder(
        { radius: 10, height: 1 },
        { x: -35, y: 50, z: 265 + i * 80 },
        0x1000fa,
        wood,
        new THREE.Euler(0, 0, -0.7)
      );
    }

    this.AddFixedCube(
      { x: 25, y: 1, z: 25 },
      { x: -20, y: 60, z: 615 },
      0x1000fa,
      wood,
      new THREE.Euler(0, 0, 0)
    );

    this.level1end = {
      x: -20,
      y: 60,
      z: 615,
    };
  }
  LoadLevel2() {
    let gravity = new RAPIER.Vector3(0.0, -9.81, 0.0);
    this.world = new RAPIER.World(gravity);
    this.bodys = [];
    const loader = new THREE.TextureLoader();
    const brick = loader.load("../assets/textures/brick.jpg");
    this.brick = brick;
    const rotation = new THREE.Euler(0, 0, 0);

    this.AddFixedCube(
      { x: 350.0, y: 0.1, z: 350 },
      { x: 0, y: 0, z: 0 },
      0xafafaf,
      brick,
      rotation
    );

    for (let i = 0; i < 6; i++) {
      this.AddFixedCylinder(
        { radius: 3, height: 5 },
        { x: 20 + i * 20, y: 20 + i * 20, z: 40 },
        0x1000fa,
        brick,
        new THREE.Euler(Math.PI / 2, 0, 0)
      );
    }

    for (let i = 0; i < 5; i++) {
      this.AddFixedCylinder(
        { radius: 6, height: 1 },
        { x: 100 + i * 20, y: 120 + i * 10, z: 60 + i * 20 },
        0x1000fa,
        brick,
        new THREE.Euler(0, 0, 0)
      );
    }

    this.AddFixedCube(
      { x: 25, y: 1, z: 25 },
      { x: 180, y: 160, z: 200 },
      0x1000fa,
      brick,
      new THREE.Euler(0, 0, 0)
    );
    for (let i = 1; i < 20; i++) {
      this.AddFixedCube(
        { x: 25, y: 1, z: 25 },
        { x: 180 - i * 40, y: 160 + i * 20, z: 200 + getRandomInt(-4, 4) * 10 },

        0x1000fa,
        brick,
        new THREE.Euler(0, 0, 0)
      );
    }

    this.AddFixedCylinder(
      { radius: 50, height: 1 },
      { x: -620, y: 400, z: 200 },
      0x1000fa,
      brick,
      new THREE.Euler(0, 0, 0)
    );
    this.level2end = {
      x: -620,
      y: 400,
      z: 200,
    };
  }

  LevelOneEnd() {
      this.AddNonFixedCube(
        { x: 1, y: 1, z: 1 },
        { x: this.level1end.x, y: this.level1end.y + 50, z: this.level1end.z },
        0x1000fa,
        this.wood,
        new THREE.Euler(0, 0, 0)
      );
  }
  LevelTwoEnd() {
      this.AddNonFixedCube(
        { x: 1, y: 1, z: 1 },
        { x: this.level2end.x, y: this.level2end.y + 30, z: this.level2end.z },
        0x1000fa,
        this.brick,
        new THREE.Euler(0, 0, 0)
      );
  }

  CheckEnd() {
    // if (this.ended) {
    //   return;
    // }
    const pos = this._controls.Position;
    if (
      this.level == 1 &&
      pos.x < this.level1end.x + 5 &&
      pos.x > this.level1end.x - 5 &&
      pos.y > this.level1end.y - 5 &&
      pos.y > this.level1end.y - 5 &&
      pos.z > this.level1end.z - 5 &&
      pos.z > this.level1end.z - 5
    ) {
      this.ended = true;
      this.LevelOneEnd();
    } else if (
      this.level == 2 &&
      pos.x < this.level2end.x + 25 &&
      pos.x > this.level2end.x - 25 &&
      pos.y > this.level2end.y - 5 &&
      pos.y > this.level2end.y - 5 &&
      pos.z > this.level2end.z - 25 &&
      pos.z > this.level2end.z - 25
    ) {
      this.ended = true;
      this.LevelTwoEnd();
    }
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }
  _RequestAnimationFrame() {
    requestAnimationFrame((t) => {
      if (this._previousRAF === null) {
        this._previousRAF = t;
      }
      this._RequestAnimationFrame();

      this._threejs.render(this._scene, this._camera);
      this._Step(t - this._previousRAF);
      this._previousRAF = t;
    });
  }

  _Step(timeElapsed) {
    const timeElapsedSeconds = timeElapsed * 0.001;
    this.world.step();
    this.AlignBodys();

    if (this._mixers) {
      this._mixers.map((m) => m.update(timeElapsedSeconds));
    }

    if (this._controls) {
      this._controls.Update(timeElapsedSeconds);
      this.CheckEnd();
    }

    if (this._thirdPersonCamera) {
      this._thirdPersonCamera.Update(timeElapsedSeconds);
    }
  }
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
