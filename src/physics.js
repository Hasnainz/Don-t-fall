import * as THREE from "three";

// Takes the world and the player velocity and adjusts for any collisions
export class Physics {
  constructor() {
    this._Initalise();
  }

  _Initalise() {}

  //Player - x, y, z
  Update(controlObject, world, movement) {
    const character = new THREE.Box3().setFromObject(controlObject);
    // character.translate(movement.sideways);
    character.translate(movement.forward);
    character.translate(movement.upward);
    this.offset = new THREE.Vector3(0,0,0);
    this.offset.add(movement.upward);
    this.offset.add(movement.forward);
    this._jump = false;
    this._reset = false;

    // const raycaster = new THREE.Raycaster(
    //   new THREE.Vector3(0,character.min.y,0),
    //   new THREE.Vector3(0,-1,0)
    // ); 


    const floor = world[0];
    // console.log(floor);
    // console.log(raycaster.intersectObject(floor));
    // console.log(character);

    if (character.intersectsBox(floor)) {
      this._jump = true;
      this.offset.add(
        new THREE.Vector3(0, floor.max.y - character.min.y, 0)
      );
    }


    if (character.min.y < -100) {
      this._reset = true;
    }

    // for (let i = 1; i < world.length; i++) {
    //   const current_box = world[i];
    //   if (character.intersectsBox(current_box)) {
    //     if (character.max.x > current_box.min.x) {
    //       // console.log(character.max.x - current_box.min.x);
    //       this.offset.add(new THREE.Vector3(Math.min(character.max.x - current_box.min.x, current_box.max.x-character.min.x),0,0));
    //     } else if (character.min.x < current_box.max.x) {
    //       console.log(character.max.x - current_box.min.x);
    //     }
    //     // console.log(character);
    //     // console.log(current_box);
    //   }
    // }

    const adjusted_positions = {
      offset: this.offset,
      jump: this._jump,
      reset: this._reset,
    };
    return adjusted_positions;
  }
}

// max: Object { x: 7.42535211263537, y: 16.10569772267642, z: 2.576425025570755 }
// min: Object { x: -7.402608154759699, y: -0.009212620113851018, z: -2.0852149509307103 }
// max: Object { x: 100, y: 2.220446049250313e-14, z: 100 }
// min: Object { x: -100, y: -2.220446049250313e-14, z: -100 }
