import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/Addons.js";
import { CharacterControllerInput } from "./input";
import { CharacterStateMachine } from "./statemachine";
import { Physics } from "./physics";
import { ThirdPersonCamera } from "./camera";

export class CharacterController {
  constructor(params) {
    this._Initialize(params);
  }
  _Initialize(params) {
    this.loaded = false;
    this._params = params;
    this._decceleration = new THREE.Vector3(-5.0, -0.8, -5.0);
    this._acceleration = new THREE.Vector3(0.4, 0.5, 0.5);
    this._velocity = new THREE.Vector3(0, 0, 0);

    this._animations = {};
    this._input = new CharacterControllerInput();
    this._stateMachine = new CharacterStateMachine(this._animations);
    this._collisions = new Physics();
    this._jump = false;
    this.RAPIER = params.RAPIER;
    this.world = params.world;
    this.scene = params.scene;

    this._LoadModels();
  }

  _LoadModels() {
    const loader = new FBXLoader();
    loader.setPath("../assets/character/");
    loader.load("bluegoblin.fbx", (fbx) => {
      fbx.scale.setScalar(0.1);
      fbx.traverse((c) => {
        c.castShadow = true;
      });

      this._target = fbx;
      this.scene.add(this._target);

      this._mixer = new THREE.AnimationMixer(this._target);

      this._manager = new THREE.LoadingManager();
      this._manager.onLoad = () => {
        this._stateMachine.SetState("idle");
        this.loaded = true;
      };

      const _OnLoad = (animName, anim) => {
        const clip = anim.animations[0];
        const action = this._mixer.clipAction(clip);

        this._animations[animName] = {
          clip: clip,
          action: action,
        };
      };

      const loader = new FBXLoader(this._manager);
      loader.setPath("../assets/animations/");
      loader.load("breathingidle.fbx", (a) => {
        _OnLoad("idle", a);
      });
      loader.load("running.fbx", (a) => {
        _OnLoad("run", a);
      });
      loader.load("walking.fbx", (a) => {
        _OnLoad("walk", a);
      });
      loader.load("hiphopdancing.fbx", (a) => {
        _OnLoad("dance", a);
      });
      loader.load("jump.fbx", (a) => {
        _OnLoad("jump", a);
      });
      loader.load("walkingbackwards.fbx", (a) => {
        _OnLoad("walkback", a);
      });
    });
    let characterDesc =
      this.RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
        this._params.start.x,
        this._params.start.y,
        this._params.start.z
      );
    this.character = this.world.createRigidBody(characterDesc);
    let characterColliderDesc = this.RAPIER.ColliderDesc.cylinder(7.5, 1.5);
    this.characterCollider = this.world.createCollider(
      characterColliderDesc,
      this.character
    );

    this.characterController = this.world.createCharacterController(0.1);
    // Don’t allow climbing slopes larger than 45 degrees.
    this.characterController.setMaxSlopeClimbAngle((45 * Math.PI) / 180);
    // Automatically slide down on slopes smaller than 30 degrees.
    this.characterController.setMinSlopeSlideAngle((10 * Math.PI) / 180);
    // this.characterCylinder = new THREE.Mesh(
    //   new THREE.CylinderGeometry(1.5, 1.5, 15),
    //   new THREE.MeshPhongMaterial({ color: 0x0fa0a0 })
    // );
    // this.scene.add(this.characterCylinder);
  }

  Update(timeInSeconds) {
    if (!this._stateMachine._currentState) {
      return;
    }

    this._stateMachine.Update(timeInSeconds, {
      key: this._input,
      jump: this._jump,
    });

    const velocity = this._velocity;

    const frameDecceleration = new THREE.Vector3(
      velocity.x * this._decceleration.x,
      velocity.y * this._decceleration.y,
      velocity.z * this._decceleration.z
    );
    frameDecceleration.multiplyScalar(timeInSeconds);
    velocity.z +=
      Math.sign(frameDecceleration.z) *
      Math.min(Math.abs(frameDecceleration.z), Math.abs(velocity.z));

    const controlObject = this._target;
    const acc = this._acceleration.clone();

    if (this._input._keys.shift && this._input._keys.forward) {
      acc.multiply(new THREE.Vector3(3.0, 1, 3.0));
    }

    if (this._input._keys.dance) {
      acc.multiplyScalar(0.0);
    }

    if (this._input._keys.forward) {
      velocity.z += acc.z * timeInSeconds;
    }

    if (this._input._keys.backward) {
      velocity.z -= acc.z * timeInSeconds;
    }

    if (this._input._keys.space && this._jump) {
      this._jump = false;
      velocity.y = acc.y;
    } else if (this._jump) {
      velocity.y = 0;
    } else {
      velocity.y += this._decceleration.y * timeInSeconds;
    }

    const Q = new THREE.Quaternion();
    const A = new THREE.Vector3();
    const rotation = controlObject.quaternion.clone();

    if (this._input._keys.left) {
      A.set(0, 1, 0);
      Q.setFromAxisAngle(A, Math.PI * timeInSeconds * acc.x);
      rotation.multiply(Q);
    }
    if (this._input._keys.right) {
      A.set(0, 1, 0);
      Q.setFromAxisAngle(A, -Math.PI * timeInSeconds * acc.x);
      rotation.multiply(Q);
    }

    controlObject.quaternion.copy(rotation);

    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(controlObject.quaternion);
    forward.normalize();

    const sideways = new THREE.Vector3(1, 0, 0);
    sideways.applyQuaternion(controlObject.quaternion);
    sideways.normalize();

    const upwards = new THREE.Vector3(0, 1, 0);
    upwards.applyQuaternion(controlObject.quaternion);
    upwards.normalize();

    sideways.multiplyScalar(velocity.x);
    forward.multiplyScalar(velocity.z);
    upwards.multiplyScalar(velocity.y);

    const rotatedVelocity = sideways.add(upwards).add(forward);

    this.characterController.computeColliderMovement(this.characterCollider, {
      x: rotatedVelocity.x,
      y: rotatedVelocity.y,
      z: rotatedVelocity.z,
    });

    let movement = this.characterController.computedMovement();
    let newPos = this.character.translation();
    newPos.x += movement.x;
    newPos.y += movement.y;
    newPos.z += movement.z;

    if (newPos.y < -200) {
      newPos.x = 0.0;
      newPos.y = 10.0;
      newPos.z = 0.0;
      velocity.x = 0;
      velocity.y = 0;
      velocity.z = 0;
    }

    this.character.setNextKinematicTranslation(newPos);

    // this.characterCylinder.position.set(newPos.x, newPos.y, newPos.z);

    controlObject.position.set(newPos.x, newPos.y - 7.6, newPos.z);

    this._jump = this.characterController.computedGrounded();

    if (this._mixer) {
      this._mixer.update(timeInSeconds);
    }
  }

  get Position() {
    if (!this._target) {
      return new THREE.Vector3();
    }
    return this._target.position;
  }

  get Rotation() {
    if (!this._target) {
      return new THREE.Quaternion();
    }
    return this._target.quaternion;
  }

  get Box() {
    if (!this._target) {
      return null;
    }
    return new THREE.Box3().setFromObject(this._target);
  }
}
